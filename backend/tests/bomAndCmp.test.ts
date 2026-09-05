import { describe, it, expect } from 'vitest';
import {
  inventoryMovementSchema,
  recipeItemInputSchema,
  setProductRecipeSchema,
  createOrderReturnSchema,
} from '../src/utils/validators';

describe('ERP CMP (Custo Médio Ponderado / Weighted Average Cost)', () => {
  function calculateCMP(
    currentQty: number,
    currentCost: number,
    inboundQty: number,
    inboundCost: number
  ): { newQty: number; newCostPrice: number } {
    const newQty = currentQty + inboundQty;
    if (newQty <= 0) return { newQty: 0, newCostPrice: currentCost };

    const currentTotal = currentQty > 0 ? currentQty * currentCost : 0;
    const incomingTotal = inboundQty * inboundCost;
    const newCostPrice = Math.round(((currentTotal + incomingTotal) / newQty) * 100) / 100;
    return { newQty, newCostPrice };
  }

  it('calculates weighted average cost correctly when stock already exists', () => {
    // 10 units at R$ 5.00 (R$ 50) + 20 units at R$ 8.00 (R$ 160) = 30 units total R$ 210 -> R$ 7.00 each
    const result = calculateCMP(10, 5.0, 20, 8.0);
    expect(result.newQty).toBe(30);
    expect(result.newCostPrice).toBe(7.0);
  });

  it('sets cost to inbound cost when initial stock is zero', () => {
    // 0 units at R$ 0.00 + 15 units at R$ 12.50 -> R$ 12.50
    const result = calculateCMP(0, 0.0, 15, 12.5);
    expect(result.newQty).toBe(15);
    expect(result.newCostPrice).toBe(12.5);
  });

  it('correctly rounds CMP with fractional cents', () => {
    // 7 units at R$ 3.33 (R$ 23.31) + 11 units at R$ 4.75 (R$ 52.25) = 18 units, total R$ 75.56 -> R$ 4.20
    const result = calculateCMP(7, 3.33, 11, 4.75);
    expect(result.newQty).toBe(18);
    expect(result.newCostPrice).toBe(4.2);
  });
});

describe('ERP BOM (Ficha Técnica / Recipe Margin Calculations)', () => {
  function calculateRecipeSummary(
    salePrice: number,
    items: Array<{ quantity: number; costPrice: number }>
  ) {
    let totalProductionCost = 0;
    for (const item of items) {
      totalProductionCost += item.quantity * item.costPrice;
    }
    totalProductionCost = Math.round(totalProductionCost * 100) / 100;
    const grossMargin = Math.round((salePrice - totalProductionCost) * 100) / 100;
    const marginPercentage = salePrice > 0
      ? Math.round(((salePrice - totalProductionCost) / salePrice) * 10000) / 100
      : 0;

    return { totalProductionCost, grossMargin, marginPercentage };
  }

  it('calculates total recipe cost, gross margin and profit percentage correctly', () => {
    const salePrice = 50.0;
    const ingredients = [
      { quantity: 0.5, costPrice: 6.0 },  // Farinha: R$ 3.00
      { quantity: 0.2, costPrice: 40.0 }, // Chocolate: R$ 8.00
      { quantity: 1.0, costPrice: 4.0 },  // Embalagem: R$ 4.00
    ];

    const summary = calculateRecipeSummary(salePrice, ingredients);
    expect(summary.totalProductionCost).toBe(15.0);
    expect(summary.grossMargin).toBe(35.0);
    expect(summary.marginPercentage).toBe(70.0);
  });

  it('handles zero sale price gracefully without NaN or division by zero', () => {
    const summary = calculateRecipeSummary(0, [{ quantity: 2, costPrice: 5 }]);
    expect(summary.totalProductionCost).toBe(10.0);
    expect(summary.grossMargin).toBe(-10.0);
    expect(summary.marginPercentage).toBe(0);
  });
});

