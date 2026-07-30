import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import {
  Users, Calendar, CreditCard, DollarSign, LogOut,
  Moon, Sun, Search, Filter, Trash2, Edit, X, Check,
  AlertCircle, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck,
  LifeBuoy, MessageSquare, Send, Plus, Crown, Shield, Zap, UserPlus, Sparkles,
  Phone, Mail, ExternalLink, Clock, Settings, Lock
} from 'lucide-react'

interface UserSubscription {
  plan: string
  status: string
  expiresAt: string | null
  trialEndsAt: string | null
}

interface UserData {
  id: number
  username: string
  businessName: string
  cnpj: string
  phone: string
  createdAt: string
  bookingsCount: number
  subscription: UserSubscription | null
  _count: {
    links: number
    services: number
  }
}

interface SuperAdminUser {
  id: number
  username: string
  businessName: string
  phone: string
  email: string
  role: string
  createdAt: string
  parsedPermissions?: {
    canManageUsers: boolean
    canManageSubscriptions: boolean
    canManageSuperAdmins: boolean
    canAccessSupport: boolean
    canViewFinancials: boolean
  }
}

interface Stats {
  totalUsers: number
  totalBookings: number
  activeSubscriptions: number
  trialingSubscriptions: number
  estimatedMonthlyRevenue: number
}

interface AdminPermissions {
  canManageUsers: boolean
  canManageSubscriptions: boolean
  canManageSuperAdmins: boolean
  canAccessSupport: boolean
  canViewFinancials: boolean
}

