import { prisma } from '../db';

export interface RecipeItemInput {
  inventoryItemId: number;
  quantity: number;
  unit?: string;
}

export interface CalculatedRecipeItem {
  id: number;
  inventoryItemId: number;
  name: string;
  quantity: number;
  unit: string;
  stockQuantity: number;
  costPrice: number;
  totalCost: number;
}

export interface ProductRecipeSummary {
  productId: number;
  productName: string;
  salePrice: number;
  items: CalculatedRecipeItem[];
  totalProductionCost: number;
  grossMargin: number;
  marginPercentage: number;
}

/**
 * Retorna a ficha técnica de um produto com os cálculos de custo e margem bruta
 */
export async function getRecipeForProduct(productId: number, adminId: number): Promise<ProductRecipeSummary | null> {
  const product = await prisma.product.findFirst({
    where: { id: productId, adminId },
    include: {
      recipeItems: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });

  if (!product) return null;

  let totalProductionCost = 0;

  const items: CalculatedRecipeItem[] = product.recipeItems.map((ri) => {
    const itemCost = Number(ri.quantity) * Number(ri.inventoryItem.costPrice);
    totalProductionCost += itemCost;

    return {
      id: ri.id,
      inventoryItemId: ri.inventoryItemId,
      name: ri.inventoryItem.name,
      quantity: Number(ri.quantity),
      unit: ri.unit || ri.inventoryItem.unit,
      stockQuantity: Number(ri.inventoryItem.quantity),
      costPrice: Number(ri.inventoryItem.costPrice),
      totalCost: Math.round(itemCost * 100) / 100,
    };
  });

  totalProductionCost = Math.round(totalProductionCost * 100) / 100;
  const grossMargin = Math.round((product.price - totalProductionCost) * 100) / 100;
  const marginPercentage = product.price > 0
    ? Math.round(((product.price - totalProductionCost) / product.price) * 10000) / 100
    : 0;

  return {
    productId: product.id,
    productName: product.name,
    salePrice: product.price,
    items,
    totalProductionCost,
    grossMargin,
    marginPercentage,
  };
}

/**
 * Salva / atualiza todos os itens da ficha técnica do produto
 */
export async function setRecipeForProduct(
  productId: number,
  items: RecipeItemInput[],
  adminId: number
): Promise<ProductRecipeSummary> {
  const product = await prisma.product.findFirst({
    where: { id: productId, adminId },
  });

  if (!product) {
    throw new Error('Produto não encontrado');
  }

  // Valida itens de estoque pertencentes ao admin
  const inventoryItemIds = items.map((i) => i.inventoryItemId);
  if (inventoryItemIds.length > 0) {
    const validItems = await prisma.inventoryItem.findMany({
      where: { id: { in: inventoryItemIds }, adminId },
      select: { id: true, unit: true },
    });

    if (validItems.length !== inventoryItemIds.length) {
      throw new Error('Um ou mais insumos informados não pertencem à sua conta');
    }
  }

  // Atualiza ficha técnica em transação atômica
  await prisma.$transaction(async (tx) => {
    // Remove itens anteriores
    await tx.productRecipeItem.deleteMany({
      where: { productId },
    });

    // Insere novos itens
    if (items.length > 0) {
      await tx.productRecipeItem.createMany({
        data: items.map((item) => ({
          productId,
          inventoryItemId: item.inventoryItemId,
          quantity: Math.max(0.001, Number(item.quantity)),
          unit: item.unit?.trim() || 'unidade',
        })),
      });
    }
  });

  const updated = await getRecipeForProduct(productId, adminId);
  return updated!;
}

/**
 * Remove um insumo da ficha técnica
 */
export async function deleteRecipeItem(productId: number, recipeItemId: number, adminId: number): Promise<boolean> {
  const product = await prisma.product.findFirst({
    where: { id: productId, adminId },
  });
  if (!product) return false;

  const item = await prisma.productRecipeItem.findFirst({
    where: { id: recipeItemId, productId },
  });
  if (!item) return false;

  await prisma.productRecipeItem.delete({
    where: { id: recipeItemId },
  });

  return true;
}

/**
 * Dá baixa automática de estoque de insumos com base na ficha técnica ao produzir um pedido
 */
export async function consumeIngredientsForOrder(orderId: number, adminId: number): Promise<{ consumedCount: number }> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, adminId },
    include: {
      items: {
        include: {
          product: {
            include: {
              recipeItems: {
                include: {
                  inventoryItem: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order || !order.items) return { consumedCount: 0 };

  let consumedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const orderItem of order.items) {
      const product = orderItem.product;
      if (!product || !product.recipeItems || product.recipeItems.length === 0) continue;

      for (const recipeItem of product.recipeItems) {
        const qtyNeeded = Math.round(orderItem.quantity * Number(recipeItem.quantity) * 100) / 100;
        if (qtyNeeded <= 0) continue;

        const currentStock = await tx.inventoryItem.findUnique({
          where: { id: recipeItem.inventoryItemId },
        });

        if (!currentStock) continue;

        const newStock = Math.max(0, currentStock.quantity - Math.ceil(qtyNeeded));

        await tx.inventoryItem.update({
          where: { id: currentStock.id },
          data: { quantity: newStock },
        });

        await tx.stockMovement.create({
          data: {
            itemId: currentStock.id,
            type: 'SAIDA',
            quantity: Math.ceil(qtyNeeded),
            unitCost: currentStock.costPrice,
            reason: `Produção Pedido #${order.orderNumber} (${orderItem.productName})`,
          },
        });

        consumedCount++;
      }
    }
  });

  return { consumedCount };
}

/**
 * Estorna insumos de volta ao estoque caso um pedido seja devolvido ou cancelado após produção
 */
export async function returnIngredientsForOrder(orderId: number, adminId: number): Promise<{ returnedCount: number }> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, adminId },
    include: {
      items: {
        include: {
          product: {
            include: {
              recipeItems: {
                include: {
                  inventoryItem: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order || !order.items) return { returnedCount: 0 };

  let returnedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const orderItem of order.items) {
      const product = orderItem.product;
      if (!product || !product.recipeItems || product.recipeItems.length === 0) continue;

      for (const recipeItem of product.recipeItems) {
        const qtyNeeded = Math.round(orderItem.quantity * Number(recipeItem.quantity) * 100) / 100;
        if (qtyNeeded <= 0) continue;

        const currentStock = await tx.inventoryItem.findUnique({
          where: { id: recipeItem.inventoryItemId },
        });

        if (!currentStock) continue;

        const newStock = currentStock.quantity + Math.ceil(qtyNeeded);

        await tx.inventoryItem.update({
          where: { id: currentStock.id },
          data: { quantity: newStock },
        });

        await tx.stockMovement.create({
          data: {
            itemId: currentStock.id,
            type: 'ENTRADA',
            quantity: Math.ceil(qtyNeeded),
            unitCost: currentStock.costPrice,
            reason: `Estorno/Devolução Pedido #${order.orderNumber} (${orderItem.productName})`,
          },
        });

        returnedCount++;
      }
    }
  });

  return { returnedCount };
}
