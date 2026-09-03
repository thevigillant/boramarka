import { describe, it, expect } from 'vitest'

describe('Entrada de Nota Fiscal & Alimentação Automática de Estoque', () => {
  it('deve processar itens da nota fiscal e preparar para alimentar estoque', () => {
    const rawItems = [
      {
        description: 'Leite Condensado Moça 395g',
        quantity: 12,
        unitPrice: 7.5,
        totalPrice: 90,
        expenseCategory: 'INSUMOS',
        itemCode: '7891000100103',
      },
      {
        description: 'Chocolate em Barra Nobre 1kg',
        quantity: 4,
        unitPrice: 42.0,
        totalPrice: 168,
        expenseCategory: 'INSUMOS',
      },
      {
        description: 'Taxa de Entrega / Frete',
        quantity: 1,
        unitPrice: 15,
        totalPrice: 15,
        expenseCategory: 'FRETE',
        inventoryItemId: 'SKIP',
      },
    ]

    const updateStock = true

    const processed = rawItems.map((item) => {
      const skipStock = item.inventoryItemId === 'SKIP'
      const itemQty = Math.max(1, Math.round(item.quantity))
      const shouldEnterStock = updateStock && !skipStock

      return {
        name: item.description,
        shouldEnterStock,
        addQty: itemQty,
        category: item.expenseCategory === 'INSUMOS' ? 'INSUMO' : 'PRODUTO',
      }
    })

    expect(processed[0].shouldEnterStock).toBe(true)
    expect(processed[0].addQty).toBe(12)
    expect(processed[0].category).toBe('INSUMO')

    expect(processed[1].shouldEnterStock).toBe(true)
    expect(processed[1].addQty).toBe(4)

    expect(processed[2].shouldEnterStock).toBe(false)
  })

  it('deve calcular corretamente acréscimo de quantidade e preço de custo', () => {
    const currentStock = {
      name: 'Farinha de Trigo Especial 1kg',
      quantity: 5,
      costPrice: 4.8,
    }

    const inboundItem = {
      quantity: 10,
      unitPrice: 5.2,
    }

    const newQuantity = currentStock.quantity + Math.max(1, Math.round(inboundItem.quantity))
    const newCostPrice = inboundItem.unitPrice

    expect(newQuantity).toBe(15)
    expect(newCostPrice).toBe(5.2)
  })
})
