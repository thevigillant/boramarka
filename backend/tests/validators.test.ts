import { describe, it, expect } from 'vitest'
import {
  sendVerificationCodeSchema,
  verifyCodeSchema,
  bookSlotSchema,
  createServiceSchema,
  createLinkSchema,
} from '../src/utils/validators'

describe('Validators (Zod Schemas)', () => {
  describe('sendVerificationCodeSchema', () => {
    it('deve aceitar e-mail válido', () => {
      const res = sendVerificationCodeSchema.safeParse({ email: 'teste@boramarka.com.br' })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar e-mail inválido', () => {
      const res = sendVerificationCodeSchema.safeParse({ email: 'invalido' })
      expect(res.success).toBe(false)
    })
  })

  describe('verifyCodeSchema', () => {
    it('deve aceitar código de 4 dígitos', () => {
      const res = verifyCodeSchema.safeParse({ email: 'teste@boramarka.com.br', code: '1234' })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar código com tamanho diferente de 4 dígitos', () => {
      const res = verifyCodeSchema.safeParse({ email: 'teste@boramarka.com.br', code: '123' })
      expect(res.success).toBe(false)
    })
  })

  describe('bookSlotSchema', () => {
    it('deve validar payload de agendamento correto', () => {
      const res = bookSlotSchema.safeParse({
        timeSlotId: 10,
        clientName: 'Bruno Santana',
        clientPhone: '11999999999',
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar nome muito curto', () => {
      const res = bookSlotSchema.safeParse({
        timeSlotId: 10,
        clientName: 'A',
        clientPhone: '11999999999',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('createServiceSchema', () => {
    it('deve validar criação de serviço válida', () => {
      const res = createServiceSchema.safeParse({
        name: 'Corte Degradê',
        price: 45.0,
        duration: 30,
        description: 'Corte social moderno',
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar preço negativo', () => {
      const res = createServiceSchema.safeParse({
        name: 'Corte Degradê',
        price: -10,
        duration: 30,
      })
      expect(res.success).toBe(false)
    })
  })

  describe('createLinkSchema', () => {
    it('deve validar título de link válido', () => {
      const res = createLinkSchema.safeParse({
        title: 'Agendamento de Sexta',
      })
      expect(res.success).toBe(true)
    })
  })
})
