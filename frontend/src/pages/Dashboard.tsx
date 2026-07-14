import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import {
  Calendar, Plus, Trash2, Copy, RefreshCw, Link2,
  Clock, Users, LogOut, X, Check, ExternalLink,
  AlertCircle, Loader2, ChevronDown, DollarSign,
  TrendingUp, TrendingDown, Wallet, CreditCard, Gift, Tag,
  Briefcase, ArrowUpRight, ArrowDownRight, Search,
  Filter, Download, MoreVertical, LayoutDashboard, Phone, User, Moon, Sun,
  ChevronLeft, ChevronRight, Camera, Pencil, Store, MapPin, Palette, CheckCircle2, Sparkles, Globe, MessageCircle, ShieldAlert
} from 'lucide-react'

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
      type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
    } text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm border-2 border-white/20`}>
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
function PaywallModal({ isOpen, onClose, onCheckout }: { isOpen: boolean; onClose: () => void; onCheckout: (plan: 'mensal' | 'anual') => void }) {
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
    <div className="card-simple p-6 flex flex-col justify-between hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-6">
        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">{title}</p>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <Icon className="w-5 h-5" style={{ color: color }} />
        </div>
      </div>
      <div>
        <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">{value}</p>
        {trend && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${trend.up ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.val}
          </span>
        )}
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
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'horarios' | 'agendamentos' | 'financeiro' | 'servicos' | 'trash' | 'personalizar' | 'faturamento' | 'clientes' | 'cupons' | 'memberships' | 'social'>('overview')
  const [showPaywall, setShowPaywall] = useState(false)
  const [financeFilter, setFinanceFilter] = useState<'all' | 'receivable' | 'payable'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  // Data
  const [stats, setStats] = useState<Stats>({ totalLinks: 0, totalSlots: 0, totalBookings: 0, availableSlots: 0 })
  const [financeStats, setFinanceStats] = useState<FinanceStats>({
    totalReceivable: 0, totalPayable: 0, receivedAmount: 0, paidAmount: 0,
    pendingReceivable: 0, pendingPayable: 0, balance: 0
  })
  const [links, setLinks] = useState<LinkData[]>([])
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
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
    paid: false
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

  const handleCheckout = async (plan: 'mensal' | 'anual') => {
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
      setNewTx({ type: 'receivable', description: '', amount: '', dueDate: new Date().toISOString().split('T')[0], clientName: '', paid: false })
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300 relative">
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Navbar Premium */}
      <header className="bg-white dark:bg-[#131826] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20 shrink-0">
                <Check className="w-7 h-7" strokeWidth={3} />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-black text-xl text-slate-900 dark:text-white leading-tight">BoraMarka</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Painel de Controle</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">Sua Agenda Online</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
             {sessionStorage.getItem('superadmin_token') && (
               <button 
                 onClick={handleRestoreSuperAdmin}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-[10px] rounded-full uppercase tracking-wider transition-all hover:opacity-90 shadow-md shadow-emerald-500/25 cursor-pointer shrink-0"
                 title="Voltar ao Painel SuperAdmin"
               >
                 <ShieldAlert className="w-3.5 h-3.5" /> Voltar SuperAdmin
               </button>
             )}
             <button 
               onClick={() => setIsDark(!isDark)}
               className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
               title="Alternar Modo Escuro"
             >
               {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>

             <button 
               onClick={() => fetchData(true)} 
               disabled={refreshing}
               className={`p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all ${refreshing ? 'animate-spin' : ''}`}
               title="Atualizar dados"
             >
               <RefreshCw className="w-5 h-5" />
             </button>
             
             {adminInfo && (
               <div className="flex items-center gap-4 pl-5 border-l border-slate-200 dark:border-slate-800">
                 <div className="text-right hidden sm:block">
                   <div className="flex items-center justify-end gap-2">
                     <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{adminInfo.businessName || adminInfo.username}</p>
                     <button onClick={() => subscription?.status === 'inactive' ? setShowPaywall(true) : openEditProfile()} className="text-slate-400 hover:text-orange-500 transition-colors" title="Editar Perfil">
                       <Pencil className="w-3.5 h-3.5" />
                     </button>
                   </div>
                   <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">@{adminInfo.username.toLowerCase()}</p>
                 </div>
                 <button 
                   onClick={() => subscription?.status === 'inactive' ? setShowPaywall(true) : avatarInputRef.current?.click()}
                   className="w-10 h-10 rounded-full relative group cursor-pointer shrink-0"
                   title="Clique para trocar a foto"
                 >
                   {adminInfo.photoUrl ? (
                     <img src={adminInfo.photoUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                   ) : (
                     <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-slate-300">
                       {adminInfo.username[0].toUpperCase()}
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera className="w-4 h-4 text-white" />
                   </div>
                   <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 border-2 border-white dark:border-[#131826] rounded-full"></div>
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
                   className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all ml-1"
                   title="Sair do sistema"
                 >
                   <LogOut className="w-5 h-5" />
                 </button>
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        
        {/* Navigation Tabs - Pill Style */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          {[
            { id: 'overview' as const, label: 'Resumo', icon: LayoutDashboard },
            { id: 'agendamentos' as const, label: 'Agendamentos', icon: Calendar, badge: bookings.length },
            { id: 'clientes' as const, label: 'Clientes', icon: Users },
            { id: 'horarios' as const, label: 'Gerenciar Agenda', icon: Clock },
            { id: 'servicos' as const, label: 'Serviços', icon: Briefcase },
            { id: 'links' as const, label: 'Links de Venda', icon: Link2 },
            { id: 'personalizar' as const, label: 'Personalizar', icon: Palette },
            { id: 'financeiro' as const, label: 'Financeiro', icon: DollarSign },
            { id: 'faturamento' as const, label: 'Assinatura', icon: CreditCard },
            { id: 'cupons' as const, label: 'Cupons', icon: Tag },
            { id: 'memberships' as const, label: 'Clube de Assinaturas', icon: Gift },
            { id: 'social' as const, label: 'Explorar Rede', icon: Globe },
            { id: 'trash' as const, label: 'Lixeira', icon: Trash2 },
          ].map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (subscription?.status === 'inactive' && tab.id !== 'faturamento') {
                    setShowPaywall(true)
                  } else {
                    setActiveTab(tab.id)
                  }
                }}
                className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white'
                }`}
                title={tab.label}
              >
                <tab.icon className="w-[16px] h-[16px] flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-white/30 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: Overview */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="animate-slide-up space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total de Clientes" value={stats.totalBookings} icon={Users} color="#2563eb" />
              <StatCard title="Saldo Financeiro" value={formatCurrency(financeStats.balance)} icon={Wallet} color="#059669" />
              <StatCard title="A Receber" value={formatCurrency(financeStats.pendingReceivable)} icon={TrendingUp} color="#0891b2" />
              <StatCard title="A Pagar" value={formatCurrency(financeStats.pendingPayable)} icon={TrendingDown} color="#dc2626" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Bookings */}
              <div className="card-simple p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Últimos Agendamentos</h3>
                  <button onClick={() => setActiveTab('agendamentos')} className="text-pink-500 text-xs font-bold hover:underline uppercase tracking-wider">Ver todos</button>
                </div>
                <div className="space-y-4">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-100 dark:border-slate-800 transition-all hover:border-pink-500/30">
                      <div className="w-10 h-10 bg-white dark:bg-[#131826] rounded-lg flex items-center justify-center font-black text-pink-500 border border-slate-200 dark:border-slate-700">
                        {b.clientName[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm dark:text-white">{b.clientName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">{formatDate(b.timeSlot.date)} — {b.timeSlot.time}</p>
                      </div>
                      <a href={`https://wa.me/${b.clientPhone}`} target="_blank" className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all">
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                  {bookings.length === 0 && <p className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm italic">Nenhum agendamento recente</p>}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="card-simple p-6 overflow-hidden relative">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-lg">Resumo Financeiro</h3>
                   <button onClick={() => setActiveTab('financeiro')} className="text-pink-500 text-xs font-bold hover:underline uppercase tracking-wider">Gestão completa</button>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Recebido</p>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(financeStats.receivedAmount)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                       <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-5 rounded-2xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20">
                    <div>
                      <p className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase tracking-widest">Pago</p>
                      <p className="text-2xl font-black text-red-700 dark:text-red-400">{formatCurrency(financeStats.paidAmount)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                       <ArrowDownRight className="w-6 h-6 text-red-600 dark:text-red-400" />
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
                <h2 className="text-2xl font-black text-slate-900">Financeiro</h2>
                <p className="text-sm text-slate-500">Contas a pagar e a receber</p>
              </div>
              <button
                onClick={() => setShowNewTransaction(true)}
                className="w-full sm:w-auto btn-primary-simple flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Lançar Valor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="card-simple p-6 bg-emerald-600 dark:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-600/20">
                 <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Saldo Atual</p>
                 <p className="text-3xl font-black">{formatCurrency(financeStats.balance)}</p>
                 <Wallet className="w-12 h-12 absolute -right-2 -bottom-2 opacity-10" />
               </div>
               <div className="card-simple p-6 bg-slate-900 dark:bg-slate-800 text-white border-none shadow-lg shadow-slate-900/20">
                 <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Pendentes de Entrada</p>
                 <p className="text-3xl font-black">{formatCurrency(financeStats.pendingReceivable)}</p>
               </div>
               <div className="card-simple p-6 bg-white dark:bg-[#131826] border-slate-200 dark:border-slate-800">
                 <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Contas Pendentes</p>
                 <p className="text-3xl font-black text-red-600 dark:text-red-500">{formatCurrency(financeStats.pendingPayable)}</p>
               </div>
            </div>

            <div className="card-simple overflow-hidden">
               <div className="p-4 bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Últimos Lançamentos</span>
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
                     <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Descrição</th>
                       <th className="px-6 py-4">Cliente/Fornecedor</th>
                       <th className="px-6 py-4">Data</th>
                       <th className="px-6 py-4 text-right">Valor</th>
                       <th className="px-6 py-4"></th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {transactions
                       .filter(tx => financeFilter === 'all' || tx.type === financeFilter)
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
                           <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                             tx.type === 'receivable' ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-500' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                           }`}>
                             {tx.type === 'receivable' ? 'Entrada' : 'Saída'}
                           </span>
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
                 {transactions.length === 0 && (
                   <div className="text-center py-20 italic text-slate-400">Nenhuma transação lançada</div>
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
                   .map(booking => {
                     // Initials logic
                     const parts = booking.clientName.trim().split(/\s+/)
                     const initials = parts.length >= 2 
                       ? (parts[0][0] + parts[1][0]).toUpperCase() 
                       : (parts[0] ? parts[0][0].toUpperCase() : '')

                     return (
                       <div key={booking.id} className="card-simple p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-pink-200 dark:hover:border-pink-500/50 transition-all">
                         <div className="flex gap-4 items-center flex-1">
                           <div className="w-12 h-12 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-500/10 dark:to-pink-500/20 rounded-2xl flex items-center justify-center text-pink-500 text-base font-black border border-pink-200/50 dark:border-pink-500/30">
                             {initials}
                           </div>
                           <div>
                             <div className="flex items-center gap-2.5">
                               <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-none">{booking.clientName}</h4>
                               {booking.status === 'PENDENTE' ? (
                                 <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                   Pendente
                                 </span>
                               ) : (
                                 <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                   Confirmado
                                 </span>
                               )}
                             </div>
                             <p className="text-xs font-bold text-pink-500 mt-1.5">
                               {booking.timeSlot.link?.service?.name || booking.timeSlot.link?.title}
                             </p>
                             <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                               <span className="flex items-center gap-1 font-bold">
                                 <Clock className="w-3.5 h-3.5" />
                                 {formatDate(booking.timeSlot.date)} às {booking.timeSlot.time}
                               </span>
                               {booking.timeSlot.link?.service && (
                                 <span className="flex items-center gap-1 font-bold">
                                   • {formatCurrency(booking.timeSlot.link.service.price)}
                                 </span>
                               )}
                               <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                                 📞 {booking.clientPhone}
                               </span>
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                           {booking.status === 'PENDENTE' && (
                             <button
                               onClick={() => handleConfirmBooking(booking.id)}
                               className="p-2.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                               title="Confirmar Agendamento"
                             >
                               <Check className="w-5 h-5" />
                             </button>
                           )}
                           <a
                             href={`https://wa.me/${booking.clientPhone}`}
                             target="_blank"
                             rel="noreferrer"
                             className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                             title="Chamar no WhatsApp"
                           >
                             <Phone className="w-5 h-5" />
                           </a>
                           <button
                             onClick={() => handleCancelBooking(booking.id)}
                             className="p-2.5 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-xl transition-all"
                             title="Cancelar Agendamento"
                           >
                             <Trash2 className="w-5 h-5" />
                           </button>
                         </div>
                       </div>
                     )
                   })}
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
                               <div key={slot.id} className={`p-4 text-center rounded-2xl border transition-all flex flex-col justify-center min-h-[80px] ${slot.isAvailable ? 'bg-transparent border-slate-200 dark:border-slate-700 hover:border-pink-500/50' : 'bg-gradient-to-r from-orange-500 to-pink-500 border-transparent text-white shadow-md shadow-orange-500/20'}`}>
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
                    <p className="text-slate-400 font-bold uppercase tracking-widest">Seu catálogo está vazio</p>
                    <p className="text-xs text-slate-300 mt-1">Clique em "Novo Serviço" para começar</p>
                  </div>
                )}
              </div>
           </div>
        )}

        {activeTab === 'links' && (
           <div className="animate-slide-up space-y-6">
              {/* Profile Link Section */}
              <div className="card-simple p-6 bg-gradient-to-br from-orange-500 to-pink-500 text-white border-none shadow-xl shadow-pink-500/20">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-black mb-1">Seu Link Mestre</h3>
                    <p className="text-pink-100 text-sm font-medium">Envie este link para seus clientes verem TODOS os seus serviços de uma vez.</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => { 
                        const url = `${window.location.origin}/p/${adminInfo?.username}`; 
                        navigator.clipboard.writeText(url); 
                        showToast('Link do perfil copiado!') 
                      }} 
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-pink-500 font-black py-3 px-6 rounded-xl hover:bg-pink-50 transition-all shadow-lg"
                    >
                      <Copy className="w-4 h-4" /> Copiar Perfil
                    </button>
                    <button 
                      onClick={() => openEditProfile()} 
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-pink-600/40 text-white font-black py-3 px-6 rounded-xl hover:bg-pink-600/60 transition-all border border-white/20 shadow-lg"
                    >
                      <Palette className="w-4 h-4" /> Personalizar Página
                    </button>
                    <a 
                      href={`/p/${adminInfo?.username}`} 
                      target="_blank" 
                      className="p-3 bg-pink-500/30 text-white rounded-xl hover:bg-pink-500/50 transition-all border border-white/20"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              {editingLink ? (
                <div className="card-simple p-8 border-pink-200 dark:border-pink-500/30 shadow-xl mb-6 animate-scale-in">
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
                    <div className="bg-slate-50 dark:bg-slate-805/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
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
                <button onClick={() => setShowNewLink(true)} className="w-full btn-primary-simple py-5 flex items-center justify-center gap-3 text-xl font-black shadow-xl shadow-pink-500/20 border-2 border-white/20 mb-6">
                  <Plus className="w-8 h-8" /> CRIAR NOVO LINK DE VENDA
                </button>
              ) : (
                <div className="card-simple p-8 border-pink-200 dark:border-pink-500/30 shadow-xl mb-6 animate-scale-in">
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
                    <div className="bg-slate-50 dark:bg-slate-805/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
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
                  <div key={link.id} className="card-simple p-6 hover:shadow-xl transition-all border-l-4 border-pink-500 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{link.title}</h3>
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
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center"><p className="text-2xl font-black text-slate-700 dark:text-slate-200">{link.totalSlots}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</p></div>
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-xl text-center"><p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{link.availableSlots}</p><p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500 uppercase tracking-widest">Livres</p></div>
                        <div className="bg-pink-50 dark:bg-pink-500/10 p-2 rounded-xl text-center"><p className="text-2xl font-black text-pink-500">{link.bookedSlots}</p><p className="text-[9px] font-bold text-pink-400 uppercase tracking-widest">Agend.</p></div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => { const url = `${window.location.origin}/agendar/${link.token}`; navigator.clipboard.writeText(url); showToast('Link copiado!') }} className="flex-1 text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center gap-1.5"><Copy className="w-3.5 h-3.5" /> COPIAR</button>
                      <button onClick={() => startEditingLink(link)} className="flex-1 text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> EDITAR</button>
                      <button onClick={() => handleDeleteLink(link.id)} className="flex-1 text-center py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> EXCLUIR</button>
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
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-[#1A2235]/20">
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
              <div className="card-simple p-8 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-[#131826] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Status da Conta</span>
                    <div className="flex items-center gap-2">
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
                    <span className="text-lg font-black text-slate-900 dark:text-white block mt-1">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Monthly Card */}
                    <div className={`border p-6 rounded-3xl space-y-6 flex flex-col justify-between transition-all text-left ${
                      subscription?.plan === 'mensal' && subscription?.status === 'active'
                        ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Plano Mensal</h4>
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
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Plano Anual</h4>
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
                  <h2 className="text-2xl font-black text-slate-900">Lixeira</h2>
                  <p className="text-sm text-slate-500">Links de venda excluídos recentemente</p>
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
                    <Trash2 className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest">A lixeira está vazia</p>
                  </div>
                )}
              </div>
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
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Nenhum profissional encontrado</p>
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

    </div>
  )
}
