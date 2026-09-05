import { z } from 'zod'

// ═══ Auth & Account ═══
export const loginSchema = z.object({
  username: z.string().min(1, 'Nome de usuário é obrigatório').toLowerCase(),
  password: z.string().min(1, 'Senha é obrigatória'),
  companyUsername: z.string().optional()
})

export const registerSchema = z.object({
  username: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres').toLowerCase(),
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres, com letras e números'),
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

// ═══ Schedule & Bookings ═══
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
  description: z.string().optional(),
  photoUrl: z.string().optional(),
  isUpsellable: z.boolean().optional(),
  upsellDiscount: z.number().optional(),
  addonServiceIds: z.array(z.number().int()).optional()
})

export const createLinkSchema = z.object({
  title: z.string().min(2, 'Título deve ter no mínimo 2 caracteres'),
  serviceId: z.number().int().optional().nullable(),
  bookingFeeEnabled: z.boolean().optional(),
  bookingFeeAmount: z.number().nonnegative().optional()
})

// ═══ Finance ═══
export const createTransactionSchema = z.object({
  type: z.enum(['receivable', 'payable'], { message: 'Tipo deve ser "receivable" ou "payable"' }),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  clientName: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  paid: z.boolean().optional(),
  supplierId: z.number().int().optional().nullable(),
  invoiceId: z.number().int().optional().nullable(),
  purchaseId: z.number().int().optional().nullable()
})

// ═══ Employees ═══
export const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  role: z.string().min(1, 'Cargo é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  admissionDate: z.string().optional(),
  salary: z.number().nonnegative().optional(),
  commission: z.number().nonnegative().optional(),
  workingHours: z.string().optional(),
  password: z.string().optional(),
  address: z.string().optional()
})

// ═══ Memberships ═══
export const createMembershipPlanSchema = z.object({
  name: z.string().min(2, 'Nome do plano é obrigatório'),
  description: z.string().optional(),
  price: z.number().positive('Preço deve ser maior que zero'),
  interval: z.enum(['monthly', 'yearly'], { message: 'Intervalo deve ser "monthly" ou "yearly"' })
})

export const createClientSubscriptionSchema = z.object({
  clientName: z.string().min(2, 'Nome do cliente é obrigatório'),
  clientPhone: z.string().min(10, 'Celular inválido'),
  planId: z.number().int().positive('Plano inválido'),
  monthsDuration: z.number().int().positive().optional()
})

// ═══ Loyalty ═══
export const updateLoyaltyConfigSchema = z.object({
  loyaltyEnabled: z.boolean().optional(),
  loyaltyTarget: z.number().int().positive().optional(),
  loyaltyRewardType: z.string().optional(),
  loyaltyRewardValue: z.number().nonnegative().optional()
})

export const loyaltyStampActionSchema = z.object({
  clientPhone: z.string().min(8, 'Telefone do cliente é obrigatório'),
  clientName: z.string().optional(),
  action: z.enum(['add', 'remove', 'reset'], { message: 'Ação inválida' })
})

// ═══ CRM & Chat ═══
export const createCustomerContactSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().min(8, 'Telefone é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  status: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  avatarUrl: z.string().optional()
})

export const updateCustomerContactSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  avatarUrl: z.string().optional()
})

export const sendCrmMessageSchema = z.object({
  content: z.string().optional(),
  messageType: z.enum(['TEXT', 'AUDIO', 'IMAGE', 'DOCUMENT']).optional(),
  mediaUrl: z.string().optional(),
  mediaName: z.string().optional(),
  mediaDuration: z.number().optional()
})

// ═══ Support & Helpdesk ═══
export const createSupportTicketSchema = z.object({
  subject: z.string().min(3, 'Assunto deve ter no mínimo 3 caracteres'),
  category: z.string().optional(),
  message: z.string().min(3, 'Mensagem deve ter no mínimo 3 caracteres'),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional()
})

export const sendSupportMessageSchema = z.object({
  message: z.string().min(1, 'Mensagem não pode ser vazia'),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional()
})

export const supportSatisfactionSchema = z.object({
  rating: z.number().int().min(1).max(5, 'A nota deve ser entre 1 e 5 estrelas'),
  comment: z.string().optional()
})

// ═══ Reviews (A3) ═══
export const submitReviewSchema = z.object({
  bookingId: z.number().int().positive('ID do agendamento é obrigatório'),
  clientPhone: z.string().min(8, 'Telefone do cliente é obrigatório'),
  rating: z.number().int().min(1).max(5, 'Avaliação deve ser de 1 a 5 estrelas'),
  comment: z.string().max(500, 'Comentário deve ter no máximo 500 caracteres').optional().default('')
})

export const moderateReviewSchema = z.object({
  approved: z.boolean()
})

