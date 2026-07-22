import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import {
  Calendar, Plus, Trash2, Copy, RefreshCw, Link2,
  Clock, Users, LogOut, X, Check, ExternalLink,
  AlertCircle, Loader2, ChevronDown, DollarSign,
  TrendingUp, TrendingDown, Wallet, CreditCard, Gift, Tag,
  Briefcase, ArrowUpRight, ArrowDownRight, Search,
  Filter, Download, MoreVertical, LayoutDashboard, Phone, User, Moon, Sun,
  ChevronLeft, ChevronRight, Camera, Pencil, Store, MapPin, Palette, CheckCircle2, Sparkles, Globe, MessageCircle, ShieldAlert, UserCheck,
  FileText, Upload, Paperclip, AlertTriangle, Archive, UserX, FileCheck, Eye, Laptop, Mail, Menu, ChevronUp, Layers
} from 'lucide-react'
import { exportBookingsToPDF, exportFinanceToPDF } from '../utils/pdfExport'
import { BoraMarkaLogo } from '../components/BoraMarkaLogo'
import { BookingCard } from '../components/BookingCard'

// ════════════════════════════════════════════
// Types
// ════════════════════════════════════════════
interface LinkData {
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

interface SlotData {
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

interface BookingData {
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

interface ServiceData {
  id: number
  name: string
  description: string | null
  price: number
  duration: number
  createdAt: string
}

interface Stats {
  totalLinks: number
  totalSlots: number
  totalBookings: number
  availableSlots: number
}

interface FinanceStats {
  totalReceivable: number
  totalPayable: number
  receivedAmount: number
  paidAmount: number
  pendingReceivable: number
  pendingPayable: number
  balance: number
}

interface Transaction {
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

interface EmployeeDocumentData {
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

interface EmployeeData {
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
// Helpers
// ════════════════════════════════════════════
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function generateTimeSlots(startTime: string, endTime: string, intervalMin: number): string[] {
  const times: string[] = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let cur = sh * 60 + sm
  const end = eh * 60 + em
  while (cur < end) {
    const h = Math.floor(cur / 60)
    const m = cur % 60
    times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    cur += intervalMin
  }
  return times
}

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function getWeekday(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return WEEKDAYS[date.getDay()]
}

// ════════════════════════════════════════════
// Toast Component
// ════════════════════════════════════════════
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed top-6 right-6 left-6 sm:left-auto sm:w-80 z-50 animate-slide-up ${
      type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90'
    } backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm border border-white/10`}>
      {type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="flex-1 font-semibold">{message}</span>
    </div>
  )
}

// ════════════════════════════════════════════
// Trial Countdown Banner
// ════════════════════════════════════════════
function TrialBanner({ 
  trialEndsAt, 
  onCheckout,
  onLogout,
  onRestoreSuperAdmin
}: { 
  trialEndsAt: string; 
  onCheckout: (plan: 'mensal' | 'anual') => void;
  onLogout: () => void;
  onRestoreSuperAdmin?: (() => void) | null;
}) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime()
      const end = new Date(trialEndsAt).getTime()
      const diff = end - now

      if (diff <= 0) {
        setExpired(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [trialEndsAt])

  if (expired) return null

  const isUrgent = timeLeft.days <= 1

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] ${isUrgent ? 'bg-gradient-to-r from-red-600 to-pink-600' : 'bg-gradient-to-r from-orange-500 to-pink-500'} text-white shadow-lg`}>
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">⏳ Período Grátis</span>
          <div className="flex items-center gap-1.5">
            <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg text-center min-w-[36px]">
              <span className="text-sm font-black leading-none">{timeLeft.days}</span>
              <p className="text-[7px] font-bold uppercase opacity-80">dias</p>
            </div>
            <span className="font-black text-sm">:</span>
            <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg text-center min-w-[36px]">
              <span className="text-sm font-black leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
              <p className="text-[7px] font-bold uppercase opacity-80">hrs</p>
            </div>
            <span className="font-black text-sm">:</span>
            <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg text-center min-w-[36px]">
              <span className="text-sm font-black leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <p className="text-[7px] font-bold uppercase opacity-80">min</p>
            </div>
            <span className="font-black text-sm">:</span>
            <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg text-center min-w-[36px]">
              <span className="text-sm font-black leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <p className="text-[7px] font-bold uppercase opacity-80">seg</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCheckout('mensal')}
            className="bg-white text-pink-600 px-4 py-1.5 rounded-xl text-xs font-black hover:bg-white/90 transition-all hover:scale-105 shadow-md cursor-pointer"
          >
            Assinar Agora
          </button>
          
          {onRestoreSuperAdmin && (
            <button
              onClick={onRestoreSuperAdmin}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 border border-white/25"
            >
              Voltar SuperAdmin
            </button>
          )}

