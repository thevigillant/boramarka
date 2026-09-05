// ════════════════════════════════════════════
// Dashboard Types — Shared across all tab components
// ════════════════════════════════════════════

export interface LinkData {
  id: number
  token: string
  title: string
  createdAt: string
  totalSlots: number
  availableSlots: number
  bookedSlots: number
  bookingFeeEnabled: boolean
  bookingFeeAmount: number
  service?: { id: number; name: string; price: number } | null
}

export interface SlotData {
  id: number
  date: string
  time: string
  isAvailable: boolean
  booking: {
    id: number
    clientName: string
    clientPhone: string
    createdAt: string
  } | null
}

export interface BookingData {
  id: number
  clientName: string
  clientPhone: string
  status: string
  paidAmount?: number
  createdAt: string
  timeSlot: {
    date: string
    time: string
    link: {
      title: string
      token: string
      service: {
        id: number
        name: string
        price: number
        duration: number
      } | null
    }
  }
}

export interface ServiceData {
  id: number
  name: string
  description: string | null
  price: number
  duration: number
  photoUrl: string
  createdAt: string
}

export interface Stats {
  totalLinks: number
  totalSlots: number
  totalBookings: number
  availableSlots: number
}

export interface FinanceStats {
  totalReceivable: number
  totalPayable: number
  receivedAmount: number
  paidAmount: number
  pendingReceivable: number
  pendingPayable: number
  balance: number
}

export interface Transaction {
  id: number
  type: 'receivable' | 'payable'
  description: string
  amount: number
  dueDate: string
  paid: boolean
  paidAt: string | null
  clientName: string
  category: string
  notes: string
  supplierId?: number | null
  invoiceId?: number | null
  purchaseId?: number | null
  createdAt: string
}

export interface EmployeeDocumentData {
  id: number
  title: string
  category: string
  fileUrl: string
  fileName: string
  fileSize: string
  expiryDate: string
  notes: string
  createdAt: string
}

export interface EmployeeData {
  id: number
  name: string
  role: string
  phone: string
  email: string
  cpf: string
  rg: string
  birthDate: string
  admissionDate: string
  salary: number
  commission: number
  workingHours: string
  status: 'ACTIVE' | 'DISMISSED' | 'ARCHIVED'
  dismissalDate: string
  dismissalReason: string
  dismissalNotes: string
  pendingType: string
  pendingResolved: boolean
  pendingNotes: string
  createdAt: string
  documents?: EmployeeDocumentData[]
}

// ════════════════════════════════════════════
// 🍰 BoraEnkomenda Types
// ════════════════════════════════════════════

export interface ProductCategoryData {
  id: number
  name: string
  iconUrl: string
  position: number
  _count?: { products: number }
}

export interface ProductPhotoData {
  id: number
  url: string
  position: number
}

export interface ProductCustomFieldData {
  id?: number
  label: string
  fieldType: 'TEXT' | 'SELECT' | 'CHECKBOX'
  options: string[] | string
  required: boolean
  position?: number
}

export interface ProductData {
  id: number
  name: string
  description: string
  price: number
  minDaysNotice: number
  maxQuantityPerOrder: number
  unitLabel: string
  available: boolean
  featured: boolean
  position: number
  categoryId: number | null
  category?: ProductCategoryData | null
  photos: ProductPhotoData[]
  customFields: ProductCustomFieldData[]
  createdAt: string
}

export interface OrderItemData {
  id: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  customizations: string
  notes: string
  productId?: number | null
  product?: {
    photos?: { url: string }[]
  } | null
}

export interface OrderStatusLogData {
  id: number
  oldStatus: string
  newStatus: string
  note: string
  createdAt: string
}

