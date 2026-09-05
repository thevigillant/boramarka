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
  parseSafeInt,
  updateOrderStatusSchema,
  createCategorySchema,
  createInventoryItemSchema,
  inventoryMovementSchema,
  createPdvSaleSchema,
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

  describe('parseSafeInt', () => {
    it('deve converter número inteiro positivo', () => {
      expect(parseSafeInt(42)).toBe(42)
      expect(parseSafeInt(1)).toBe(1)
    })

    it('deve converter string numérica inteira positiva', () => {
      expect(parseSafeInt('15')).toBe(15)
      expect(parseSafeInt('100')).toBe(100)
    })

    it('deve retornar null para zero, negativos e floats', () => {
      expect(parseSafeInt(0)).toBe(null)
      expect(parseSafeInt(-5)).toBe(null)
      expect(parseSafeInt('-10')).toBe(null)
      expect(parseSafeInt(3.14)).toBe(null)
      expect(parseSafeInt('3.14')).toBe(null)
    })

    it('deve retornar null para strings inválidas e valores vazios', () => {
      expect(parseSafeInt('abc')).toBe(null)
      expect(parseSafeInt('NaN')).toBe(null)
      expect(parseSafeInt('')).toBe(null)
      expect(parseSafeInt(null)).toBe(null)
      expect(parseSafeInt(undefined)).toBe(null)
    })
  })

  describe('updateOrderStatusSchema', () => {
    it('deve aceitar status válidos', () => {
      expect(updateOrderStatusSchema.safeParse({ status: 'NOVO' }).success).toBe(true)
      expect(updateOrderStatusSchema.safeParse({ status: 'EM_PRODUCAO' }).success).toBe(true)
      expect(updateOrderStatusSchema.safeParse({ status: 'ENTREGUE' }).success).toBe(true)
      expect(updateOrderStatusSchema.safeParse({ status: 'CANCELADO' }).success).toBe(true)
    })

    it('deve rejeitar status inválido', () => {
      expect(updateOrderStatusSchema.safeParse({ status: 'INVALIDO' }).success).toBe(false)
      expect(updateOrderStatusSchema.safeParse({ status: '' }).success).toBe(false)
    })
  })

  describe('createCategorySchema', () => {
    it('deve aceitar categoria válida', () => {
      const res = createCategorySchema.safeParse({ name: 'Bolos Decorados' })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar nome menor que 2 caracteres', () => {
      const res = createCategorySchema.safeParse({ name: 'A' })
      expect(res.success).toBe(false)
    })
  })

  describe('createInventoryItemSchema & inventoryMovementSchema', () => {
    it('deve validar item de estoque válido', () => {
      const res = createInventoryItemSchema.safeParse({
        name: 'Farinha de Trigo Especial',
        costPrice: 5.5,
        salePrice: 10,
        quantity: 50,
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar item sem nome', () => {
      const res = createInventoryItemSchema.safeParse({ name: '' })
      expect(res.success).toBe(false)
    })

    it('deve validar movimentação de estoque válida', () => {
      const res = inventoryMovementSchema.safeParse({
        type: 'ENTRADA',
        quantity: 10,
        reason: 'Compra semanal',
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar tipo inválido ou quantidade não positiva', () => {
      expect(inventoryMovementSchema.safeParse({ type: 'TRANSFERENCIA', quantity: 10 }).success).toBe(false)
      expect(inventoryMovementSchema.safeParse({ type: 'ENTRADA', quantity: 0 }).success).toBe(false)
      expect(inventoryMovementSchema.safeParse({ type: 'ENTRADA', quantity: -5 }).success).toBe(false)
    })
  })

  describe('createPdvSaleSchema', () => {
    it('deve validar venda com itens corretos', () => {
      const res = createPdvSaleSchema.safeParse({
        paymentMethod: 'PIX',
        discount: 5,
        items: [
          { name: 'Corte Degradê', quantity: 1, unitPrice: 35 },
          { name: 'Pomada Modeladora', quantity: 2, unitPrice: 20 },
        ],
      })
      expect(res.success).toBe(true)
    })

    it('deve rejeitar venda sem itens', () => {
      const res = createPdvSaleSchema.safeParse({
        paymentMethod: 'PIX',
        items: [],
      })
      expect(res.success).toBe(false)
    })

    it('deve rejeitar item com preço negativo ou quantidade zero', () => {
      const res = createPdvSaleSchema.safeParse({
        paymentMethod: 'PIX',
        items: [{ name: 'Item', quantity: 0, unitPrice: 10 }],
      })
      expect(res.success).toBe(false)
    })
  })
})