          <button
            onClick={onLogout}
            className="bg-black/30 hover:bg-black/55 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// Inactive Account Warning Banner
// ════════════════════════════════════════════
function InactiveBanner({ 
  onSubscribe,
  onLogout,
  onRestoreSuperAdmin
}: { 
  onSubscribe: () => void;
  onLogout: () => void;
  onRestoreSuperAdmin?: (() => void) | null;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold flex items-center gap-1.5">
            ⚠️ Assinatura Inativa
          </span>
          <span className="text-xs opacity-90 hidden sm:inline">— Seu catálogo está visível, mas novas marcações e edições estão suspensas.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSubscribe}
            className="bg-white text-red-600 px-4 py-1.5 rounded-xl text-xs font-black hover:bg-white/90 transition-all hover:scale-105 shadow-md cursor-pointer"
          >
            Ativar Conta
          </button>

          {onRestoreSuperAdmin && (
            <button
              onClick={onRestoreSuperAdmin}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 border border-white/25"
            >
              Voltar SuperAdmin
            </button>
          )}

          <button
            onClick={onLogout}
            className="bg-black/30 hover:bg-black/55 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// Subscription Paywall Modal
// ════════════════════════════════════════════
function PaywallModal({ isOpen, onClose, onCheckout }: { isOpen: boolean; onClose: () => void; onCheckout: (plan: 'mensal' | 'anual' | 'premium') => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6 text-center animate-fade-in" style={{ position: 'fixed' }}>
      <div className="bg-[#131826] border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative animate-scale-up">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold bg-slate-800/50 hover:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition-all"
        >
          &times;
        </button>
        
        <div className="w-16 h-16 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-2">Assinatura Necessária</h2>
        <p className="text-slate-400 mb-8 text-sm font-medium leading-relaxed">
          Sua conta está no modo de visualização. Para reativar sua agenda online, gerenciar seus horários e continuar recebendo agendamentos automáticos, escolha um de nossos planos.
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={() => onCheckout('mensal')}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 border border-slate-750 hover:scale-[1.02]"
          >
            <CreditCard className="w-5 h-5" />
            Plano Mensal — R$ 30/mês
          </button>
          
          <button 
            onClick={() => onCheckout('anual')}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Plano Anual — R$ 260/ano <span className="text-xs opacity-80 ml-1">(economize R$ 100)</span>
          </button>

          <button 
            onClick={() => onCheckout('premium')}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-yellow-300" />
            Plano Premium — R$ 69,90/mês
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// Stat Card
// ════════════════════════════════════════════
function StatCard({ title, value, icon: Icon, color, trend }: { title: string; value: string | number; icon: any; color: string; trend?: { val: string; up: boolean } }) {
  return (
    <div className="card-simple">
      <div className="card-simple-inner p-3.5 sm:p-5 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-2.5 sm:mb-4">
          <p className="text-slate-500 dark:text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate mr-1">{title}</p>
          <div className="p-1.5 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: color }} />
          </div>
        </div>
        <div>
          <p className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white truncate">{value}</p>
          {trend && (
            <span className={`text-[10px] sm:text-xs font-bold flex items-center gap-0.5 mt-1 ${trend.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend.val}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// Calendar Widget
// ════════════════════════════════════════════
function CalendarWidget({ selectedDate, onSelectDate, currentMonth, setCurrentMonth }: { selectedDate: string, onSelectDate: (d: string) => void, currentMonth: Date, setCurrentMonth: (d: Date) => void }) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const handlePrev = () => setCurrentMonth(new Date(year, month - 1, 1))
  const handleNext = () => setCurrentMonth(new Date(year, month + 1, 1))

  const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long' })

  return (
    <div className="w-full select-none">
       <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white">
           <Calendar className="w-4 h-4 text-orange-500" /> {monthName} {year}
         </h3>
         <div className="flex gap-1">
           <button onClick={handlePrev} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4" /></button>
           <button onClick={handleNext} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4" /></button>
         </div>
       </div>
       <div className="grid grid-cols-7 gap-1 text-center mb-2">
         {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
           <div key={d} className="text-[9px] font-black text-slate-400 uppercase">{d}</div>
         ))}
       </div>
       <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
         {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
         {Array.from({ length: daysInMonth }).map((_, i) => {
           const day = i + 1;
           const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
           const isSelected = selectedDate === dateStr;
           const isToday = new Date().toISOString().split('T')[0] === dateStr;
           
           return (
             <button
               key={day}
               onClick={() => onSelectDate(dateStr)}
               className={`w-8 h-8 mx-auto rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                 isSelected 
                   ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/20' 
                   : isToday
                   ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
               }`}
             >
               {day}
             </button>
           );
         })}
       </div>
    </div>
  )
}

// Phone mask for Brazilian numbers: (XX) XXXXX-XXXX
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// ════════════════════════════════════════════
// Main Dashboard
// ════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'horarios' | 'agendamentos' | 'financeiro' | 'servicos' | 'trash' | 'personalizar' | 'faturamento' | 'clientes' | 'cupons' | 'memberships' | 'social' | 'rh' | 'audit'>('overview')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>('operacional')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [showPaywall, setShowPaywall] = useState(false)
  const [financeFilter, setFinanceFilter] = useState<'all' | 'receivable' | 'payable'>('all')
  const [financeSearchQuery, setFinanceSearchQuery] = useState('')
  const [financePaidFilter, setFinancePaidFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [financeDateRange, setFinanceDateRange] = useState<'all' | 'today' | 'thisMonth' | 'lastMonth' | 'last30' | 'last90' | 'custom'>('all')
  const [financeStartDate, setFinanceStartDate] = useState('')
  const [financeEndDate, setFinanceEndDate] = useState('')
  const [financeCategoryFilter, setFinanceCategoryFilter] = useState('all')
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfReportType, setPdfReportType] = useState<'bookings' | 'finance'>('bookings')
  const [pdfIncludeLogo, setPdfIncludeLogo] = useState(true)
  const [pdfLogoUrl, setPdfLogoUrl] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)
  const pdfFileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  // 🔍 Global Header Search State & Shortcut
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const headerSearchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        headerSearchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Data
  const [stats, setStats] = useState<Stats>({ totalLinks: 0, totalSlots: 0, totalBookings: 0, availableSlots: 0 })
  const [financeStats, setFinanceStats] = useState<FinanceStats>({
    totalReceivable: 0, totalPayable: 0, receivedAmount: 0, paidAmount: 0,
    pendingReceivable: 0, pendingPayable: 0, balance: 0
  })
  const [links, setLinks] = useState<LinkData[]>([])
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // ═══ Categorias da Navbar (Dropdowns) ═══
  const navCategories = useMemo(() => {
    type TabIdType = 'overview' | 'links' | 'horarios' | 'agendamentos' | 'financeiro' | 'servicos' | 'trash' | 'personalizar' | 'faturamento' | 'clientes' | 'cupons' | 'memberships' | 'social' | 'rh' | 'audit'
    interface NavItem {
      id: TabIdType
      label: string
      icon: any
      desc: string
      badge?: number
    }

    return [
      {
        id: 'overview',
        label: 'Visão Geral',
        icon: LayoutDashboard,
        type: 'single' as const,
        tabId: 'overview' as TabIdType,
      },
      {
        id: 'operacional',
        label: 'Operacional',
        icon: Calendar,
        type: 'dropdown' as const,
        badge: bookings.length > 0 ? bookings.length : undefined,
        items: [
          { id: 'agendamentos', label: 'Agendamentos', icon: Calendar, desc: 'Lista e confirmação de horários agendados', badge: bookings.length },
          { id: 'clientes', label: 'Clientes', icon: Users, desc: 'Base completa e histórico de clientes' },
          { id: 'horarios', label: 'Gerenciar Agenda', icon: Clock, desc: 'Configuração da grade de horários disponíveis' },
        ] as NavItem[]
      },
      {
        id: 'comercial',
        label: 'Comercial',
        icon: Briefcase,
        type: 'dropdown' as const,
        items: [
          { id: 'servicos', label: 'Serviços', icon: Briefcase, desc: 'Catálogo de serviços, preços e durações' },
          { id: 'links', label: 'Links de Venda', icon: Link2, desc: 'Links para clientes agendarem online' },
          { id: 'cupons', label: 'Cupons de Desconto', icon: Tag, desc: 'Crie códigos promocionais para clientes' },
          { id: 'memberships', label: 'Clube de Assinaturas', icon: Gift, desc: 'Planos e assinaturas recorrentes de clientes' },
        ] as NavItem[]
      },
      {
        id: 'gestao',
        label: 'Gestão & Finanças',
        icon: DollarSign,
        type: 'dropdown' as const,
        items: [
          { id: 'financeiro', label: 'Financeiro', icon: DollarSign, desc: 'Fluxo de caixa, recebíveis e despesas' },
          { id: 'rh', label: 'RH / Equipe', icon: UserCheck, desc: 'Gestão de funcionários, funções e comissões' },
          { id: 'faturamento', label: 'Plano & Assinatura', icon: CreditCard, desc: 'Gerenciar seu plano e faturas no BoraMarka' },
        ] as NavItem[]
      },
      {
        id: 'sistema',
        label: 'Sistema & Ajustes',
        icon: Palette,
        type: 'dropdown' as const,
        items: [
          { id: 'personalizar', label: 'Personalizar Página', icon: Palette, desc: 'Identidade visual, tema, cores e banner' },
          { id: 'social', label: 'Explorar Rede', icon: Globe, desc: 'Rede de contatos e chat com profissionais' },
          { id: 'audit', label: 'Logs & Auditoria', icon: ShieldAlert, desc: 'Registro de ações, logins e segurança' },
          { id: 'trash', label: 'Lixeira', icon: Trash2, desc: 'Recuperar itens excluídos recentemente' },
        ] as NavItem[]
      }
    ]
  }, [bookings.length])

  // Informações da aba atual (Breadcrumb)
  const currentTabInfo = useMemo(() => {
    for (const cat of navCategories) {
      if (cat.type === 'single' && cat.tabId === activeTab) {
        return { catLabel: cat.label, itemLabel: cat.label, icon: cat.icon }
      }
      if (cat.type === 'dropdown') {
        const found = cat.items.find(item => item.id === activeTab)
        if (found) {
          return { catLabel: cat.label, itemLabel: found.label, icon: found.icon }
        }
      }
    }
    return { catLabel: 'Visão Geral', itemLabel: 'Resumo', icon: LayoutDashboard }
  }, [activeTab, navCategories])
  
  // Get all unique categories for filter
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    transactions.forEach(t => {
      if (t.category) cats.add(t.category)
    })
    return Array.from(cats)
  }, [transactions])

  // 🔍 Resultados da Busca Global no Cabeçalho
  const filteredSearchItems = useMemo(() => {
    if (!globalSearchQuery.trim()) return []
    const q = globalSearchQuery.toLowerCase()
    const items: { title: string; subtitle: string; icon: any; targetTab: string }[] = []

    // 1. Clientes & Agendamentos
    bookings.forEach(b => {
      if (b.clientName?.toLowerCase().includes(q) || b.clientPhone?.includes(q)) {
        items.push({
          title: b.clientName,
          subtitle: `Agendamento • ${b.timeSlot?.link?.title || 'Serviço'} (${formatDate(b.timeSlot?.date || '')})`,
          icon: Users,
          targetTab: 'agendamentos'
        })
      }
    })

    // 2. Links de Venda & Serviços
    links.forEach(l => {
      if (l.title?.toLowerCase().includes(q) || l.token?.toLowerCase().includes(q) || l.service?.name?.toLowerCase().includes(q)) {
        items.push({
          title: l.title,
          subtitle: `Link de Vendas • Token: ${l.token}${l.service ? ` (${l.service.name})` : ''}`,
          icon: Link2,
          targetTab: 'links'
        })
      }
    })

    // 3. Transações Financeiras
    transactions.forEach(t => {
      if (t.description?.toLowerCase().includes(q) || t.clientName?.toLowerCase().includes(q)) {
        items.push({
          title: t.description,
          subtitle: `Financeiro • ${t.type === 'receivable' ? 'Entrada' : 'Saída'} ${formatCurrency(t.amount)}`,
          icon: DollarSign,
          targetTab: 'financeiro'
        })
      }
    })

    return items.slice(0, 8)
  }, [globalSearchQuery, bookings, links, transactions])

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: Transaction) => {
      // 1. Search Query filter (description or clientName)
      if (financeSearchQuery.trim()) {
        const query = financeSearchQuery.toLowerCase()
        const descMatch = t.description.toLowerCase().includes(query)
        const clientMatch = t.clientName ? t.clientName.toLowerCase().includes(query) : false
        if (!descMatch && !clientMatch) return false
      }

      // 2. Paid filter (status)
      if (financePaidFilter !== 'all') {
        const wantPaid = financePaidFilter === 'paid'
        if (t.paid !== wantPaid) return false
      }

      // 3. Category filter
      if (financeCategoryFilter !== 'all') {
        if (t.category !== financeCategoryFilter) return false
      }

      // 4. Date range filter
      if (financeDateRange !== 'all') {
        const tDate = new Date(t.dueDate)
        const today = new Date()
        
        // Reset times for date-only comparison
        tDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)

        if (financeDateRange === 'today') {
          if (tDate.getTime() !== today.getTime()) return false
        } else if (financeDateRange === 'thisMonth') {
          if (tDate.getMonth() !== today.getMonth() || tDate.getFullYear() !== today.getFullYear()) return false
        } else if (financeDateRange === 'lastMonth') {
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
          if (tDate.getMonth() !== lastMonth.getMonth() || tDate.getFullYear() !== lastMonth.getFullYear()) return false
        } else if (financeDateRange === 'last30') {
          const past30 = new Date()
          past30.setDate(today.getDate() - 30)
          past30.setHours(0, 0, 0, 0)
          if (tDate.getTime() < past30.getTime() || tDate.getTime() > today.getTime()) return false
        } else if (financeDateRange === 'last90') {
          const past90 = new Date()
          past90.setDate(today.getDate() - 90)
          past90.setHours(0, 0, 0, 0)
          if (tDate.getTime() < past90.getTime() || tDate.getTime() > today.getTime()) return false
        } else if (financeDateRange === 'custom') {
          if (financeStartDate) {
            const start = new Date(financeStartDate)
            start.setHours(0, 0, 0, 0)
            if (tDate.getTime() < start.getTime()) return false
          }
          if (financeEndDate) {
            const end = new Date(financeEndDate)
            end.setHours(0, 0, 0, 0)
            if (tDate.getTime() > end.getTime()) return false
          }
        }
      }

      return true
    })
  }, [transactions, financeSearchQuery, financePaidFilter, financeCategoryFilter, financeDateRange, financeStartDate, financeEndDate])

  // Recalculated dynamic stats based on filtered transactions
  const filteredFinanceStats = useMemo(() => {
    let totalReceivable = 0
    let totalPayable = 0
    let receivedAmount = 0
    let paidAmount = 0
    let pendingReceivable = 0
    let pendingPayable = 0

    filteredTransactions.forEach(t => {
      const amount = t.amount
      if (t.type === 'receivable') {
        totalReceivable += amount
        if (t.paid) {
          receivedAmount += amount
        } else {
          pendingReceivable += amount
        }
      } else {
        totalPayable += amount
        if (t.paid) {
          paidAmount += amount
        } else {
          pendingPayable += amount
        }
      }
    })

    const balance = receivedAmount - paidAmount

    return {
      totalReceivable,
      totalPayable,
      receivedAmount,
      paidAmount,
      pendingReceivable,
      pendingPayable,
      balance
    }
  }, [filteredTransactions])
  const [slots, setSlots] = useState<SlotData[]>([])
  const [services, setServices] = useState<ServiceData[]>([])
  const [deletedLinks, setDeletedLinks] = useState<any[]>([])
  const [selectedLinkId, setSelectedLinkId] = useState<number | null>(null)
  const [coupons, setCoupons] = useState<any[]>([])
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: ''
  })
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')
  const [membershipPlans, setMembershipPlans] = useState<any[]>([])
  const [clientSubscriptions, setClientSubscriptions] = useState<any[]>([])
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    interval: 'monthly' as 'monthly' | 'yearly'
  })
  const [subForm, setSubForm] = useState({
    clientName: '',
    clientPhone: '',
    planId: ''
  })
  const [selectedClientPhone, setSelectedClientPhone] = useState<string | null>(null)
  const [selectedClientName, setSelectedClientName] = useState<string>('')
  const [clientHistory, setClientHistory] = useState<any[]>([])
  const [clientNotes, setClientNotes] = useState<any[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [loadingClientDetails, setLoadingClientDetails] = useState(false)

  // ═══ Employee / RH States ═══
  const [employees, setEmployees] = useState<EmployeeData[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [rhSubTab, setRhSubTab] = useState<'ACTIVE' | 'DISMISSED' | 'ARCHIVED'>('ACTIVE')
  const [rhSearch, setRhSearch] = useState('')
  const [rhPendingTypeFilter, setRhPendingTypeFilter] = useState('ALL')
  const [rhPendingStatusFilter, setRhPendingStatusFilter] = useState('ALL')
  
  // Registration Modal State
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null)
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    cpf: '',
    rg: '',
    birthDate: '',
    admissionDate: new Date().toISOString().split('T')[0],
    salary: '',
    commission: '',
    workingHours: ''
  })

  // Dismissal Modal State
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [employeeToDismiss, setEmployeeToDismiss] = useState<EmployeeData | null>(null)
  const [dismissForm, setDismissForm] = useState({
    dismissalDate: new Date().toISOString().split('T')[0],
    dismissalReason: 'Sem justa causa',
    dismissalNotes: '',
    pendingType: 'RESCISAO',
    pendingNotes: '',
    hasPending: true
  })

  // Document Manager Modal State
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [selectedEmployeeForDocs, setSelectedEmployeeForDocs] = useState<EmployeeData | null>(null)
  const [docList, setDocList] = useState<EmployeeDocumentData[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'CONTRATO',
    fileUrl: '',
    fileName: '',
    fileSize: '',
    expiryDate: '',
    notes: ''
  })

  // ═══ Audit Log States ═══
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false)
  const [auditSearch, setAuditSearch] = useState('')
  const [auditEntityFilter, setAuditEntityFilter] = useState('ALL')
  const [auditSeverityFilter, setAuditSeverityFilter] = useState('ALL')

  // ═══ Social/Chat States ═══
  const [socialSearch, setSocialSearch] = useState('')
  const [exploreList, setExploreList] = useState<any[]>([])
  const [inboxList, setInboxList] = useState<any[]>([])
  const [activeChatPartner, setActiveChatPartner] = useState<any | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingExplore, setLoadingExplore] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [adminInfo, setAdminInfo] = useState<{ 
    username: string; 
    email?: string;
    businessName: string; 
    photoUrl?: string; 
    cnpj?: string; 
    phone?: string; 
    description?: string; 
    address?: string; 
    operatingHours?: string; 
    mpAccessToken?: string;
    accentColor?: string;
    secondaryColor?: string;
    publicTheme?: string;
    bannerUrl?: string;
    customDomain?: string;
  } | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const img = new window.Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 400
        const MAX_HEIGHT = 400
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)

        try {
          await api.updateProfile({ photoUrl: dataUrl })
          setAdminInfo(prev => prev ? { ...prev, photoUrl: dataUrl } : prev)
          showToast('Foto de perfil atualizada!')
        } catch (err: any) {
          showToast(err.message, 'error')
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Branding (Personalizar) Form State & Refs
  const brandingAvatarInputRef = useRef<HTMLInputElement>(null)
  const brandingBannerInputRef = useRef<HTMLInputElement>(null)
  const [brandingForm, setBrandingForm] = useState({
    businessName: '',
    description: '',
    photoUrl: '',
    bannerUrl: '',
    accentColor: '#f97316',
    secondaryColor: '#ec4899',
    publicTheme: 'light',
    customDomain: '',
  })

  useEffect(() => {
    if (adminInfo) {
      setBrandingForm({
        businessName: adminInfo.businessName || '',
        description: adminInfo.description || '',
        photoUrl: adminInfo.photoUrl || '',
        bannerUrl: adminInfo.bannerUrl || '',
        accentColor: adminInfo.accentColor || '#f97316',
        secondaryColor: adminInfo.secondaryColor || '#ec4899',
        publicTheme: adminInfo.publicTheme || 'light',
        customDomain: adminInfo.customDomain || '',
      })
    }
  }, [adminInfo])

  const handleBrandingAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const img = new window.Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const MAX = 400
        canvas.width = MAX
        canvas.height = MAX
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, MAX, MAX)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        setBrandingForm(prev => ({ ...prev, photoUrl: dataUrl }))
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleBrandingBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const img = new window.Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const TARGET_WIDTH = 1200
        const TARGET_HEIGHT = 400
        canvas.width = TARGET_WIDTH
        canvas.height = TARGET_HEIGHT
        
        const ctx = canvas.getContext('2d')
        const imgRatio = img.width / img.height
        const targetRatio = TARGET_WIDTH / TARGET_HEIGHT
        
        let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height
        if (imgRatio > targetRatio) {
          srcW = img.height * targetRatio
          srcX = (img.width - srcW) / 2
        } else {
          srcH = img.width / targetRatio
          srcY = (img.height - srcH) / 2
        }
        
        ctx?.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, TARGET_WIDTH, TARGET_HEIGHT)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
        setBrandingForm(prev => ({ ...prev, bannerUrl: dataUrl }))
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.updateProfile(brandingForm)
      setAdminInfo(prev => prev ? { ...prev, ...brandingForm } : prev)
      showToast('Identidade visual salva com sucesso!')
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  // Modals / Forms
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    businessName: '',
    phone: '',
    address: '',
    description: '',
    cnpj: '',
    operatingHours: '',
    mpAccessToken: '',
    accentColor: '#f97316',
    secondaryColor: '#ec4899',
    publicTheme: 'light'
  })

  const dayLabels: Record<string, string> = {
    seg: 'Segunda', ter: 'Terça', qua: 'Quarta',
    qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo'
  }

  const openEditProfile = () => {
    if (adminInfo) {
      let hoursStr = adminInfo.operatingHours || ''
      if (!hoursStr || !hoursStr.includes('seg')) {
        hoursStr = JSON.stringify({
          seg: { open: '08:00', close: '18:00', active: true },
          ter: { open: '08:00', close: '18:00', active: true },
          qua: { open: '08:00', close: '18:00', active: true },
          qui: { open: '08:00', close: '18:00', active: true },
          sex: { open: '08:00', close: '18:00', active: true },
          sab: { open: '08:00', close: '13:00', active: true },
          dom: { open: '', close: '', active: false },
        })
      }
      setProfileForm({
        username: adminInfo.username || '',
        email: adminInfo.email || '',
        businessName: adminInfo.businessName || '',
        phone: adminInfo.phone || '',
        address: adminInfo.address || '',
        description: adminInfo.description || '',
        cnpj: adminInfo.cnpj || '',
        operatingHours: hoursStr,
        mpAccessToken: adminInfo.mpAccessToken || '',
        accentColor: adminInfo.accentColor || '#f97316',
        secondaryColor: adminInfo.secondaryColor || '#ec4899',
        publicTheme: adminInfo.publicTheme || 'light'
      })
      setShowEditProfile(true)
    }
  }

  const updateProfileHours = (day: string, field: string, value: string | boolean) => {
    try {
      const hours = JSON.parse(profileForm.operatingHours || '{}')
      const updated = { ...hours, [day]: { ...hours[day], [field]: value } }
      setProfileForm(prev => ({ ...prev, operatingHours: JSON.stringify(updated) }))
    } catch {
      // ignore
    }
  }

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.updateProfile(profileForm)
      setAdminInfo(prev => prev ? { ...prev, ...profileForm } : prev)
      showToast('Perfil atualizado!')
      setShowEditProfile(false)
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const [showNewLink, setShowNewLink] = useState(false)
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkServiceId, setNewLinkServiceId] = useState<number | null>(null)
  const [newLinkBookingFeeEnabled, setNewLinkBookingFeeEnabled] = useState(false)
  const [newLinkBookingFeeAmount, setNewLinkBookingFeeAmount] = useState('')

  const [editingLink, setEditingLink] = useState<LinkData | null>(null)
  const [editLinkTitle, setEditLinkTitle] = useState('')
  const [editLinkServiceId, setEditLinkServiceId] = useState<number | null>(null)
  const [editLinkBookingFeeEnabled, setEditLinkBookingFeeEnabled] = useState(false)
  const [editLinkBookingFeeAmount, setEditLinkBookingFeeAmount] = useState('')
  const [showNewTransaction, setShowNewTransaction] = useState(false)
  const [newTx, setNewTx] = useState({
    type: 'receivable' as 'receivable' | 'payable',
    description: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    clientName: '',
    paid: false,
    category: ''
  })

  const [showNewService, setShowNewService] = useState(false)
  const [editingService, setEditingService] = useState<ServiceData | null>(null)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30'
  })

  // Booking Management States
  const [searchBookingQuery, setSearchBookingQuery] = useState('')
  const [showNewBookingModal, setShowNewBookingModal] = useState(false)
  const [showDeleteSlotModal, setShowDeleteSlotModal] = useState(false)
  const [slotToDelete, setSlotToDelete] = useState<number | null>(null)
  const [slotToDeleteTime, setSlotToDeleteTime] = useState('')
  const [deleteAllDayFreeSlots, setDeleteAllDayFreeSlots] = useState(false)
  const [newBookingData, setNewBookingData] = useState({
    linkId: '',
    date: '',
    time: '',
    clientName: '',
    clientPhone: ''
  })

  // Scheduler Form
  const [slotDate, setSlotDate] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [slotStartTime, setSlotStartTime] = useState('08:00')
  const [slotEndTime, setSlotEndTime] = useState('18:00')
  const [slotInterval, setSlotInterval] = useState(30)
  const [isSingleSlot, setIsSingleSlot] = useState(false)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

  // ═══ Data Fetching ═══
  const [subscription, setSubscription] = useState<{ plan: string; status: string; expiresAt: string | null; trialEndsAt: string | null } | null>(null)
  
  const hasBanner = !!(subscription && (
    subscription.status === 'inactive' || 
    (subscription.status === 'trialing' && subscription.trialEndsAt && new Date(subscription.trialEndsAt).getTime() > new Date().getTime())
  ))
  
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const [s, f, l, b, t, p, sv, dl, subStatus, cpList, googleStatus, plans, subs] = await Promise.all([
        api.getStats(),
        api.getFinanceStats(),
        api.getLinks(),
        api.getBookings(),
        api.getTransactions(),
        api.getProfile(),
        api.getServices(),
        api.getDeletedLinks(),
        api.getSubscriptionStatus().catch(() => null), // Não quebrar se falhar
        api.getCoupons().catch(() => []), // Não quebrar se falhar
        api.getGoogleCalendarStatus().catch(() => ({ connected: false, email: '' })), // Não quebrar se falhar
        api.getMembershipPlans().catch(() => []),
        api.getClientSubscriptions().catch(() => [])
      ])
      setStats(s)
      setFinanceStats(f)
      setLinks(l)
      setBookings(b)
      setTransactions(t)
      setAdminInfo(p)
      setServices(sv)
      setDeletedLinks(dl)
      setCoupons(cpList || [])
      setIsGoogleConnected(!!googleStatus?.connected)
      setGoogleEmail(googleStatus?.email || '')
      setMembershipPlans(plans || [])
      setClientSubscriptions(subs || [])
      if (subStatus) setSubscription(subStatus)
      if (isManual) showToast('Dados atualizados!')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [showToast])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(), 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    if (paymentStatus) {
      if (paymentStatus === 'success') {
        showToast('Parabéns! Sua assinatura foi ativada com sucesso. 🎉', 'success')
      } else if (paymentStatus === 'pending') {
        showToast('Seu pagamento está em análise. Assim que aprovado, sua assinatura será ativada! ⌛', 'success')
      } else if (paymentStatus === 'failure') {
        showToast('Houve um problema ao processar seu pagamento. Tente novamente.', 'error')
      }
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const googleStatus = params.get('google')
    if (googleStatus) {
      if (googleStatus === 'success') {
        showToast('Google Agenda integrado com sucesso! 🎉', 'success')
      } else if (googleStatus === 'error') {
        const msg = params.get('message') || 'Não foi possível conectar com sua conta Google.'
        showToast(`Erro na integração com Google: ${msg}`, 'error')
      }
      window.history.replaceState({}, document.title, window.location.pathname)
      fetchData()
    }
  }, [showToast, fetchData])

  useEffect(() => {
    if (activeTab === 'horarios' && selectedLinkId) {
      api.getSlots(selectedLinkId).then(setSlots)
    }
  }, [activeTab, selectedLinkId])

  useEffect(() => {
    if (subscription?.status === 'inactive') {
      setActiveTab('servicos')
      setShowPaywall(true)
    }
  }, [subscription?.status])

  // ═══ Social Networking & Chat Effects & Functions ═══
  useEffect(() => {
    if (activeTab === 'social') {
      loadExploreList()
      loadInboxList()
    }
  }, [activeTab, socialSearch])

  useEffect(() => {
    let intervalId: any = null
    if (activeTab === 'social' && activeChatPartner) {
      loadChatMessages(activeChatPartner.id)
      intervalId = setInterval(() => {
        loadChatMessages(activeChatPartner.id, true) // silent reload
      }, 4000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [activeTab, activeChatPartner])

  const loadExploreList = async () => {
    try {
      setLoadingExplore(true)
      const data = await api.exploreProfessionals(socialSearch)
      setExploreList(data)
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar profissionais', 'error')
    } finally {
      setLoadingExplore(false)
    }
  }

  const loadInboxList = async () => {
    try {
      const data = await api.getChatsInbox()
      setInboxList(data)
    } catch (err: any) {
      console.error('Erro ao carregar caixa de mensagens', err)
    }
  }

  const loadChatMessages = async (partnerId: number, silent = false) => {
    try {
      if (!silent) setLoadingChat(true)
      const data = await api.getChatMessages(partnerId)
      setChatMessages(data)
    } catch (err: any) {
      if (!silent) showToast(err.message || 'Erro ao carregar conversas', 'error')
    } finally {
      if (!silent) setLoadingChat(false)
    }
  }

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeChatPartner || !newMessage.trim()) return
    try {
      const sent = await api.sendChatMessage(activeChatPartner.id, newMessage)
      setChatMessages(prev => [...prev, sent])
      setNewMessage('')
      loadInboxList()
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar mensagem', 'error')
    }
  }

  const handleRestoreSuperAdmin = () => {
    const superadminToken = sessionStorage.getItem('superadmin_token')
    if (superadminToken) {
      localStorage.setItem('token', superadminToken)
      localStorage.setItem('role', 'superadmin')
      sessionStorage.removeItem('superadmin_token')
      navigate('/superadmin')
    }
  }

  // ═══ Handlers ═══
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('role')
    navigate('/login')
  }

  const handleCheckout = async (plan: 'mensal' | 'anual' | 'premium') => {
    try {
      const { init_point } = await api.createCheckout(plan)
      window.location.href = init_point // Redireciona para o Mercado Pago
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        code: couponForm.code,
        discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue) || 0
      }
      await api.createCoupon(data)
      showToast('Cupom criado com sucesso!')
      setCouponForm({ code: '', discountType: 'percentage', discountValue: '' })
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteCoupon = async (id: number) => {
    try {
      await api.deleteCoupon(id)
      showToast('Cupom excluído com sucesso!')
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateMembershipPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        name: planForm.name,
        description: planForm.description,
        price: parseFloat(planForm.price) || 0,
        interval: planForm.interval
      }
      await api.createMembershipPlan(data)
      showToast('Plano de assinatura criado com sucesso!')
      setPlanForm({ name: '', description: '', price: '', interval: 'monthly' })
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteMembershipPlan = async (id: number) => {
    try {
      await api.deleteMembershipPlan(id)
      showToast('Plano de assinatura excluído com sucesso!')
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateClientSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        clientName: subForm.clientName,
        clientPhone: subForm.clientPhone,
        planId: parseInt(subForm.planId)
      }
      await api.createClientSubscription(data)
      showToast('Cliente assinado com sucesso!')
      setSubForm({ clientName: '', clientPhone: '', planId: '' })
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteClientSubscription = async (id: number) => {
    try {
      await api.deleteClientSubscription(id)
      showToast('Assinatura do cliente cancelada/excluída!')
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleOpenClientDetails = async (name: string, phone: string) => {
    setSelectedClientPhone(phone)
    setSelectedClientName(name)
    setLoadingClientDetails(true)
    try {
      const [history, notes] = await Promise.all([
        api.getClientHistory(phone),
        api.getClientNotes(phone)
      ])
      setClientHistory(history)
      setClientNotes(notes)
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setLoadingClientDetails(false)
    }
  }

  const handleCreateClientNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientPhone || !newNoteContent.trim()) return
    try {
      await api.createClientNote(selectedClientPhone, newNoteContent)
      showToast('Anotação salva com sucesso!')
      setNewNoteContent('')
      // Reload notes list
      const notes = await api.getClientNotes(selectedClientPhone)
      setClientNotes(notes)
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteClientNote = async (id: number) => {
    if (!selectedClientPhone) return
    try {
      await api.deleteClientNote(id)
      showToast('Anotação excluída!')
      // Reload notes list
      const notes = await api.getClientNotes(selectedClientPhone)
      setClientNotes(notes)
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        name: serviceForm.name,
        description: serviceForm.description,
        price: parseFloat(serviceForm.price),
        duration: parseInt(serviceForm.duration)
      }
      if (editingService) {
        await api.updateService(editingService.id, data)
        showToast('Serviço atualizado!')
      } else {
        await api.createService(data)
        showToast('Serviço criado!')
      }
      setShowNewService(false)
      setEditingService(null)
      setServiceForm({ name: '', description: '', price: '', duration: '30' })
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteService = async (id: number) => {
    if (!confirm('Excluir este serviço?')) return
    try {
      await api.deleteService(id)
      showToast('Serviço excluído!')
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const fetchEmployees = useCallback(async () => {
    if (subscription?.plan !== 'premium' || subscription?.status !== 'active') return
    setLoadingEmployees(true)
    try {
      const data = await api.getEmployees()
      setEmployees(data || [])
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar colaboradores', 'error')
    } finally {
      setLoadingEmployees(false)
    }
  }, [subscription, showToast])

  useEffect(() => {
    if (activeTab === 'rh') {
      fetchEmployees()
    }
  }, [activeTab, fetchEmployees])

  const handleCreateOrUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeForm.name || !employeeForm.role) {
      showToast('Nome e Cargo são obrigatórios', 'error')
      return
    }

    const data = {
      name: employeeForm.name,
      role: employeeForm.role,
      phone: employeeForm.phone,
      email: employeeForm.email,
      cpf: employeeForm.cpf,
      rg: employeeForm.rg,
      birthDate: employeeForm.birthDate,
      admissionDate: employeeForm.admissionDate,
      salary: employeeForm.salary ? parseFloat(employeeForm.salary) : 0,
      commission: employeeForm.commission ? parseFloat(employeeForm.commission) : 0,
      workingHours: employeeForm.workingHours
    }

    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, data)
        showToast('Colaborador atualizado com sucesso!')
      } else {
        await api.createEmployee(data)
        showToast('Colaborador cadastrado com sucesso!')
      }
      setEmployeeModalOpen(false)
      setEditingEmployee(null)
      setEmployeeForm({
        name: '', role: '', phone: '', email: '',
        cpf: '', rg: '', birthDate: '',
        admissionDate: new Date().toISOString().split('T')[0],
        salary: '', commission: '', workingHours: ''
      })
      fetchEmployees()
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar colaborador', 'error')
    }
  }

  const openEditEmployee = (emp: EmployeeData) => {
    setEditingEmployee(emp)
    setEmployeeForm({
      name: emp.name,
      role: emp.role,
      phone: emp.phone || '',
      email: emp.email || '',
      cpf: emp.cpf || '',
      rg: emp.rg || '',
      birthDate: emp.birthDate || '',
      admissionDate: emp.admissionDate || new Date().toISOString().split('T')[0],
      salary: emp.salary ? emp.salary.toString() : '',
      commission: emp.commission ? emp.commission.toString() : '',
      workingHours: emp.workingHours || ''
    })
    setEmployeeModalOpen(true)
  }

  const openDismissModal = (emp: EmployeeData) => {
    setEmployeeToDismiss(emp)
    setDismissForm({
      dismissalDate: new Date().toISOString().split('T')[0],
      dismissalReason: 'Sem justa causa',
      dismissalNotes: '',
      pendingType: 'RESCISAO',
      pendingNotes: '',
      hasPending: true
    })
    setDismissModalOpen(true)
  }

  const handleConfirmDismissal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeToDismiss) return
    try {
      await api.dismissEmployee(employeeToDismiss.id, {
        dismissalDate: dismissForm.dismissalDate,
        dismissalReason: dismissForm.dismissalReason,
        dismissalNotes: dismissForm.dismissalNotes,
        pendingType: dismissForm.hasPending ? dismissForm.pendingType : '',
        pendingNotes: dismissForm.hasPending ? dismissForm.pendingNotes : '',
        pendingResolved: !dismissForm.hasPending
      })
      showToast(`Colaborador ${employeeToDismiss.name} demitido. Mivido para pendências.`)
      setDismissModalOpen(false)
      setEmployeeToDismiss(null)
      fetchEmployees()
    } catch (err: any) {
      showToast(err.message || 'Erro ao demitir colaborador', 'error')
    }
  }

  const handleResolvePending = async (empId: number, resolved: boolean) => {
    try {
      await api.resolveEmployeePending(empId, resolved)
      showToast(resolved ? 'Pendência marcada como resolvida!' : 'Pendência reaberta.')
      fetchEmployees()
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar pendência', 'error')
    }
  }

  const handleArchiveEmployee = async (empId: number) => {
    if (!window.confirm('Mover este colaborador demitido para o Arquivo Morto?')) return
    try {
      await api.archiveEmployee(empId)
      showToast('Colaborador movido para o Arquivo Morto.')
      fetchEmployees()
    } catch (err: any) {
      showToast(err.message || 'Erro ao arquivar colaborador', 'error')
    }
  }

  const handleRestoreEmployee = async (empId: number) => {
    if (!window.confirm('Reativar este colaborador e retornar para a Equipe Ativa?')) return
    try {
      await api.restoreEmployee(empId)
      showToast('Colaborador reativado na equipe!')
      fetchEmployees()
    } catch (err: any) {
      showToast(err.message || 'Erro ao reativar colaborador', 'error')
    }
  }

  const handleDeleteEmployee = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover permanentemente o registro deste colaborador?')) return
    try {
      await api.deleteEmployee(id)
      showToast('Registro de colaborador excluído!')
      fetchEmployees()
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir colaborador', 'error')
    }
  }

  // Document Manager Handlers
  const openDocManager = async (emp: EmployeeData) => {
    setSelectedEmployeeForDocs(emp)
    setDocModalOpen(true)
    setLoadingDocs(true)
    try {
      const docs = await api.getEmployeeDocuments(emp.id)
      setDocList(docs || [])
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar documentos', 'error')
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployeeForDocs) return
    if (!docForm.title || !docForm.fileUrl) {
      showToast('Título e arquivo são obrigatórios', 'error')
      return
    }
    try {
      await api.addEmployeeDocument(selectedEmployeeForDocs.id, docForm)
      showToast('Documento anexado com sucesso!')
      setDocForm({
        title: '',
        category: 'CONTRATO',
        fileUrl: '',
        fileName: '',
        fileSize: '',
        expiryDate: '',
        notes: ''
      })
      const docs = await api.getEmployeeDocuments(selectedEmployeeForDocs.id)
      setDocList(docs || [])
      fetchEmployees()
    } catch (err: any) {
      showToast(err.message || 'Erro ao anexar documento', 'error')
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    if (!selectedEmployeeForDocs) return
    if (!window.confirm('Excluir este documento anexado?')) return
    try {
      await api.deleteEmployeeDocument(docId)
      showToast('Documento excluído!')
      const docs = await api.getEmployeeDocuments(selectedEmployeeForDocs.id)
      setDocList(docs || [])
      fetchEmployees()
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir documento', 'error')
    }
  }

  // Audit Logs Handler
  const fetchAuditLogs = useCallback(async () => {
    setLoadingAuditLogs(true)
    try {
      const logs = await api.getAuditLogs({
        search: auditSearch,
        entity: auditEntityFilter !== 'ALL' ? auditEntityFilter : undefined,
        severity: auditSeverityFilter !== 'ALL' ? auditSeverityFilter : undefined
      })
      setAuditLogs(logs || [])
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar logs de auditoria', 'error')
    } finally {
      setLoadingAuditLogs(false)
    }
  }, [auditSearch, auditEntityFilter, auditSeverityFilter, showToast])

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs()
    }
  }, [activeTab, fetchAuditLogs])

  const handleCreateLink = async () => {
    if (!newLinkTitle.trim()) return
    try {
      await api.createLink(
        newLinkTitle.trim(),
        newLinkServiceId || undefined,
        newLinkBookingFeeEnabled,
        newLinkBookingFeeEnabled ? parseFloat(newLinkBookingFeeAmount) || 0 : 0
      )
      setNewLinkTitle('')
      setNewLinkServiceId(null)
      setNewLinkBookingFeeEnabled(false)
      setNewLinkBookingFeeAmount('')
      setShowNewLink(false)
      fetchData()
      showToast('Link criado!')
    } catch (err: any) { showToast(err.message, 'error') }
  }

  const startEditingLink = (link: LinkData) => {
    setEditingLink(link)
    setEditLinkTitle(link.title)
    setEditLinkServiceId(link.service?.id || null)
    setEditLinkBookingFeeEnabled(link.bookingFeeEnabled)
    setEditLinkBookingFeeAmount(link.bookingFeeAmount ? link.bookingFeeAmount.toString() : '')
    setShowNewLink(false)
  }

  const handleUpdateLink = async () => {
    if (!editingLink || !editLinkTitle.trim()) return
    try {
      await api.updateLink(editingLink.id, {
        title: editLinkTitle.trim(),
        serviceId: editLinkServiceId,
        bookingFeeEnabled: editLinkBookingFeeEnabled,
        bookingFeeAmount: editLinkBookingFeeEnabled ? parseFloat(editLinkBookingFeeAmount) || 0 : 0
      })
      setEditingLink(null)
      fetchData()
      showToast('Link atualizado!')
    } catch (err: any) { showToast(err.message, 'error') }
  }

  const handleDeleteLink = async (id: number) => {
    console.log('[FRONTEND] handleDeleteLink called for ID:', id);
    const confirmed = window.confirm('Deseja excluir este link de venda? Todos os horários vinculados a ele serão removidos.');
    if (!confirmed) return;
    
    try {
      await api.deleteLink(id);
      fetchData();
      showToast('Link excluído com sucesso!');
    } catch (err: any) { 
      console.error('[FRONTEND] Delete error:', err);
      showToast(err.message, 'error');
    }
  }
  const handleRestoreLink = async (id: number) => {
    try {
      await api.restoreLink(id)
      fetchData()
      showToast('Link restaurado!')
    } catch (err: any) { showToast(err.message, 'error') }
  }

  const handleDeleteLinkPermanent = async (id: number) => {
    if (!confirm('AVISO: Esta ação é permanente e NÃO PODE ser desfeita. Todos os dados vinculados a este link serão apagados para sempre. Continuar?')) return
    try {
      await api.deleteLinkPermanent(id)
      fetchData()
      showToast('Link apagado definitivamente!')
    } catch (err: any) { showToast(err.message, 'error') }
  }
  // ═══ PDF Export Handlers ═══
  const openPdfExportModal = (type: 'bookings' | 'finance') => {
    setPdfReportType(type)
    setPdfIncludeLogo(true)
    setPdfLogoUrl(adminInfo?.photoUrl || '')
    setShowPdfModal(true)
  }

  const handlePdfLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setPdfLogoUrl(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleGeneratePdf = async () => {
    setExportingPdf(true)
    try {
      if (pdfReportType === 'bookings') {
        const filteredBookings = bookings.filter(booking => {
          const query = searchBookingQuery.toLowerCase().trim()
          if (!query) return true
          const serviceName = booking.timeSlot?.link?.service?.name || ''
          const linkTitle = booking.timeSlot?.link?.title || ''
          return (
            booking.clientName.toLowerCase().includes(query) ||
            booking.clientPhone.includes(query) ||
            serviceName.toLowerCase().includes(query) ||
            linkTitle.toLowerCase().includes(query)
          )
        })
        await exportBookingsToPDF({
          bookings: filteredBookings,
          adminInfo,
          includeLogo: pdfIncludeLogo,
          customLogoUrl: pdfLogoUrl
        })
        showToast('Relatório de agendamentos em PDF gerado!')
      } else {
        // Prepare active filters list for the PDF
        const filterLabels: string[] = []
        filterLabels.push(`Tipo: ${financeFilter === 'all' ? 'Todos' : financeFilter === 'receivable' ? 'Entrada' : 'Saída'}`)
        if (financeSearchQuery.trim()) {
          filterLabels.push(`Busca: "${financeSearchQuery}"`)
        }
        if (financePaidFilter !== 'all') {
          filterLabels.push(`Status: ${financePaidFilter === 'paid' ? 'Pago' : 'Pendente'}`)
        }
        if (financeCategoryFilter !== 'all') {
          filterLabels.push(`Categoria: ${financeCategoryFilter}`)
        }
        if (financeDateRange !== 'all') {
          let rangeText = ''
          if (financeDateRange === 'today') rangeText = 'Hoje'
          else if (financeDateRange === 'thisMonth') rangeText = 'Este Mês'
          else if (financeDateRange === 'lastMonth') rangeText = 'Mês Passado'
          else if (financeDateRange === 'last30') rangeText = 'Últimos 30 Dias'
          else if (financeDateRange === 'last90') rangeText = 'Últimos 90 Dias'
          else if (financeDateRange === 'custom') rangeText = `${financeStartDate || 'Início'} a ${financeEndDate || 'Fim'}`
          filterLabels.push(`Período: ${rangeText}`)
        }

        await exportFinanceToPDF({
          transactions: filteredTransactions,
          financeStats: filteredFinanceStats,
          adminInfo,
          includeLogo: pdfIncludeLogo,
          customLogoUrl: pdfLogoUrl,
          filterLabels
        } as any)
        showToast('Relatório financeiro em PDF gerado!')
      }
      setShowPdfModal(false)
    } catch (err: any) {
      showToast('Erro ao gerar PDF: ' + (err.message || 'Falha ao processar'), 'error')
    } finally {
      setExportingPdf(false)
    }
  }

  const handleCreateTransaction = async () => {
    if (!newTx.description || !newTx.amount) return
    try {
      await api.createTransaction({
        ...newTx,
        dueDate: newTx.dueDate || new Date().toISOString().split('T')[0],
        amount: parseFloat(newTx.amount.replace(',', '.')),
        paid: newTx.paid
      })
      setShowNewTransaction(false)
      setNewTx({ type: 'receivable', description: '', amount: '', dueDate: new Date().toISOString().split('T')[0], clientName: '', paid: false, category: '' })
      fetchData()
      showToast('Transação registrada!')
    } catch (err: any) { showToast(err.message, 'error') }
  }

  const handleToggleTx = async (id: number) => {
    try {
      await api.toggleTransactionPaid(id)
      fetchData()
    } catch (err: any) { showToast(err.message, 'error') }
  }

  const handleDeleteTx = async (id: number) => {
    if (!confirm('Deseja excluir esta transação?')) return
    try {
      await api.deleteTransaction(id)
      fetchData()
      showToast('Transação excluída')
    } catch (err: any) { showToast(err.message, 'error') }
  }

  const handleCreateSlots = async () => {
    if (!selectedLinkId || !slotDate) return
    const times = isSingleSlot ? [slotStartTime] : generateTimeSlots(slotStartTime, slotEndTime, slotInterval)
    try {
      await api.createSlots(selectedLinkId, times.map(t => ({ date: slotDate, time: t })))
      api.getSlots(selectedLinkId).then(setSlots)
      fetchData()
      showToast(isSingleSlot ? 'Horário único criado!' : 'Horários criados!')
    } catch (err: any) { showToast(err.message, 'error') }
  }

  const handleConfirmBooking = async (id: number) => {
    try {
      await api.confirmBooking(id)
      showToast('Agendamento confirmado!')
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleToggleBookingDone = async (booking: any) => {
    const newStatus = booking.status === 'CONCLUIDO' ? 'CONFIRMADO' : 'CONCLUIDO'
    try {
      await api.updateBookingStatus(booking.id, newStatus)
      showToast(newStatus === 'CONCLUIDO' ? 'Agendamento concluído com sucesso! ✓' : 'Status alterado')
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleSaveBookingNotes = async (bookingId: number, notesText: string) => {
    try {
      await api.updateBookingNotes(bookingId, notesText)
      showToast('Anotação salva com sucesso!')
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return
    try {
      await api.cancelBooking(id)
      showToast('Agendamento cancelado com sucesso!')
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteSlot = (id: number, time: string) => {
    setSlotToDelete(id)
    setSlotToDeleteTime(time)
    setDeleteAllDayFreeSlots(false)
    setShowDeleteSlotModal(true)
  }

  const confirmDeleteSlot = async () => {
    if (!slotToDelete) return
    try {
      if (deleteAllDayFreeSlots && slotDate) {
        const freeSlots = slotsByDate[slotDate]?.filter(s => s.isAvailable) || []
        await Promise.all(freeSlots.map(s => api.deleteSlot(s.id)))
        showToast('Todos os horários livres da data foram removidos!')
      } else {
        await api.deleteSlot(slotToDelete)
        showToast('Horário removido com sucesso!')
      }
      
      setShowDeleteSlotModal(false)
      setSlotToDelete(null)
      
      if (selectedLinkId) {
        api.getSlots(selectedLinkId).then(setSlots)
      }
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    const { linkId, date, time, clientName, clientPhone } = newBookingData
    if (!linkId || !date || !time || !clientName.trim() || !clientPhone.trim()) {
      showToast('Todos os campos são obrigatórios', 'error')
      return
    }
    try {
      await api.createManualBooking({
        linkId: parseInt(linkId),
        date,
        time,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim()
      })
      showToast('Agendamento criado com sucesso!')
      setShowNewBookingModal(false)
      setNewBookingData({ linkId: '', date: '', time: '', clientName: '', clientPhone: '' })
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]"><div className="spinner" /></div>

  // Group slots by date
  const slotsByDate: Record<string, SlotData[]> = {}
  if (Array.isArray(slots)) {
    slots.forEach(s => {
      if (!slotsByDate[s.date]) slotsByDate[s.date] = []
      slotsByDate[s.date].push(s)
    })
  }

  // Dynamic CRM Client Aggregation
  const aggregatedClients = (() => {
    const clientsMap: Record<string, { name: string; phone: string; totalBookings: number; totalSpent: number; lastBookingDate: string }> = {}

    bookings.forEach(b => {
      const phone = b.clientPhone ? b.clientPhone.trim() : ''
      if (!phone) return

      const servicePrice = b.timeSlot?.link?.service?.price || 0
      const isConfirmedOrPaid = b.status === 'CONFIRMADO' || b.status === 'PAGO'

      if (!clientsMap[phone]) {
        clientsMap[phone] = {
          name: b.clientName || 'Cliente sem nome',
          phone: phone,
          totalBookings: 0,
          totalSpent: 0,
          lastBookingDate: b.timeSlot?.date || ''
        }
      }

      clientsMap[phone].totalBookings += 1
      if (isConfirmedOrPaid) {
        clientsMap[phone].totalSpent += servicePrice
      }

      // Keep latest booking date
      if (b.timeSlot?.date && (!clientsMap[phone].lastBookingDate || b.timeSlot.date > clientsMap[phone].lastBookingDate)) {
        clientsMap[phone].lastBookingDate = b.timeSlot.date
      }
    })

    const list = Object.values(clientsMap)

    // Filter by clientSearch state
    if (clientSearch.trim()) {
      const query = clientSearch.toLowerCase()
      return list.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.phone.includes(query)
      )
    }

    return list
  })()

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-[#050507] text-white' : 'bg-[#F1F5F9] text-slate-800'} pb-20 transition-colors duration-300 relative overflow-hidden grain`}>
      {/* Mesh Gradient Orbs */}
      <div className="orb w-[600px] h-[600px] bg-violet-600/[0.05] top-[-150px] left-[-100px] blur-[160px]" />
      <div className="orb w-[400px] h-[400px] bg-pink-600/[0.04] top-[40%] right-[-100px] blur-[140px]" style={{ animationDelay: '-7s' }} />
      <div className="orb w-[500px] h-[500px] bg-orange-600/[0.03] bottom-[5%] left-[30%] blur-[160px]" style={{ animationDelay: '-14s' }} />
      {/* Trial Countdown Banner (during trial) */}
      {subscription && subscription.status === 'trialing' && subscription.trialEndsAt && (
        <TrialBanner 
          trialEndsAt={subscription.trialEndsAt} 
          onCheckout={handleCheckout} 
          onLogout={handleLogout}
          onRestoreSuperAdmin={sessionStorage.getItem('superadmin_token') ? handleRestoreSuperAdmin : null}
        />
      )}

      {/* Inactive Account Banner (when expired/inactive) */}
      {subscription && subscription.status === 'inactive' && (
        <InactiveBanner 
          onSubscribe={() => setShowPaywall(true)} 
          onLogout={handleLogout}
          onRestoreSuperAdmin={sessionStorage.getItem('superadmin_token') ? handleRestoreSuperAdmin : null}
        />
      )}

      {/* Paywall Modal */}
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} onCheckout={handleCheckout} />

      {/* PDF Export Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6 text-center animate-fade-in" style={{ position: 'fixed' }}>
          <div className="bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl relative text-left animate-scale-up">
            <button 
              onClick={() => setShowPdfModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl font-bold bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition-all"
            >
              &times;
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500/10 to-pink-500/10 dark:bg-orange-500/20 text-orange-500 rounded-2xl border border-orange-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Exportar PDF</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {pdfReportType === 'bookings' ? 'Relatório de Agendamentos' : 'Relatório Financeiro'}
                </p>
              </div>
            </div>

            <div className="space-y-5 my-6">
              
              {/* Active filters summary */}
              {pdfReportType === 'finance' && (
                <div className="p-4 bg-slate-50 dark:bg-[#1A2235] rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-400 space-y-1.5">
                  <span className="font-black text-slate-850 dark:text-slate-350 block mb-1">Filtros Aplicados no Relatório:</span>
                  <div>• Tipo: {financeFilter === 'all' ? 'Todos' : financeFilter === 'receivable' ? 'Apenas Entradas' : 'Apenas Saídas'}</div>
                  {financeSearchQuery.trim() && <div className="truncate">• Busca: "{financeSearchQuery}"</div>}
                  {financePaidFilter !== 'all' && <div>• Status: {financePaidFilter === 'paid' ? 'Apenas Pagas/Recebidas' : 'Apenas Pendentes'}</div>}
                  {financeCategoryFilter !== 'all' && <div>• Categoria: {financeCategoryFilter}</div>}
                  {financeDateRange !== 'all' && (
                    <div>
                      • Período: {
                        financeDateRange === 'today' ? 'Hoje' :
                        financeDateRange === 'thisMonth' ? 'Este Mês' :
                        financeDateRange === 'lastMonth' ? 'Mês Passado' :
                        financeDateRange === 'last30' ? 'Últimos 30 Dias' :
                        financeDateRange === 'last90' ? 'Últimos 90 Dias' :
                        `Personalizado (${financeStartDate || 'Início'} a ${financeEndDate || 'Fim'})`
                      }
                    </div>
                  )}
                  <div className="text-[10px] text-pink-500 font-black pt-1">
                    * Serão exportados {filteredTransactions.length} lançamentos.
                  </div>
                </div>
              )}

              {/* Option toggle: Include logo */}
              <div className="bg-slate-50 dark:bg-[#1A2235] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <label htmlFor="modal-pdf-include-logo" className="text-xs font-bold text-slate-700 dark:text-slate-200 block cursor-pointer select-none">
                    Quero adicionar minha logo no PDF
                  </label>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Exibe a marca do seu negócio no cabeçalho
                  </p>
                </div>
                <input
                  id="modal-pdf-include-logo"
                  type="checkbox"
                  checked={pdfIncludeLogo}
                  onChange={e => setPdfIncludeLogo(e.target.checked)}
                  className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500 cursor-pointer"
                />
              </div>

              {/* Logo customizer section */}
              {pdfIncludeLogo && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-[#1A2235] rounded-2xl border border-slate-200 dark:border-slate-800 animate-fade-in">
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Logotipo do Relatório
                  </label>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131826] overflow-hidden flex items-center justify-center shrink-0">
                      {pdfLogoUrl ? (
                        <img src={pdfLogoUrl} alt="Logo PDF" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">📸</span>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <input
                        type="file"
                        ref={pdfFileInputRef}
                        onChange={handlePdfLogoFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => pdfFileInputRef.current?.click()}
                        className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider"
                      >
                        Carregar Nova Logo
                      </button>

                      {adminInfo?.photoUrl && pdfLogoUrl !== adminInfo.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPdfLogoUrl(adminInfo.photoUrl || '')}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline block"
                        >
                          Usar Logo do Perfil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={exportingPdf}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-black transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
              >
                {exportingPdf ? 'Gerando...' : 'Gerar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Navbar Premium — Glass Island */}
      <header 
        style={hasBanner ? { top: '48px', marginTop: '48px' } : undefined}
        className="sticky top-0 z-40 px-3 sm:px-6 pt-3 sm:pt-4 pb-2 transition-all duration-300"
      >
        <div className="bg-white/85 dark:bg-[#131826]/80 backdrop-blur-md border border-slate-200/50 dark:border-white/[0.06] rounded-2xl max-w-6xl mx-auto px-3.5 sm:px-5 h-16 flex items-center justify-between shadow-lg shadow-black/5">
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0"
              title="Abrir Menu de Módulos"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <BoraMarkaLogo size="md" showText={false} />
              <div className="hidden sm:block">
                <h1 className="font-extrabold text-[15px] text-slate-800 dark:text-white/90 leading-tight tracking-tight">
                  Bora<span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">Marka</span>
                </h1>
                <p className="text-[9px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-[0.12em] mt-0.5">Sua agenda cheia, sem complicação</p>
              </div>
            </div>
          </div>

          {/* 🔍 Global Header Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-4 lg:mx-8">
            <div className="w-full relative group">
              <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] group-hover:border-violet-500/40 focus-within:border-violet-500/80 focus-within:ring-2 focus-within:ring-violet-500/20 rounded-xl px-3 py-1.5 transition-all duration-200 shadow-inner">
                <Search className="w-4 h-4 text-slate-400 dark:text-white/40 group-focus-within:text-violet-500 transition-colors shrink-0" />
                <input
                  ref={headerSearchInputRef}
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder="Buscar cliente, serviço ou agendamento..."
                  className="bg-transparent text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35 focus:outline-none w-full font-medium"
                />
                {globalSearchQuery ? (
                  <button
                    onClick={() => setGlobalSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[9px] font-semibold text-slate-400 dark:text-white/30 bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-300/60 dark:border-white/10 shrink-0">
                    ⌘K
                  </kbd>
                )}
              </div>

              {/* Search Results Dropdown Overlay */}
              {globalSearchQuery.trim() !== '' && (
                <div className="absolute left-0 top-full mt-2.5 w-full bg-white dark:bg-[#0D111E] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2.5 z-50 animate-scale-in max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between px-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-white/[0.06]">
                    <p className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">
                      Resultados da busca ({filteredSearchItems.length})
                    </p>
                    <button onClick={() => setGlobalSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[10px]">
                      Fechar
                    </button>
                  </div>

                  {filteredSearchItems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-white/40">
                      Nenhum resultado encontrado para "{globalSearchQuery}"
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredSearchItems.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (subscription?.status === 'inactive' && item.targetTab !== 'faturamento') {
                              setShowPaywall(true)
                            } else {
                              setActiveTab(item.targetTab as any)
                            }
                            setGlobalSearchQuery('')
                          }}
                          className="w-full p-2 rounded-xl flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all group/item"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400 shrink-0">
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                              <p className="text-[10px] text-slate-400 dark:text-white/40 truncate">{item.subtitle}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-violet-500 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 ml-2">
                            Ir →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
             {sessionStorage.getItem('superadmin_token') && (
               <button 
                 onClick={handleRestoreSuperAdmin}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[10px] rounded-full uppercase tracking-wider transition-all hover:opacity-90 shadow-md shadow-emerald-500/25 cursor-pointer shrink-0"
                 title="Voltar ao Painel SuperAdmin"
               >
                 <ShieldAlert className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Voltar SuperAdmin</span>
               </button>
             )}
              <button 
                onClick={() => setIsDark(!isDark)} 
                className="p-2 text-slate-400 dark:text-white/30 hover:text-slate-650 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl transition-all shrink-0"
                title={isDark ? "Modo Claro" : "Modo Escuro"}
              >
                {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              <button 
                onClick={() => fetchData(true)} 
                disabled={refreshing}
                className={`p-2 text-slate-400 dark:text-white/30 hover:text-slate-650 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl transition-all shrink-0 ${refreshing ? 'animate-spin' : ''}`}
                title="Atualizar dados"
              >
                <RefreshCw className="w-4.5 h-4.5" />
              </button>
               {adminInfo && (
                 <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-white/[0.06]">
                   <div className="text-right hidden sm:block">
                     <div className="flex items-center justify-end gap-2">
                       <p className="text-[13px] font-bold text-slate-700 dark:text-white/80 leading-none">{adminInfo.businessName || adminInfo.username}</p>
                       <button onClick={() => subscription?.status === 'inactive' ? setShowPaywall(true) : openEditProfile()} className="text-slate-400 dark:text-white/25 hover:text-violet-650 dark:hover:text-violet-400 transition-colors" title="Editar Perfil">
                         <Pencil className="w-3 h-3" />
                       </button>
                     </div>
                     <p className="text-[10px] text-slate-400 dark:text-white/25 font-semibold mt-1">@{adminInfo.username.toLowerCase()}</p>
                   </div>
                   <button 
                     onClick={() => subscription?.status === 'inactive' ? setShowPaywall(true) : avatarInputRef.current?.click()}
                     className="w-9 h-9 rounded-full relative group cursor-pointer shrink-0"
                     title="Clique para trocar a foto"
                   >
                     {adminInfo.photoUrl ? (
                       <img src={adminInfo.photoUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                     ) : (
                       <div className="w-9 h-9 bg-slate-200/50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.08] rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-white/50 text-sm">
                         {adminInfo.username[0].toUpperCase()}
                       </div>
                     )}
                     <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera className="w-3.5 h-3.5 text-white" />
                     </div>
                     <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-violet-500 border-2 border-[#F1F5F9] dark:border-[#080a16] rounded-full"></div>
                   </button>
                   <input
                     ref={avatarInputRef}
                     type="file"
                     accept="image/*"
                     onChange={handleAvatarChange}
                     className="hidden"
                   />
                   <button 
                     onClick={handleLogout}
                     className="p-2 text-slate-400 dark:text-white/25 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.06] rounded-xl transition-all shrink-0"
                     title="Sair do sistema"
                   >
                     <LogOut className="w-4.5 h-4.5" />
                   </button>
                 </div>
               )}
          </div>
        </div>

        {/* 📱 Subcabeçalho Mobile — Título do Módulo Ativo com Espaçamento Limpo */}
        <div className="md:hidden max-w-6xl mx-auto px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
              <currentTabInfo.icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">{currentTabInfo.itemLabel}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">{currentTabInfo.catLabel}</span>
        </div>
      </header>

      {/* 📱 Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md md:hidden flex flex-col justify-end animate-fade-in">
          <div className="bg-white dark:bg-[#0D111E] border-t border-slate-200 dark:border-white/10 rounded-t-[2rem] p-5 max-h-[85dvh] overflow-y-auto custom-scrollbar animate-slide-up relative shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mb-5"></div>
            
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">Módulos do Sistema</h3>
                  <p className="text-[11px] text-slate-500 dark:text-white/40">Selecione para navegar</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pb-6">
              {navCategories.map(cat => {
                if (cat.type === 'single') {
                  const isActive = activeTab === cat.tabId
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveTab(cat.tabId)
                        setMobileMenuOpen(false)
                      }}
                      className={`w-full p-3.5 rounded-2xl flex items-center gap-3 font-bold text-sm transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-600/20'
                          : 'bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-white/80 hover:bg-slate-200/80 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      <cat.icon className="w-5 h-5 shrink-0 text-violet-500 dark:text-violet-400" />
                      <span>{cat.label}</span>
                    </button>
                  )
                }

                const isCatExpanded = expandedMobileCategory === cat.id
                const hasActiveSub = cat.items.some(item => item.id === activeTab)

                return (
                  <div key={cat.id} className="rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] overflow-hidden">
                    <button
                      onClick={() => setExpandedMobileCategory(isCatExpanded ? null : cat.id)}
                      className={`w-full p-3.5 flex items-center justify-between text-sm font-bold transition-colors ${
                        hasActiveSub ? 'text-violet-600 dark:text-violet-400' : 'text-slate-800 dark:text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <cat.icon className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
                        <span>{cat.label}</span>
                        {cat.badge !== undefined && (
                          <span className="bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-white/40 transition-transform duration-300 ${isCatExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isCatExpanded && (
                      <div className="p-2 space-y-1.5 bg-white/60 dark:bg-white/[0.02] border-t border-slate-200/60 dark:border-white/[0.04]">
                        {cat.items.map(item => {
                          const isSubActive = activeTab === item.id
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                if (subscription?.status === 'inactive' && item.id !== 'faturamento') {
                                  setShowPaywall(true)
                                } else {
                                  setActiveTab(item.id)
                                }
                                setMobileMenuOpen(false)
                              }}
                              className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${
                                isSubActive
                                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold shadow-md'
                                  : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-white/70 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4 shrink-0" />
                                <div>
                                  <p className="text-xs leading-tight">{item.label}</p>
                                  <p className={`text-[10px] mt-0.5 ${isSubActive ? 'text-white/80' : 'text-slate-400 dark:text-white/35'}`}>{item.desc}</p>
                                </div>
                              </div>
                              {item.badge !== undefined && item.badge > 0 && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSubActive ? 'bg-white/20 text-white' : 'bg-violet-500/20 text-violet-300'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 pt-4 pb-16 sm:pb-24 pb-safe">
        
        {/* 💻 Desktop Categorized Dropdown Navbar */}
        <div ref={dropdownRef} className="hidden md:flex items-center justify-start gap-2.5 mb-8 relative z-30 flex-wrap">
          {navCategories.map(cat => {
            if (cat.type === 'single') {
              const isActive = activeTab === cat.tabId
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.tabId)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-600/25'
                      : 'bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <cat.icon className="w-4 h-4 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              )
            }

            const isDropdownOpen = activeDropdown === cat.id
            const hasActiveSub = cat.items.some(item => item.id === activeTab)

            return (
              <div key={cat.id} className="relative">
                <button
                  onClick={() => setActiveDropdown(isDropdownOpen ? null : cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                    hasActiveSub
                      ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-600/25'
                      : isDropdownOpen
                        ? 'bg-slate-200 dark:bg-white/15 text-slate-900 dark:text-white border border-slate-300 dark:border-white/20'
                        : 'bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <cat.icon className="w-4 h-4 shrink-0" />
                  <span>{cat.label}</span>
                  {cat.badge !== undefined && (
                    <span className="bg-white/20 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                      {cat.badge}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Floating Card */}
                {isDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2.5 w-72 bg-white dark:bg-[#0D111E] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-scale-in">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">Módulo: {cat.label}</p>
                    </div>
                    <div className="space-y-1">
                      {cat.items.map(item => {
                        const isSubActive = activeTab === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (subscription?.status === 'inactive' && item.id !== 'faturamento') {
                                setShowPaywall(true)
                              } else {
                                setActiveTab(item.id)
                              }
                              setActiveDropdown(null)
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-start gap-3 text-left transition-all ${
                              isSubActive
                                ? 'bg-gradient-to-r from-violet-600/15 to-pink-600/15 border border-violet-500/30 text-violet-600 dark:text-violet-300 font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-white/70'
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSubActive ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40'}`}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-white/40 leading-snug mt-0.5 line-clamp-2">{item.desc}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: Overview */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="animate-slide-up space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
              <StatCard title="Total de Clientes" value={stats.totalBookings} icon={Users} color="#8b5cf6" />
              <StatCard title="Saldo Financeiro" value={formatCurrency(financeStats.balance)} icon={Wallet} color="#10b981" />
              <StatCard title="A Receber" value={formatCurrency(financeStats.pendingReceivable)} icon={TrendingUp} color="#06b6d4" />
              <StatCard title="A Pagar" value={formatCurrency(financeStats.pendingPayable)} icon={TrendingDown} color="#ef4444" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Bookings */}
              <div className="card-simple">
                <div className="card-simple-inner p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-[15px] text-slate-800 dark:text-white/80">Últimos Agendamentos</h3>
                    <button onClick={() => setActiveTab('agendamentos')} className="text-violet-500 dark:text-violet-400 text-[11px] font-semibold hover:underline uppercase tracking-wider">Ver todos</button>
                  </div>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map(b => (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-150 dark:border-white/[0.04] transition-all hover:border-violet-500/20">
                        <div className="w-9 h-9 bg-slate-100 dark:bg-white/[0.04] rounded-lg flex items-center justify-center font-bold text-violet-500 dark:text-violet-400 text-sm border border-slate-200 dark:border-white/[0.06]">
                          {b.clientName[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-800 dark:text-white/80">{b.clientName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-white/25 font-semibold uppercase">{formatDate(b.timeSlot.date)} — {b.timeSlot.time}</p>
                        </div>
                        <a href={`https://wa.me/${b.clientPhone}`} target="_blank" className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/[0.06] rounded-lg transition-all">
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                    {bookings.length === 0 && <p className="text-center py-10 text-slate-400 dark:text-white/20 text-sm italic">Nenhum agendamento recente</p>}
                  </div>
                </div>
              </div>
              {/* Financial Summary */}
              <div className="card-simple">
                <div className="card-simple-inner p-6 overflow-hidden relative">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-[15px] text-slate-800 dark:text-white/80">Resumo Financeiro</h3>
                     <button onClick={() => setActiveTab('financeiro')} className="text-violet-500 dark:text-violet-400 text-[11px] font-semibold hover:underline uppercase tracking-wider">Gestão completa</button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/[0.04] border border-emerald-500/20 dark:border-emerald-500/10">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400/80 uppercase tracking-widest">Recebido</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(financeStats.receivedAmount)}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/[0.06] flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-5 rounded-xl bg-red-500/10 dark:bg-red-500/[0.04] border border-red-500/20 dark:border-red-500/10">
                      <div>
                        <p className="text-[10px] font-bold text-red-650 dark:text-red-400/80 uppercase tracking-widest">Pago</p>
                        <p className="text-2xl font-black text-red-600 dark:text-red-400">{formatCurrency(financeStats.paidAmount)}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/[0.06] flex items-center justify-center">
                          <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: Financeiro */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'financeiro' && (
          <div className="animate-slide-up space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Financeiro</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Contas a pagar e a receber</p>
              </div>
              <div className="flex flex-wrap w-full sm:w-auto items-center gap-3">
                <button
                  onClick={() => openPdfExportModal('finance')}
                  disabled={transactions.length === 0}
                  className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-black py-2.5 px-4 rounded-xl transition-all border border-slate-700 shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  title="Exportar dados financeiros para PDF"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Exportar PDF
                </button>

                <button
                  onClick={() => setShowNewTransaction(true)}
                  className="w-full sm:w-auto btn-primary-simple flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Lançar Valor
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="card-simple p-6 bg-emerald-600 dark:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-600/20">
                 <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Saldo Atual</p>
                 <p className="text-3xl font-black">{formatCurrency(filteredFinanceStats.balance)}</p>
                 <Wallet className="w-12 h-12 absolute -right-2 -bottom-2 opacity-10" />
               </div>
               <div className="card-simple p-6 bg-slate-900 dark:bg-slate-800 text-white border-none shadow-lg shadow-slate-900/20">
                 <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Pendentes de Entrada</p>
                 <p className="text-3xl font-black">{formatCurrency(filteredFinanceStats.pendingReceivable)}</p>
               </div>
               <div className="card-simple p-6 bg-white dark:bg-[#131826] border-slate-200 dark:border-slate-800">
                 <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Contas Pendentes</p>
                 <p className="text-3xl font-black text-red-600 dark:text-red-500">{formatCurrency(filteredFinanceStats.pendingPayable)}</p>
               </div>
            </div>

            {/* Advanced Finance Filter Panel */}
            <div className="card-simple p-5 space-y-4 bg-white/60 dark:bg-[#131826]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-visible">
              <div className="flex items-center gap-2 text-slate-700 dark:text-white">
                <Filter className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-black uppercase tracking-wider">Filtros Avançados</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Search Text Input */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Busca Rápida
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Descrição ou cliente..."
                      value={financeSearchQuery}
                      onChange={e => setFinanceSearchQuery(e.target.value)}
                      className="input-simple pl-9 py-2 text-xs w-full"
                    />
                  </div>
                </div>

                {/* Status: Paid or Unpaid */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Status de Pagamento
                  </label>
                  <select
                    value={financePaidFilter}
                    onChange={e => setFinancePaidFilter(e.target.value as any)}
                    className="input-simple py-2 text-xs w-full cursor-pointer"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="paid">Pagas / Recebidas</option>
                    <option value="unpaid">Pendentes</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={financeCategoryFilter}
                    onChange={e => setFinanceCategoryFilter(e.target.value)}
                    className="input-simple py-2 text-xs w-full cursor-pointer"
                  >
                    <option value="all">Todas as Categorias</option>
                    {uniqueCategories.map((cat: string) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Period/Date Filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Período
                  </label>
                  <select
                    value={financeDateRange}
                    onChange={e => setFinanceDateRange(e.target.value as any)}
                    className="input-simple py-2 text-xs w-full cursor-pointer"
                  >
                    <option value="all">Qualquer Período</option>
                    <option value="today">Hoje</option>
                    <option value="thisMonth">Este Mês</option>
                    <option value="lastMonth">Mês Passado</option>
                    <option value="last30">Últimos 30 Dias</option>
                    <option value="last90">Últimos 90 Dias</option>
                    <option value="custom">Personalizado...</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Range Panel */}
              {financeDateRange === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={financeStartDate}
                      onChange={e => setFinanceStartDate(e.target.value)}
                      className="input-simple py-2 text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      Data Final
                    </label>
                    <input
                      type="date"
                      value={financeEndDate}
                      onChange={e => setFinanceEndDate(e.target.value)}
                      className="input-simple py-2 text-xs w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="card-simple overflow-hidden">
               <div className="p-4 bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Lançamentos Filtrados</span>
                 <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
                   <button 
                     onClick={() => setFinanceFilter('all')}
                     className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${financeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                   >
                     Tudo
                   </button>
                   <button 
                     onClick={() => setFinanceFilter('receivable')}
                     className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${financeFilter === 'receivable' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                   >
                     Entradas
                   </button>
                   <button 
                     onClick={() => setFinanceFilter('payable')}
                     className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${financeFilter === 'payable' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'}`}
                   >
                     Saídas
                   </button>
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Descrição</th>
                       <th className="px-6 py-4">Data Vencimento</th>
                       <th className="px-6 py-4 text-right">Valor</th>
                       <th className="px-6 py-4"></th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {filteredTransactions.filter(tx => financeFilter === 'all' || tx.type === financeFilter)
                       .map(tx => (
                       <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
                         <td className="px-6 py-4">
                           <button
                             onClick={() => handleToggleTx(tx.id)}
                             className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                               tx.paid
                                 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                 : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-700'
                             }`}
                           >
                             {tx.paid && <Check className="w-4 h-4" />}
                           </button>
                         </td>
                         <td className="px-6 py-4">
                           <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{tx.description}</p>
                           <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                             <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                             tx.type === 'receivable' ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-500' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                           }`}>
                             {tx.type === 'receivable' ? 'Entrada' : 'Saída'}
                           </span>
                             {tx.category && (
                               <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                                 {tx.category}
                               </span>
                             )}
                           </div>
                         </td>
                         <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-bold">
                           {formatDate(tx.dueDate)}
                         </td>
                         <td className={`px-6 py-4 text-right font-black text-sm ${
                           tx.type === 'receivable' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                         }`}>
                           {tx.type === 'receivable' ? '+' : '-'} {formatCurrency(tx.amount)}
                         </td>
                         <td className="px-6 py-4">
                           <button onClick={() => handleDeleteTx(tx.id)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {filteredTransactions.filter((tx: Transaction) => financeFilter === 'all' || tx.type === financeFilter).length === 0 && (
                    <div className="text-center py-20 italic text-slate-450 dark:text-slate-500">Nenhum lançamento encontrado</div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* Other Tabs (Simplified logic from before) */}
        {/* ═══════════════════════════════════════════ */}
        
        {activeTab === 'agendamentos' && (
           <div className="animate-slide-up space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Gerenciar Seus Agendamentos</h2>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fácil de editar, filtrar e gerenciar as datas.</p>
                 </div>
                 <div className="flex w-full sm:w-auto items-center gap-3">
                   <div className="relative flex-1 sm:flex-none">
                     <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input
                       type="text"
                       placeholder="Buscar cliente..."
                       value={searchBookingQuery}
                       onChange={e => setSearchBookingQuery(e.target.value)}
                       className="input-simple pl-10 py-2 text-sm max-w-full sm:max-w-[200px]"
                     />
                   </div>
                   <button
                     onClick={() => setShowNewBookingModal(true)}
                     className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black py-2.5 px-6 rounded-xl transition-all shadow-md shadow-pink-500/20 whitespace-nowrap text-sm"
                   >
                     <Plus className="w-4 h-4" />
                     Bora Agendar Novo!
                   </button>
                 </div>
              </div>
              <div className="grid gap-4">
                 {bookings
                   .filter(booking => {
                     const query = searchBookingQuery.toLowerCase().trim()
                     if (!query) return true
                     const serviceName = booking.timeSlot.link?.service?.name || ''
                     const linkTitle = booking.timeSlot.link?.title || ''
                     return (
                       booking.clientName.toLowerCase().includes(query) ||
                       booking.clientPhone.includes(query) ||
                       serviceName.toLowerCase().includes(query) ||
                       linkTitle.toLowerCase().includes(query)
                     )
                   })
                   .map(booking => (
                     <BookingCard
                       key={booking.id}
                       booking={booking}
                       onToggleDone={handleToggleBookingDone}
                       onConfirm={handleConfirmBooking}
                       onCancel={handleCancelBooking}
                       onSaveNotes={handleSaveBookingNotes}
                       formatDate={formatDate}
                       formatCurrency={formatCurrency}
                     />
                   ))}
                 {bookings.filter(booking => {
                     const query = searchBookingQuery.toLowerCase().trim()
                     if (!query) return true
                     const serviceName = booking.timeSlot.link?.service?.name || ''
                     const linkTitle = booking.timeSlot.link?.title || ''
                     return (
                       booking.clientName.toLowerCase().includes(query) ||
                       booking.clientPhone.includes(query) ||
                       serviceName.toLowerCase().includes(query) ||
                       linkTitle.toLowerCase().includes(query)
                     )
                   }).length === 0 && (
                   <div className="text-center py-20 italic text-slate-400 dark:text-slate-600">
                     Nenhum agendamento encontrado
                   </div>
                 )}
              </div>
           </div>
        )}

        {activeTab === 'horarios' && (
           <div className="animate-slide-up">
              <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
                
                {/* Left Column: Calendar & Service Selector */}
                <div className="space-y-6">
                  {/* Calendar Card */}
                  <div className="card-simple p-6 bg-slate-50 dark:bg-[#0B0F19] border-slate-200 dark:border-[#1E293B]">
                     <CalendarWidget 
                       selectedDate={slotDate} 
                       onSelectDate={setSlotDate} 
                       currentMonth={calendarMonth} 
                       setCurrentMonth={setCalendarMonth} 
                     />
                  </div>
                  
                  {/* Google Calendar Card */}
                  <div className="card-simple p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📅</span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Google Agenda</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Sincronize seus agendamentos</p>
                      </div>
                    </div>
                    
                    {isGoogleConnected ? (
                      <div className="space-y-3 text-left">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-emerald-500 text-[10px] font-black uppercase tracking-wider flex items-center justify-between">
                          <span>Sincronizado</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium truncate">Conectado a: <strong>{googleEmail}</strong></p>
                        <button 
                          onClick={async () => {
                            try {
                              await api.disconnectGoogleCalendar();
                              setIsGoogleConnected(false);
                              setGoogleEmail('');
                              showToast('Integração com Google Agenda removida com sucesso!');
                            } catch (err: any) {
                              showToast(err.message, 'error');
                            }
                          }}
                          className="w-full text-center py-2 text-[10px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-dashed border-red-500/30 rounded-xl transition-all uppercase tracking-wider"
                        >
                          Desconectar
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                          window.location.href = `http://localhost:3001/api/admin/google-calendar/connect?token=${token}`;
                        }}
                        className="w-full py-2.5 bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-800 hover:border-pink-500 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.567 0-6.46-2.893-6.46-6.46s2.893-6.46 6.46-6.46c1.626 0 3.102.602 4.232 1.6l3.057-3.057C19.347 2.308 15.993 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c5.77 0 10.58-4.14 10.97-9.715H12.24z"/>
                        </svg>
                        Sincronizar Google Agenda
                      </button>
                    )}
                  </div>
                  
                  {/* Service Selector Card */}
                  <div className="card-simple p-6">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">Configurar agenda para:</label>
                    <select value={selectedLinkId || ''} onChange={e => setSelectedLinkId(e.target.value ? parseInt(e.target.value) : null)} className="input-simple font-bold w-full bg-slate-50 dark:bg-[#131826]">
                      <option value="">Selecione o Serviço...</option>
                      {links.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                    </select>
                  </div>
                </div>

                {/* Right Column: Add Slots & Grid */}
                <div className="space-y-6">
                  {/* Add Slots Card */}
                  <div className="card-simple p-6 border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19]">
                     <div className="flex items-center gap-3 mb-6">
                       <h3 className="font-bold text-sm flex items-center gap-2 text-pink-500 uppercase tracking-widest"><Plus className="w-5 h-5" /> Abrir Novos Horários</h3>
                       <label className="flex items-center gap-2 ml-auto cursor-pointer border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131826] px-3 py-1.5 rounded-lg shadow-sm hover:border-pink-300 dark:hover:border-pink-500/50 transition-colors">
                         <input type="checkbox" checked={isSingleSlot} onChange={e => setIsSingleSlot(e.target.checked)} className="w-4 h-4 text-pink-500 rounded border-slate-300 focus:ring-pink-500" />
                         <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Horário Único</span>
                       </label>
                     </div>
                     <div className={`grid gap-4 mb-6 ${isSingleSlot ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                        <div><label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Dia</label><input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} className="input-simple text-sm bg-white dark:bg-[#131826]" /></div>
                        {!isSingleSlot && <div><label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Intervalo</label><select value={slotInterval} onChange={e => setSlotInterval(parseInt(e.target.value))} className="input-simple text-sm bg-white dark:bg-[#131826]"><option value={15}>15 min</option><option value={30}>30 min</option><option value={60}>1 hora</option></select></div>}
                        <div><label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">{isSingleSlot ? 'Horário' : 'Início'}</label><input type="time" value={slotStartTime} onChange={e => setSlotStartTime(e.target.value)} className="input-simple text-sm bg-white dark:bg-[#131826]" /></div>
                        {!isSingleSlot && <div><label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Fim</label><input type="time" value={slotEndTime} onChange={e => setSlotEndTime(e.target.value)} className="input-simple text-sm bg-white dark:bg-[#131826]" /></div>}
                     </div>
                     <button onClick={handleCreateSlots} disabled={!slotDate || !selectedLinkId} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">GERAR HORÁRIOS NA AGENDA</button>
                  </div>

                  {/* Slots Grid Card */}
                  <div className="card-simple p-6 min-h-[300px]">
                     {slotDate && selectedLinkId ? (
                       <>
                         <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                           <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">{getWeekday(slotDate)} — {formatDate(slotDate)}</h4>
                           <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Grade de Vagas</span>
                         </div>
                         {slotsByDate[slotDate] && slotsByDate[slotDate].length > 0 ? (
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                             {slotsByDate[slotDate].map(slot => (
                                <div key={slot.id} className={`relative group p-4 text-center rounded-2xl border transition-all flex flex-col justify-center min-h-[80px] ${slot.isAvailable ? 'bg-transparent border-slate-200 dark:border-slate-700 hover:border-pink-500/50' : 'bg-gradient-to-r from-orange-500 to-pink-500 border-transparent text-white shadow-md shadow-orange-500/20'}`}>
                                  {slot.isAvailable && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSlot(slot.id, slot.time);
                                      }}
                                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                      title="Excluir Horário"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <p className={`font-black text-lg leading-tight ${slot.isAvailable ? 'text-slate-900 dark:text-white' : 'text-white'}`}>{slot.time}</p>
                                  <p className={`text-[10px] font-bold truncate mt-1 uppercase tracking-wider ${slot.isAvailable ? 'text-slate-400 dark:text-slate-500' : 'text-white/90'}`}>{slot.booking ? slot.booking.clientName : (slot.isAvailable ? 'Livre' : 'Ocupado')}</p>
                                </div>
                              ))}
                           </div>
                         ) : (
                           <div className="text-center py-10 text-slate-500">
                             Nenhum horário gerado para esta data.
                           </div>
                         )}
                       </>
                     ) : (
                       <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-10">
                         {selectedLinkId ? (
                           <>
                             <Clock className="w-12 h-12 mb-4 opacity-50" />
                             <p className="font-bold">Selecione um dia no calendário</p>
                             <p className="text-xs mt-1">Para visualizar a grade de horários da data.</p>
                           </>
                         ) : (
                           <>
                             <Briefcase className="w-12 h-12 mb-4 opacity-50" />
                             <p className="font-bold">Selecione um serviço na lateral</p>
                             <p className="text-xs mt-1">Para gerenciar os horários da sua agenda.</p>
                           </>
                         )}
                       </div>
                     )}
                  </div>
                </div>
              </div>
           </div>
        )}

        {activeTab === 'servicos' && (
           <div className="animate-slide-up space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Catálogo de Serviços</h2>
                <button 
                  onClick={() => {
                    if (subscription?.status === 'inactive') {
                      setShowPaywall(true)
                    } else {
                      setEditingService(null)
                      setServiceForm({ name: '', description: '', price: '', duration: '30' })
                      setShowNewService(true)
                    }
                  }} 
                  className="btn-primary-simple py-2.5 px-6 flex items-center gap-2 font-black text-sm"
                >
                  <Plus className="w-5 h-5" /> NOVO SERVIÇO
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {services.map(service => (
                  <div key={service.id} className="card-simple p-6 hover:shadow-xl transition-all border-l-4 border-pink-500 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{service.name}</h3>
                        <p className="text-lg font-black text-pink-500">{formatCurrency(service.price)}</p>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">{service.description || 'Sem descrição.'}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
                        <Clock className="w-3.5 h-3.5" /> {service.duration} minutos
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => {
                          if (subscription?.status === 'inactive') {
                            setShowPaywall(true)
                          } else {
                            setEditingService(service)
                            setServiceForm({
                              name: service.name,
                              description: service.description || '',
                              price: service.price.toString(),
                              duration: service.duration.toString()
                            })
                            setShowNewService(true)
                          }
                        }}
                        className="flex-1 text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all"
                      >
                        EDITAR
                      </button>
                      <button 
                        onClick={() => {
                          if (subscription?.status === 'inactive') {
                            setShowPaywall(true)
                          } else {
                            handleDeleteService(service.id)
                          }
                        }}
                        className="flex-1 text-center py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        EXCLUIR
                      </button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <div className="col-span-full card-simple py-20 text-center border-dashed border-2 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Seu catálogo está vazio</p>
                    <p className="text-xs text-slate-300 mt-1">Clique em "Novo Serviço" para começar</p>
                  </div>
                )}
              </div>
           </div>
        )}

        {activeTab === 'links' && (
           <div className="animate-slide-up space-y-6">
              {/* Profile Link Section */}
              <div className="card-simple p-4 sm:p-6 bg-gradient-to-br from-orange-500 to-pink-500 text-white border-none shadow-xl shadow-pink-500/20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-black mb-1">Seu Link Mestre</h3>
                    <p className="text-pink-100 text-xs sm:text-sm font-medium leading-relaxed">Envie este link para seus clientes verem TODOS os seus serviços de uma vez.</p>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => { 
                        const url = `${window.location.origin}/p/${adminInfo?.username}`; 
                        navigator.clipboard.writeText(url); 
                        showToast('Link do perfil copiado!') 
                      }} 
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-pink-600 font-bold py-2.5 px-4 rounded-xl hover:bg-pink-50 transition-all text-xs sm:text-sm shadow-md min-h-[42px]"
                    >
                      <Copy className="w-4 h-4" /> Copiar Perfil
                    </button>
                     <button 
                       onClick={() => setActiveTab('personalizar')} 
                       className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/15 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-white/25 transition-all border border-white/20 text-xs sm:text-sm shadow-md min-h-[42px]"
                     >
                       <Palette className="w-4 h-4" /> Personalizar Página
                     </button>
                    <a 
                      href={`/p/${adminInfo?.username}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2.5 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-all border border-white/20 shrink-0 flex items-center justify-center min-h-[42px] min-w-[42px]"
                      title="Abrir em nova aba"
                    >
                      <ExternalLink className="w-4.5 h-4.5" />
                    </a>
                  </div>
                </div>
              </div>

              {editingLink ? (
                <div className="card-simple p-5 sm:p-8 border-pink-200 dark:border-pink-500/30 shadow-xl mb-6 animate-scale-in">
                  <h3 className="font-black text-slate-900 dark:text-white mb-6 text-xl">Editar Link de Venda</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Título do Link</label>
                      <input type="text" value={editLinkTitle} onChange={e => setEditLinkTitle(e.target.value)} placeholder="Ex: Cortes de Cabelo..." className="w-full input-simple text-lg font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Vincular a um Serviço (Opcional)</label>
                      <select 
                        value={editLinkServiceId || ''} 
                        onChange={e => setEditLinkServiceId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full input-simple font-bold"
                      >
                        <option value="">Nenhum (Apenas título)</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price)})</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Taxa de Agendamento */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editLinkBookingFeeEnabled}
                          onChange={e => setEditLinkBookingFeeEnabled(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Cobrar Sinal de Reserva (direto na sua conta MP)</span>
                      </label>
                      
                      {editLinkBookingFeeEnabled && (
                        <div className="animate-fade-in pl-6">
                          <label className="block text-xs font-bold text-slate-400 mb-1">Valor do Sinal (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editLinkBookingFeeAmount}
                            onChange={e => setEditLinkBookingFeeAmount(e.target.value)}
                            placeholder="0,00"
                            className="w-32 input-simple font-bold text-sm bg-white dark:bg-[#131826]"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <button onClick={handleUpdateLink} className="flex-1 btn-primary-simple py-4 font-black text-lg">SALVAR ALTERAÇÕES</button>
                      <button onClick={() => setEditingLink(null)} className="px-8 font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                    </div>
                  </div>
                </div>
              ) : !showNewLink ? (
                <button onClick={() => setShowNewLink(true)} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2.5 text-sm sm:text-base font-extrabold shadow-lg shadow-pink-500/20 transition-all mb-6">
                  <Plus className="w-5 h-5" /> CRIAR NOVO LINK DE VENDA
                </button>
              ) : (
                <div className="card-simple p-5 sm:p-8 border-pink-200 dark:border-pink-500/30 shadow-xl mb-6 animate-scale-in">
                  <h3 className="font-black text-slate-900 dark:text-white mb-6 text-xl">Criar Novo Link de Venda</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Título do Link</label>
                      <input type="text" value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)} placeholder="Ex: Cortes de Cabelo, Consultoria, Unhas..." className="w-full input-simple text-lg font-bold" autoFocus />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Vincular a um Serviço (Opcional)</label>
                      <select 
                        value={newLinkServiceId || ''} 
                        onChange={e => setNewLinkServiceId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full input-simple font-bold"
                      >
                        <option value="">Nenhum (Apenas título)</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price)})</option>
                        ))}
                      </select>
                    </div>

                    {/* Taxa de Agendamento */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newLinkBookingFeeEnabled}
                          onChange={e => setNewLinkBookingFeeEnabled(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Cobrar Sinal de Reserva (direto na sua conta MP)</span>
                      </label>
                      
                      {newLinkBookingFeeEnabled && (
                        <div className="animate-fade-in pl-6">
                          <label className="block text-xs font-bold text-slate-400 mb-1">Valor do Sinal (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={newLinkBookingFeeAmount}
                            onChange={e => setNewLinkBookingFeeAmount(e.target.value)}
                            placeholder="0,00"
                            className="w-32 input-simple font-bold text-sm bg-white dark:bg-[#131826]"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <button onClick={handleCreateLink} className="flex-1 btn-primary-simple py-4 font-black text-lg">CRIAR LINK AGORA</button>
                      <button onClick={() => setShowNewLink(false)} className="px-8 font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {links.map(link => (
                  <div key={link.id} className="card-simple p-4 sm:p-5 hover:shadow-xl transition-all border-l-4 border-pink-500 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{link.title}</h3>
                          {link.service && <p className="text-xs font-bold text-pink-500 mt-1">{link.service.name} • {formatCurrency(link.service.price)}</p>}
                          {link.bookingFeeEnabled ? (
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" /> Sinal: {formatCurrency(link.bookingFeeAmount)} (direto no seu MP)
                            </p>
                          ) : (
                            <p className="text-[10px] font-bold text-slate-400 mt-1">Sem sinal de reserva</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-center">
                          <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-200">{link.totalSlots}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-xl text-center">
                          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{link.availableSlots}</p>
                          <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500 uppercase tracking-wider">Livres</p>
                        </div>
                        <div className="bg-pink-50 dark:bg-pink-500/10 p-2 rounded-xl text-center">
                          <p className="text-xl sm:text-2xl font-black text-pink-500">{link.bookedSlots}</p>
                          <p className="text-[9px] font-bold text-pink-400 uppercase tracking-wider">Agendados</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => { const url = `${window.location.origin}/agendar/${link.token}`; navigator.clipboard.writeText(url); showToast('Link copiado!') }} className="flex-1 text-center py-2 px-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-pink-500 dark:hover:text-pink-400 bg-slate-100 dark:bg-slate-800/70 rounded-xl transition-all flex items-center justify-center gap-1"><Copy className="w-3.5 h-3.5" /> COPIAR</button>
                      <button onClick={() => startEditingLink(link)} className="flex-1 text-center py-2 px-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-pink-500 dark:hover:text-pink-400 bg-slate-100 dark:bg-slate-800/70 rounded-xl transition-all flex items-center justify-center gap-1"><Pencil className="w-3.5 h-3.5" /> EDITAR</button>
                      <button onClick={() => handleDeleteLink(link.id)} className="flex-1 text-center py-2 px-1.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 bg-red-500/10 rounded-xl transition-all flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /> EXCLUIR</button>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        )}
        {activeTab === 'clientes' && (
           <div className="animate-slide-up space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Clientes (Mini-CRM)</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe a frequência de agendamentos e faturamento por cliente</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder="Buscar por nome ou telefone..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131826] font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-simple p-5 flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Total de Clientes</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block mt-0.5">{aggregatedClients.length}</span>
                  </div>
                </div>

                <div className="card-simple p-5 flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Faturamento Médio por Cliente</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block mt-0.5">
                      {formatCurrency(
                        aggregatedClients.length > 0 
                          ? aggregatedClients.reduce((acc, curr) => acc + curr.totalSpent, 0) / aggregatedClients.length 
                          : 0
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table / List */}
              {aggregatedClients.length === 0 ? (
                <div className="card-simple p-12 text-center border-dashed border-2 border-slate-250 dark:border-slate-800/80">
                  <span className="text-4xl block mb-3">👥</span>
                  <h3 className="text-md font-black text-slate-900 dark:text-white">Nenhum cliente encontrado</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Os clientes aparecerão aqui automaticamente quando realizarem agendamentos pelos seus links.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100/50 dark:bg-[#1A2235]/20">
                          <th className="py-4 px-6">Nome do Cliente</th>
                          <th className="py-4 px-6">WhatsApp</th>
                          <th className="py-4 px-6 text-center">Consultas</th>
                          <th className="py-4 px-6 text-right">Total Pago</th>
                          <th className="py-4 px-6 text-right">Último Agendamento</th>
                          <th className="py-4 px-6 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedClients.map((client, idx) => (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-[#1A2235]/10 transition-colors">
                            <td className="py-4 px-6 font-black text-sm text-slate-900 dark:text-white">{client.name}</td>
                            <td className="py-4 px-6 text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">{client.phone}</td>
                            <td className="py-4 px-6 text-center font-bold text-sm text-slate-700 dark:text-slate-300">{client.totalBookings}</td>
                            <td className="py-4 px-6 text-right font-black text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(client.totalSpent)}</td>
                            <td className="py-4 px-6 text-right font-bold text-xs text-slate-500 dark:text-slate-400">
                              {client.lastBookingDate ? formatDate(client.lastBookingDate) : 'Sem data'}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleOpenClientDetails(client.name, client.phone)}
                                  className="p-2 bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white rounded-xl transition-all"
                                  title="Ficha do Cliente"
                                >
                                  <User className="w-4 h-4" />
                                </button>
                                <a 
                                  href={`https://wa.me/55${client.phone}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                                  title="Iniciar conversa no WhatsApp"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {aggregatedClients.map((client, idx) => (
                      <div key={idx} className="card-simple p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white">{client.name}</h4>
                            <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1">{client.phone}</span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleOpenClientDetails(client.name, client.phone)}
                              className="p-2.5 bg-pink-500/10 hover:bg-pink-500 text-pink-500 hover:text-white rounded-xl transition-all"
                              title="Ficha do Cliente"
                            >
                              <User className="w-4 h-4" />
                            </button>
                            <a 
                              href={`https://wa.me/55${client.phone}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl transition-all"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Consultas</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-white block mt-0.5">{client.totalBookings}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Total Pago</span>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">{formatCurrency(client.totalSpent)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Último</span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                              {client.lastBookingDate ? formatDate(client.lastBookingDate) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

           </div>
        )}
        {activeTab === 'personalizar' && (
           <div className="animate-slide-up space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Personalizar Página Pública</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Configure a identidade visual e o banner do seu link de agendamento</p>
                </div>
              </div>

              {/* Grid layout: Left = Form, Right = Mobile Simulator Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* CONFIGURATIONS COLUMN (left 7 cols) */}
                <form onSubmit={handleBrandingSubmit} className="lg:col-span-7 card-simple p-4 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-[#131826]">
                  
                  {/* Business Name and Description */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Informações do Perfil</h3>
                    
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Nome do Negócio</label>
                      <input
                        type="text"
                        value={brandingForm.businessName}
                        onChange={e => setBrandingForm({ ...brandingForm, businessName: e.target.value })}
                        placeholder="Ex: Barber Shop Elite"
                        className="w-full input-simple font-bold text-sm bg-slate-50 dark:bg-[#1A2235]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Descrição / Bio</label>
                      <textarea
                        value={brandingForm.description}
                        onChange={e => setBrandingForm({ ...brandingForm, description: e.target.value })}
                        placeholder="Descreva seu negócio, sua equipe ou seus diferenciais..."
                        className="w-full input-simple font-bold text-sm resize-none h-24 bg-slate-50 dark:bg-[#1A2235]"
                      ></textarea>
                    </div>
                  </div>

                  {/* Profile Photo and Cover Banner Images */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Imagens de Identidade</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Logo / Avatar upload */}
                      <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Foto / Logotipo</label>
                        <div className="flex items-center gap-4">
                          <div 
                            onClick={() => brandingAvatarInputRef.current?.click()}
                            className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2235] hover:border-pink-500 transition-all cursor-pointer overflow-hidden flex items-center justify-center flex-shrink-0"
                          >
                            {brandingForm.photoUrl ? (
                              <img src={brandingForm.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <input
                              type="file"
                              ref={brandingAvatarInputRef}
                              onChange={handleBrandingAvatarChange}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => brandingAvatarInputRef.current?.click()}
                              className="text-xs font-bold text-pink-500 hover:underline uppercase tracking-wider block"
                            >
                              Carregar Foto
                            </button>
                            {brandingForm.photoUrl && (
                              <button
                                type="button"
                                onClick={() => setBrandingForm({ ...brandingForm, photoUrl: '' })}
                                className="text-xs font-bold text-red-500 hover:underline uppercase tracking-wider block mt-1"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Banner upload */}
                      <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Imagem de Capa (Banner)</label>
                        <div className="flex items-center gap-4">
                          <div 
                            onClick={() => brandingBannerInputRef.current?.click()}
                            className="w-24 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2235] hover:border-pink-500 transition-all cursor-pointer overflow-hidden flex items-center justify-center flex-shrink-0"
                          >
                            {brandingForm.bannerUrl ? (
                              <img src={brandingForm.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                              <Store className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <input
                              type="file"
                              ref={brandingBannerInputRef}
                              onChange={handleBrandingBannerChange}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => brandingBannerInputRef.current?.click()}
                              className="text-xs font-bold text-pink-500 hover:underline uppercase tracking-wider block"
                            >
                              Carregar Banner
                            </button>
                            {brandingForm.bannerUrl ? (
                              <button
                                type="button"
                                onClick={() => setBrandingForm({ ...brandingForm, bannerUrl: '' })}
                                className="text-xs font-bold text-red-500 hover:underline uppercase tracking-wider block mt-1"
                              >
                                Usar Gradiente
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-1">Usando gradiente de cores</span>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Colors, Presets and Theme styling */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Estilo e Cores</h3>
                    
                    {/* Theme selector */}
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Tema da Página</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBrandingForm({ ...brandingForm, publicTheme: 'light' })}
                          className={`py-3 px-4 rounded-xl border text-xs font-black transition-all uppercase tracking-wider ${
                            brandingForm.publicTheme === 'light'
                              ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 text-orange-500'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Modo Claro
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrandingForm({ ...brandingForm, publicTheme: 'dark' })}
                          className={`py-3 px-4 rounded-xl border text-xs font-black transition-all uppercase tracking-wider ${
                            brandingForm.publicTheme === 'dark'
                              ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 text-orange-500'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Modo Escuro
                        </button>
                      </div>
                    </div>

                    {/* Accent / Secondary Color inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Cor Principal (Destaque)</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1A2235] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          <input
                            type="color"
                            value={brandingForm.accentColor}
                            onChange={e => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                            className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent p-0 overflow-hidden"
                          />
                          <span className="text-xs font-mono font-black uppercase text-slate-600 dark:text-slate-300">
                            {brandingForm.accentColor}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Cor Secundária</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1A2235] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          <input
                            type="color"
                            value={brandingForm.secondaryColor}
                            onChange={e => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                            className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent p-0 overflow-hidden"
                          />
                          <span className="text-xs font-mono font-black uppercase text-slate-600 dark:text-slate-300">
                            {brandingForm.secondaryColor}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Presets */}
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Presets de Cores</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Sunset', primary: '#f97316', secondary: '#ec4899' },
                          { name: 'Ocean', primary: '#0ea5e9', secondary: '#2563eb' },
                          { name: 'Forest', primary: '#10b981', secondary: '#059669' },
                          { name: 'Grape', primary: '#8b5cf6', secondary: '#d946ef' },
                          { name: 'Crimson', primary: '#ef4444', secondary: '#b91c1c' },
                        ].map(preset => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setBrandingForm({ ...brandingForm, accentColor: preset.primary, secondaryColor: preset.secondary })}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-white dark:bg-[#131826]"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                            />
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Custom Domain and Subdomain Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Endereço e Domínio</h3>
                    
                    {/* Wildcard Subdomain display */}
                    <div className="bg-slate-50 dark:bg-[#1A2235] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase">Subdomínio Grátis</label>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {adminInfo ? `${adminInfo.username}.boramarka.com.br` : '...'}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        Sua página pública resolve diretamente com este subdomínio de forma transparente!
                      </span>
                    </div>

                    {/* Custom Domain Input */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase">Domínio Próprio</label>
                        {subscription?.plan !== 'premium' && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full">
                            Recurso Premium
                          </span>
                        )}
                      </div>
                      
                      {subscription?.plan === 'premium' ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={brandingForm.customDomain || ''}
                            onChange={e => setBrandingForm({ ...brandingForm, customDomain: e.target.value })}
                            placeholder="ex: agendar.meusalao.com.br"
                            className="w-full input-simple font-bold text-sm bg-slate-50 dark:bg-[#1A2235]"
                          />
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Aponte o registro <strong>CNAME</strong> do seu domínio próprio para <strong>cname.boramarka.com.br</strong> e depois salve o domínio desejado acima.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-gradient-to-br from-pink-500/5 to-orange-500/5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl text-white">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                          </div>
                          <div className="space-y-1 text-left">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Domínio Próprio Bloqueado</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              Mapear seu domínio próprio (ex: <code>agendar.meusalao.com</code>) é uma funcionalidade exclusiva do <strong>Plano Premium</strong>. Faça o upgrade na aba "Assinatura" para habilitar!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="w-full py-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-lg transition-all shadow-xl shadow-pink-500/20 mt-4">
                    Salvar Identidade Visual
                  </button>
                </form>

                {/* SIMULATOR PREVIEW COLUMN (right 5 cols) */}
                <div className="lg:col-span-5 flex justify-center lg:sticky lg:top-6">
                  <div className="w-[310px] max-w-full h-[620px] bg-slate-900 rounded-[40px] sm:rounded-[50px] border-[6px] sm:border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                    
                    {/* Speaker notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-30 flex items-center justify-center">
                      <div className="w-10 h-1 bg-slate-700 rounded-full mb-1" />
                    </div>

                    {/* Dynamic Simulated Page Content */}
                    <div className={`flex-1 overflow-y-auto overflow-x-hidden ${
                      brandingForm.publicTheme === 'dark' ? 'dark bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-900'
                    } transition-all duration-200 text-left pt-0 pb-10`}>
                      
                      {/* Custom cover/banner preview */}
                      <div 
                        className="h-28 w-full relative bg-cover bg-center"
                        style={brandingForm.bannerUrl ? { backgroundImage: `url(${brandingForm.bannerUrl})` } : { background: `linear-gradient(135deg, ${brandingForm.accentColor}, ${brandingForm.secondaryColor})` }}
                      >
                        <div className="absolute inset-0 bg-black/15"></div>
                        {!brandingForm.bannerUrl && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>}
                      </div>

                      {/* Header Avatar and Business Name Card */}
                      <div className="px-4 pb-4 -mt-8 relative z-10 text-center">
                        <div 
                          className="w-16 h-16 rounded-full mx-auto mb-2.5 shadow-lg flex items-center justify-center text-white text-2xl font-black overflow-hidden border-4 border-white dark:border-[#131826]"
                          style={{ 
                            background: `linear-gradient(to right, ${brandingForm.accentColor}, ${brandingForm.secondaryColor})`,
                            boxShadow: `0 8px 20px -3px ${brandingForm.accentColor}30`
                          }}
                        >
                          {brandingForm.photoUrl ? (
                            <img src={brandingForm.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            (brandingForm.businessName || 'B')[0].toUpperCase()
                          )}
                        </div>
                        
                        <h4 className="text-sm font-black tracking-tight mb-1 text-slate-900 dark:text-white truncate">
                          {brandingForm.businessName || 'Nome do seu Negócio'}
                        </h4>
                        
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium px-2 leading-tight">
                          {brandingForm.description || 'Sua descrição ou biografia aparecerá aqui para seus clientes.'}
                        </p>
                        
                        {/* Fake contact buttons */}
                        <div className="flex justify-center gap-1.5 mt-3">
                          <span className="flex items-center gap-1 text-[8px] font-bold text-white uppercase tracking-widest bg-[#25D366] px-2.5 py-1 rounded-full shadow-md">
                            WhatsApp
                          </span>
                          <span className="flex items-center gap-1 text-[8px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            Localização
                          </span>
                        </div>
                      </div>

                      {/* Mock Catalog Items */}
                      <div className="px-3 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-950 dark:text-white">Nosso Catálogo</h5>
                          <div className="h-[1.5px] flex-1 bg-slate-200 dark:bg-slate-800 ml-2 rounded-full"></div>
                        </div>

                        <div className="space-y-2">
                          {[
                            { name: 'Corte Social Masculino', price: 45.0, duration: '30 min' },
                            { name: 'Barba Terapia Completa', price: 35.0, duration: '20 min' },
                          ].map((item, idx) => (
                            <div 
                              key={idx} 
                              className="bg-white dark:bg-[#131826] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-all flex flex-col justify-between"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-black text-[10px] text-slate-950 dark:text-white leading-tight">
                                  {item.name}
                                </span>
                                <span 
                                  className="font-black text-[10px] whitespace-nowrap"
                                  style={{ color: brandingForm.accentColor }}
                                >
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                </span>
                              </div>
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                                {item.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mocked Footer */}
                      <div className="mt-6 text-center pt-3 border-t border-slate-200 dark:border-slate-800/60 opacity-60">
                        <span 
                          className="text-[10px] font-black bg-clip-text text-transparent inline-block"
                          style={{ backgroundImage: `linear-gradient(to right, ${brandingForm.accentColor}, ${brandingForm.secondaryColor})` }}
                        >
                          BoraMarka
                        </span>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
           </div>
        )}
        {activeTab === 'faturamento' && (
           <div className="animate-slide-up space-y-6 text-left">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Gerenciar Assinatura</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seu plano, faturamento e acesso à plataforma</p>
                </div>
              </div>

              {/* Subscription Status Card */}
              <div className="card-simple p-4 sm:p-8 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-[#131826] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Status da Conta</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {subscription?.status === 'active' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4" /> Ativo
                        </span>
                      )}
                      {subscription?.status === 'trialing' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4" /> Período de Testes (Trial)
                        </span>
                      )}
                      {subscription?.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                          <Clock className="w-4 h-4 animate-pulse" /> Pagamento Pendente
                        </span>
                      )}
                      {(!subscription || subscription.status === 'inactive') && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 uppercase tracking-wider">
                          <AlertCircle className="w-4 h-4" /> Inativo / Expirado
                        </span>
                      )}
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        (Plano {subscription?.plan === 'anual' ? 'Anual' : 'Mensal'})
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Validade / Próxima Cobrança</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block mt-1">
                      {subscription?.status === 'active' && subscription.expiresAt
                        ? new Date(subscription.expiresAt).toLocaleDateString('pt-BR')
                        : subscription?.status === 'trialing' && subscription.trialEndsAt
                        ? `${new Date(subscription.trialEndsAt).toLocaleDateString('pt-BR')} (Fim do teste grátis)`
                        : subscription?.status === 'pending'
                        ? 'Aguardando compensação'
                        : 'Expirada'}
                    </span>
                  </div>
                </div>

                {subscription?.status === 'inactive' && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black text-red-800 dark:text-red-400 uppercase tracking-wide">Agendamentos Suspensos</h4>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        Sua assinatura expirou e a sua página pública está temporariamente desativada para novos agendamentos dos seus clientes. Escolha um plano abaixo para reativar seu negócio imediatamente.
                      </p>
                    </div>
                  </div>
                )}

                {subscription?.status === 'pending' && (
                  <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 p-4 rounded-2xl flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black text-yellow-800 dark:text-yellow-400 uppercase tracking-wide">Pagamento em Processamento</h4>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
                        Identificamos seu pedido de assinatura. O Mercado Pago está processando a transação. Assim que for confirmado, seu plano será atualizado automaticamente.
                      </p>
                    </div>
                  </div>
                )}

                 {/* Plan Options */}
                <div>
                  <h3 className="text-md font-black text-slate-900 dark:text-white mb-6">Planos Disponíveis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Monthly Card */}
                    <div className={`border p-4 sm:p-6 rounded-3xl space-y-6 flex flex-col justify-between transition-all text-left ${
                      subscription?.plan === 'mensal' && subscription?.status === 'active'
                        ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Plano Básico Mensal</h4>
                            <p className="text-xs text-slate-400 font-semibold mt-1">Ideal para começar e testar</p>
                          </div>
                          {subscription?.plan === 'mensal' && subscription?.status === 'active' && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-orange-500 text-white px-2.5 py-1 rounded-full">Plano Atual</span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">R$ 30</span>
                          <span className="text-xs text-slate-400 font-bold uppercase">/ mês</span>
                        </div>
                        <ul className="space-y-2.5 pt-2">
                          {['Agenda online 24h sem limites', 'Até 10 links de agendamento simultâneos', 'Taxa de agendamento (cobrança de sinal)', 'Lembretes de WhatsApp ilimitados', 'Financeiro e fluxo de caixa integrados'].map((feat, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <button 
                        onClick={() => handleCheckout('mensal')}
                        className={`w-full py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                          subscription?.plan === 'mensal' && subscription?.status === 'active'
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-md'
                        }`}
                        disabled={subscription?.plan === 'mensal' && subscription?.status === 'active'}
                      >
                        <CreditCard className="w-4 h-4" />
                        {subscription?.plan === 'mensal' && subscription?.status === 'active' ? 'Plano Ativo' : 'Assinar Mensal'}
                      </button>
                    </div>

                    {/* Annual Card */}
                    <div className={`border p-6 rounded-3xl space-y-6 flex flex-col justify-between transition-all text-left relative overflow-hidden ${
                      subscription?.plan === 'anual' && subscription?.status === 'active'
                        ? 'border-pink-500 bg-pink-500/5 dark:bg-pink-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}>
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-10">
                        Economize R$ 100
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Plano Básico Anual</h4>
                            <p className="text-xs text-slate-400 font-semibold mt-1">O melhor custo-benefício</p>
                          </div>
                          {subscription?.plan === 'anual' && subscription?.status === 'active' && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-pink-500 text-white px-2.5 py-1 rounded-full">Plano Atual</span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">R$ 260</span>
                          <span className="text-xs text-slate-400 font-bold uppercase">/ ano</span>
                        </div>
                        <ul className="space-y-2.5 pt-2">
                          {['Tudo do plano mensal sem restrições', 'Acesso imediato a novas funcionalidades', 'Links de agendamento ilimitados', 'Suporte VIP e prioritário via WhatsApp', 'Equivalente a apenas R$ 21,60 por mês'].map((feat, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button 
                        onClick={() => handleCheckout('anual')}
                        className={`w-full py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                          subscription?.plan === 'anual' && subscription?.status === 'active'
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-xl shadow-pink-500/20 hover:opacity-95'
                        }`}
                        disabled={subscription?.plan === 'anual' && subscription?.status === 'active'}
                      >
                        <CreditCard className="w-4 h-4" />
                        {subscription?.plan === 'anual' && subscription?.status === 'active' ? 'Plano Ativo' : 'Assinar Anual'}
                      </button>
                    </div>

                    {/* Premium Card */}
                    <div className={`border p-6 rounded-3xl space-y-6 flex flex-col justify-between transition-all text-left relative overflow-hidden ${
                      subscription?.plan === 'premium' && subscription?.status === 'active'
                        ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10 shadow-lg shadow-violet-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}>
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-10">
                        Mais Completo
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Plano Premium</h4>
                            <p className="text-xs text-slate-400 font-semibold mt-1">Domínio próprio e exclusividade</p>
                          </div>
                          {subscription?.plan === 'premium' && subscription?.status === 'active' && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-violet-600 text-white px-2.5 py-1 rounded-full">Plano Atual</span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">R$ 69,90</span>
                          <span className="text-xs text-slate-400 font-bold uppercase">/ mês</span>
                        </div>
                        <ul className="space-y-2.5 pt-2">
                          {['Tudo dos planos básico e anual', 'Gestão de RH e Equipe completa', 'Subdomínio Wildcard grátis profissional', 'Domínio próprio (ex: agendar.salao.com)', 'Página 100% livre da marca BoraMarka', 'Suporte técnico prioritário dedicado VIP'].map((feat, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button 
                        onClick={() => handleCheckout('premium')}
                        className={`w-full py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                          subscription?.plan === 'premium' && subscription?.status === 'active'
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:opacity-95'
                        }`}
                        disabled={subscription?.plan === 'premium' && subscription?.status === 'active'}
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                        {subscription?.plan === 'premium' && subscription?.status === 'active' ? 'Plano Ativo' : 'Assinar Premium'}
                      </button>
                    </div>

                  </div>
                </div>

              </div>
           </div>
        )}
        {activeTab === 'cupons' && (
           <div className="animate-slide-up space-y-6 text-left">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Cupons de Desconto</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Crie códigos promocionais para campanhas de marketing e descontos nos agendamentos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Create Coupon Column (left 5 cols) */}
                <form onSubmit={handleCreateCoupon} className="lg:col-span-5 card-simple p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-[#131826]">
                  <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Novo Cupom</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Código do Cupom</label>
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={couponForm.code}
                          onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                          placeholder="EX: DESCONTO10"
                          className="input-simple font-bold text-sm pl-12 bg-white dark:bg-[#131826]"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">Os clientes digitarão este código na tela de agendamento.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Tipo de Desconto</label>
                      <select 
                        value={couponForm.discountType}
                        onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as 'percentage' | 'fixed' })}
                        className="input-simple font-bold w-full bg-slate-50 dark:bg-[#131826]"
                      >
                        <option value="percentage">Porcentagem (%)</option>
                        <option value="fixed">Valor Fixo (R$)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Valor do Desconto</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={couponForm.discountValue}
                          onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                          placeholder={couponForm.discountType === 'percentage' ? 'Ex: 10' : 'Ex: 15.00'}
                          className="input-simple font-bold text-sm pl-12 bg-white dark:bg-[#131826]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-md transition-all shadow-xl shadow-pink-500/20 flex items-center justify-center gap-2 hover:opacity-95">
                    <Plus className="w-5 h-5" /> Criar Cupom
                  </button>
                </form>

                {/* Coupons List Column (right 7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cupons Ativos ({coupons.length})</h3>
                  </div>

                  {coupons.length === 0 ? (
                    <div className="card-simple p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-850 bg-white dark:bg-[#131826]/40">
                      <span className="text-4xl block mb-3">🏷️</span>
                      <h4 className="text-md font-black text-slate-900 dark:text-white">Nenhum cupom ativo</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Crie um cupom no formulário ao lado para compartilhar com seus clientes.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {coupons.map(cp => (
                        <div key={cp.id} className="card-simple p-5 flex items-center justify-between bg-white dark:bg-[#131826] hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-pink-500/10 text-pink-500 rounded-2xl shrink-0">
                              <Tag className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200 tracking-wider">
                                  {cp.code}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              </div>
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5">
                                Desconto: <strong className="text-emerald-500">{cp.discountType === 'percentage' ? `${cp.discountValue}%` : formatCurrency(cp.discountValue)}</strong>
                              </p>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleDeleteCoupon(cp.id)}
                            className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                            title="Excluir Cupom"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
           </div>
        )}
        {activeTab === 'memberships' && (
          <div className="animate-slide-up space-y-8 text-left">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Clube de Assinaturas</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Crie planos de assinatura recorrentes para seus clientes fidelizados (mensais/anuais)</p>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="card-simple p-6 bg-gradient-to-br from-orange-500/5 to-pink-500/5 border-orange-500/10">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recorrência Mensal (MRR)</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(
                    clientSubscriptions.reduce((acc, sub) => {
                      if (sub.status !== 'active') return acc;
                      const planPrice = sub.plan.price;
                      return acc + (sub.plan.interval === 'yearly' ? planPrice / 12 : planPrice);
                    }, 0)
                  )}
                </h3>
              </div>

              <div className="card-simple p-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Assinantes Ativos</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {clientSubscriptions.filter(s => s.status === 'active').length}
                </h3>
              </div>

              <div className="card-simple p-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Planos Ativos</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {membershipPlans.length}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Create Plan & Register Subscriber Forms */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Create Plan Form */}
                <form onSubmit={handleCreateMembershipPlan} className="card-simple p-6 space-y-4 bg-white dark:bg-[#131826] border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Novo Plano de Assinatura
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nome do Plano</label>
                      <input 
                        type="text"
                        value={planForm.name}
                        onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                        placeholder="Ex: Assinatura Barba e Cabelo"
                        className="input-simple text-xs font-bold w-full bg-slate-50 dark:bg-[#131826]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Intervalo de Cobrança</label>
                      <select
                        value={planForm.interval}
                        onChange={e => setPlanForm({ ...planForm, interval: e.target.value as 'monthly' | 'yearly' })}
                        className="input-simple text-xs font-bold w-full bg-slate-50 dark:bg-[#131826]"
                      >
                        <option value="monthly">Mensal</option>
                        <option value="yearly">Anual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Preço do Plano</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                        <input 
                          type="number"
                          step="0.01"
                          value={planForm.price}
                          onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                          placeholder="Ex: 80.00"
                          className="input-simple text-xs font-bold pl-9 w-full bg-slate-50 dark:bg-[#131826]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Descrição (opcional)</label>
                      <textarea
                        value={planForm.description}
                        onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                        placeholder="Descreva o que o plano oferece..."
                        className="input-simple text-xs font-bold w-full h-16 bg-slate-50 dark:bg-[#131826]"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl text-white font-black text-xs transition-all uppercase tracking-wider">
                    Criar Plano
                  </button>
                </form>

                {/* Register Subscriber Form */}
                <form onSubmit={handleCreateClientSubscription} className="card-simple p-6 space-y-4 bg-white dark:bg-[#131826] border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4" /> Vincular Novo Assinante
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nome do Cliente</label>
                      <input 
                        type="text"
                        value={subForm.clientName}
                        onChange={e => setSubForm({ ...subForm, clientName: e.target.value })}
                        placeholder="Ex: Bruno Santana"
                        className="input-simple text-xs font-bold w-full bg-slate-50 dark:bg-[#131826]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">WhatsApp do Cliente</label>
                      <input 
                        type="tel"
                        value={subForm.clientPhone}
                        onChange={e => setSubForm({ ...subForm, clientPhone: maskPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        className="input-simple text-xs font-bold w-full bg-slate-50 dark:bg-[#131826]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Plano Escolhido</label>
                      <select
                        value={subForm.planId}
                        onChange={e => setSubForm({ ...subForm, planId: e.target.value })}
                        className="input-simple text-xs font-bold w-full bg-slate-50 dark:bg-[#131826]"
                        required
                      >
                        <option value="">Selecione o Plano...</option>
                        {membershipPlans.map(plan => (
                          <option key={plan.id} value={plan.id}>{plan.name} ({plan.interval === 'yearly' ? 'Anual' : 'Mensal'} - R$ {plan.price.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={membershipPlans.length === 0}
                    className="w-full py-3 bg-slate-800 dark:bg-[#1A2235] text-white hover:bg-slate-700 rounded-xl font-black text-xs transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Ativar Assinatura
                  </button>
                </form>

              </div>

              {/* Right Column: Plans and Subscriptions Lists */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Membership Plans List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">Planos Disponíveis ({membershipPlans.length})</h3>
                  {membershipPlans.length === 0 ? (
                    <div className="card-simple p-8 text-center text-xs text-slate-400 font-semibold border-dashed">
                      Nenhum plano de assinatura cadastrado ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {membershipPlans.map(plan => (
                        <div key={plan.id} className="card-simple p-4 flex items-center justify-between bg-white dark:bg-[#131826]">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{plan.name}</h4>
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 uppercase tracking-wider">
                                {plan.interval === 'yearly' ? 'Anual' : 'Mensal'}
                              </span>
                            </div>
                            {plan.description && <p className="text-[10px] text-slate-400 mt-1 font-semibold">{plan.description}</p>}
                            <p className="text-[10px] text-slate-500 font-bold mt-1.5">
                              Assinantes ativos: <strong className="text-slate-800 dark:text-slate-200">{plan._count?.subscriptions || 0}</strong>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-emerald-500">{formatCurrency(plan.price)}</span>
                            <button 
                              onClick={() => handleDeleteMembershipPlan(plan.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                              title="Excluir Plano"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Client Subscriptions List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">Lista de Assinantes ({clientSubscriptions.length})</h3>
                  {clientSubscriptions.length === 0 ? (
                    <div className="card-simple p-8 text-center text-xs text-slate-400 font-semibold border-dashed">
                      Nenhum cliente cadastrado no clube de assinaturas ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {clientSubscriptions.map(sub => (
                        <div key={sub.id} className="card-simple p-4 flex items-center justify-between bg-white dark:bg-[#131826]">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{sub.clientName}</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Plano: <span className="text-pink-500 font-black">{sub.plan.name}</span></p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Celular: {maskPhone(sub.clientPhone)}</p>
                          </div>

                          <div className="text-right space-y-2 shrink-0">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
                              Renova: {new Date(sub.expiresAt).toLocaleDateString('pt-BR')}
                            </span>
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleDeleteClientSubscription(sub.id)}
                                className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                                title="Cancelar Assinatura"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
        {activeTab === 'trash' && (
           <div className="animate-slide-up space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Lixeira</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Links de venda excluídos recentemente</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deletedLinks.map(link => (
                  <div key={link.id} className="card-simple p-6 opacity-80 hover:opacity-100 transition-all border-dashed">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-400 line-through">{link.title}</h3>
                        <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mt-1">Excluído em {formatDate(link.deletedAt?.split('T')[0])}</p>
                      </div>
                      <Trash2 className="w-6 h-6 text-slate-200" />
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRestoreLink(link.id)} 
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 font-black py-3 rounded-xl hover:bg-emerald-100 transition-all"
                        title="Restaurar Link"
                      >
                        <RefreshCw className="w-4 h-4" /> Restaurar
                      </button>
                      <button 
                        onClick={() => handleDeleteLinkPermanent(link.id)} 
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                        title="Excluir Permanentemente"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {deletedLinks.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <Trash2 className="w-16 h-16 text-slate-400 dark:text-slate-200 mx-auto mb-4 opacity-40" />
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">A lixeira está vazia</p>
                  </div>
                )}
              </div>
           </div>
        )}

        {activeTab === 'rh' && (
          <div className="animate-slide-up space-y-6">
            {subscription?.plan !== 'premium' || subscription?.status !== 'active' ? (
              <div className="max-w-md mx-auto text-center py-16 px-6 bg-white/80 dark:bg-[#131826]/40 border border-slate-200 dark:border-white/[0.06] rounded-3xl backdrop-blur-xl shadow-2xl space-y-6 text-slate-900 dark:text-slate-100">
                <div className="w-16 h-16 bg-violet-500/20 text-violet-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-violet-500/30">
                  <UserCheck className="w-8 h-8 text-violet-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Gestão de RH Bloqueada</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold leading-relaxed">
                  A Gestão de RH e Colaboradores é uma funcionalidade exclusiva do <strong>Plano Premium</strong> (R$ 69,90/mês). 
                  Organize sua equipe, controle arquivos, gerencie demissões e controle pendências!
                </p>
                <button
                  onClick={() => setActiveTab('faturamento')}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-spin-slow" />
                  Fazer Upgrade para o Plano Premium
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Title & Action */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <UserCheck className="w-6 h-6 text-violet-500" />
                      Gestão de Recursos Humanos (RH)
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Controle completo de colaboradores, arquivos, desligamentos e pendências</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingEmployee(null)
                      setEmployeeForm({
                        name: '', role: '', phone: '', email: '',
                        cpf: '', rg: '', birthDate: '',
                        admissionDate: new Date().toISOString().split('T')[0],
                        salary: '', commission: '', workingHours: ''
                      })
                      setEmployeeModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-md shadow-indigo-500/10 hover:scale-[1.02] transition-all"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar Colaborador
                  </button>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="card-simple p-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Equipe Ativa</span>
                      <Users className="w-4 h-4 text-violet-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {employees.filter(e => e.status === 'ACTIVE' || !e.status).length}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold">Colaboradores trabalhando</span>
                  </div>

                  <div className="card-simple p-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Folha Salarial Base</span>
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(employees.filter(e => e.status === 'ACTIVE' || !e.status).reduce((acc, c) => acc + (c.salary || 0), 0))}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold">Total salários bases ativos</span>
                  </div>

                  <div className={`card-simple p-5 border-2 ${
                    employees.filter(e => e.status === 'DISMISSED' && !e.pendingResolved).length > 0 
                      ? 'border-amber-500/40 bg-amber-500/5' 
                      : 'border-transparent'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Pendências Demissionais</span>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {employees.filter(e => e.status === 'DISMISSED' && !e.pendingResolved).length}
                    </p>
                    <span className="text-[10px] text-amber-400 font-bold">Ex-funcionários pendentes</span>
                  </div>

                  <div className="card-simple p-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Arquivo Morto</span>
                      <Archive className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {employees.filter(e => e.status === 'ARCHIVED').length}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold">Registros arquivados</span>
                  </div>
                </div>

                {/* Sub-Tab Navigation Bar & Search Filters */}
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white/40 dark:bg-[#131826]/30 p-2 rounded-3xl border border-slate-200 dark:border-white/[0.06]">
                  {/* Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setRhSubTab('ACTIVE')}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                        rhSubTab === 'ACTIVE'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Equipe Ativa
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-bold">
                        {employees.filter(e => e.status === 'ACTIVE' || !e.status).length}
                      </span>
                    </button>

                    <button
                      onClick={() => setRhSubTab('DISMISSED')}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 relative ${
                        rhSubTab === 'DISMISSED'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Demitidos & Pendências
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        employees.filter(e => e.status === 'DISMISSED' && !e.pendingResolved).length > 0
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-white/20 text-white'
                      }`}>
                        {employees.filter(e => e.status === 'DISMISSED').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setRhSubTab('ARCHIVED')}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                        rhSubTab === 'ARCHIVED'
                          ? 'bg-slate-700 text-white shadow-md'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Arquivo Morto
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-bold">
                        {employees.filter(e => e.status === 'ARCHIVED').length}
                      </span>
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 md:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={rhSearch}
                        onChange={e => setRhSearch(e.target.value)}
                        placeholder="Buscar por nome, cargo, CPF..."
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Specific Filters for DISMISSED Tab */}
                {rhSubTab === 'DISMISSED' && (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-wrap items-center gap-4 text-xs font-bold">
                    <span className="text-amber-500 flex items-center gap-1.5 uppercase text-[10px] tracking-wider font-black">
                      <Filter className="w-3.5 h-3.5" /> Filtrar Pendências:
                    </span>

                    <div className="flex items-center gap-2">
                      <label className="text-slate-400 text-[10px] uppercase">Status da Pendência:</label>
                      <select
                        value={rhPendingStatusFilter}
                        onChange={e => setRhPendingStatusFilter(e.target.value)}
                        className="bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl font-bold"
                      >
                        <option value="ALL">Todas (Abertas e Resolvidas)</option>
                        <option value="PENDING">⚠️ Apenas Pendentes (Abertas)</option>
                        <option value="RESOLVED">✅ Apenas Resolvidas</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-slate-400 text-[10px] uppercase">Tipo de Pendência:</label>
                      <select
                        value={rhPendingTypeFilter}
                        onChange={e => setRhPendingTypeFilter(e.target.value)}
                        className="bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl font-bold"
                      >
                        <option value="ALL">Todos os Tipos</option>
                        <option value="RESCISAO">Pagamento de Rescisão</option>
                        <option value="EQUIPAMENTO">Devolução de Chaves / Equipamentos</option>
                        <option value="EXAME_DEMISSIONAL">Exame Demissional</option>
                        <option value="DOCUMENTACAO">Assinatura de Documentação / Carteira</option>
                        <option value="OUTROS">Outros</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Employees Cards Container */}
                {loadingEmployees ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Carregando colaboradores...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees
                      .filter(emp => {
                        // Filter by subtab
                        if (rhSubTab === 'ACTIVE') return emp.status === 'ACTIVE' || !emp.status;
                        if (rhSubTab === 'DISMISSED') return emp.status === 'DISMISSED';
                        if (rhSubTab === 'ARCHIVED') return emp.status === 'ARCHIVED';
                        return true;
                      })
                      .filter(emp => {
                        // Filter by search
                        if (!rhSearch.trim()) return true;
                        const query = rhSearch.toLowerCase();
                        return (
                          emp.name.toLowerCase().includes(query) ||
                          emp.role.toLowerCase().includes(query) ||
                          (emp.cpf && emp.cpf.includes(query)) ||
                          (emp.phone && emp.phone.includes(query))
                        );
                      })
                      .filter(emp => {
                        // Filter by pending status (if dismissed subtab)
                        if (rhSubTab !== 'DISMISSED') return true;
                        if (rhPendingStatusFilter === 'PENDING') return !emp.pendingResolved;
                        if (rhPendingStatusFilter === 'RESOLVED') return emp.pendingResolved;
                        return true;
                      })
                      .filter(emp => {
                        // Filter by pending type (if dismissed subtab)
                        if (rhSubTab !== 'DISMISSED') return true;
                        if (rhPendingTypeFilter === 'ALL') return true;
                        return emp.pendingType === rhPendingTypeFilter;
                      })
                      .map(emp => (
                        <div key={emp.id} className={`card-simple p-6 flex flex-col justify-between relative overflow-hidden group border-2 ${
                          rhSubTab === 'DISMISSED' && !emp.pendingResolved
                            ? 'border-amber-500/40 bg-amber-500/5'
                            : rhSubTab === 'ARCHIVED'
                            ? 'opacity-75 bg-slate-900/40 border-slate-800'
                            : 'border-transparent'
                        }`}>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/10 dark:group-hover:bg-violet-500/20 transition-all duration-500" />
                          
                          <div className="relative space-y-4">
                            {/* Card Header: Avatar & Status */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-md ${
                                  rhSubTab === 'DISMISSED'
                                    ? 'bg-gradient-to-br from-amber-500 to-red-500'
                                    : rhSubTab === 'ARCHIVED'
                                    ? 'bg-slate-700'
                                    : 'bg-gradient-to-br from-violet-500 to-indigo-500'
                                }`}>
                                  {emp.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="text-left">
                                  <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">{emp.name}</h3>
                                  <span className="inline-block mt-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                    {emp.role}
                                  </span>
                                </div>
                              </div>

                              {/* Document counter badge */}
                              <button
                                onClick={() => openDocManager(emp)}
                                className="flex items-center gap-1 text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl hover:bg-violet-500 hover:text-white transition-all"
                                title="Ver Arquivos & Documentos"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>{emp.documents?.length || 0}</span>
                              </button>
                            </div>

                            {/* Dismissed Status Box */}
                            {rhSubTab === 'DISMISSED' && (
                              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1 text-left">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Demissão em {emp.dismissalDate || formatDate(emp.createdAt.split('T')[0])}</span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    emp.pendingResolved
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-red-500 text-white animate-pulse'
                                  }`}>
                                    {emp.pendingResolved ? '✅ Pendência Resolvida' : '⚠️ Pendência Aberta'}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Motivo: {emp.dismissalReason}</p>
                                {emp.pendingType && (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                                    <strong>Pendência:</strong> {emp.pendingType} {emp.pendingNotes && `— ${emp.pendingNotes}`}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Archived Status Box */}
                            {rhSubTab === 'ARCHIVED' && (
                              <div className="p-2.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">📁 Registro no Arquivo Morto</span>
                              </div>
                            )}

                            {/* Details List */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.05] text-xs font-semibold text-slate-600 dark:text-slate-350 text-left">
                              {emp.cpf && (
                                <p className="text-[11px]">
                                  <span className="text-slate-400 font-bold">CPF:</span> {emp.cpf}
                                </p>
                              )}
                              {emp.phone && (
                                <p className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{emp.phone}</span>
                                </p>
                              )}
                              {emp.email && (
                                <p className="flex items-center gap-2">
                                  <span className="text-slate-400 font-bold">@</span>
                                  <span className="truncate">{emp.email}</span>
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-dashed border-slate-100 dark:border-white/[0.05]">
                                <div>
                                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">Salário Base</span>
                                  <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(emp.salary)}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">Comissão</span>
                                  <span className="text-xs font-black text-slate-900 dark:text-white">{emp.commission}%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2 mt-6 relative z-10">
                            <button
                              onClick={() => openDocManager(emp)}
                              className="w-full flex items-center justify-center gap-2 bg-violet-500/10 hover:bg-violet-500 hover:text-white text-violet-500 font-black py-2.5 rounded-xl transition-all text-xs border border-violet-500/20"
                            >
                              <Paperclip className="w-3.5 h-3.5" /> Arquivos & Documentos ({emp.documents?.length || 0})
                            </button>

                            <div className="flex gap-2">
                              {rhSubTab === 'ACTIVE' && (
                                <>
                                  <button
                                    onClick={() => openEditEmployee(emp)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 font-black py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all text-xs"
                                  >
                                    <Pencil className="w-3.5 h-3.5" /> Editar
                                  </button>
                                  <button
                                    onClick={() => openDismissModal(emp)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white font-black py-2 rounded-xl transition-all text-xs"
                                    title="Demitir Colaborador"
                                  >
                                    <UserX className="w-3.5 h-3.5" /> Demitir
                                  </button>
                                </>
                              )}

                              {rhSubTab === 'DISMISSED' && (
                                <>
                                  {!emp.pendingResolved ? (
                                    <button
                                      onClick={() => handleResolvePending(emp.id, true)}
                                      className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 text-white font-black py-2 rounded-xl hover:bg-emerald-600 transition-all text-xs shadow-md"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolver Pendência
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleArchiveEmployee(emp.id)}
                                      className="flex-1 flex items-center justify-center gap-1 bg-slate-800 text-slate-200 font-black py-2 rounded-xl hover:bg-slate-700 transition-all text-xs"
                                    >
                                      <Archive className="w-3.5 h-3.5" /> Arquivo Morto
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRestoreEmployee(emp.id)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl transition-all text-xs font-bold"
                                    title="Reativar Colaborador na Equipe"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {rhSubTab === 'ARCHIVED' && (
                                <>
                                  <button
                                    onClick={() => handleRestoreEmployee(emp.id)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-violet-600 text-white font-black py-2 rounded-xl hover:bg-violet-700 transition-all text-xs"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" /> Reativar Equipe
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEmployee(emp.id)}
                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                    title="Excluir Definitivamente"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                    {employees
                      .filter(emp => {
                        if (rhSubTab === 'ACTIVE') return emp.status === 'ACTIVE' || !emp.status;
                        if (rhSubTab === 'DISMISSED') return emp.status === 'DISMISSED';
                        if (rhSubTab === 'ARCHIVED') return emp.status === 'ARCHIVED';
                        return true;
                      })
                      .length === 0 && (
                      <div className="col-span-full py-20 text-center bg-white/40 dark:bg-[#131826]/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <UserCheck className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4 opacity-40 animate-pulse" />
                        <h4 className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-sm">
                          Nenhum colaborador nesta categoria
                        </h4>
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1 max-w-xs mx-auto">
                          {rhSubTab === 'ACTIVE' && 'Cadastre membros da sua equipe ativa.'}
                          {rhSubTab === 'DISMISSED' && 'Nenhum funcionário demitido ou com pendências registradas.'}
                          {rhSubTab === 'ARCHIVED' && 'Nenhum colaborador arquivado no histórico.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: Logs de Auditoria & Registro de Ações */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div className="animate-slide-up space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-violet-500" />
                  Logs & Auditoria de Atividades
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Rastreamento completo de alterações em serviços, cupons, colaboradores e endereço IP das máquinas
                </p>
              </div>
              <button
                onClick={() => fetchAuditLogs()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar Logs
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-white/40 dark:bg-[#131826]/30 border border-slate-200 dark:border-white/[0.06] rounded-2xl">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  placeholder="Filtrar por usuário, ação, dispositivo ou IP..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-400">Severidade:</label>
                  <select
                    value={auditSeverityFilter}
                    onChange={e => setAuditSeverityFilter(e.target.value)}
                    className="bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="ALL">Todas Severidades</option>
                    <option value="CRITICAL">🚨 Crítico</option>
                    <option value="HIGH">⚠️ Alto</option>
                    <option value="MEDIUM">🔮 Médio</option>
                    <option value="INFO">ℹ️ Informativo</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-400">Categoria:</label>
                  <select
                    value={auditEntityFilter}
                    onChange={e => setAuditEntityFilter(e.target.value)}
                    className="bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="ALL">Todas as Categorias</option>
                    <option value="SERVICE">Serviços</option>
                    <option value="COUPON">Cupons</option>
                    <option value="EMPLOYEE">Colaboradores (RH)</option>
                    <option value="DOCUMENT">Documentos</option>
                    <option value="AUTH">Login & Segurança</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Logs List */}
            {loadingAuditLogs ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                <p className="text-xs font-bold text-slate-400">Carregando histórico de auditoria...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-20 text-center bg-white/40 dark:bg-[#131826]/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
                <h4 className="text-slate-500 dark:text-slate-400 font-black uppercase text-sm">Nenhum registro de auditoria encontrado</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                  As ações realizadas na plataforma serão registradas aqui em tempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log: any) => {
                  const severity = log.severity || 'INFO'
                  const isCritical = severity === 'CRITICAL'
                  const isHigh = severity === 'HIGH'
                  const isMedium = severity === 'MEDIUM'

                  return (
                    <div
                      key={log.id}
                      className={`p-4 bg-white/80 dark:bg-[#131826]/60 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left shadow-sm transition-all ${
                        isCritical
                          ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                          : isHigh
                          ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                          : 'border-slate-200 dark:border-white/[0.06] hover:border-violet-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
                          isCritical
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-md shadow-red-500/10'
                            : isHigh
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : isMedium
                            ? 'bg-violet-500/10 text-violet-500 border border-violet-500/20'
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          <ShieldAlert className="w-5 h-5" />
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Severity Tag */}
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              isCritical
                                ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse'
                                : isHigh
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : isMedium
                                ? 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                                : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            }`}>
                              {isCritical ? '🚨 CRÍTICO' : isHigh ? '⚠️ ALTO' : isMedium ? '🔮 MÉDIO' : 'ℹ️ INFO'}
                            </span>

                            {/* Action Tag */}
                            <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                              {log.action}
                            </span>

                            <span className="text-[10px] font-bold text-slate-400 ml-auto sm:ml-0">
                              {log.createdAt && log.createdAt.includes('T')
                                ? `${formatDate(log.createdAt.split('T')[0])} às ${log.createdAt.split('T')[1]?.substring(0, 5)}`
                                : log.createdAt || ''}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                            {log.details || 'Ação registrada no sistema'}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold pt-1">
                            <span className="flex items-center gap-1 text-violet-500 font-bold">
                              <User className="w-3.5 h-3.5" />
                              {log.userName || 'Usuário'} ({log.userRole || 'user'})
                            </span>

                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                              <Laptop className="w-3.5 h-3.5 text-slate-400" />
                              {log.deviceInfo || 'Dispositivo Desconhecido'}
                            </span>

                            <span className={`flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              (log.ipAddress && (log.ipAddress.includes('Localhost') || log.ipAddress === '127.0.0.1'))
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}>
                              🌐 IP: {log.ipAddress || '127.0.0.1'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: Social Network & Direct Messages Chat */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'social' && (
          <div className="animate-slide-up space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Rede de Profissionais</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Descubra novos parceiros, faça networking e troque parcerias no BoraMarka.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Explorer Directory (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3 bg-white dark:bg-[#131826] p-3 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={socialSearch}
                    onChange={e => setSocialSearch(e.target.value)}
                    placeholder="Buscar profissionais por especialidade, cidade, nome..."
                    className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 font-bold"
                  />
                </div>

                {loadingExplore ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white dark:bg-[#131826] rounded-3xl border border-slate-150 dark:border-slate-800">
                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Vasculhando a rede de profissionais...</p>
                  </div>
                ) : exploreList.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-[#131826] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Globe className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Nenhum profissional encontrado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exploreList.map(prof => (
                      <div key={prof.id} className="bg-white dark:bg-[#131826] p-5 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-205 dark:hover:border-slate-700 transition-all group">
                        <div>
                          <div className="flex gap-4 items-start">
                            {prof.photoUrl ? (
                              <img src={prof.photoUrl} alt={prof.businessName} className="w-14 h-14 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-800" />
                            ) : (
                              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-xl shrink-0">
                                {prof.businessName?.[0]?.toUpperCase() || prof.username?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="space-y-1 text-left min-w-0">
                              <h4 className="font-black text-sm text-slate-900 dark:text-white truncate leading-tight group-hover:text-pink-500 transition-colors">
                                {prof.businessName || prof.username}
                              </h4>
                              <p className="text-[10px] text-pink-500 font-black tracking-widest uppercase">@{prof.username.toLowerCase()}</p>
                              {prof.address && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 shrink-0" /> {prof.address}
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4 leading-relaxed line-clamp-3 text-left">
                            {prof.description || 'Nenhuma biografia informada ainda.'}
                          </p>
                        </div>

                        <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                          <a
                            href={`/p/${prof.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 text-center bg-slate-50 dark:bg-[#0f131f] hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 font-black text-[10px] rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Página
                          </a>
                          <button
                            onClick={() => {
                              setActiveChatPartner(prof)
                              setChatMessages([])
                            }}
                            className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-black text-[10px] rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-pink-500/10"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Chat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Active Chat / Inbox (5 cols) */}
              <div className="lg:col-span-5 bg-white dark:bg-[#131826] rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[650px]">
                {activeChatPartner ? (
                  // Chat Box
                  <div className="flex flex-col h-full justify-between">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-150 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-[#1A2235]/20">
                      <div className="flex gap-3 items-center">
                        {activeChatPartner.photoUrl ? (
                          <img src={activeChatPartner.photoUrl} alt={activeChatPartner.businessName} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {activeChatPartner.businessName?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="text-left">
                          <h4 className="font-black text-xs text-slate-900 dark:text-white leading-none">{activeChatPartner.businessName || activeChatPartner.username}</h4>
                          <span className="text-[9px] font-black text-slate-400 tracking-wider">Online no BoraMarka</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveChatPartner(null)
                          setChatMessages([])
                          loadInboxList()
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        title="Fechar Conversa"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar flex flex-col justify-end bg-slate-50/20 dark:bg-[#0f131f]/10">
                      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        {chatMessages.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center p-8 text-center">
                            <p className="text-[10px] text-slate-400 font-semibold italic">Nenhuma mensagem nesta conversa. Diga olá e inicie seu networking!</p>
                          </div>
                        ) : (
                          chatMessages.map((msg: any) => {
                            const isMe = msg.senderId !== activeChatPartner.id
                            const messageTime = new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            return (
                              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-xs leading-relaxed ${
                                  isMe 
                                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-[#1A2235] text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800/80'
                                } text-left`}>
                                  <p className="font-semibold whitespace-pre-line break-words">{msg.content}</p>
                                  <span className={`text-[8px] font-bold block mt-1.5 text-right ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                    {messageTime}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    {/* Send Form */}
                    <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-150 dark:border-slate-800/80 flex gap-2 bg-white dark:bg-[#131826]">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Escreva sua mensagem..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-pink-500 text-xs font-bold bg-slate-50 dark:bg-[#0f131f] text-slate-900 dark:text-white"
                        required
                      />
                      <button type="submit" className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs rounded-xl uppercase tracking-wider transition-all">
                        Enviar
                      </button>
                    </form>
                  </div>
                ) : (
                  // Inbox List
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/20 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Suas Conversas</span>
                      <MessageCircle className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
                      {inboxList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                          <MessageCircle className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
                          <p className="text-xs font-bold">Nenhum chat ativo</p>
                          <p className="text-[10px] mt-1 font-semibold">Clique no botão "Chat" em um profissional ao lado para iniciar conversas!</p>
                        </div>
                      ) : (
                        inboxList.map((item: any) => {
                          const conversationTime = new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                          return (
                            <button
                              key={item.partner.id}
                              onClick={() => setActiveChatPartner(item.partner)}
                              className="w-full p-4 flex gap-3 items-center hover:bg-slate-50 dark:hover:bg-[#1A2235]/30 text-left transition-colors"
                            >
                              {item.partner.photoUrl ? (
                                <img src={item.partner.photoUrl} alt={item.partner.businessName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-655 dark:text-slate-300 shrink-0 uppercase">
                                  {item.partner.businessName?.[0] || item.partner.username?.[0]}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.partner.businessName}</h5>
                                  <span className="text-[9px] text-slate-400 font-bold shrink-0">{conversationTime}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">{item.lastMessage}</p>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-10 pb-6 border-t border-slate-200 dark:border-slate-800 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h4 className="text-lg font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent inline-block mb-3">
            BoraMarka
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            BoraMarka S.A. &copy; 2026. Todos os direitos reservados. Sua agenda na velocidade do seu negócio.
          </p>
        </footer>
      </main>

      {/* New Transaction Modal */}
      {showNewTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#131826] w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Lançar Valor Financeiro</h3>
              <button onClick={() => setShowNewTransaction(false)} className="p-2 text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-850 rounded-2xl">
                <button onClick={() => setNewTx({...newTx, type: 'receivable'})} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${newTx.type === 'receivable' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>Entrada (+)</button>
                <button onClick={() => setNewTx({...newTx, type: 'payable'})} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${newTx.type === 'payable' ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>Saída (-)</button>
              </div>
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">Descrição</label><input type="text" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder="Ex: Corte Cabelo, Pagamento Aluguel..." className="input-simple font-bold" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">Valor (R$)</label><input type="text" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} placeholder="0,00" className="input-simple font-bold" /></div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 flex justify-between">
                    Data
                    <button onClick={() => setNewTx({...newTx, dueDate: new Date().toISOString().split('T')[0]})} className="text-pink-500 hover:underline">Hoje</button>
                  </label>
                  <input type="date" value={newTx.dueDate} onChange={e => setNewTx({...newTx, dueDate: e.target.value})} className="input-simple font-bold text-xs" />
                </div>
              </div>
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">Cliente / Fornecedor</label><input type="text" value={newTx.clientName} onChange={e => setNewTx({...newTx, clientName: e.target.value})} placeholder="Opcional" className="input-simple font-bold" /></div>
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Categoria</label>
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={
                      ['Serviço', 'Venda de Produto', 'Assinatura', 'Fornecedor', 'Aluguel', 'Salário / Comissão', 'Marketing', 'Utilidades', 'Impostos'].includes(newTx.category) 
                        ? newTx.category 
                        : newTx.category === '' ? '' : 'custom'
                    }
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setNewTx({...newTx, category: ''})
                      } else {
                        setNewTx({...newTx, category: val})
                      }
                    }}
                    className="input-simple font-bold text-xs"
                  >
                    <option value="">Selecione uma Categoria...</option>
                    {newTx.type === 'receivable' ? (
                      <>
                        <option value="Serviço">Serviço</option>
                        <option value="Venda de Produto">Venda de Produto</option>
                        <option value="Assinatura">Assinatura / Recorrência</option>
                      </>
                    ) : (
                      <>
                        <option value="Fornecedor">Fornecedor</option>
                        <option value="Aluguel">Aluguel</option>
                        <option value="Salário / Comissão">Salário / Comissão</option>
                        <option value="Marketing">Marketing / Anúncios</option>
                        <option value="Utilidades">Utilidades (Água, Luz...)</option>
                        <option value="Impostos">Impostos / Taxas</option>
                      </>
                    )}
                    <option value="custom">Outra (Personalizada)...</option>
                  </select>

                  {(!['Serviço', 'Venda de Produto', 'Assinatura', 'Fornecedor', 'Aluguel', 'Salário / Comissão', 'Marketing', 'Utilidades', 'Impostos'].includes(newTx.category) || 
                    ['Serviço', 'Venda de Produto', 'Assinatura', 'Fornecedor', 'Aluguel', 'Salário / Comissão', 'Marketing', 'Utilidades', 'Impostos'].includes(newTx.category) && newTx.category === '') && (
                    <input 
                      type="text" 
                      value={newTx.category} 
                      onChange={e => setNewTx({...newTx, category: e.target.value})} 
                      placeholder="Nome da categoria" 
                      className="input-simple font-bold" 
                    />
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-850 cursor-pointer" onClick={() => setNewTx({...newTx, paid: !newTx.paid})}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${newTx.paid ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-200 text-transparent'}`}>
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Já está {newTx.type === 'receivable' ? 'recebido' : 'pago'}</span>
              </div>

              <button onClick={handleCreateTransaction} className={`w-full py-5 rounded-2xl text-white font-black text-lg transition-all shadow-xl ${newTx.type === 'receivable' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-red-600 shadow-red-600/20'}`}>
                Confirmar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Service Modal */}
      {showNewService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#131826] w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}</h3>
              <button onClick={() => setShowNewService(false)} className="p-2 text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Nome do Serviço</label>
                <input 
                  type="text" 
                  value={serviceForm.name} 
                  onChange={e => setServiceForm({...serviceForm, name: e.target.value})} 
                  placeholder="Ex: Corte Masculino, Manicure, etc." 
                  className="input-simple font-bold" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Descrição (Opcional)</label>
                <textarea 
                  value={serviceForm.description} 
                  onChange={e => setServiceForm({...serviceForm, description: e.target.value})} 
                  placeholder="Explique o que inclui o serviço..." 
                  className="input-simple font-medium text-sm min-h-[80px]" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={serviceForm.price} 
                    onChange={e => setServiceForm({...serviceForm, price: e.target.value})} 
                    placeholder="0,00" 
                    className="input-simple font-bold" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Duração (Minutos)</label>
                  <select 
                    value={serviceForm.duration} 
                    onChange={e => setServiceForm({...serviceForm, duration: e.target.value})} 
                    className="input-simple font-bold"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hora</option>
                    <option value="90">1h 30min</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-lg transition-all shadow-xl shadow-pink-500/20 mt-4">
                {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#131826] w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Bora Agendar Novo!</h3>
              <button onClick={() => setShowNewBookingModal(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateManualBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Serviço / Link de Venda</label>
                <select
                  value={newBookingData.linkId}
                  onChange={e => setNewBookingData({...newBookingData, linkId: e.target.value})}
                  className="input-simple font-bold"
                  required
                >
                  <option value="">Selecione...</option>
                  {links.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Data</label>
                  <input
                    type="date"
                    value={newBookingData.date}
                    onChange={e => setNewBookingData({...newBookingData, date: e.target.value})}
                    className="input-simple font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Horário (HH:MM)</label>
                  <input
                    type="time"
                    value={newBookingData.time}
                    onChange={e => setNewBookingData({...newBookingData, time: e.target.value})}
                    className="input-simple font-bold text-xs"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Nome do Cliente</label>
                <input
                  type="text"
                  value={newBookingData.clientName}
                  onChange={e => setNewBookingData({...newBookingData, clientName: e.target.value})}
                  placeholder="Nome completo do cliente"
                  className="input-simple font-bold text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Celular do Cliente</label>
                <input
                  type="text"
                  value={newBookingData.clientPhone}
                  onChange={e => setNewBookingData({...newBookingData, clientPhone: e.target.value})}
                  placeholder="Ex: (11) 99999-9999"
                  className="input-simple font-bold text-sm"
                  required
                />
              </div>

              <button type="submit" className="w-full py-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-lg transition-all shadow-xl shadow-pink-500/20 mt-4">
                Agendar Horário
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEditProfile(false)}></div>
          <div className="bg-white dark:bg-[#1A2235] rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Editar Perfil</h3>
              <button onClick={() => setShowEditProfile(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleEditProfileSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Login / @ Usuário</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={e => setProfileForm({...profileForm, username: e.target.value.toLowerCase()})}
                    placeholder="Seu @ de login"
                    className="input-simple font-bold text-sm pl-12"
                    required
                  />
                </div>
                <p className="text-[10px] text-orange-500 font-bold mt-1.5 px-1 leading-tight">
                  Atenção: mudar o @ altera seu link de agendamento e login de acesso ao painel.
                </p>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">E-mail para Notificações e Recuperação de Senha</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={profileForm.email || ''}
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                    placeholder="seu@email.com"
                    className="input-simple font-bold text-sm pl-12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Nome do Negócio</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={profileForm.businessName}
                    onChange={e => setProfileForm({...profileForm, businessName: e.target.value})}
                    placeholder="Ex: Barber Shop"
                    className="input-simple font-bold text-sm pl-12"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">CNPJ</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={profileForm.cnpj}
                      onChange={e => setProfileForm({...profileForm, cnpj: e.target.value})}
                      placeholder="CNPJ (opcional)"
                      className="input-simple font-bold text-sm pl-12"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                      placeholder="Ex: (11) 99999-9999"
                      className="input-simple font-bold text-sm pl-12"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Token de Acesso do Mercado Pago (para Taxas de Agendamento)</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={profileForm.mpAccessToken || ''}
                    onChange={e => setProfileForm({...profileForm, mpAccessToken: e.target.value})}
                    placeholder="APP_USR-... ou 'SIMULADOR' para testar localmente"
                    className="input-simple font-bold text-sm pl-12 bg-white dark:bg-[#131826]"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-normal">
                  Insira o seu Access Token de Produção ou Sandbox do Mercado Pago. Para testar sem chaves reais, digite <strong>SIMULADOR</strong>.
                </p>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Endereço</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                    placeholder="Seu endereço físico (opcional)"
                    className="input-simple font-bold text-sm pl-12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Descrição / Bio</label>
                <textarea
                  value={profileForm.description}
                  onChange={e => setProfileForm({...profileForm, description: e.target.value})}
                  placeholder="Fale um pouco sobre o seu negócio..."
                  className="input-simple font-bold text-sm resize-none h-24"
                ></textarea>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">
                  <Clock className="w-4 h-4" />
                  Horário de Funcionamento
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(dayLabels).map(([key, label]) => {
                    let hoursObj: any = {}
                    try { hoursObj = JSON.parse(profileForm.operatingHours || '{}') } catch {}
                    const dayData = hoursObj[key] || { open: '', close: '', active: false }
                    
                    return (
                    <div key={key} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all ${
                      dayData.active
                        ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        : 'bg-transparent border-slate-100 dark:border-slate-800 opacity-60'
                    }`}>
                      <label className="flex items-center gap-2 cursor-pointer min-w-[100px]">
                        <input
                          type="checkbox"
                          checked={dayData.active}
                          onChange={e => updateProfileHours(key, 'active', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                        />
                        <span className={`text-sm font-bold ${dayData.active ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                          {label}
                        </span>
                      </label>
                      {dayData.active ? (
                        <div className="flex items-center gap-2 ml-0 sm:ml-auto">
                          <input
                            type="time"
                            value={dayData.open}
                            onChange={e => updateProfileHours(key, 'open', e.target.value)}
                            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-pink-500 bg-white dark:bg-[#131826]"
                          />
                          <span className="text-slate-400 text-[10px] font-bold">até</span>
                          <input
                            type="time"
                            value={dayData.close}
                            onChange={e => updateProfileHours(key, 'close', e.target.value)}
                            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-pink-500 bg-white dark:bg-[#131826]"
                          />
                        </div>
                      ) : (
                        <span className="ml-0 sm:ml-auto text-xs font-bold text-slate-400">Fechado</span>
                      )}
                    </div>
                  )})}
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-lg transition-all shadow-xl shadow-pink-500/20 mt-4">
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Ficha do Cliente */}
      {selectedClientPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-slate-100">
          <div className="bg-white dark:bg-[#131826] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[85vh] text-left border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-6 border-b border-slate-150 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-[#1A2235]/30">
              <div>
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest block">Ficha do Cliente</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{selectedClientName}</h3>
                <span className="text-xs font-bold text-slate-400 font-mono block mt-0.5">{maskPhone(selectedClientPhone)}</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedClientPhone(null)
                  setSelectedClientName('')
                  setClientHistory([])
                  setClientNotes([])
                  setNewNoteContent('')
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {loadingClientDetails ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                  <p className="text-xs font-bold text-slate-400">Carregando histórico do cliente...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Left Column: Notes Form & Notes List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Anotações & Prontuário
                    </h4>
                    
                    <form onSubmit={handleCreateClientNote} className="space-y-2">
                      <textarea
                        value={newNoteContent}
                        onChange={e => setNewNoteContent(e.target.value)}
                        placeholder="Adicione notas de prontuário (ex: Alergias, preferências de corte, fórmulas químicas)..."
                        className="w-full input-simple text-xs font-bold h-20 bg-slate-50 dark:bg-[#0f131f] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"
                        required
                      />
                      <div className="flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-black text-[10px] rounded-xl uppercase tracking-wider transition-all">
                          Salvar Nota
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                      {clientNotes.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-semibold italic text-center py-4 bg-slate-50/50 dark:bg-[#0f131f]/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                          Nenhuma anotação registrada ainda.
                        </p>
                      ) : (
                        clientNotes.map(note => (
                          <div key={note.id} className="p-3 bg-slate-50 dark:bg-[#0f131f]/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex justify-between gap-3 items-start">
                            <div className="space-y-1 text-left">
                              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium whitespace-pre-line leading-relaxed">{note.content}</p>
                              <span className="text-[9px] text-slate-400 font-semibold block">
                                Criado em {new Date(note.createdAt).toLocaleDateString('pt-BR')} às {new Date(note.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteClientNote(note.id)}
                              className="p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors shrink-0"
                              title="Excluir Nota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Appointment History */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Histórico de Agendamentos ({clientHistory.length})
                    </h4>
                    
                    <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                      {clientHistory.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-semibold italic text-center py-4 bg-slate-50/50 dark:bg-[#0f131f]/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                          Nenhum atendimento no histórico.
                        </p>
                      ) : (
                        clientHistory.map(h => {
                          const dateFormatted = h.timeSlot.date.split('-').reverse().join('/')
                          return (
                            <div key={h.id} className="p-3 bg-slate-50/55 dark:bg-[#0f131f]/30 rounded-2xl border border-slate-150 dark:border-slate-800/80 flex items-center justify-between">
                              <div className="text-left">
                                <h5 className="font-bold text-xs text-slate-900 dark:text-white">{h.timeSlot.link.service?.name || 'Serviço'}</h5>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">📅 {dateFormatted} às {h.timeSlot.time}</p>
                              </div>
                              
                              <div className="text-right">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  h.status === 'CONFIRMADO' || h.status === 'PAGO' 
                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                    : h.status === 'PENDENTE' 
                                    ? 'bg-amber-500/10 text-amber-500' 
                                    : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {h.status}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Slot Confirmation Modal */}
      {showDeleteSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#131826] w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Excluir Horário</h3>
              <button onClick={() => setShowDeleteSlotModal(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-semibold text-left">
                Tem certeza que deseja excluir o horário das <span className="text-pink-500 font-bold">{slotToDeleteTime}</span>?
              </p>

              <label className="flex items-center gap-3 p-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/50 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer text-left">
                <input
                  type="checkbox"
                  checked={deleteAllDayFreeSlots}
                  onChange={e => setDeleteAllDayFreeSlots(e.target.checked)}
                  className="w-4 h-4 text-pink-500 rounded border-slate-300 focus:ring-pink-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block uppercase tracking-wider">Limpar o dia todo</span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Excluir TODOS os horários livres desta data</span>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmDeleteSlot}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all shadow-md shadow-red-500/10 text-sm"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setShowDeleteSlotModal(false)}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-xl transition-all text-sm"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee / Colaborador Registration Modal */}
      {employeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-slate-100">
          <div className="bg-white dark:bg-[#131826] w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-violet-500" />
                  {editingEmployee ? 'Editar Ficha do Colaborador' : 'Novo Cadastro de Colaborador'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Preencha os dados contratuais e pessoais</p>
              </div>
              <button 
                onClick={() => {
                  setEmployeeModalOpen(false)
                  setEditingEmployee(null)
                }} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  value={employeeForm.name} 
                  onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} 
                  placeholder="Ex: Carlos Eduardo Silva" 
                  className="input-simple font-bold" 
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Cargo / Especialidade *</label>
                  <input 
                    type="text" 
                    value={employeeForm.role} 
                    onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})} 
                    placeholder="Ex: Barbeiro Senior, Esteticista..." 
                    className="input-simple font-bold" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Jornada / Horário</label>
                  <input 
                    type="text" 
                    value={employeeForm.workingHours} 
                    onChange={e => setEmployeeForm({...employeeForm, workingHours: e.target.value})} 
                    placeholder="Ex: Seg a Sex 09h às 18h" 
                    className="input-simple font-bold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">WhatsApp / Telefone</label>
                  <input 
                    type="text" 
                    value={employeeForm.phone} 
                    onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})} 
                    placeholder="Ex: (11) 99999-9999" 
                    className="input-simple font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">E-mail</label>
                  <input 
                    type="email" 
                    value={employeeForm.email} 
                    onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})} 
                    placeholder="Ex: carlos@email.com" 
                    className="input-simple font-bold text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">CPF</label>
                  <input 
                    type="text" 
                    value={employeeForm.cpf} 
                    onChange={e => setEmployeeForm({...employeeForm, cpf: e.target.value})} 
                    placeholder="000.000.000-00" 
                    className="input-simple font-bold text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">RG</label>
                  <input 
                    type="text" 
                    value={employeeForm.rg} 
                    onChange={e => setEmployeeForm({...employeeForm, rg: e.target.value})} 
                    placeholder="00.000.000-0" 
                    className="input-simple font-bold text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Data de Admissão</label>
                  <input 
                    type="date" 
                    value={employeeForm.admissionDate} 
                    onChange={e => setEmployeeForm({...employeeForm, admissionDate: e.target.value})} 
                    className="input-simple font-bold text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={employeeForm.birthDate} 
                    onChange={e => setEmployeeForm({...employeeForm, birthDate: e.target.value})} 
                    className="input-simple font-bold text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Salário Base (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={employeeForm.salary} 
                    onChange={e => setEmployeeForm({...employeeForm, salary: e.target.value})} 
                    placeholder="0,00" 
                    className="input-simple font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Comissão (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={employeeForm.commission} 
                    onChange={e => setEmployeeForm({...employeeForm, commission: e.target.value})} 
                    placeholder="Ex: 10" 
                    className="input-simple font-bold" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-xl transition-all shadow-md shadow-indigo-500/10 hover:opacity-95 text-sm uppercase tracking-wider"
                >
                  {editingEmployee ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmployeeModalOpen(false)
                    setEditingEmployee(null)
                  }}
                  className="px-5 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-xl transition-all text-sm uppercase tracking-wider"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dismissal / Demissão Modal */}
      {dismissModalOpen && employeeToDismiss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-slate-100">
          <div className="bg-white dark:bg-[#131826] w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-in border border-amber-500/30 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Demissão do Colaborador</h3>
                  <p className="text-xs text-amber-500 font-bold">{employeeToDismiss.name} — {employeeToDismiss.role}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setDismissModalOpen(false)
                  setEmployeeToDismiss(null)
                }} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleConfirmDismissal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Data do Desligamento *</label>
                  <input 
                    type="date" 
                    value={dismissForm.dismissalDate} 
                    onChange={e => setDismissForm({...dismissForm, dismissalDate: e.target.value})} 
                    className="input-simple font-bold text-xs" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Motivo do Desligamento *</label>
                  <select
                    value={dismissForm.dismissalReason}
                    onChange={e => setDismissForm({...dismissForm, dismissalReason: e.target.value})}
                    className="input-simple font-bold text-xs"
                    required
                  >
                    <option value="Sem justa causa">Sem justa causa</option>
                    <option value="Com justa causa">Com justa causa</option>
                    <option value="Pedido de demissão">Pedido de demissão</option>
                    <option value="Término de contrato de experiência">Término de contrato de experiência</option>
                    <option value="Acordo entre as partes">Acordo entre as partes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Observações da Demissão</label>
                <textarea
                  rows={2}
                  value={dismissForm.dismissalNotes}
                  onChange={e => setDismissForm({...dismissForm, dismissalNotes: e.target.value})}
                  placeholder="Ex: Entregou aviso prévio trabalhado..."
                  className="input-simple font-semibold text-xs"
                />
              </div>

              {/* Toggle Pending Issue */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black text-amber-500 uppercase tracking-wider">Registrar Pendência Demissional?</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={dismissForm.hasPending}
                    onChange={e => setDismissForm({...dismissForm, hasPending: e.target.checked})}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                </div>

                {dismissForm.hasPending && (
                  <div className="space-y-3 pt-2 border-t border-amber-500/20">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tipo da Pendência principal</label>
                      <select
                        value={dismissForm.pendingType}
                        onChange={e => setDismissForm({...dismissForm, pendingType: e.target.value})}
                        className="input-simple font-bold text-xs"
                      >
                        <option value="RESCISAO">Pagamento de Rescisão / Verbas</option>
                        <option value="EQUIPAMENTO">Devolução de Chaves / Notebook / Equipamentos</option>
                        <option value="EXAME_DEMISSIONAL">Exame Médico Demissional</option>
                        <option value="DOCUMENTACAO">Assinatura de Documentação / Carteira</option>
                        <option value="OUTROS">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Detalhes da Pendência</label>
                      <input 
                        type="text"
                        value={dismissForm.pendingNotes}
                        onChange={e => setDismissForm({...dismissForm, pendingNotes: e.target.value})}
                        placeholder="Ex: Falta devolução da chave do portão e pagamento da 2ª parcela"
                        className="input-simple font-semibold text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-red-600 text-white font-black rounded-xl transition-all shadow-md hover:opacity-95 text-sm uppercase tracking-wider"
                >
                  Confirmar Demissão & Mover para Pendências
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDismissModalOpen(false)
                    setEmployeeToDismiss(null)
                  }}
                  className="px-5 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-xl transition-all text-sm uppercase tracking-wider"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Manager Modal */}
      {docModalOpen && selectedEmployeeForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-slate-100">
          <div className="bg-white dark:bg-[#131826] w-full max-w-2xl rounded-3xl p-8 shadow-2xl animate-scale-in border border-violet-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/20 text-violet-500 flex items-center justify-center font-black">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Gestão de Documentos</h3>
                  <p className="text-xs text-violet-500 font-bold">{selectedEmployeeForDocs.name} ({selectedEmployeeForDocs.role})</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setDocModalOpen(false)
                  setSelectedEmployeeForDocs(null)
                }} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form for Uploading / Attaching New Document */}
            <form onSubmit={handleAddDocument} className="p-5 bg-violet-500/5 border border-violet-500/20 rounded-2xl space-y-4 mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-violet-500 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Anexar Novo Documento
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Título do Documento *</label>
                  <input 
                    type="text" 
                    value={docForm.title} 
                    onChange={e => setDocForm({...docForm, title: e.target.value})} 
                    placeholder="Ex: ASO Admissional, Contrato de Trabalho..." 
                    className="input-simple font-bold text-xs" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Categoria *</label>
                  <select
                    value={docForm.category}
                    onChange={e => setDocForm({...docForm, category: e.target.value})}
                    className="input-simple font-bold text-xs"
                    required
                  >
                    <option value="CONTRATO">Contrato de Trabalho</option>
                    <option value="ASO">Exame ASO / Atestado</option>
                    <option value="IDENTIFICACAO">Documento Pessoal (RG/CPF/CNH)</option>
                    <option value="HOLERITE">Holerite / Comprovante</option>
                    <option value="GERAL">Outros Documentos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Data de Vencimento / Validade</label>
                  <input 
                    type="date" 
                    value={docForm.expiryDate} 
                    onChange={e => setDocForm({...docForm, expiryDate: e.target.value})} 
                    className="input-simple font-bold text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Arquivo *</label>
                  <input 
                    type="file" 
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 25 * 1024 * 1024) {
                          showToast('O arquivo não pode ser maior que 25MB', 'error')
                          e.target.value = ''
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = (uploadEvent) => {
                          const base64 = uploadEvent.target?.result as string
                          setDocForm({
                            ...docForm,
                            fileUrl: base64,
                            fileName: file.name,
                            fileSize: file.size >= 1024 * 1024
                              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                              : `${(file.size / 1024).toFixed(1)} KB`
                          })
                        }
                        reader.onerror = () => {
                          showToast('Erro ao ler arquivo selecionado', 'error')
                        }
                        reader.readAsDataURL(file)
                      }
                    }} 
                    className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-violet-600 file:text-white hover:file:bg-violet-700 cursor-pointer" 
                    required={!docForm.fileUrl}
                  />
                  {docForm.fileName && (
                    <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                      ✅ {docForm.fileName} ({docForm.fileSize})
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-wider hover:opacity-95 shadow-md"
              >
                Anexar Documento ao Colaborador
              </button>
            </form>

            {/* Document List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Documentos Arquivados ({docList.length})</span>
              </h4>

              {loadingDocs ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 text-violet-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">Carregando arquivos...</p>
                </div>
              ) : docList.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-slate-400 font-bold">Nenhum documento anexado ainda.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {docList.map(doc => {
                    const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()
                    return (
                      <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-black text-slate-900 dark:text-white">{doc.title}</h5>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-violet-500/10 text-violet-500">
                                {doc.category}
                              </span>
                              {isExpired && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-500 text-white animate-pulse">
                                  ⚠️ Vencido ({formatDate(doc.expiryDate)})
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {doc.fileName || 'Arquivo'} {doc.fileSize && `(${doc.fileSize})`} — Enviado em {formatDate(doc.createdAt.split('T')[0])}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={doc.fileName || doc.title}
                            className="p-2 bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white rounded-xl transition-all"
                            title="Baixar / Visualizar"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                            title="Excluir Documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