// ═══ Portal do Funcionário ═══
export const portalLoginSchema = z.object({
  token: z.string().optional(),
  login: z.string().optional(),
  password: z.string().optional()
})

export const employeeVacationRequestSchema = z.object({
  type: z.string().optional(),
  startDate: z.string().min(1, 'Data inicial é obrigatória'),
  endDate: z.string().min(1, 'Data final é obrigatória'),
  daysCount: z.number().int().positive().optional(),
  reason: z.string().optional()
})

// ═══ Helper de Validação Numérica de Parâmetros (NaN Guard) ═══
export function parseSafeInt(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) return null;
  return num;
}

// ═══ Orders (BoraEnkomenda) ═══
export const updateOrderStatusSchema = z.object({
  status: z.enum(['NOVO', 'CONFIRMADO', 'EM_PRODUCAO', 'PRONTO', 'ENTREGUE', 'CANCELADO'], {
    message: 'Status inválido. Deve ser NOVO, CONFIRMADO, EM_PRODUCAO, PRONTO, ENTREGUE ou CANCELADO'
  }),
  note: z.string().max(500).optional()
})

export const updateOrderPaymentSchema = z.object({
  depositPaid: z.boolean()
})

// ═══ Products & Categories ═══
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nome da categoria é obrigatório (mín. 2 caracteres)'),
  iconUrl: z.string().optional().default('')
})

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  iconUrl: z.string().optional()
})

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome do produto é obrigatório'),
  description: z.string().optional().default(''),
  price: z.number().nonnegative('Preço deve ser positivo'),
  categoryId: z.number().int().positive('Categoria inválida').optional().nullable(),
  available: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  photoUrl: z.string().optional(),
  position: z.number().int().optional().default(0),
  preparationTimeMinutes: z.number().int().nonnegative().optional().default(0),
  minOrderQuantity: z.number().int().positive().optional().default(1),
  maxDailyQuantity: z.number().int().positive().optional().nullable()
})

export const updateProductSchema = createProductSchema.partial()

// ═══ Inventory ═══
export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().default(''),
  category: z.string().optional().default('PRODUTO'),
  unit: z.string().optional().default('unidade'),
  costPrice: z.number().nonnegative().optional().default(0),
  salePrice: z.number().nonnegative().optional().default(0),
  quantity: z.number().nonnegative().optional().default(0),
  minQuantity: z.number().nonnegative().optional().default(5),
  photoUrl: z.string().optional().default('')
})

export const updateInventoryItemSchema = createInventoryItemSchema.partial()

export const inventoryMovementSchema = z.object({
  type: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE', 'PERDA'], {
    message: 'Tipo de movimentação deve ser ENTRADA, SAIDA, AJUSTE ou PERDA'
  }),
  quantity: z.number().positive('Quantidade deve ser maior que zero'),
  unitCost: z.number().nonnegative('Custo unitário não pode ser negativo').optional(),
  reason: z.string().optional().default('')
})

// ═══ PDV (Ponto de Venda) ═══
export const pdvSaleItemSchema = z.object({
  name: z.string().min(1, 'Nome do item é obrigatório'),
  quantity: z.number().positive('Quantidade deve ser maior que zero'),
  unitPrice: z.number().nonnegative('Preço unitário não pode ser negativo'),
  itemType: z.string().optional().default('SERVICE'),
  inventoryItemId: z.number().int().positive().optional().nullable(),
  serviceId: z.number().int().positive().optional().nullable()
})

export const createPdvSaleSchema = z.object({
  bookingId: z.number().int().positive().optional().nullable(),
  employeeId: z.number().int().positive().optional().nullable(),
  paymentMethod: z.string().min(1, 'Método de pagamento é obrigatório'),
  discount: z.number().nonnegative().optional().default(0),
  notes: z.string().optional(),
  items: z.array(pdvSaleItemSchema).min(1, 'A venda precisa ter pelo menos 1 item')
})

// ═══ BOM (Ficha Técnica / Receita de Produção) ═══
export const recipeItemInputSchema = z.object({
  inventoryItemId: z.number().int().positive('ID do insumo inválido'),
  quantity: z.number().positive('Quantidade do insumo deve ser maior que zero'),
  unit: z.string().optional().default('unidade')
})

export const setProductRecipeSchema = z.object({
  items: z.array(recipeItemInputSchema)
})

// ═══ Devoluções & Trocas (Order Returns) ═══
export const createOrderReturnSchema = z.object({
  type: z.enum(['DEVOLUCAO', 'TROCA'], {
    message: 'Tipo deve ser DEVOLUCAO ou TROCA'
  }).default('DEVOLUCAO'),
  reason: z.string().min(3, 'Motivo da devolução/troca é obrigatório'),
  refundAmount: z.number().nonnegative().optional().default(0),
  restockItems: z.boolean().optional().default(true),
  notes: z.string().optional().default('')
})