// ════════════════════════════════════════════
// Custom Toast Component
// ════════════════════════════════════════════
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-6 right-6 z-50 animate-slide-up ${
      type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
    } text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm border-2 border-white/20`}>
      {type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="flex-1 font-bold">{message}</span>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [superadmins, setSuperadmins] = useState<SuperAdminUser[]>([])
  
  // Logged-in SuperAdmin permissions
  const [myPermissions, setMyPermissions] = useState<AdminPermissions>({
    canManageUsers: true,
    canManageSubscriptions: true,
    canManageSuperAdmins: true,
    canAccessSupport: true,
    canViewFinancials: true,
  })

  // Navigation Tabs: 'users' | 'superadmins' | 'support'
  const [activeTab, setActiveTab] = useState<'users' | 'superadmins' | 'support'>('users')

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState<any[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [ticketDetails, setTicketDetails] = useState<any | null>(null)
  const [supportReply, setSupportReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all')

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, trialing, inactive, pending
  
  // Modals state
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [subPlan, setSubPlan] = useState('mensal')
  const [subStatus, setSubStatus] = useState('active')
  const [subExpiresAt, setSubExpiresAt] = useState('')
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // New SuperAdmin Modal State
  const [showNewSuperAdminModal, setShowNewSuperAdminModal] = useState(false)
  const [saUsername, setSaUsername] = useState('')
  const [saPassword, setSaPassword] = useState('')
  const [saBusinessName, setSaBusinessName] = useState('')
  const [saPhone, setSaPhone] = useState('')
  const [saEmail, setSaEmail] = useState('')
  const [saPerms, setSaPerms] = useState<AdminPermissions>({
    canManageUsers: true,
    canManageSubscriptions: true,
    canManageSuperAdmins: false,
    canAccessSupport: true,
    canViewFinancials: false,
  })

  // Edit SuperAdmin Permissions Modal
  const [editingSuperAdmin, setEditingSuperAdmin] = useState<SuperAdminUser | null>(null)
  const [editSaPerms, setEditSaPerms] = useState<AdminPermissions>({
    canManageUsers: true,
    canManageSubscriptions: true,
    canManageSuperAdmins: false,
    canAccessSupport: true,
    canViewFinancials: false,
  })

  // New Professional User Modal State
  const [showNewProModal, setShowNewProModal] = useState(false)
  const [proBusinessName, setProBusinessName] = useState('')
  const [proUsername, setProUsername] = useState('')
  const [proPassword, setProPassword] = useState('')
  const [proPhone, setProPhone] = useState('')
  const [proEmail, setProEmail] = useState('')
  const [proPlan, setProPlan] = useState('mensal')
  const [proIsFullAccess, setProIsFullAccess] = useState(false)

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsData, usersData, ticketsData, superadminsData, meData] = await Promise.all([
        api.getSuperAdminStats(),
        api.getSuperAdminUsers(),
        api.getSupportTickets().catch(() => []),
        api.getSuperAdminAdmins().catch(() => []),
        api.getSuperAdminMe().catch(() => null),
      ])
      setStats(statsData)
      setUsers(usersData)
      setSupportTickets(ticketsData)
      setSuperadmins(superadminsData)
      if (meData?.permissions) {
        setMyPermissions(meData.permissions)
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar dados do painel', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketsOnly = async () => {
    try {
      const ticketsData = await api.getSupportTickets()
      setSupportTickets(ticketsData)
    } catch (err: any) {
      console.error('Erro ao recarregar chamados:', err)
    }
  }

  const fetchSuperAdminsOnly = async () => {
    try {
      const data = await api.getSuperAdminAdmins()
      setSuperadmins(data)
    } catch (err: any) {
      console.error('Erro ao buscar superadmins:', err)
    }
  }

  const fetchUsersOnly = async () => {
    try {
      const usersData = await api.getSuperAdminUsers()
      setUsers(usersData)
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err)
    }
  }

  const fetchTicketDetails = async (id: number) => {
    try {
      const details = await api.getTicketDetails(id)
      setTicketDetails(details)
    } catch (err: any) {
      showToast('Erro ao carregar detalhes do chamado', 'error')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId)
      const interval = setInterval(() => fetchTicketDetails(selectedTicketId), 6000)
      return () => clearInterval(interval)
    }
  }, [selectedTicketId])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    navigate('/login')
  }

  const handleImpersonateUser = async (userId: number) => {
    try {
      const superadminToken = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (superadminToken) {
        localStorage.setItem('superadminToken', superadminToken)
      }
      const res = await api.impersonateUser(userId)
      localStorage.setItem('token', res.token)
      localStorage.setItem('role', 'admin')
      localStorage.setItem('username', res.username)
      showToast(`Acessando painel de ${res.username}...`, 'success')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
    } catch (err: any) {
      showToast(err.message || 'Erro ao acessar conta', 'error')
    }
  }

  const handleImpersonateSelf = async () => {
    try {
      const superadminToken = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (superadminToken) {
        localStorage.setItem('superadminToken', superadminToken)
      }
      const res = await api.impersonateSelf()
      localStorage.setItem('token', res.token)
      localStorage.setItem('role', 'admin')
      localStorage.setItem('username', res.username)
      showToast(`Usando BoraMarka como Profissional...`, 'success')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
    } catch (err: any) {
      showToast(err.message || 'Erro ao acessar painel profissional', 'error')
    }
  }

  const handleGrant30DaysTrial = async (user: UserData) => {
    if (!myPermissions.canManageSubscriptions) {
      showToast('Você não possui permissão para alterar assinaturas.', 'error')
      return
    }
    try {
      await api.grantTrialToUser(user.id)
      await fetchUsersOnly()
      showToast(`+30 Dias de Teste concedidos com sucesso para "${user.businessName}"!`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Erro ao conceder teste grátis', 'error')
    }
  }

  const handleGrantFullAccess = async (user: UserData) => {
    if (!myPermissions.canManageSubscriptions) {
      showToast('Você não possui permissão para alterar assinaturas.', 'error')
      return
    }
    if (!window.confirm(`Liberar ACESSO TOTAL GRATUITO (Plano Premium sem expiração e sem cobrança) para "${user.businessName}"?`)) return

    try {
      await api.grantFullAccessToUser(user.id)
      await fetchUsersOnly()
      showToast(`👑 Acesso Total Grátis (Plano Premium Vitalício) concedido para "${user.businessName}"!`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Erro ao liberar acesso total', 'error')
    }
  }

  const openEditModal = (user: UserData) => {
    if (!myPermissions.canManageSubscriptions) {
      showToast('Você não possui permissão para editar assinaturas.', 'error')
      return
    }
    setEditingUser(user)
    setSubPlan(user.subscription?.plan || 'mensal')
    setSubStatus(user.subscription?.status || 'active')
    
    if (user.subscription?.expiresAt) {
      const d = new Date(user.subscription.expiresAt)
      setSubExpiresAt(d.toISOString().split('T')[0])
    } else {
      setSubExpiresAt('')
    }
  }

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setActionLoading(true)
    try {
      await api.updateUserSubscription(editingUser.id, {
        plan: subPlan,
        status: subStatus,
        expiresAt: subExpiresAt ? new Date(subExpiresAt).toISOString() : null
      })
      showToast('Assinatura atualizada com sucesso!')
      setEditingUser(null)
      fetchData()
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar assinatura', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    if (!myPermissions.canManageUsers) {
      showToast('Você não possui permissão para excluir profissionais.', 'error')
      return
    }

    setActionLoading(true)
    try {
      await api.deleteUser(deletingUser.id)
      showToast('Profissional excluído com sucesso!')
      setDeletingUser(null)
      fetchData()
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir usuário', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!saUsername.trim() || !saPassword.trim()) return

    try {
      setActionLoading(true)
      await api.createSuperAdminAccount({
        username: saUsername,
        password: saPassword,
        businessName: saBusinessName,
        phone: saPhone,
        email: saEmail,
        permissions: saPerms,
      })
      showToast(`SuperAdmin "${saUsername}" criado com sucesso com permissões atribuídas!`, 'success')
      setShowNewSuperAdminModal(false)
      setSaUsername('')
      setSaPassword('')
      setSaBusinessName('')
      setSaPhone('')
      setSaEmail('')
      fetchSuperAdminsOnly()
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar SuperAdmin', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveSuperAdminPermissions = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSuperAdmin) return

    try {
      setActionLoading(true)
      await api.updateSuperAdminPermissions(editingSuperAdmin.id, editSaPerms as any)
      showToast(`Permissões do SuperAdmin "${editingSuperAdmin.username}" atualizadas!`, 'success')
      setEditingSuperAdmin(null)
      fetchSuperAdminsOnly()
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar permissões', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proUsername.trim() || !proPassword.trim() || !proBusinessName.trim()) return

    try {
      setActionLoading(true)
      await api.createProfessionalUser({
        username: proUsername,
        password: proPassword,
        businessName: proBusinessName,
        phone: proPhone,
        email: proEmail,
        plan: proPlan,
        isFullAccess: proIsFullAccess,
      })
      showToast(`Profissional "${proBusinessName}" cadastrado com sucesso!`, 'success')
      setShowNewProModal(false)
      setProBusinessName('')
      setProUsername('')
      setProPassword('')
      setProPhone('')
      setProEmail('')
      setProIsFullAccess(false)
      fetchUsersOnly()
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar profissional', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendSuperAdminReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicketId || !supportReply.trim()) return

    const msg = supportReply
    setSupportReply('')

    try {
      setSendingReply(true)
      await api.sendTicketMessage(selectedTicketId, msg)
      await fetchTicketDetails(selectedTicketId)
      await fetchTicketsOnly()
      showToast('Resposta enviada com sucesso ao cliente!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar resposta', 'error')
      setSupportReply(msg)
    } finally {
      setSendingReply(false)
    }
  }

  const handleUpdateTicketStatus = async (status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    if (!selectedTicketId) return
    try {
      await api.updateTicketStatus(selectedTicketId, status)
      await fetchTicketDetails(selectedTicketId)
      await fetchTicketsOnly()
      showToast(`Status do chamado atualizado para ${status === 'RESOLVED' ? 'Concluído' : status === 'IN_PROGRESS' ? 'Em Atendimento' : 'Aberto'}`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar status', 'error')
    }
  }

  // Filter users based on search & status
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.cnpj && u.cnpj.includes(searchTerm))

    let matchesStatus = true
    if (statusFilter === 'active') {
      matchesStatus = u.subscription?.status === 'active'
    } else if (statusFilter === 'trialing') {
      matchesStatus = u.subscription?.status === 'trialing'
    } else if (statusFilter === 'pending') {
      matchesStatus = u.subscription?.status === 'pending'
    } else if (statusFilter === 'inactive') {
      matchesStatus = !u.subscription || (u.subscription.status !== 'active' && u.subscription.status !== 'trialing' && u.subscription.status !== 'pending')
    }

    return matchesSearch && matchesStatus
  })

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
          </span>
        )
      case 'trialing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40">
            <ShieldCheck className="w-3.5 h-3.5" /> Trial (Teste)
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5" /> Pendente
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40">
            <X className="w-3.5 h-3.5" /> Inativo
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Carregando Painel SuperAdmin BoraMarka...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 z-30 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-[64px] sm:h-20 flex justify-between items-center py-2.5 sm:py-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20 flex-shrink-0">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight leading-none text-slate-900 dark:text-white">BoraMarka</h1>
                <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" /> Online
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-pink-500 uppercase tracking-widest block mt-0.5">Painel SuperAdmin</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131826] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm"
              title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />}
            </button>

            {/* Usar como Profissional */}
            <button
              onClick={handleImpersonateSelf}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 hover:opacity-90 text-white rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Usar como Profissional</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-5 mb-6 sm:mb-8">
          <div className="card-simple p-3.5 sm:p-5 flex flex-col justify-between bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Clientes</span>
            <div className="flex items-end justify-between mt-2 sm:mt-3">
              <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">{stats?.totalUsers || 0}</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          <div className="card-simple p-3.5 sm:p-5 flex flex-col justify-between bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Agendamentos</span>
            <div className="flex items-end justify-between mt-2 sm:mt-3">
              <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">{stats?.totalBookings || 0}</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          <div className="card-simple p-3.5 sm:p-5 flex flex-col justify-between bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Assinaturas Ativas</span>
            <div className="flex items-end justify-between mt-2 sm:mt-3">
              <span className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats?.activeSubscriptions || 0}</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          <div className="card-simple p-3.5 sm:p-5 flex flex-col justify-between bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Contas em Trial</span>
            <div className="flex items-end justify-between mt-2 sm:mt-3">
              <span className="text-xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 leading-none">{stats?.trialingSubscriptions || 0}</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Revenue Card: Vibrant Gradient */}
          {myPermissions.canViewFinancials ? (
            <div className="col-span-2 sm:col-span-1 card-simple p-3.5 sm:p-5 flex flex-col justify-between bg-gradient-to-br from-violet-600 via-pink-600 to-orange-500 text-white border-none shadow-lg rounded-2xl">
              <span className="text-[9px] sm:text-[10px] font-black text-white/80 uppercase tracking-widest">Receita Mensal Est.</span>
              <div className="flex items-end justify-between mt-2 sm:mt-3">
                <span className="text-lg sm:text-2xl font-black text-white leading-none">{formatCurrency(stats?.estimatedMonthlyRevenue || 0)}</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="col-span-2 sm:col-span-1 card-simple p-3.5 sm:p-5 flex flex-col justify-between bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl opacity-60">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Lock className="w-3 h-3" /> Receita Privada
              </span>
              <div className="text-xs font-bold text-slate-500 mt-2">Sem permissão financeira</div>
            </div>
          )}
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 w-full">
          <div className="flex items-center gap-2 overflow-x-auto w-full max-w-full pb-2 sm:pb-0 scrollbar-none touch-pan-x">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-shrink-0 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md'
                  : 'bg-white dark:bg-[#131826] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Profissionais ({users.length})</span>
            </button>

            {myPermissions.canManageSuperAdmins && (
              <button
                onClick={() => setActiveTab('superadmins')}
                className={`flex-shrink-0 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'superadmins'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md'
                    : 'bg-white dark:bg-[#131826] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Gestores SuperAdmin ({superadmins.length})</span>
              </button>
            )}

            {myPermissions.canAccessSupport && (
              <button
                onClick={() => setActiveTab('support')}
                className={`flex-shrink-0 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap relative ${
                  activeTab === 'support'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md'
                    : 'bg-white dark:bg-[#131826] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Central de Suporte ({supportTickets.length})</span>
                {supportTickets.filter(t => t.status === 'OPEN').length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping absolute -top-1 -right-1" />
                )}
              </button>
            )}
          </div>

          {/* Quick Action Add Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeTab === 'users' && myPermissions.canManageUsers && (
              <button
                onClick={() => setShowNewProModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Novo Profissional
              </button>
            )}
            {activeTab === 'superadmins' && myPermissions.canManageSuperAdmins && (
              <button
                onClick={() => setShowNewSuperAdminModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Novo SuperAdmin
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="card-simple p-4 sm:p-6 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl sm:rounded-3xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Gerenciamento de Profissionais</h2>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                  Visualize cadastros do BoraMarka, conceda testes de 1-clique e gerencie assinaturas.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-simple pl-10 pr-4 py-2.5 w-full sm:w-72 text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  />
                </div>

                {/* Status filter dropdown */}
                <div className="relative">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-simple pl-10 pr-8 py-2.5 text-xs font-bold appearance-none bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800 cursor-pointer w-full"
                  >
                    <option value="all" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Todos os Status</option>
                    <option value="active" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Ativos</option>
                    <option value="trialing" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Trial (Teste)</option>
                    <option value="pending" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Pendentes</option>
                    <option value="inactive" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Inativos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Cards View (Smalls Screens < 768px) */}
            <div className="block md:hidden space-y-3.5">
              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-sm font-bold text-slate-500">
                  Nenhum profissional encontrado.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0D111E]/60 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-black flex items-center justify-center text-xs shadow-md flex-shrink-0">
                          {user.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-sm">{user.businessName}</div>
                          <div className="text-xs font-bold text-pink-600 dark:text-pink-400">@{user.username}</div>
                        </div>
                      </div>
                      <div>
                        {user.subscription?.status === 'active' && user.subscription?.plan === 'premium' && !user.subscription?.expiresAt ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 uppercase tracking-wider inline-flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500" /> VIP
                          </span>
                        ) : (
                          getStatusBadge(user.subscription?.status)
                        )}
                      </div>
                    </div>

                    {/* Stats summary row */}
                    <div className="grid grid-cols-3 gap-2 text-center py-2 px-3 bg-white dark:bg-[#131826] rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs font-bold">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-black">Serviços</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{user._count.services}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-black">Links</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{user._count.links}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-black">Marcações</span>
                        <span className="text-pink-600 dark:text-pink-400 font-extrabold">{user.bookingsCount}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 font-medium">
                      {user.phone && <div><strong>WhatsApp:</strong> {user.phone}</div>}
                      {user.subscription && (
                        <div>
                          <strong>Plano:</strong> {user.subscription.plan} • {user.subscription.expiresAt ? `Expira ${new Date(user.subscription.expiresAt).toLocaleDateString('pt-BR')}` : 'Vitalício'}
                        </div>
                      )}
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      {myPermissions.canManageSubscriptions && (
                        <button
                          onClick={() => handleGrantFullAccess(user)}
                          className="py-2 px-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5" /> Acesso Total
                        </button>
                      )}
                      {myPermissions.canManageSubscriptions && (
                        <button
                          onClick={() => handleGrant30DaysTrial(user)}
                          className="py-2 px-2 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 border border-blue-500/30 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" /> +30d Teste
                        </button>
                      )}
                      <button
                        onClick={() => handleImpersonateUser(user.id)}
                        className="py-2 px-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Acessar Painel
                      </button>
                      {myPermissions.canManageSubscriptions && (
                        <button
                          onClick={() => openEditModal(user)}
                          className="py-2 px-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 border border-pink-500/30 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Editar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table Container (Screens >= 768px) */}
            <div className="hidden md:block overflow-x-auto -mx-6">
              <table className="w-full min-w-[850px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider bg-slate-100/70 dark:bg-slate-900/40">
                    <th className="px-6 py-4">Nome do Negócio / Usuário</th>
                    <th className="px-6 py-4">Contato</th>
                    <th className="px-6 py-4 text-center">Configuração</th>
                    <th className="px-6 py-4 text-center">Agendamentos</th>
                    <th className="px-6 py-4">Assinatura</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm font-bold text-slate-500 dark:text-slate-500">
                        Nenhum profissional encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-violet-50/40 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-black flex items-center justify-center text-xs shadow-md">
                              {user.businessName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 dark:text-white text-sm">{user.businessName}</div>
                              <div className="text-xs font-bold text-pink-600 dark:text-pink-400">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {user.phone ? (
                            <div className="text-slate-900 dark:text-slate-100 font-bold">{user.phone}</div>
                          ) : (
                            <div className="text-slate-500 font-medium">Sem telefone</div>
                          )}
                          {user.cnpj ? (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">CNPJ: {user.cnpj}</div>
                          ) : (
                            <div className="text-[11px] text-slate-400 font-medium">Sem CNPJ</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-black text-slate-800 dark:text-slate-200">
                          <div>{user._count.services} serv.</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{user._count.links} links</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                            {user.bookingsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.subscription ? (
                            <div>
                              <div className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wide flex items-center gap-1">
                                {user.subscription.plan === 'premium' && !user.subscription.expiresAt ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-black flex items-center gap-1">
                                    <Crown className="w-3.5 h-3.5 text-amber-500" /> Acesso Total (VIP)
                                  </span>
                                ) : (
                                  user.subscription.plan
                                )}
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                                {user.subscription.expiresAt
                                  ? `Expira: ${new Date(user.subscription.expiresAt).toLocaleDateString('pt-BR')}`
                                  : 'Sem expiração (Ilimitado)'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 font-bold">Nenhuma</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {user.subscription?.status === 'active' && user.subscription?.plan === 'premium' && !user.subscription?.expiresAt ? (
                            <span className="px-3 py-1 rounded-xl text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1 w-fit">
                              <Crown className="w-3 h-3 text-amber-500" /> VIP Vitalício
                            </span>
                          ) : (
                            getStatusBadge(user.subscription?.status)
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            {/* Quick Grant Full Access */}
                            {myPermissions.canManageSubscriptions && (
                              <button
                                onClick={() => handleGrantFullAccess(user)}
                                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-600 hover:to-yellow-600 rounded-xl transition-all cursor-pointer font-black text-[10px] uppercase flex items-center gap-1 shadow-sm"
                                title="Liberar Acesso Total ao sistema sem teste grátis e sem cobrança"
                              >
                                <Crown className="w-3.5 h-3.5 text-slate-950" /> Acesso Total Grátis
                              </button>
                            )}

                            {/* Quick 30 days trial */}
                            {myPermissions.canManageSubscriptions && (
                              <button
                                onClick={() => handleGrant30DaysTrial(user)}
                                className="px-2.5 py-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 rounded-xl transition-all cursor-pointer font-black text-[10px] uppercase flex items-center gap-1 border border-blue-500/30"
                                title="Conceder +30 dias de teste grátis com 1 clique"
                              >
                                <Zap className="w-3 h-3 text-blue-600" /> +30d Teste
                              </button>
                            )}

                            {/* Impersonate */}
                            <button
                              onClick={() => handleImpersonateUser(user.id)}
                              className="p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all cursor-pointer"
                              title="Acessar Painel como este Profissional"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>

                            {/* Edit Subscription */}
                            {myPermissions.canManageSubscriptions && (
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-2 text-slate-700 dark:text-slate-300 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-xl transition-all cursor-pointer"
                                title="Editar Assinatura"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete User */}
                            {myPermissions.canManageUsers && (
                              <button
                                onClick={() => setDeletingUser(user)}
                                className="p-2 text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                                title="Excluir Usuário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: GESTÃO DE SUPERADMINS */}
        {activeTab === 'superadmins' && myPermissions.canManageSuperAdmins && (
          <div className="card-simple p-6 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" /> Time de Gestores SuperAdmin
                </h2>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                  Usuários com privilégios administrativos e permissões granulares configuradas.
                </p>
              </div>

              <button
                onClick={() => setShowNewSuperAdminModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Criar Novo SuperAdmin
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {superadmins.map((sa) => (
                <div
                  key={sa.id}
                  className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm hover:border-pink-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                      {sa.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-500" /> SuperAdmin
                      </span>
                      <button
                        onClick={() => {
                          setEditingSuperAdmin(sa)
                          if (sa.parsedPermissions) setEditSaPerms(sa.parsedPermissions)
                        }}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-600 dark:text-slate-400"
                        title="Editar Permissões"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">{sa.businessName || sa.username}</h4>
                    <p className="text-xs font-bold text-pink-600 dark:text-pink-400">@{sa.username}</p>
                  </div>

                  {/* Permissões Badges */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Permissões do Gestor</span>
                    <div className="flex flex-wrap gap-1">
                      {sa.parsedPermissions?.canManageUsers && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          Profissionais
                        </span>
                      )}
                      {sa.parsedPermissions?.canManageSubscriptions && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                          Assinaturas
                        </span>
                      )}
                      {sa.parsedPermissions?.canManageSuperAdmins && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          SuperAdmins
                        </span>
                      )}
                      {sa.parsedPermissions?.canAccessSupport && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                          Helpdesk
                        </span>
                      )}
                      {sa.parsedPermissions?.canViewFinancials && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20">
                          Financeiro
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CENTRAL DE SUPORTE (HELPDESK) */}
        {activeTab === 'support' && myPermissions.canAccessSupport && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Tickets List */}
            <div className="lg:col-span-5 card-simple p-4 sm:p-6 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl sm:rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-full sm:w-auto">
                  <h3 className="text-base font-black text-slate-900 dark:text-white whitespace-nowrap">Chamados de Suporte</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Atendimento dos assinantes BoraMarka</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none justify-between sm:justify-start flex-shrink-0">
                  {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
                    <button
                      key={st}
                      onClick={() => setTicketStatusFilter(st)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial text-center ${
                        ticketStatusFilter === st
                          ? 'bg-white dark:bg-[#131826] text-pink-500 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {st === 'all' ? 'Todos' : st === 'OPEN' ? 'Abertos' : st === 'IN_PROGRESS' ? 'Respondidos' : 'Concluídos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets List Items */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {supportTickets
                  .filter(t => ticketStatusFilter === 'all' || t.status === ticketStatusFilter)
                  .map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        selectedTicketId === t.id
                          ? 'bg-pink-500/10 border-pink-500 dark:border-pink-500 shadow-md'
                          : 'bg-white dark:bg-[#131826] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          #{t.id} • {t.category}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-pink-500/10 text-pink-600 border-pink-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {t.status === 'RESOLVED' ? 'Concluído' : t.status === 'IN_PROGRESS' ? 'Respondido' : 'Aberto'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{t.subject}</h4>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{t.admin?.businessName || t.admin?.username || 'Cliente'}</span>
                        <span className="text-[10px]">{new Date(t.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                {supportTickets.length === 0 && (
                  <div className="py-16 text-center text-xs font-bold text-slate-400">
                    Nenhum chamado de suporte registrado.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Active Conversation */}
            <div className="lg:col-span-7 card-simple p-6 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
              {ticketDetails ? (
                <div className="flex flex-col h-[600px]">
                  {/* Active Ticket Header */}
                  <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                          #{ticketDetails.id} • {ticketDetails.category}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">{ticketDetails.subject}</h3>
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-1">
                        Cliente: <span className="text-slate-900 dark:text-white">{ticketDetails.admin?.businessName} ({ticketDetails.admin?.username})</span> • Telefone: {ticketDetails.admin?.phone || 'Não informado'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {ticketDetails.admin?.phone && (
                        <a
                          href={`https://wa.me/${ticketDetails.admin.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition-all border border-emerald-500/20 flex items-center gap-1"
                        >
                          WhatsApp
                        </a>
                      )}
                      <button
                        onClick={() => handleUpdateTicketStatus(ticketDetails.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          ticketDetails.status === 'RESOLVED'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-emerald-600 text-white shadow-md'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{ticketDetails.status === 'RESOLVED' ? 'Reabrir Chamado' : 'Concluir Chamado'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 custom-scrollbar">
                    {ticketDetails.messages?.map((msg: any) => {
                      const isSuperAdmin = msg.senderRole === 'SUPERADMIN'
                      return (
                        <div key={msg.id} className={`flex flex-col ${isSuperAdmin ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1 mb-1">
                            {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className={`p-4 rounded-2xl text-xs font-medium max-w-[80%] leading-relaxed shadow-sm ${
                            isSuperAdmin
                              ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-tr-none'
                              : 'bg-slate-100 dark:bg-[#1A2235] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendSuperAdminReply} className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
                    <input
                      type="text"
                      value={supportReply}
                      onChange={e => setSupportReply(e.target.value)}
                      placeholder="Escreva sua resposta como SuperAdmin..."
                      className="input-simple text-xs py-2.5 px-4 flex-1 bg-white text-slate-900 dark:bg-[#131826] dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !supportReply.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-black text-xs rounded-xl shadow-lg hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Responder</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="py-32 text-center space-y-3 text-slate-400">
                  <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold">Selecione um chamado da lista ao lado para responder.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: EDIT SUBSCRIPTION */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md card-simple p-4 sm:p-8 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl sm:rounded-3xl animate-scale-in max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Gerenciar Assinatura</h3>
                <p className="text-xs text-slate-400 font-semibold">@{editingUser.username} — {editingUser.businessName}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubscription} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setSubPlan('premium')
                  setSubStatus('active')
                  setSubExpiresAt('')
                }}
                className="w-full py-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Crown className="w-4 h-4 text-amber-500" /> Preencher Acesso Total Grátis (VIP)
              </button>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Plano de Assinatura</label>
                <select
                  value={subPlan}
                  onChange={(e) => setSubPlan(e.target.value)}
                  className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white"
                >
                  <option value="mensal" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Plano Mensal (R$ 29,90/mês)</option>
                  <option value="anual" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Plano Anual</option>
                  <option value="premium" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Plano Premium VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Status da Assinatura</label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white"
                >
                  <option value="active" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Ativo (Pago)</option>
                  <option value="trialing" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Trial (Período de Teste)</option>
                  <option value="pending" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Pendente</option>
                  <option value="canceled" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Cancelado / Inativo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Data de Expiração</label>
                <input
                  type="date"
                  value={subExpiresAt}
                  onChange={(e) => setSubExpiresAt(e.target.value)}
                  className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-black text-xs uppercase shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW SUPERADMIN WITH PERMISSIONS */}
      {showNewSuperAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg card-simple p-4 sm:p-8 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl sm:rounded-3xl animate-scale-in max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-pink-500" /> Cadastrar Novo SuperAdmin
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Defina as credenciais e as permissões de acesso</p>
              </div>
              <button
                onClick={() => setShowNewSuperAdminModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Nome do Gestor / Empresa *</label>
                <input
                  type="text"
                  value={saBusinessName}
                  onChange={e => setSaBusinessName(e.target.value)}
                  placeholder="Ex: Carlos Santana (Suporte)"
                  className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Login / Usuário *</label>
                  <input
                    type="text"
                    value={saUsername}
                    onChange={e => setSaUsername(e.target.value)}
                    placeholder="Ex: carlossuperadmin"
                    className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Senha de Acesso *</label>
                  <input
                    type="password"
                    value={saPassword}
                    onChange={e => setSaPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={saPhone}
                    onChange={e => setSaPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    value={saEmail}
                    onChange={e => setSaEmail(e.target.value)}
                    placeholder="gestor@boramarka.com"
                    className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              {/* PERMISSÕES GRANULARES SELECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase text-pink-600 dark:text-pink-400 tracking-wider block">
                  Permissões Granulares do Gestor
                </span>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                  <div className="pr-2">
                    <div className="text-xs font-black text-slate-900 dark:text-white">Gerenciar Profissionais / Clientes</div>
                    <div className="text-[10px] text-slate-500 font-medium">Cadastrar, editar e excluir contas de profissionais</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={saPerms.canManageUsers}
                    onChange={e => setSaPerms({ ...saPerms, canManageUsers: e.target.checked })}
                    className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                  <div className="pr-2">
                    <div className="text-xs font-black text-slate-900 dark:text-white">Alterar Assinaturas & Períodos de Teste</div>
                    <div className="text-[10px] text-slate-500 font-medium">Mudar planos e conceder +30 dias de teste com 1 clique</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={saPerms.canManageSubscriptions}
                    onChange={e => setSaPerms({ ...saPerms, canManageSubscriptions: e.target.checked })}
                    className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                  <div className="pr-2">
                    <div className="text-xs font-black text-slate-900 dark:text-white">Criar outros Administradores / SuperAdmins</div>
                    <div className="text-[10px] text-slate-500 font-medium">Cadastrar novas contas de gestores gerais</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={saPerms.canManageSuperAdmins}
                    onChange={e => setSaPerms({ ...saPerms, canManageSuperAdmins: e.target.checked })}
                    className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                  <div className="pr-2">
                    <div className="text-xs font-black text-slate-900 dark:text-white">Atender Central de Suporte (Helpdesk)</div>
                    <div className="text-[10px] text-slate-500 font-medium">Responder chamados de ajuda dos clientes em tempo real</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={saPerms.canAccessSupport}
                    onChange={e => setSaPerms({ ...saPerms, canAccessSupport: e.target.checked })}
                    className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                  <div className="pr-2">
                    <div className="text-xs font-black text-slate-900 dark:text-white">Visualizar Faturamento / Receitas</div>
                    <div className="text-[10px] text-slate-500 font-medium">Acesso aos valores de receita mensal estimada</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={saPerms.canViewFinancials}
                    onChange={e => setSaPerms({ ...saPerms, canViewFinancials: e.target.checked })}
                    className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewSuperAdminModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-black text-xs uppercase shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar SuperAdmin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT SUPERADMIN PERMISSIONS */}
      {editingSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg card-simple p-4 sm:p-8 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl sm:rounded-3xl animate-scale-in max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-pink-500" /> Editar Permissões do Gestor
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">@{editingSuperAdmin.username} — {editingSuperAdmin.businessName}</p>
              </div>
              <button
                onClick={() => setEditingSuperAdmin(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSuperAdminPermissions} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase text-pink-600 dark:text-pink-400 tracking-wider block">
                  Permissões Granulares
                </span>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                  <div className="pr-2">
                    <div className="text-xs font-black text-slate-900 dark:text-white">Gerenciar Profissionais / Clientes</div>
                    <div className="text-[10px] text-slate-500 font-medium">Cadastrar, editar e excluir contas de profissionais</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editSaPerms.canManageUsers}
                    onChange={e => setEditSaPerms({ ...editSaPerms, canManageUsers: e.target.checked })}
                    className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                  <div className="pr-2">
                    <div className="text-xs font-black text-slate-900 dark:text-white">Alterar Assinaturas & Períodos de Teste</div>
                    <div className="text-[10px] text-slate-500 font-medium">Mudar planos e conceder +30 dias de teste com 1 clique</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editSaPerms.canManageSubscriptions}
                    onChange={e => setEditSaPerms({ ...editSaPerms, canManageSubscriptions: e.target.checked })}
                    className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                  <div className="pr-2">
                    <div className="text-xs font-black text-slate-900 dark:text-white">Criar outros Administradores / SuperAdmins</div>
                    <div className="text-[10px] text-slate-500 font-medium">Cadastrar novas contas de gestores gerais</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editSaPerms.canManageSuperAdmins}
                    onChange={e => setEditSaPerms({ ...editSaPerms, canManageSuperAdmins: e.target.checked })}
                    className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                  <div className="pr-2">
                    <div className="text-xs font-black text-slate-900 dark:text-white">Atender Central de Suporte (Helpdesk)</div>
                    <div className="text-[10px] text-slate-500 font-medium">Responder chamados de ajuda dos clientes em tempo real</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editSaPerms.canAccessSupport}
                    onChange={e => setEditSaPerms({ ...editSaPerms, canAccessSupport: e.target.checked })}
                    className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                  <div className="pr-2">
                    <div className="text-xs font-black text-slate-900 dark:text-white">Visualizar Faturamento / Receitas</div>
                    <div className="text-[10px] text-slate-500 font-medium">Acesso aos valores de receita mensal estimada</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editSaPerms.canViewFinancials}
                    onChange={e => setEditSaPerms({ ...editSaPerms, canViewFinancials: e.target.checked })}
                    className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingSuperAdmin(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-black text-xs uppercase shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Permissões'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW PROFESSIONAL */}
      {showNewProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md card-simple p-4 sm:p-8 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl sm:rounded-3xl animate-scale-in max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-pink-500" /> Cadastrar Novo Profissional
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Criação rápida de conta de cliente com período de teste</p>
              </div>
              <button
                onClick={() => setShowNewProModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfessional} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Nome do Negócio / Empresa *</label>
                <input
                  type="text"
                  value={proBusinessName}
                  onChange={e => setProBusinessName(e.target.value)}
                  placeholder="Ex: Barbearia Luxo VIP"
                  className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Nome de Usuário (Login) *</label>
                <input
                  type="text"
                  value={proUsername}
                  onChange={e => setProUsername(e.target.value)}
                  placeholder="Ex: barbearialuxo"
                  className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Senha *</label>
                <input
                  type="password"
                  value={proPassword}
                  onChange={e => setProPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={proPhone}
                    onChange={e => setProPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">Plano Inicial</label>
                  <select
                    value={proPlan}
                    onChange={e => setProPlan(e.target.value)}
                    className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  >
                    <option value="mensal" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Mensal (30d Teste)</option>
                    <option value="anual" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Anual</option>
                    <option value="premium" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Premium VIP</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={proIsFullAccess}
                  onChange={e => setProIsFullAccess(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <div>
                  <div className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500" /> Liberar Acesso Total Grátis (VIP)
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">Concede acesso ilimitado a todos os recursos sem cobrança e sem período de testes.</div>
                </div>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewProModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-black text-xs uppercase shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar Profissional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md card-simple p-6 sm:p-8 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl animate-scale-in">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Confirmar Exclusão</h3>
            </div>

            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Tem certeza que deseja excluir o profissional <strong className="text-slate-900 dark:text-white">"{deletingUser.businessName}"</strong> (@{deletingUser.username})? 
              Esta ação excluirá permanentemente todos os agendamentos, serviços e links cadastrados deste usuário.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, Excluir Conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