export interface OrderData {
  id: number
  orderNumber: string
  clientName: string
  clientPhone: string
  clientEmail: string
  deliveryDate: string
  deliveryTime: string
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryAddress: string
  status: 'NOVO' | 'CONFIRMADO' | 'EM_PRODUCAO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO' | 'DEVOLVIDO' | 'TROCA'
  notes: string
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  depositPercentage: number
  depositAmount: number
  depositPaid: boolean
  remainingAmount: number
  mpPaymentId?: string
  cancellationCode?: string
  createdAt: string
  updatedAt: string
  items: OrderItemData[]
  statusLogs?: OrderStatusLogData[]
}

export interface OrderSettingsData {
  id?: number
  enabled: boolean
  storeName: string
  storeDescription: string
  bannerUrl: string
  minOrderAmount: number
  depositPercentage: number
  allowScheduledPickup: boolean
  allowDelivery: boolean
  deliveryFee: number
  minAdvanceDays: number
  maxOrdersPerDay?: number
  whatsappNotifications: boolean
  pixKey: string
}

export interface OrderStatsData {
  totalOrders: number
  activeOrders: number
  completedOrders: number
  canceledOrders: number
  totalRevenue: number
  receivedRevenue: number
  pendingBalance: number
  statusCounts: {
    NOVO: number
    CONFIRMADO: number
    EM_PRODUCAO: number
    PRONTO: number
    ENTREGUE: number
    CANCELADO: number
  }
  topProducts: Array<{
    name: string
    quantity: number
    total: number
  }>
}

// ════════════════════════════════════════════
// 🛒 BoraEnkomenda: Listas de Compras Types
// ════════════════════════════════════════════

