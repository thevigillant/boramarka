import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import {
  Users, Calendar, CreditCard, DollarSign, LogOut,
  Moon, Sun, Search, Filter, Trash2, Edit, X, Check,
  AlertCircle, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck
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

interface Stats {
  totalUsers: number
  totalBookings: number
  activeSubscriptions: number
  trialingSubscriptions: number
  estimatedMonthlyRevenue: number
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
    } text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm border-2 border-white/20`}>
      {type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="flex-1 font-semibold">{message}</span>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  
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

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
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
      const [statsData, usersData] = await Promise.all([
        api.getSuperAdminStats(),
        api.getSuperAdminUsers()
      ])
      setStats(statsData)
      setUsers(usersData)
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar dados do painel', 'error')
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('role')
    navigate('/login')
  }

  // Save changes to user's subscription
  const handleSaveSubscription = async () => {
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

  // Delete professional account
  const handleDeleteUser = async () => {
    if (!deletingUser) return
    setActionLoading(true)
    try {
      await api.deleteUser(deletingUser.id)
      showToast('Profissional excluído com sucesso!')
      setDeletingUser(null)
      fetchData()
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir profissional', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Impersonate professional account (login as them)
  const handleImpersonateUser = async (userId: number) => {
    try {
      const data = await api.impersonateUser(userId)
      // Save current superadmin token to session storage
      const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (currentToken) {
        sessionStorage.setItem('superadmin_token', currentToken)
      }
      // Set the impersonated professional's token as active
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', 'admin')
      // Redirect to professional dashboard
      navigate('/dashboard')
    } catch (err: any) {
      showToast(err.message || 'Erro ao entrar como profissional', 'error')
    }
  }

  // Impersonate self as professional
  const handleImpersonateSelf = async () => {
    try {
      const data = await api.impersonateSelf()
      // Save current superadmin token to session storage
      const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (currentToken) {
        sessionStorage.setItem('superadmin_token', currentToken)
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', 'admin')
      navigate('/dashboard')
    } catch (err: any) {
      showToast(err.message || 'Erro ao entrar como profissional', 'error')
    }
  }

  // Open subscription edit modal and pre-fill values
  const openEditModal = (user: UserData) => {
    setEditingUser(user)
    if (user.subscription) {
      setSubPlan(user.subscription.plan)
      setSubStatus(user.subscription.status)
      if (user.subscription.expiresAt) {
        setSubExpiresAt(new Date(user.subscription.expiresAt).toISOString().split('T')[0])
      } else {
        setSubExpiresAt('')
      }
    } else {
      setSubPlan('mensal')
      setSubStatus('trialing')
      setSubExpiresAt('')
    }
  }

  // Filtered users list
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
    
    if (statusFilter === 'all') return matchesSearch
    
    const userStatus = user.subscription?.status || 'inactive'
    return matchesSearch && userStatus === statusFilter
  })

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  // Get status color label
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
          </span>
        )
      case 'trialing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Trial (Teste)
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Pendente
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
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
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Carregando painel principal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 dark:bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none text-slate-900 dark:text-white">BoraMarka</h1>
              <span className="text-[9px] font-black text-pink-500 uppercase tracking-wider">Painel do Administrador</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131826] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
              title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Usar como Profissional */}
            <button
              onClick={handleImpersonateSelf}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-500/20 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Usar como Profissional
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <div className="card-simple p-6 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total de Clientes</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats?.totalUsers || 0}</span>
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-500/10 flex items-center justify-center text-pink-500 dark:text-pink-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="card-simple p-6 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Agendamentos Totais</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats?.totalBookings || 0}</span>
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-500/10 flex items-center justify-center text-pink-500 dark:text-pink-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="card-simple p-6 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assinaturas Ativas</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats?.activeSubscriptions || 0}</span>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="card-simple p-6 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contas em Trial</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400 leading-none">{stats?.trialingSubscriptions || 0}</span>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="card-simple p-6 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800 dark:from-[#131826] dark:to-[#171E30] text-white border-none shadow-xl">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Receita Mensal Est.</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-pink-400 leading-none">{formatCurrency(stats?.estimatedMonthlyRevenue || 0)}</span>
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Table Section */}
        <div className="card-simple p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Gerenciamento de Profissionais</h2>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                Visualize os cadastros do BoraMarka, gerencie planos de assinatura e exclua contas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar profissional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-simple pl-10 pr-4 py-2 w-full sm:w-64 text-sm"
                />
              </div>

              {/* Status filter dropdown */}
              <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-simple pl-10 pr-8 py-2 text-sm appearance-none bg-none cursor-pointer"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="trialing">Trial</option>
                  <option value="pending">Pendente</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Nome do Negócio / Usuário</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4 text-center">Configuração</th>
                  <th className="px-6 py-4 text-center">Agendamentos</th>
                  <th className="px-6 py-4">Assinatura</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-slate-400 dark:text-slate-600">
                      Nenhum profissional encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-[#131826]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{user.businessName || 'Sem nome'}</div>
                        <div className="text-xs text-slate-400">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold">{user.phone || 'Sem telefone'}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{user.cnpj ? `CNPJ: ${user.cnpj}` : 'Sem CNPJ'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {user._count?.services || 0} serv.
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {user._count?.links || 0} links
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-black bg-pink-500/10 text-pink-500">
                          {user.bookingsCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.subscription ? (
                          <div>
                            <div className="text-sm font-bold capitalize">{user.subscription.plan}</div>
                            <div className="text-[10px] text-slate-400 font-bold">
                              {user.subscription.status === 'trialing'
                                ? `Expira trial: ${user.subscription.trialEndsAt ? new Date(user.subscription.trialEndsAt).toLocaleDateString('pt-BR') : '-'}`
                                : `Expira: ${user.subscription.expiresAt ? new Date(user.subscription.expiresAt).toLocaleDateString('pt-BR') : 'Sem expiração'}`
                              }
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400">Nenhuma</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.subscription?.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleImpersonateUser(user.id)}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                            title="Acessar Painel como este Profissional"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-pink-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                            title="Editar Assinatura"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit Subscription Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md card-simple p-6 sm:p-8 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Gerenciar Assinatura</h3>
                <p className="text-xs text-slate-400">#{editingUser.username} — {editingUser.businessName}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Plan dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Plano de Assinatura</label>
                <select
                  value={subPlan}
                  onChange={(e) => setSubPlan(e.target.value)}
                  className="input-simple w-full"
                >
                  <option value="mensal">Mensal (R$ 29,90/mês)</option>
                  <option value="anual">Anual (R$ 299,00/ano)</option>
                </select>
              </div>

              {/* Status dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status da Conta</label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="input-simple w-full"
                >
                  <option value="active">Ativo (Acesso Liberado)</option>
                  <option value="trialing">Trial (Em Período de Testes)</option>
                  <option value="pending">Pendente (Aguardando Pagamento)</option>
                  <option value="inactive">Inativo (Acesso Bloqueado)</option>
                </select>
              </div>

              {/* Expiration date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Data de Vencimento da Assinatura
                </label>
                <input
                  type="date"
                  value={subExpiresAt}
                  onChange={(e) => setSubExpiresAt(e.target.value)}
                  className="input-simple w-full"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Se deixado em branco, a conta ativa não terá prazo de expiração fixo.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingUser(null)}
                  disabled={actionLoading}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSubscription}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm card-simple p-6 sm:p-8 animate-scale-in border-rose-500/20">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Excluir Profissional?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Tem certeza de que deseja excluir o profissional <strong className="text-slate-800 dark:text-slate-200">@{deletingUser.username}</strong> ({deletingUser.businessName})?
                <br />
                <span className="text-rose-500 dark:text-rose-400 font-bold mt-2 block">
                  Esta ação é irreversível e deletará todas as agendas, serviços, faturamento e clientes associados.
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingUser(null)}
                disabled={actionLoading}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Excluir Conta'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
