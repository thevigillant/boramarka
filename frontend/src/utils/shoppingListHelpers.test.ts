import { describe, it, expect } from 'vitest'
import {
  calculateShoppingProgress,
  formatShoppingListForWhatsApp,
  parseQuickShoppingItemsText,
  categorizeIngredient,
} from './shoppingListHelpers'

describe('shoppingListHelpers', () => {
  it('calculates shopping progress accurately', () => {
    expect(calculateShoppingProgress([])).toEqual({ total: 0, checked: 0, percentage: 0 })
    expect(calculateShoppingProgress([{ checked: false }, { checked: false }])).toEqual({
      total: 2,
      checked: 0,
      percentage: 0,
    })
    expect(calculateShoppingProgress([{ checked: true }, { checked: false }])).toEqual({
      total: 2,
      checked: 1,
      percentage: 50,
    })
    expect(
      calculateShoppingProgress([{ checked: true }, { checked: true }, { checked: true }])
    ).toEqual({
      total: 3,
      checked: 3,
      percentage: 100,
    })
  })

  it('categorizes ingredients intelligently', () => {
    expect(categorizeIngredient('Leite Condensado Moça')).toBe('Laticínios & Ovos')
    expect(categorizeIngredient('Farinha de Trigo')).toBe('Secos & Farinhas')
    expect(categorizeIngredient('Barra Chocolate Meio Amargo')).toBe('Doces & Chocolates')
    expect(categorizeIngredient('Caixa para Bolo G60')).toBe('Embalagens')
    expect(categorizeIngredient('Morangos frescos')).toBe('Hortifruti')
    expect(categorizeIngredient('Fita adesiva transparente')).toBe('Embalagens')
    expect(categorizeIngredient('Pano de prato')).toBe('Geral')
  })

  it('parses multi-line quick items text accurately', () => {
    const rawText = `
      4 latas de Leite condensado
      2 kg Farinha de trigo
      3x Barra de chocolate
      Morangos frescos
    `
    const parsed = parseQuickShoppingItemsText(rawText)
    expect(parsed).toHaveLength(4)

    expect(parsed[0]).toEqual({
      quantity: 4,
      unit: 'lata',
      name: 'Leite condensado',
      category: 'Laticínios & Ovos',
    })

    expect(parsed[1]).toEqual({
      quantity: 2,
      unit: 'kg',
      name: 'Farinha de trigo',
      category: 'Secos & Farinhas',
    })

    expect(parsed[2]).toEqual({
      quantity: 3,
      unit: 'un',
      name: 'Barra de chocolate',
      category: 'Doces & Chocolates',
    })

    expect(parsed[3]).toEqual({
      quantity: 1,
      unit: 'un',
      name: 'Morangos frescos',
      category: 'Hortifruti',
    })
  })

  it('formats shopping list for WhatsApp with progress and categories', () => {
    const list = {
      title: 'Compras Fim de Semana',
      targetDate: '2026-09-05T00:00:00.000Z',
      items: [
        {
          id: 1,
          shoppingListId: 10,
          name: 'Leite Moça',
          quantity: 4,
          unit: 'lata',
          category: 'Laticínios & Ovos',
          estimatedPrice: 6.5,
          actualPrice: 0,
          checked: true,
        },
        {
          id: 2,
          shoppingListId: 10,
          name: 'Farinha Dona Benta',
          quantity: 2,
          unit: 'kg',
          category: 'Secos & Farinhas',
          estimatedPrice: 4.0,
          actualPrice: 0,
          checked: false,
        },
      ],
    }

    const output = formatShoppingListForWhatsApp(list as any)
    expect(output).toContain('COMPRAS FIM DE SEMANA')
    expect(output).toContain('Progresso: 1/2 pegos (50%)')
    expect(output).toContain('✅ *Leite Moça* (4 lata)')
    expect(output).toContain('⬜ *Farinha Dona Benta* (2 kg)')
    expect(output).toContain('BoraMarka · BoraEnkomenda')
  })
})