export interface ShoppingListItemData {
  id: number
  shoppingListId: number
  name: string
  quantity: number
  unit: string
  category: string
  estimatedPrice: number
  actualPrice: number
  checked: boolean
  checkedAt?: string | null
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface ShoppingListData {
  id: number
  title: string
  description?: string
  status: 'ABERTA' | 'CONCLUIDA'
  targetDate?: string | null
  orderId?: number | null
  order?: {
    id: number
    orderNumber: string
    clientName: string
    deliveryDate: string
    deliveryTime?: string
  } | null
  items: ShoppingListItemData[]
  totalItems: number
  checkedItems: number
  progress: number
  estimatedTotal: number
  createdAt: string
  updatedAt?: string
}

export interface CreateShoppingListPayload {
  title: string
  description?: string
  targetDate?: string
  orderId?: number
  items?: Array<{
    name: string
    quantity?: number
    unit?: string
    category?: string
    estimatedPrice?: number
    notes?: string
  }>
}


// ════════════════════════════════════════════
// 🏭 Fornecedores, Compras & Notas Fiscais Types
// ════════════════════════════════════════════

export interface SupplierData {
  id: number
  cnpj: string
  corporateName: string
  tradeName: string
  stateRegistration?: string
  phone: string
  email: string
  address: string
  category: string
  paymentTerms?: string
  pixKey?: string
  bankInfo?: string
  notes?: string
  active: boolean
  createdAt: string
  totalPurchased?: number
  totalPending?: number
  _count?: {
    purchases: number
    invoices: number
  }
}

export interface PurchaseItemData {
  id?: number
  name: string
  category: string
  quantity: number
  unit: string
  unitPrice: number
  subtotal: number
  notes?: string
  inventoryItemId?: number | null
}

export interface PurchaseData {
  id: number
  purchaseNumber: string
  purchaseDate: string
  expectedDeliveryDate?: string | null
  receivedDate?: string | null
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED'
  paymentMethod: string
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED'
  dueDate?: string | null
  totalAmount: number
  notes: string
  supplierId?: number | null
  supplier?: SupplierData
  invoiceId?: number | null
  items: PurchaseItemData[]
  createdAt: string
}

export interface InvoiceItemData {
  id?: number
  description: string
  expenseCategory: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  itemCode?: string
  ncm?: string
  cfop?: string
  discount?: number
  inventoryItemId?: number | null
  inventoryItem?: {
    id: number
    name: string
    unit: string
    quantity: number
    costPrice?: number
  }
}

export interface InvoiceInstallment {
  number: number
  dueDate: string
  amount: number
}

export interface InvoiceData {
  id: number
  invoiceNumber: string
  series?: string
  accessKey?: string
  issueDate: string
  dueDate: string
  totalAmount: number
  paymentMethod: string
  paid: boolean
  paidAt?: string | null
  status: 'REGISTRADA' | 'PAGA' | 'CANCELADA' | 'AUTORIZADA'
  attachmentUrl?: string
  notes: string
  transactionId?: number | null
  supplierId?: number | null
  supplier?: SupplierData
  items: InvoiceItemData[]
  createdAt: string
  direction?: 'ENTRADA' | 'SAIDA'
  operationType?: 'COMPRA' | 'VENDA' | 'DEVOLUCAO' | 'SERVICO'
  clientName?: string
  clientDocument?: string
  clientEmail?: string
  authorizationProtocol?: string
  qrCodeUrl?: string
  orderId?: number | null
  saleTransactionId?: number | null
  cfop?: string
  naturezaOperacao?: string
  productsAmount?: number
  freightAmount?: number
  discountAmount?: number
  otherExpenses?: number
  icmsAmount?: number
  ipiAmount?: number
  pisAmount?: number
  cofinsAmount?: number
  xmlContent?: string
  installments?: string
  transactions?: any[]
}

export interface FiscalSettingsData {
  cnpj: string
  businessName: string
  ie: string
  taxRegime: string
  nfeSeries: string
  nfeNextNumber: number
  nfceSeries: string
  nfceNextNumber: number
}

export interface EmitSalesInvoicePayload {
  clientName?: string
  clientDocument?: string
  clientEmail?: string
  clientAddress?: string
  items: Array<{
    itemCode?: string
    description: string
    ncm?: string
    cfop?: string
    unit: string
    quantity: number
    unitPrice: number
    inventoryItemId?: number | null
  }>
  paymentMethod: string
  orderId?: number | null
  saleTransactionId?: number | null
  naturezaOperacao?: string
  cfop?: string
  mod?: '55' | '65'
  notes?: string
}

export interface InboundInvoicePayload {
  invoiceNumber: string
  series?: string
  accessKey?: string
  issueDate: string
  dueDate: string
  totalAmount: number
  paymentMethod: string
  paid?: boolean
  supplierId?: number | null
  newSupplier?: {
    cnpj: string
    corporateName: string
    tradeName?: string
    ie?: string
    phone?: string
    email?: string
    address?: string
  }
  notes?: string
  updateStock?: boolean
  items: Array<{
    description: string
    expenseCategory: string
    quantity: number
    unit: string
    unitPrice: number
    totalPrice?: number
    itemCode?: string
    ncm?: string
    cfop?: string
    discount?: number
    inventoryItemId?: number | null
    createInventoryItem?: boolean
  }>
  cfop?: string
  naturezaOperacao?: string
  productsAmount?: number
  freightAmount?: number
  discountAmount?: number
  otherExpenses?: number
  icmsAmount?: number
  ipiAmount?: number
  pisAmount?: number
  cofinsAmount?: number
  xmlContent?: string
  installments?: any[]
}

export interface DreReportData {
  period: {
    startDate: string | null
    endDate: string | null
  }
  summary: {
    grossRevenue: number
    cogs: number
    grossProfit: number
    grossMarginPercent: number
    operatingExpenses: number
    netIncome: number
    netMarginPercent: number
    receivablesPending: number
    payablesPending: number
  }
  revenueBreakdown: Array<{
    category: string
    amount: number
    percentage: number
  }>
  expenseBreakdown: Array<{
    category: string
    amount: number
    percentage: number
  }>
}

export interface EnrichedFinanceStats {
  totalReceivable: number
  totalPayable: number
  receivedAmount: number
  paidAmount: number
  pendingReceivable: number
  pendingPayable: number
  overduePayable: number
  balance: number
  invoicesCount: number
  suppliersCount: number
  purchasesCount: number
}

