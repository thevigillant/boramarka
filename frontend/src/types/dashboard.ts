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
// 🍰 BoraEncomenda Types
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
  status: 'NOVO' | 'CONFIRMADO' | 'EM_PRODUCAO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO'
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

