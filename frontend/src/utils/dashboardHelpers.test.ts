import { describe, it, expect } from 'vitest'
import { formatDate, formatCurrency, WEEKDAYS, getWeekday, maskPhone } from './dashboardHelpers'

describe('Dashboard Helpers (Unit Tests)', () => {
  describe('formatDate', () => {
    it('deve formatar data AAAA-MM-DD em DD/MM/AAAA', () => {
      expect(formatDate('2026-08-06')).toBe('06/08/2026')
    })

    it('deve retornar "-" se a string de data for vazia', () => {
      expect(formatDate('')).toBe('-')
    })
  })

  describe('formatCurrency', () => {
    it('deve formatar valor em reais (BRL)', () => {
      const formatted = formatCurrency(50.5).replace(/\s/g, ' ')
      expect(formatted).toContain('50,50')
    })
  })

  describe('maskPhone', () => {
    it('deve aplicar máscara de celular de 11 dígitos', () => {
      expect(maskPhone('11988887777')).toBe('(11) 98888-7777')
    })
  })

  describe('WEEKDAYS', () => {
    it('deve conter 7 dias da semana ordenados', () => {
      expect(WEEKDAYS).toHaveLength(7)
      expect(WEEKDAYS[0]).toBe('Domingo')
      expect(WEEKDAYS[1]).toBe('Segunda')
    })
  })

  describe('getWeekday', () => {
    it('deve retornar o nome em português do dia da semana para uma data', () => {
      // 2026-08-06 é quinta-feira
      expect(getWeekday('2026-08-06')).toBe('Quinta')
    })
  })
})
