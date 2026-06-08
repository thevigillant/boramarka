import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import {
  Calendar, Plus, Trash2, Copy, RefreshCw, Link2,
  Clock, Users, LogOut, X, Check, ExternalLink,
  AlertCircle, Loader2, ChevronDown, DollarSign,
  TrendingUp, TrendingDown, Wallet, CreditCard,
  Briefcase, ArrowUpRight, ArrowDownRight, Search,
  Filter, Download, MoreVertical, LayoutDashboard, Phone, User, Moon, Sun,
  ChevronLeft, ChevronRight, Camera, Pencil, Store, MapPin
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
  service?: { name: string; price: number }
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

// ════════════════════════════════════════════
// Main Dashboard
// ════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'horarios' | 'agendamentos' | 'financeiro' | 'servicos' | 'trash'>('overview')
  const [financeFilter, setFinanceFilter] = useState<'all' | 'receivable' | 'payable'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
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
  const [adminInfo, setAdminInfo] = useState<{ username: string; businessName: string; photoUrl?: string; cnpj?: string; phone?: string; description?: string; address?: string; operatingHours?: string } | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const img = new window.Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const MAX = 400
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX } }
        else { if (h > MAX) { w *= MAX / h; h = MAX } }

        canvas.width = w
        canvas.height = h
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

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

  // Modals / Forms
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    username: '',
    businessName: '',
    phone: '',
    address: '',
    description: '',
    cnpj: '',
    operatingHours: ''
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
        operatingHours: hoursStr
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
  const [subscription, setSubscription] = useState<{ plan: string; status: string; expiresAt: string | null } | null>(null)
  
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const [s, f, l, b, t, p, sv, dl, subStatus] = await Promise.all([
        api.getStats(),
        api.getFinanceStats(),
        api.getLinks(),
        api.getBookings(),
        api.getTransactions(),
        api.getProfile(),
        api.getServices(),
        api.getDeletedLinks(),
        api.getSubscriptionStatus().catch(() => null) // Não quebrar se falhar
      ])
      setStats(s)
      setFinanceStats(f)
      setLinks(l)
      setBookings(b)
      setTransactions(t)
      setAdminInfo(p)
      setServices(sv)
      setDeletedLinks(dl)
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
    if (activeTab === 'horarios' && selectedLinkId) {
      api.getSlots(selectedLinkId).then(setSlots)
    }
  }, [activeTab, selectedLinkId])

  // ═══ Handlers ═══
  const handleLogout = () => {
    localStorage.removeItem('token')
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
      await api.createLink(newLinkTitle.trim(), newLinkServiceId || undefined)
      setNewLinkTitle('')
      setNewLinkServiceId(null)
      setShowNewLink(false)
      fetchData()
      showToast('Link criado!')
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300 relative">
      {/* Subscription Overlay */}
      {subscription && subscription.status !== 'active' && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center" style={{ position: 'fixed' }}>
          <div className="bg-[#131826] border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Assinatura Inativa</h2>
            <p className="text-slate-400 mb-8 font-medium">
              Sua agenda online está pausada. Ative sua assinatura para continuar recebendo clientes e gerenciar seus horários.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={() => handleCheckout('mensal')}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Assinar Mensal (R$ 30)
              </button>
              <button 
                onClick={() => handleCheckout('anual')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Assinar Anual (R$ 260)
              </button>
            </div>
          </div>
        </div>
      )}

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
                     <button onClick={openEditProfile} className="text-slate-400 hover:text-orange-500 transition-colors" title="Editar Perfil">
                       <Pencil className="w-3.5 h-3.5" />
                     </button>
                   </div>
                   <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">@{adminInfo.username.toLowerCase()}</p>
                 </div>
                 <button 
                   onClick={() => avatarInputRef.current?.click()}
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

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Navigation Tabs - Pill Style */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          {[
            { id: 'overview' as const, label: 'Resumo', icon: LayoutDashboard },
            { id: 'agendamentos' as const, label: 'Agendamentos', icon: Calendar, badge: bookings.length },
            { id: 'horarios' as const, label: 'Gerenciar Agenda', icon: Clock },
            { id: 'servicos' as const, label: 'Serviços', icon: Briefcase },
            { id: 'links' as const, label: 'Links de Venda', icon: Link2 },
            { id: 'financeiro' as const, label: 'Financeiro', icon: DollarSign },
            { id: 'trash' as const, label: 'Lixeira', icon: Trash2 },
          ].map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-[16px] h-[16px]" />
                <span>{tab.label}</span>
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
                  onClick={() => { setEditingService(null); setServiceForm({ name: '', description: '', price: '', duration: '30' }); setShowNewService(true) }} 
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
                          setEditingService(service)
                          setServiceForm({
                            name: service.name,
                            description: service.description || '',
                            price: service.price.toString(),
                            duration: service.duration.toString()
                          })
                          setShowNewService(true)
                        }}
                        className="flex-1 text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all"
                      >
                        EDITAR
                      </button>
                      <button 
                        onClick={() => handleDeleteService(service.id)}
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

              {!showNewLink ? (
                <button onClick={() => setShowNewLink(true)} className="w-full btn-primary-simple py-5 flex items-center justify-center gap-3 text-xl font-black shadow-xl shadow-pink-500/20 border-2 border-white/20">
                  <Plus className="w-8 h-8" /> CRIAR NOVO LINK DE VENDA
                </button>
              ) : (
                <div className="card-simple p-8 border-pink-200 dark:border-pink-500/30 shadow-xl animate-scale-in">
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
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center"><p className="text-2xl font-black text-slate-700 dark:text-slate-200">{link.totalSlots}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</p></div>
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-xl text-center"><p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{link.availableSlots}</p><p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500 uppercase tracking-widest">Livres</p></div>
                        <div className="bg-pink-50 dark:bg-pink-500/10 p-2 rounded-xl text-center"><p className="text-2xl font-black text-pink-500">{link.bookedSlots}</p><p className="text-[9px] font-bold text-pink-400 uppercase tracking-widest">Agend.</p></div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => { const url = `${window.location.origin}/agendar/${link.token}`; navigator.clipboard.writeText(url); showToast('Link copiado!') }} className="flex-1 text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center gap-1.5"><Copy className="w-3.5 h-3.5" /> COPIAR URL</button>
                      <button onClick={() => handleDeleteLink(link.id)} className="flex-1 text-center py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> EXCLUIR</button>
                    </div>
                  </div>
                ))}
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
          <div className="bg-white dark:bg-[#1A2235] rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Editar Perfil</h3>
              <button onClick={() => setShowEditProfile(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleEditProfileSubmit} className="space-y-4">
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
    </div>
  )
}
