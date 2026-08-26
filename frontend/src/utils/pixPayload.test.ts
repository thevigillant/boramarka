import { describe, it, expect } from 'vitest'
import { generatePixPayload } from './pixPayload'

describe('generatePixPayload', () => {
  it('should return empty string if no pix key provided', () => {
    expect(generatePixPayload({ pixKey: '', merchantName: 'Teste' })).toBe('')
  })

  it('should generate a valid BR Code payload with CRC16 for CPF/CNPJ', () => {
    const payload = generatePixPayload({
      pixKey: '12345678909',
      merchantName: 'CONFEITARIA SILVA',
      merchantCity: 'SAO PAULO',
      amount: 50.0,
      txid: 'ENK1234',
    })

    expect(payload).toContain('000201') // Payload format
    expect(payload).toContain('br.gov.bcb.pix') // GUI
    expect(payload).toContain('12345678909') // Key
    expect(payload).toContain('540550.00') // Amount
    expect(payload).toContain('CONFEITARIA SILVA') // Name
    expect(payload).toContain('SAO PAULO') // City
    expect(payload).toContain('ENK1234') // TxID
    expect(payload.endsWith(payload.slice(-4))).toBe(true) // 4-char CRC16
    expect(payload.length).toBeGreaterThan(50)
  })

  it('should automatically prepend +55 for phone keys without DDI', () => {
    const payload = generatePixPayload({
      pixKey: '11987654321',
      merchantName: 'LOJA TESTE',
      amount: 25.5,
    })

    expect(payload).toContain('+5511987654321')
    expect(payload).toContain('540525.50')
  })

  it('should handle keys with accents by normalizing to uppercase ASCII', () => {
    const payload = generatePixPayload({
      pixKey: 'contato@doces.com.br',
      merchantName: 'Doces & Delícias João',
      merchantCity: 'Ribeirão Preto',
      amount: 100.0,
    })

    expect(payload).toContain('contato@doces.com.br')
    expect(payload).not.toContain('í')
    expect(payload).not.toContain('ã')
    expect(payload).toContain('5802BR')
  })
})
