import { describe, it, expect } from 'vitest'
import {
  sendVerificationCodeSchema,
  verifyCodeSchema,
  bookSlotSchema,
  createServiceSchema,
  createLinkSchema,
  createTransactionSchema,
  createEmployeeSchema,
  createMembershipPlanSchema,
  createClientSubscriptionSchema,
  updateLoyaltyConfigSchema,
  loyaltyStampActionSchema,
  createCustomerContactSchema,
  updateCustomerContactSchema,
  sendCrmMessageSchema,
  createSupportTicketSchema,
  sendSupportMessageSchema,
  supportSatisfactionSchema,
  submitReviewSchema,
  moderateReviewSchema,
  portalLoginSchema,
  employeeVacationRequestSchema,
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

  describe('createTransactionSchema', () => {
    it('deve aceitar transação de receita válida', () => {
      const res = createTransactionSchema.safeParse({
        type: 'receivable',
        description: 'Corte de Cabelo',
        amount: 50,
        dueDate: '2026-08-14',
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar transação com tipo inválido', () => {
      const res = createTransactionSchema.safeParse({
        type: 'other',
        description: 'Despesa',
        amount: 50,
        dueDate: '2026-08-14',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('createEmployeeSchema', () => {
    it('deve aceitar funcionário com dados válidos', () => {
      const res = createEmployeeSchema.safeParse({
        name: 'Carlos Silva',
        role: 'Barbeiro',
        email: 'carlos@empresa.com',
        phone: '11988887777',
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar funcionário sem cargo', () => {
      const res = createEmployeeSchema.safeParse({
        name: 'Carlos Silva',
        role: '',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('createMembershipPlanSchema', () => {
    it('deve aceitar plano mensal válido', () => {
      const res = createMembershipPlanSchema.safeParse({
        name: 'VIP Bronze',
        price: 99.90,
        interval: 'monthly',
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar plano com intervalo inválido', () => {
      const res = createMembershipPlanSchema.safeParse({
        name: 'VIP Bronze',
        price: 99.90,
        interval: 'daily',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('loyaltyStampActionSchema', () => {
    it('deve aceitar ação de adicionar selo', () => {
      const res = loyaltyStampActionSchema.safeParse({
        clientPhone: '11999998888',
        action: 'add',
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar ação desconhecida', () => {
      const res = loyaltyStampActionSchema.safeParse({
        clientPhone: '11999998888',
        action: 'delete_all',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('createSupportTicketSchema', () => {
    it('deve aceitar chamado de suporte válido', () => {
      const res = createSupportTicketSchema.safeParse({
        subject: 'Dúvida sobre repasse',
        category: 'FINANCEIRO',
        message: 'Gostaria de saber a data de liquidação do Pix.',
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar assunto muito curto', () => {
      const res = createSupportTicketSchema.safeParse({
        subject: 'Oi',
        message: 'Gostaria de ajuda',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('submitReviewSchema', () => {
    it('deve aceitar avaliação de 5 estrelas', () => {
      const res = submitReviewSchema.safeParse({
        bookingId: 42,
        clientPhone: '11999999999',
        rating: 5,
        comment: 'Atendimento excepcional!',
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar nota maior que 5', () => {
      const res = submitReviewSchema.safeParse({
        bookingId: 42,
        clientPhone: '11999999999',
        rating: 6,
      })
      expect(res.success).toBe(false)
    })

    it('deve rejeitar nota menor que 1', () => {
      const res = submitReviewSchema.safeParse({
        bookingId: 42,
        clientPhone: '11999999999',
        rating: 0,
      })
      expect(res.success).toBe(false)
    })
  })
})
