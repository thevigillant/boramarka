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
