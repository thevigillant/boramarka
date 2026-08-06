import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Nome de usuário é obrigatório').toLowerCase(),
  password: z.string().min(1, 'Senha é obrigatória'),
  companyUsername: z.string().optional()
})

export const registerSchema = z.object({
  username: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres').toLowerCase(),
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  businessName: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  photoUrl: z.string().optional(),
  address: z.string().optional(),
  operatingHours: z.string().optional(),
  category: z.string().optional(),
})

export const sendVerificationCodeSchema = z.object({
  email: z.string().email('E-mail inválido').toLowerCase(),
  username: z.string().optional()
})

export const verifyCodeSchema = z.object({
  email: z.string().email('E-mail inválido').toLowerCase(),
  code: z.string().length(4, 'Código deve ter 4 dígitos')
})

export const bookSlotSchema = z.object({
  timeSlotId: z.number().int().positive('Slot ID inválido'),
  clientName: z.string().min(2, 'Nome do cliente deve ter no mínimo 2 caracteres'),
  clientPhone: z.string().min(10, 'Telefone inválido'),
  clientEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  payFullPrice: z.boolean().optional(),
  addonIds: z.array(z.number().int()).optional()
})

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Nome do serviço é obrigatório'),
  price: z.number().nonnegative('Preço deve ser positivo'),
  duration: z.number().positive('Duração deve ser maior que 0'),
  description: z.string().optional()
})

export const createLinkSchema = z.object({
  title: z.string().min(2, 'Título deve ter no mínimo 2 caracteres'),
  serviceId: z.number().int().optional().nullable(),
  bookingFeeEnabled: z.boolean().optional(),
  bookingFeeAmount: z.number().nonnegative().optional()
})