describe('ERP Validation Schemas for BOM, Movement and Returns', () => {
  it('validates stock movement with unitCost', () => {
    const valid = inventoryMovementSchema.safeParse({
      type: 'ENTRADA',
      quantity: 50,
      unitCost: 12.99,
      reason: 'Compra Fornecedor NF-e 4521',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects negative unitCost on stock movement', () => {
    const invalid = inventoryMovementSchema.safeParse({
      type: 'ENTRADA',
      quantity: 10,
      unitCost: -5,
    });
    expect(invalid.success).toBe(false);
  });

  it('validates recipe item and full recipe submission', () => {
    const item = recipeItemInputSchema.safeParse({
      inventoryItemId: 4,
      quantity: 2.5,
      unit: 'kg',
    });
    expect(item.success).toBe(true);

    const fullRecipe = setProductRecipeSchema.safeParse({
      items: [
        { inventoryItemId: 4, quantity: 2.5, unit: 'kg' },
        { inventoryItemId: 8, quantity: 1, unit: 'unidade' },
      ],
    });
    expect(fullRecipe.success).toBe(true);
  });

  it('validates order returns and exchanges', () => {
    const validReturn = createOrderReturnSchema.safeParse({
      type: 'DEVOLUCAO',
      reason: 'Cliente desistiu do pedido antes do consumo',
      refundAmount: 85.5,
      restockItems: true,
      notes: 'Chave Pix devolvida via comprovante',
    });
    expect(validReturn.success).toBe(true);

    const validExchange = createOrderReturnSchema.safeParse({
      type: 'TROCA',
      reason: 'Produto com tamanho divergente',
      refundAmount: 0,
      restockItems: true,
    });
    expect(validExchange.success).toBe(true);
  });

  it('rejects order return without a reason', () => {
    const invalid = createOrderReturnSchema.safeParse({
      type: 'DEVOLUCAO',
      reason: 'ab', // min length is 3
    });
    expect(invalid.success).toBe(false);
  });
});

describe('ERP CRM & Customer LTV Analytics', () => {
  function aggregateClientCRM(orders: Array<{
    clientName: string;
    clientPhone: string;
    status: string;
    total: number;
    items: Array<{ productName: string; quantity: number }>;
  }>) {
    const clientsMap = new Map<string, {
      clientName: string;
      clientPhone: string;
      ordersCount: number;
      totalSpent: number;
      productFrequency: Record<string, number>;
    }>();

    for (const order of orders) {
      const cleanKey = order.clientPhone.replace(/\D/g, '') || order.clientName.trim().toLowerCase();
      if (!cleanKey) continue;

      if (!clientsMap.has(cleanKey)) {
        clientsMap.set(cleanKey, {
          clientName: order.clientName,
          clientPhone: order.clientPhone,
          ordersCount: 0,
          totalSpent: 0,
          productFrequency: {},
        });
      }

      const client = clientsMap.get(cleanKey)!;
      client.ordersCount += 1;
      if (order.status !== 'CANCELADO' && order.status !== 'DEVOLVIDO') {
        client.totalSpent += order.total;
      }

      for (const item of order.items) {
        client.productFrequency[item.productName] =
          (client.productFrequency[item.productName] || 0) + item.quantity;
      }
    }

    return Array.from(clientsMap.values()).map(c => ({
      ...c,
      averageTicket: c.ordersCount > 0 ? Math.round((c.totalSpent / c.ordersCount) * 100) / 100 : 0,
    })).sort((a, b) => b.totalSpent - a.totalSpent);
  }

  it('correctly calculates customer LTV and orders count while excluding canceled orders from revenue', () => {
    const orders = [
      {
        clientName: 'Maria Silva',
        clientPhone: '(11) 98888-1111',
        status: 'ENTREGUE',
        total: 150.0,
        items: [{ productName: 'Bolo de Morango', quantity: 1 }],
      },
      {
        clientName: 'Maria Silva',
        clientPhone: '11988881111',
        status: 'CONFIRMADO',
        total: 200.0,
        items: [{ productName: 'Bolo de Chocolate', quantity: 1 }],
      },
      {
        clientName: 'Maria Silva',
        clientPhone: '(11) 98888-1111',
        status: 'CANCELADO',
        total: 100.0,
        items: [{ productName: 'Docinhos', quantity: 50 }],
      },
      {
        clientName: 'João Santos',
        clientPhone: '11977772222',
        status: 'ENTREGUE',
        total: 80.0,
        items: [{ productName: 'Torta Salgada', quantity: 1 }],
      },
    ];

    const result = aggregateClientCRM(orders);
    expect(result.length).toBe(2);

    // Maria should be ranked #1
    expect(result[0].clientName).toBe('Maria Silva');
    expect(result[0].ordersCount).toBe(3);
    // 150 + 200 (canceled 100 excluded) = 350
    expect(result[0].totalSpent).toBe(350.0);
    // 350 / 3 = 116.67
    expect(result[0].averageTicket).toBe(116.67);

    // João should be ranked #2
    expect(result[1].clientName).toBe('João Santos');
    expect(result[1].totalSpent).toBe(80.0);
    expect(result[1].ordersCount).toBe(1);
    expect(result[1].averageTicket).toBe(80.0);
  });
});

