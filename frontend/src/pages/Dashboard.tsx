import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, UserPermissionItem, SubscriptionUsageData, AnalyticsData } from '../services/api'
import MiniBarChart from '../components/charts/MiniBarChart'
import MiniDonutChart from '../components/charts/MiniDonutChart'
import WeekdayChart from '../components/charts/WeekdayChart'
import StatusPieChart from '../components/charts/StatusPieChart'
import {
  Calendar, Plus, Trash2, Copy, RefreshCw, RotateCcw, Link2, Link, Bell,
  Clock, Users, LogOut, X, Check, ExternalLink,
  AlertCircle, Loader2, ChevronDown, DollarSign,
  TrendingUp, TrendingDown, Wallet, CreditCard, Gift, Tag,
  Briefcase, ArrowUpRight, ArrowDownRight, Search,
  Filter, Download, MoreVertical, LayoutDashboard, Phone, User, Moon, Sun,
  ChevronLeft, ChevronRight, Camera, Pencil, Store, MapPin, Palette, CheckCircle2, Sparkles, Globe, MessageCircle, ShieldAlert, UserCheck,
  FileText, Upload, Paperclip, AlertTriangle, Archive, UserX, FileCheck, Eye, EyeOff, Laptop, Mail, Menu, ChevronUp, Layers, Shield, ShieldCheck, Lock, UserPlus, Key, Building2, Database, Target, Crown, Zap, Star, Scissors, Instagram, BarChart3, ShoppingBag, Repeat
} from 'lucide-react'
import { exportBookingsToPDF, exportFinanceToPDF } from '../utils/pdfExport'
import { exportBookingsToCSV, exportFinanceToCSV } from '../utils/csvExport'
import { BoraMarkaLogo } from '../components/BoraMarkaLogo'
import { BoraIaTab } from '../components/BoraIaTab'
import { BookingCard } from '../components/BookingCard'
import SupportChatWidget from '../components/SupportChatWidget'

import {
  LinkData, SlotData, BookingData, ServiceData, Stats, FinanceStats,
  Transaction, EmployeeDocumentData, EmployeeData
} from '../types/dashboard'
import { formatDate, formatCurrency, generateTimeSlots, WEEKDAYS, getWeekday, maskPhone } from '../utils/dashboardHelpers'
import { Toast } from '../components/dashboard/Toast'
import { TrialBanner, InactiveBanner } from '../components/dashboard/SubscriptionBanners'
import { PaywallModal } from '../components/dashboard/PaywallModal'
import { StatCard } from '../components/dashboard/StatCard'
import { CalendarWidget } from '../components/dashboard/CalendarWidget'
import { AuditTab } from '../components/dashboard/tabs/AuditTab'
import { SecurityTab } from '../components/dashboard/tabs/SecurityTab'
import { RHTab } from '../components/dashboard/tabs/RHTab'
import { SocialTab } from '../components/dashboard/tabs/SocialTab'
import { FinanceiroTab } from '../components/dashboard/tabs/FinanceiroTab'
import { AgendamentosTab } from '../components/dashboard/tabs/AgendamentosTab'
import { HorariosTab } from '../components/dashboard/tabs/HorariosTab'
import { ServicosTab } from '../components/dashboard/tabs/ServicosTab'
import { LinksTab } from '../components/dashboard/tabs/LinksTab'
import { ClientesTab } from '../components/dashboard/tabs/ClientesTab'
import { PersonalizarTab } from '../components/dashboard/tabs/PersonalizarTab'
import { FaturamentoTab } from '../components/dashboard/tabs/FaturamentoTab'
import { CuponsTab } from '../components/dashboard/tabs/CuponsTab'
import { MembershipsTab } from '../components/dashboard/tabs/MembershipsTab'
import { TrashTab } from '../components/dashboard/tabs/TrashTab'
import { EstornosTab } from '../components/dashboard/tabs/EstornosTab'
import { OverviewTab } from '../components/dashboard/tabs/OverviewTab'
import { BoraEncomendaTab } from '../components/dashboard/tabs/BoraEncomendaTab'
import { CalendarioTab } from '../components/dashboard/tabs/CalendarioTab'
import { FilaEsperaTab } from '../components/dashboard/tabs/FilaEsperaTab'
import { EstoqueTab } from '../components/dashboard/tabs/EstoqueTab'
import { PDVTab } from '../components/dashboard/tabs/PDVTab'
import { MarketingTab } from '../components/dashboard/tabs/MarketingTab'
import { Package, CalendarDays, Receipt, Megaphone } from 'lucide-react'
import { NewTransactionModal } from '../components/dashboard/modals/NewTransactionModal'
import { NewServiceModal } from '../components/dashboard/modals/NewServiceModal'
import { NewBookingModal } from '../components/dashboard/modals/NewBookingModal'
import { DeleteSlotModal } from '../components/dashboard/modals/DeleteSlotModal'
import { MpConfigModal } from '../components/dashboard/modals/MpConfigModal'
import { MpTutorialModal } from '../components/dashboard/modals/MpTutorialModal'
import { ProductAndSubscriptionModal } from '../components/dashboard/modals/ProductAndSubscriptionModal'



// ════════════════════════════════════════════
// Types
// ════════════════════════════════════════════
// ════════════════════════════════════════════
// Main Dashboard
// ════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'boraia' | 'boraencomenda' | 'links' | 'horarios' | 'agendamentos' | 'calendario' | 'fila' | 'pdv' | 'estoque' | 'marketing' | 'financeiro' | 'recebimentos' | 'servicos' | 'trash' | 'personalizar' | 'faturamento' | 'clientes' | 'cupons' | 'memberships' | 'social' | 'rh' | 'audit' | 'estornos' | 'seguranca'>('overview')
  const [usageData, setUsageData] = useState<SubscriptionUsageData | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
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
    return localStorage.getItem('theme') === 'dark'
  })

  // Global Header Search State & Shortcut
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

  const [refundRequests, setRefundRequests] = useState<any[]>([])
  const [processingRefundId, setProcessingRefundId] = useState<number | null>(null)
  const [showMpTutorialModal, setShowMpTutorialModal] = useState(false)
  const [showMpConfigModal, setShowMpConfigModal] = useState(false)
  const [pixInputKey, setPixInputKey] = useState('')
  const [mpInputToken, setMpInputToken] = useState('')
  const [showAdvancedMp, setShowAdvancedMp] = useState(false)
  const [savingMpToken, setSavingMpToken] = useState(false)

  const fetchRefundRequests = useCallback(async () => {
    try {
      const data = await api.getRefundRequests()
      setRefundRequests(data)
    } catch (err) {
      console.error('Erro ao carregar solicitações de estorno:', err)
    }
  }, [])

  useEffect(() => {
    fetchRefundRequests()
  }, [fetchRefundRequests])

  // Data
  const [stats, setStats] = useState<Stats>({ totalLinks: 0, totalSlots: 0, totalBookings: 0, availableSlots: 0 })
  const [financeStats, setFinanceStats] = useState<FinanceStats>({
    totalReceivable: 0, totalPayable: 0, receivedAmount: 0, paidAmount: 0,
    pendingReceivable: 0, pendingPayable: 0, balance: 0
  })
  const [links, setLinks] = useState<LinkData[]>([])
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
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
    pixKey?: string;
    accentColor?: string;
    secondaryColor?: string;
    publicTheme?: string;
    bannerUrl?: string;
    customDomain?: string;
    category?: string;
    businessType?: 'SERVICES' | 'PRODUCTS';
    isOperator?: boolean;
    currentOperator?: any;
  } | null>(null)

  const currentBusinessType = adminInfo?.businessType || 'SERVICES'

  // ═══ Categorias da Navbar (Dropdowns) ═══
  const navCategories = useMemo(() => {
    type TabIdType = 'overview' | 'boraia' | 'boraencomenda' | 'links' | 'horarios' | 'agendamentos' | 'calendario' | 'fila' | 'pdv' | 'estoque' | 'marketing' | 'financeiro' | 'recebimentos' | 'servicos' | 'trash' | 'personalizar' | 'faturamento' | 'clientes' | 'cupons' | 'memberships' | 'social' | 'rh' | 'audit' | 'estornos' | 'seguranca'
    interface NavItem {
      id: TabIdType
      label: string
      icon: any
      desc: string
      badge?: number
    }

    const pendingRefundsCount = refundRequests.filter(r => r.refundStatus === 'PENDING').length

    const bType = adminInfo?.businessType || 'SERVICES'

    // ═══ BORAENCOMENDA: EXCLUSIVO PARA VENDAS SOB ENCOMENDA & PRODUÇÃO ═══
    if (bType === 'PRODUCTS') {
      return [
        {
          id: 'overview',
          label: 'Visão Geral',
          icon: LayoutDashboard,
          type: 'single' as const,
          tabId: 'overview' as TabIdType,
        },
        {
          id: 'boraencomenda',
          label: 'BoraEnkomenda',
          icon: ShoppingBag,
          type: 'single' as const,
          tabId: 'boraencomenda' as TabIdType,
        },
        {
          id: 'boraia',
          label: 'BoraIA',
          icon: Sparkles,
          type: 'single' as const,
          tabId: 'boraia' as TabIdType,
        },
        {
          id: 'comercial',
          label: 'Cardápio & Pedidos',
          icon: ShoppingBag,
          type: 'dropdown' as const,
          items: [
            { id: 'boraencomenda', label: 'Kanban & Encomendas', icon: ShoppingBag, desc: 'Kanban de produção e produtos sob encomenda' },
            { id: 'clientes', label: 'Clientes', icon: Users, desc: 'Base completa de clientes' },
            { id: 'cupons', label: 'Cupons de Desconto', icon: Tag, desc: 'Crie códigos promocionais para clientes' },
          ] as NavItem[]
        },
        {
          id: 'gestao',
          label: 'Gestão & Finanças',
          icon: DollarSign,
          type: 'dropdown' as const,
          items: [
            { id: 'financeiro', label: 'Financeiro & Caixa', icon: DollarSign, desc: 'Fluxo de caixa, recebíveis e despesas' },
            { id: 'estoque', label: 'Estoque de Insumos', icon: Package, desc: 'Ingredientes, matérias-primas e embalagens' },
            { id: 'recebimentos', label: 'Dados Bancários / Pix', icon: Wallet, desc: 'Gerenciar chave Pix e recebimentos' },
            { id: 'rh', label: 'Equipe / Produção', icon: UserCheck, desc: 'Gestão de ajudantes e funções' },
            { id: 'faturamento', label: 'Plano & Assinatura', icon: CreditCard, desc: 'Gerenciar seu plano no BoraEnkomenda' },
          ] as NavItem[]
        },
        {
          id: 'sistema',
          label: 'Sistema & Ajustes',
          icon: Palette,
          type: 'dropdown' as const,
          items: [
            { id: 'seguranca', label: 'Segurança & Permissões', icon: ShieldCheck, desc: 'Controle granular de acesso por operador e perfil (RBAC)' },
            { id: 'personalizar', label: 'Personalizar Loja', icon: Palette, desc: 'Identidade visual, modelo de atuação, cores e banner' },
            { id: 'social', label: 'Explorar Rede', icon: Globe, desc: 'Rede de contatos e chat com profissionais' },
            { id: 'audit', label: 'Logs & Auditoria', icon: ShieldAlert, desc: 'Registro de ações, logins e segurança' },
            { id: 'trash', label: 'Lixeira', icon: Trash2, desc: 'Recuperar itens excluídos recentemente' },
          ] as NavItem[]
        }
      ]
    }

    // ═══ BORAMARKA: EXCLUSIVO PARA AGENDAMENTOS & SERVIÇOS ═══
    return [
      {
        id: 'overview',
        label: 'Visão Geral',
        icon: LayoutDashboard,
        type: 'single' as const,
        tabId: 'overview' as TabIdType,
      },
      {
        id: 'boraia',
        label: 'BoraIA',
        icon: Sparkles,
        type: 'single' as const,
        tabId: 'boraia' as TabIdType,
      },
      {
        id: 'operacional',
        label: 'Operacional',
        icon: Calendar,
        type: 'dropdown' as const,
        badge: (bookings.length + pendingRefundsCount) > 0 ? (bookings.length + pendingRefundsCount) : undefined,
        items: [
          { id: 'agendamentos', label: 'Agendamentos (Lista)', icon: Calendar, desc: 'Lista e confirmação de horários agendados', badge: bookings.length },
          { id: 'calendario', label: 'Calendário Visual', icon: CalendarDays, desc: 'Visão semanal e diária da agenda' },
          { id: 'fila', label: 'Fila de Espera (Walk-in)', icon: Users, desc: 'Gestão de fila e avisos no WhatsApp' },
          { id: 'estornos', label: 'Solicitações de Estorno', icon: RotateCcw, desc: 'Gerenciar cancelamentos com reembolso pendente', badge: pendingRefundsCount > 0 ? pendingRefundsCount : undefined },
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
          { id: 'pdv', label: 'PDV / Frente de Caixa', icon: Receipt, desc: 'Ponto de venda rápido e emissão de recibos' },
          { id: 'marketing', label: 'Campanhas de Marketing', icon: Megaphone, desc: 'Reativação de clientes e promoções WhatsApp' },
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
          { id: 'estoque', label: 'Controle de Estoque', icon: Package, desc: 'Produtos de revenda, insumos e reposição' },
          { id: 'recebimentos', label: 'Dados Bancários / Pix', icon: Wallet, desc: 'Gerenciar chave Pix e recebimentos' },
          { id: 'rh', label: 'RH / Equipe', icon: UserCheck, desc: 'Gestão de funcionários, funções e comissões' },
          { id: 'faturamento', label: 'Plano & Assinatura', icon: CreditCard, desc: 'Gerenciar seu plano no BoraMarka' },
        ] as NavItem[]
      },
      {
        id: 'sistema',
        label: 'Sistema & Ajustes',
        icon: Palette,
        type: 'dropdown' as const,
        items: [
          { id: 'seguranca', label: 'Segurança & Permissões', icon: ShieldCheck, desc: 'Controle granular de acesso por operador e perfil (RBAC)' },
          { id: 'personalizar', label: 'Personalizar Página', icon: Palette, desc: 'Identidade visual, modelo de atuação, cores e banner' },
          { id: 'social', label: 'Explorar Rede', icon: Globe, desc: 'Rede de contatos e chat com profissionais' },
          { id: 'audit', label: 'Logs & Auditoria', icon: ShieldAlert, desc: 'Registro de ações, logins e segurança' },
          { id: 'trash', label: 'Lixeira', icon: Trash2, desc: 'Recuperar itens excluídos recentemente' },
        ] as NavItem[]
      }
    ]
  }, [bookings.length, adminInfo?.businessType, refundRequests])

  const [operatorSession, setOperatorSession] = useState<any | null>(null)

  // Filter navbar categories based on operator permissions (if logged in as operator)
  const filteredNavCategories = useMemo(() => {
    if (!operatorSession || !operatorSession.permissions) {
      return navCategories
    }

    const perms = operatorSession.permissions

    return navCategories.map(cat => {
      if (cat.type === 'single') return cat
      if (cat.type === 'dropdown') {
        const allowedItems = cat.items.filter(item => {
          if (item.id === 'agendamentos') return perms.canAgendamentos !== false
          if (item.id === 'estornos') return perms.canEstornos !== false
          if (item.id === 'clientes') return perms.canClientes !== false
          if (item.id === 'horarios') return perms.canHorarios !== false
          if (item.id === 'servicos') return perms.canServicos !== false
          if (item.id === 'links') return perms.canLinks !== false
          if (item.id === 'cupons') return perms.canCupons !== false
          if (item.id === 'memberships') return perms.canMemberships !== false
          if (item.id === 'financeiro') return perms.canFinanceiro !== false
          if (item.id === 'rh') return perms.canRh !== false
          if (item.id === 'faturamento') return perms.canFaturamento !== false
          if (item.id === 'seguranca') return perms.canSeguranca !== false
          if (item.id === 'personalizar') return perms.canPersonalizar !== false
          if (item.id === 'social') return perms.canSocial !== false
          if (item.id === 'audit') return perms.canAudit !== false
          if (item.id === 'trash') return perms.canTrash !== false
          return true
        })

        return {
          ...cat,
          items: allowedItems,
        }
      }
      return cat
    }).filter(cat => {
      if (cat.type === 'dropdown') {
        return cat.items.length > 0
      }
      return true
    })
  }, [navCategories, operatorSession])

  // Informações da aba atual (Breadcrumb)
  const currentTabInfo = useMemo(() => {
    for (const cat of filteredNavCategories) {
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
  }, [activeTab, filteredNavCategories])
  
  // Get all unique categories for filter
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    transactions.forEach(t => {
      if (t.category) cats.add(t.category)
    })
    return Array.from(cats)
  }, [transactions])

  // Resultados da Busca Global no Cabeçalho
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
  const [rhSubTab, setRhSubTab] = useState<'ACTIVE' | 'HOLERITES' | 'VACATIONS' | 'ANNOUNCEMENTS' | 'PROFILE_REQ' | 'DISMISSED' | 'ARCHIVED'>('ACTIVE')
  const [rhSearch, setRhSearch] = useState('')
  const [rhPendingTypeFilter, setRhPendingTypeFilter] = useState('ALL')
  const [rhPendingStatusFilter, setRhPendingStatusFilter] = useState('ALL')

  // Additional RH Modules State
  const [rhPaystubs, setRhPaystubs] = useState<any[]>([])
  const [rhVacations, setRhVacations] = useState<any[]>([])
  const [rhAnnouncements, setRhAnnouncements] = useState<any[]>([])
  const [rhProfileRequests, setRhProfileRequests] = useState<any[]>([])

  // RH Modals
  const [rhPaystubModalOpen, setRhPaystubModalOpen] = useState(false)
  const [paystubForm, setPaystubForm] = useState({ employeeId: '', referenceMonth: '', grossSalary: '', netSalary: '', discounts: '', fileUrl: '', notes: '' })

  const [rhAnnouncementModalOpen, setRhAnnouncementModalOpen] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', targetGroup: 'ALL', priority: 'NORMAL' })

  const [portalLinkModal, setPortalLinkModal] = useState<{ open: boolean; link: string; name: string } | null>(null)
  const [resetPassModal, setResetPassModal] = useState<{ open: boolean; empId: number | null; empName: string; pass: string } | null>(null)
  
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
    businessType: 'SERVICES' as 'SERVICES' | 'PRODUCTS',
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
        businessType: (adminInfo.businessType === 'PRODUCTS' ? 'PRODUCTS' : 'SERVICES') as 'SERVICES' | 'PRODUCTS',
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

  const [savingBranding, setSavingBranding] = useState(false)
  const [brandingSuccess, setBrandingSuccess] = useState(false)

  const handleBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingBranding) return
    setSavingBranding(true)
    setBrandingSuccess(false)
    try {
      await api.updateProfile(brandingForm)
      setAdminInfo(prev => prev ? { ...prev, ...brandingForm } : prev)
      showToast('Identidade visual salva com sucesso!', 'success')
      setBrandingSuccess(true)
      setTimeout(() => {
        setBrandingSuccess(false)
      }, 4000)
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar identidade visual', 'error')
    } finally {
      setSavingBranding(false)
    }
  }

  // Modals / Forms
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [waStatus, setWaStatus] = useState<{ isConfigured: boolean; provider: 'meta' | 'gateway' | 'none'; details?: string } | null>(null)
  const [waTestPhone, setWaTestPhone] = useState('')
  const [waTestLoading, setWaTestLoading] = useState(false)
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; method?: string; link?: string; error?: string } | null>(null)

  const fetchWaStatus = async () => {
    try {
      const res = await api.getWhatsAppStatus()
      setWaStatus(res)
    } catch {}
  }

  const handleTestWhatsAppSend = async () => {
    if (!waTestPhone.trim()) {
      showToast('Digite um número de telefone com DDD para testar', 'error')
      return
    }
    setWaTestLoading(true)
    setWaTestResult(null)
    try {
      const res = await api.sendWhatsAppTest(waTestPhone)
      setWaTestResult(res)
      if (res.success) {
        showToast(res.method === 'link' ? 'Link do WhatsApp gerado com sucesso!' : 'Mensagem enviada com sucesso via API!')
      } else {
        showToast(res.error || 'Falha no teste de envio', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao testar envio de WhatsApp', 'error')
    } finally {
      setWaTestLoading(false)
    }
  }

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
      fetchWaStatus()
      if (adminInfo.phone) setWaTestPhone(adminInfo.phone)
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
    duration: '30',
    photoUrl: ''
  })

  // Relatório de Faturamento por Serviço & Período (Etapa 3-F)
  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'>('thisMonth')
  const [revenueStartDate, setRevenueStartDate] = useState('')
  const [revenueEndDate, setRevenueEndDate] = useState('')
  const [revenueReportData, setRevenueReportData] = useState<{
    summary: { totalRevenue: number; pendingRevenue: number; totalCompletedBookings: number; averageTicket: number };
    byService: Array<{ serviceId: number | null; serviceName: string; totalBookings: number; completedBookings: number; totalRevenue: number; pendingRevenue: number; avgTicket: number; percentageOfTotal: number }>;
  } | null>(null)
  const [revenueLoading, setRevenueLoading] = useState(false)

  const fetchRevenueReport = useCallback(async (start?: string, end?: string) => {
    setRevenueLoading(true)
    try {
      const data = await api.getRevenueReport(start, end)
      setRevenueReportData(data)
    } catch (err) {
      console.error('Erro ao buscar relatório de faturamento:', err)
    } finally {
      setRevenueLoading(false)
    }
  }, [])

  useEffect(() => {
    let start = ''
    let end = ''
    const now = new Date()

    if (revenuePeriod === 'today') {
      start = end = now.toISOString().split('T')[0]
    } else if (revenuePeriod === 'thisWeek') {
      const day = now.getDay()
      const firstDay = new Date(now)
      firstDay.setDate(now.getDate() - day)
      start = firstDay.toISOString().split('T')[0]
      end = now.toISOString().split('T')[0]
    } else if (revenuePeriod === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    } else if (revenuePeriod === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
    } else if (revenuePeriod === 'thisYear') {
      start = `${now.getFullYear()}-01-01`
      end = `${now.getFullYear()}-12-31`
    } else if (revenuePeriod === 'custom') {
      start = revenueStartDate
      end = revenueEndDate
    }

    fetchRevenueReport(start, end)
  }, [revenuePeriod, revenueStartDate, revenueEndDate, fetchRevenueReport])

  const exportRevenueCSV = () => {
    if (!revenueReportData || revenueReportData.byService.length === 0) {
      showToast('Nenhum dado de faturamento para exportar.', 'error')
      return
    }

    let csvContent = 'data:text/csv;charset=utf-8,Serviço;Total Vendas;Atendimentos Concluídos;Faturamento Total (R$);Ticket Médio (R$);Participação (%)\n'
    revenueReportData.byService.forEach(s => {
      csvContent += `"${s.serviceName}";${s.totalBookings};${s.completedBookings};${s.totalRevenue.toFixed(2)};${s.avgTicket.toFixed(2)};${s.percentageOfTotal}%\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio_faturamento_servicos_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Relatório de faturamento exportado em CSV!', 'success')
  }

  //  Security & Access Control Module States (RBAC)
  const [securityPermissions, setSecurityPermissions] = useState<UserPermissionItem[]>([])
  const [loadingSecurity, setLoadingSecurity] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [editingSecurityPerm, setEditingSecurityPerm] = useState<UserPermissionItem | null>(null)
  const [showOperatorPassword, setShowOperatorPassword] = useState(false)
  const [securityForm, setSecurityForm] = useState({
    userName: '',
    email: '',
    password: '',
    roleTitle: 'Operador',
    // Operacional
    canAgendamentos: true,
    canEstornos: false,
    canClientes: true,
    canHorarios: true,
    // Comercial
    canServicos: false,
    canLinks: false,
    canCupons: false,
    canMemberships: false,
    // Gestão & Finanças
    canFinanceiro: false,
    canRh: false,
    canFaturamento: false,
    // Sistema & Ajustes
    canSeguranca: false,
    canPersonalizar: false,
    canSocial: false,
    canAudit: false,
    canTrash: false,
    active: true,
  })

  const fetchSecurityPermissions = useCallback(async () => {
    setLoadingSecurity(true)
    try {
      const data = await api.getSecurityPermissions()
      setSecurityPermissions(data)
    } catch (err: any) {
      console.error('Erro ao buscar permissões de segurança:', err)
    } finally {
      setLoadingSecurity(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'seguranca') {
      fetchSecurityPermissions()
    }
  }, [activeTab, fetchSecurityPermissions])

  const openNewSecurityModal = () => {
    setEditingSecurityPerm(null)
    setShowOperatorPassword(false)
    setSecurityForm({
      userName: '',
      email: '',
      password: '',
      roleTitle: 'Operador',
      canAgendamentos: true,
      canEstornos: false,
      canClientes: true,
      canHorarios: true,
      canServicos: false,
      canLinks: false,
      canCupons: false,
      canMemberships: false,
      canFinanceiro: false,
      canRh: false,
      canFaturamento: false,
      canSeguranca: false,
      canPersonalizar: false,
      canSocial: false,
      canAudit: false,
      canTrash: false,
      active: true,
    })
    setShowSecurityModal(true)
  }

  const openEditSecurityModal = (item: UserPermissionItem) => {
    setEditingSecurityPerm(item)
    setShowOperatorPassword(false)
    setSecurityForm({
      userName: item.userName,
      email: item.email || '',
      password: '',
      roleTitle: item.roleTitle || 'Operador',
      canAgendamentos: item.canAgendamentos ?? true,
      canEstornos: item.canEstornos ?? false,
      canClientes: item.canClientes ?? true,
      canHorarios: item.canHorarios ?? true,
      canServicos: item.canServicos ?? false,
      canLinks: item.canLinks ?? false,
      canCupons: item.canCupons ?? false,
      canMemberships: item.canMemberships ?? false,
      canFinanceiro: item.canFinanceiro ?? false,
      canRh: item.canRh ?? false,
      canFaturamento: item.canFaturamento ?? false,
      canSeguranca: item.canSeguranca ?? false,
      canPersonalizar: item.canPersonalizar ?? false,
      canSocial: item.canSocial ?? false,
      canAudit: item.canAudit ?? false,
      canTrash: item.canTrash ?? false,
      active: item.active,
    })
    setShowSecurityModal(true)
  }

  const handleApplyRolePreset = (preset: 'admin' | 'gerente' | 'recepcionista' | 'financeiro' | 'profissional') => {
    if (preset === 'admin') {
      setSecurityForm(prev => ({
        ...prev,
        roleTitle: 'Gestor Principal',
        canAgendamentos: true, canEstornos: true, canClientes: true, canHorarios: true,
        canServicos: true, canLinks: true, canCupons: true, canMemberships: true,
        canFinanceiro: true, canRh: true, canFaturamento: true,
        canSeguranca: true, canPersonalizar: true, canSocial: true, canAudit: true, canTrash: true,
      }))
    } else if (preset === 'gerente') {
      setSecurityForm(prev => ({
        ...prev,
        roleTitle: 'Gerente de Operação',
        canAgendamentos: true, canEstornos: true, canClientes: true, canHorarios: true,
        canServicos: true, canLinks: true, canCupons: true, canMemberships: true,
        canFinanceiro: false, canRh: false, canFaturamento: false,
        canSeguranca: false, canPersonalizar: true, canSocial: true, canAudit: true, canTrash: true,
      }))
    } else if (preset === 'recepcionista') {
      setSecurityForm(prev => ({
        ...prev,
        roleTitle: 'Recepcionista / Atendente',
        canAgendamentos: true, canEstornos: true, canClientes: true, canHorarios: true,
        canServicos: false, canLinks: false, canCupons: true, canMemberships: false,
        canFinanceiro: false, canRh: false, canFaturamento: false,
        canSeguranca: false, canPersonalizar: false, canSocial: false, canAudit: false, canTrash: false,
      }))
    } else if (preset === 'financeiro') {
      setSecurityForm(prev => ({
        ...prev,
        roleTitle: 'Financeiro / Contabilidade',
        canAgendamentos: true, canEstornos: false, canClientes: true, canHorarios: false,
        canServicos: false, canLinks: false, canCupons: false, canMemberships: false,
        canFinanceiro: true, canRh: false, canFaturamento: true,
        canSeguranca: false, canPersonalizar: false, canSocial: false, canAudit: false, canTrash: false,
      }))
    } else if (preset === 'profissional') {
      setSecurityForm(prev => ({
        ...prev,
        roleTitle: 'Profissional / Atendedor',
        canAgendamentos: true, canEstornos: false, canClientes: true, canHorarios: true,
        canServicos: true, canLinks: true, canCupons: false, canMemberships: false,
        canFinanceiro: false, canRh: false, canFaturamento: false,
        canSeguranca: false, canPersonalizar: false, canSocial: false, canAudit: false, canTrash: false,
      }))
    }
  }

  const handleSaveSecurityPermission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!securityForm.userName.trim()) {
      showToast('Digite o nome do operador ou perfil.', 'error')
      return
    }

    try {
      if (editingSecurityPerm) {
        await api.updateSecurityPermission(editingSecurityPerm.id, securityForm)
        showToast('Perfil de permissões atualizado com sucesso!')
      } else {
        await api.createSecurityPermission(securityForm)
        showToast('Novo operador/perfil de segurança criado com sucesso!')
      }
      setShowSecurityModal(false)
      fetchSecurityPermissions()
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar regras de segurança.', 'error')
    }
  }

  const handleDeleteSecurityPermission = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este perfil de permissão?')) return
    try {
      await api.deleteSecurityPermission(id)
      showToast('Perfil de permissão excluído!')
      fetchSecurityPermissions()
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir perfil.', 'error')
    }
  }

  const handleToggleSecurityActive = async (item: UserPermissionItem) => {
    try {
      await api.updateSecurityPermission(item.id, { active: !item.active })
      showToast(`Status de ${item.userName} alterado para ${!item.active ? 'Ativo' : 'Inativo'}`)
      fetchSecurityPermissions()
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar status.', 'error')
    }
  }

  // Booking Management States
  const [searchBookingQuery, setSearchBookingQuery] = useState('')
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
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
  }, [bookings, searchBookingQuery])
  const [showNewBookingModal, setShowNewBookingModal] = useState(false)
  const [showDeleteSlotModal, setShowDeleteSlotModal] = useState(false)
  const [slotToDelete, setSlotToDelete] = useState<number | null>(null)
  const [slotToDeleteTime, setSlotToDeleteTime] = useState('')
  const [deleteAllDayFreeSlots, setDeleteAllDayFreeSlots] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [newBookingData, setNewBookingData] = useState({
    linkId: '',
    date: '',
    time: '',
    clientName: '',
    clientPhone: ''
  })

  const handleToggleBusinessType = async (targetType?: 'SERVICES' | 'PRODUCTS') => {
    const currentType = adminInfo?.businessType === 'PRODUCTS' ? 'PRODUCTS' : 'SERVICES'
    const newType = targetType || (currentType === 'PRODUCTS' ? 'SERVICES' : 'PRODUCTS')
    try {
      await api.updateProfile({ businessType: newType })
      setAdminInfo(prev => prev ? { ...prev, businessType: newType } : null)
      showToast(
        newType === 'PRODUCTS'
          ? '🧁 Modo BoraEnkomenda (Produção & Encomendas) ativado com sucesso!'
          : '📅 Modo BoraMarka (Serviços & Agendamentos) ativado com sucesso!',
        'success'
      )
      setActiveTab('overview')
      fetchData(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao alternar modelo de negócio', 'error')
    }
  }

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

  const isMaster = useMemo(() => {
    const role = localStorage.getItem('role') || sessionStorage.getItem('role') || (adminInfo as any)?.role
    const username = localStorage.getItem('username') || sessionStorage.getItem('username') || adminInfo?.username
    const superToken = sessionStorage.getItem('superadmin_token')

    if (
      role === 'superadmin' || 
      username === 'odonodoboramarka' || 
      adminInfo?.username === 'odonodoboramarka' || 
      (adminInfo as any)?.role === 'superadmin' || 
      !!superToken
    ) {
      return true
    }

    try {
      const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}')
      if (u.role === 'superadmin' || u.username === 'odonodoboramarka') return true
    } catch (e) {}

    return false
  }, [adminInfo])
  
  const hasBanner = !isMaster && !!(subscription && (
    subscription.status === 'inactive' || 
    (subscription.status === 'trialing' && subscription.trialEndsAt && new Date(subscription.trialEndsAt).getTime() > new Date().getTime())
  ))
  
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const [s, f, l, b, t, p, sv, dl, subStatus, cpList, googleStatus, plans, subs, usage, analyticsRes] = await Promise.all([
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
        api.getClientSubscriptions().catch(() => []),
        api.getSubscriptionUsage().catch(() => null),
        api.getAnalytics().catch(() => null)
      ])
      setStats(s)
      setFinanceStats(f)
      setLinks(l)
      setBookings(b)
      setTransactions(t)
      setAdminInfo(p)
      if (p && p.isOperator && p.currentOperator) {
        setOperatorSession(p.currentOperator)
      } else {
        setOperatorSession(null)
      }
      setServices(sv)
      setDeletedLinks(dl)
      setCoupons(cpList || [])
      setIsGoogleConnected(!!googleStatus?.connected)
      setGoogleEmail(googleStatus?.email || '')
      setMembershipPlans(plans || [])
      setClientSubscriptions(subs || [])
      
      const checkMaster = (p && ((p as any).role === 'superadmin' || p.username === 'odonodoboramarka')) ||
        localStorage.getItem('role') === 'superadmin' ||
        localStorage.getItem('username') === 'odonodoboramarka' ||
        !!sessionStorage.getItem('superadmin_token');

      if (checkMaster) {
        setSubscription({ plan: 'premium', status: 'active', expiresAt: null, trialEndsAt: null })
      } else if (subStatus) {
        setSubscription(subStatus)
      }
      if (usage) setUsageData(usage)
      if (analyticsRes) setAnalyticsData(analyticsRes)
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
      document.documentElement.style.colorScheme = 'dark'
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
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
        showToast('Parabéns! Sua assinatura foi ativada com sucesso. ', 'success')
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
        showToast('Google Agenda integrado com sucesso! ', 'success')
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
    const superadminToken = localStorage.getItem('superadminToken') || sessionStorage.getItem('superadmin_token') || localStorage.getItem('superadmin_token')
    if (superadminToken) {
      localStorage.setItem('token', superadminToken)
      localStorage.setItem('role', 'superadmin')
      localStorage.removeItem('superadminToken')
      localStorage.removeItem('superadmin_token')
      sessionStorage.removeItem('superadmin_token')
      window.location.href = '/superadmin'
    }
  }

  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    return 'Notification' in window && Notification.permission === 'granted'
  })

  const handleTogglePushNotifications = async () => {
    if (!('Notification' in window)) {
      showToast('Seu navegador não suporta Notificações Push.', 'error')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const sw = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        const { vapidPublicKey, configured } = await api.getVapidKey()
        if (configured && vapidPublicKey) {
          const urlBase64ToUint8Array = (base64String: string) => {
            const padding = '='.repeat((4 - base64String.length % 4) % 4)
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
            const rawData = window.atob(base64)
            const outputArray = new Uint8Array(rawData.length)
            for (let i = 0; i < rawData.length; ++i) {
              outputArray[i] = rawData.charCodeAt(i)
            }
            return outputArray
          }
          const sub = await sw.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          })
          await api.subscribeAdminPush(sub.toJSON())
        }
        setPushEnabled(true)
        showToast('Notificações no Navegador ativadas! Você receberá alertas de novos agendamentos.', 'success')
      } else {
        setPushEnabled(false)
        showToast('Permissão de notificação negada no navegador.', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Notificações ativadas no navegador.', 'success')
      setPushEnabled(true)
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

  const handleGoToPlans = () => {
    setActiveTab('faturamento')
    setTimeout(() => {
      const el = document.getElementById('plans-section')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
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
        duration: parseInt(serviceForm.duration),
        photoUrl: serviceForm.photoUrl || '',
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
      setServiceForm({ name: '', description: '', price: '', duration: '30', photoUrl: '' })
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
    const isTrial = subscription?.status === 'trialing'
    const isPremiumActive = subscription?.plan === 'premium' && subscription?.status === 'active'
    const storedUserStr = localStorage.getItem('user')
    let isMaster = false
    try {
      if (storedUserStr) {
        const parsed = JSON.parse(storedUserStr)
        if (parsed.role === 'superadmin' || parsed.username === 'odonodoboramarka') isMaster = true
      }
    } catch (e) {}

    if (!isTrial && !isPremiumActive && !isMaster) return

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

  const fetchRhData = useCallback(async () => {
    try {
      const [stubs, vacs, anns, reqs] = await Promise.all([
        api.getEmployeePaystubs().catch(() => []),
        api.getEmployeeVacationRequests().catch(() => []),
        api.getEmployeeAnnouncements().catch(() => []),
        api.getEmployeeProfileRequests().catch(() => []),
      ])
      setRhPaystubs(stubs || [])
      setRhVacations(vacs || [])
      setRhAnnouncements(anns || [])
      setRhProfileRequests(reqs || [])
    } catch (e) {}
  }, [])

  useEffect(() => {
    if (activeTab === 'rh') {
      fetchEmployees()
      fetchRhData()
    }
  }, [activeTab, fetchEmployees, fetchRhData])

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
      showToast(newStatus === 'CONCLUIDO' ? 'Agendamento concluído com sucesso! ' : 'Status alterado')
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
      {!isMaster && subscription && subscription.status === 'trialing' && subscription.trialEndsAt && (
        <TrialBanner 
          trialEndsAt={subscription.trialEndsAt} 
          onCheckout={handleGoToPlans} 
          onLogout={handleLogout}
          onRestoreSuperAdmin={sessionStorage.getItem('superadmin_token') ? handleRestoreSuperAdmin : null}
        />
      )}

      {/* Inactive Account Banner (when expired/inactive) */}
      {!isMaster && subscription && subscription.status === 'inactive' && (
        <InactiveBanner 
          onSubscribe={handleGoToPlans} 
          onLogout={handleLogout}
          onRestoreSuperAdmin={sessionStorage.getItem('superadmin_token') ? handleRestoreSuperAdmin : null}
        />
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onCheckout={handleCheckout}
        businessType={adminInfo?.businessType === 'PRODUCTS' ? 'PRODUCTS' : 'SERVICES'}
      />

      {/* Gerenciador de Vertical & Assinatura (BoraMarka vs BoraEnkomenda) */}
      <ProductAndSubscriptionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        adminInfo={adminInfo}
        subscription={subscription}
        isSuperAdmin={isMaster}
        onUpdateSuccess={() => fetchData(true)}
        showToast={showToast}
        onOpenPaywall={() => setShowPaywall(true)}
      />

      {/* PDF Export Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-3 sm:p-6 text-center animate-fade-in" style={{ position: 'fixed' }}>
          <div className="bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 p-5 sm:p-8 max-h-[90vh] overflow-y-auto rounded-3xl max-w-md w-full shadow-2xl relative text-left animate-scale-up">
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
                        <span className="text-2xl"></span>
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

      {/* SuperAdmin Impersonation Banner */}
      {(localStorage.getItem('superadminToken') || sessionStorage.getItem('superadmin_token') || localStorage.getItem('superadmin_token')) && (
        <div className="bg-gradient-to-r from-amber-500 via-pink-600 to-violet-600 text-white px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs font-bold shadow-md relative z-50">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="font-black uppercase tracking-wider text-[11px] sm:text-xs">Modo de Teste (SuperAdmin Impersonando)</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switch Button for SuperAdmin */}
            <button
              onClick={() => handleToggleBusinessType()}
              className="bg-black/30 hover:bg-black/45 text-white border border-white/30 px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Trocar modelo da conta entre BoraMarka e BoraEnkomenda"
            >
              <Repeat className="w-3.5 h-3.5 text-amber-300" />
              <span>
                Mudar para: {adminInfo?.businessType === 'PRODUCTS' ? '📅 BoraMarka (Serviços)' : '🧁 BoraEnkomenda (Produção)'}
              </span>
            </button>

            <button
              onClick={() => setShowProductModal(true)}
              className="bg-black/20 hover:bg-black/35 text-white border border-white/20 px-2.5 py-1.5 rounded-xl font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
              title="Gerenciar plano e detalhes de assinatura"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Assinatura</span>
            </button>

            <button
              onClick={handleRestoreSuperAdmin}
              className="bg-white text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-wider shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Voltar ao SuperAdmin</span>
            </button>
          </div>
        </div>
      )}

      {/* Navbar Premium — Glass Island */}
      <header 
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

            <div 
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group/brand select-none"
              title="Clique para gerenciar sua assinatura e modelo de negócio (BoraMarka vs BoraEnkomenda)"
            >
              {adminInfo?.businessType === 'PRODUCTS' ? (
                <>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-pink-500/25 shrink-0 group-hover/brand:scale-105 transition-transform">
                    <ShoppingBag className="w-4.5 h-4.5" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <h1 className="font-extrabold text-[15px] text-slate-800 dark:text-white/90 leading-tight tracking-tight">
                        Bora<span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Enkomenda</span>
                      </h1>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-pink-500/15 text-pink-500 dark:text-pink-400 border border-pink-500/25 px-1.5 py-0.2 rounded group-hover/brand:bg-pink-500 group-hover/brand:text-white transition-colors">
                        Produção ▾
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-[0.12em] mt-0.5">
                      Cardápio digital, pedidos & produção
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <BoraMarkaLogo size="md" showText={false} />
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <h1 className="font-extrabold text-[15px] text-slate-800 dark:text-white/90 leading-tight tracking-tight">
                        Bora<span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">Marka</span>
                      </h1>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-violet-500/15 text-violet-500 dark:text-violet-400 border border-violet-500/25 px-1.5 py-0.2 rounded group-hover/brand:bg-violet-500 group-hover/brand:text-white transition-colors">
                        Serviços ▾
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-[0.12em] mt-0.5">
                      Sua agenda cheia, sem complicação
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Global Header Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-4 lg:mx-8">
            <div className="w-full relative group">
              <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] group-hover:border-violet-500/40 focus-within:border-violet-500/80 focus-within:ring-2 focus-within:ring-violet-500/20 rounded-xl px-3 py-1.5 transition-all duration-200 shadow-inner">
                <Search className="w-4 h-4 text-slate-400 dark:text-white/40 group-focus-within:text-violet-500 transition-colors shrink-0" />
                <input
                  ref={headerSearchInputRef}
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder={adminInfo?.businessType === 'PRODUCTS' ? "Buscar cliente, produto ou encomenda..." : "Buscar cliente, serviço ou agendamento..."}
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
             {(localStorage.getItem('superadminToken') || sessionStorage.getItem('superadmin_token') || localStorage.getItem('superadmin_token')) && (
               <button 
                 onClick={handleRestoreSuperAdmin}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 via-pink-600 to-violet-600 text-white font-black text-[10px] sm:text-xs rounded-xl uppercase tracking-wider transition-all hover:opacity-90 shadow-md cursor-pointer shrink-0 animate-pulse"
                 title="Voltar ao Painel SuperAdmin"
               >
                 <Crown className="w-3.5 h-3.5 text-amber-200" />
                 <span>Voltar SuperAdmin</span>
               </button>
             )}
              {/* Web Push Notification Toggle */}
              <button
                onClick={handleTogglePushNotifications}
                className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                  pushEnabled
                    ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'text-slate-400 dark:text-white/30 hover:text-slate-650 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
                title={pushEnabled ? 'Notificações Push no Navegador Ativas' : 'Ativar Notificações no Navegador'}
              >
                <Bell className={`w-4.5 h-4.5 ${pushEnabled ? 'text-emerald-500' : ''}`} />
              </button>

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
                       {!operatorSession && (
                         <div className="flex items-center gap-1.5">
                           <button 
                             onClick={() => setShowProductModal(true)} 
                             className="text-slate-400 dark:text-white/25 hover:text-pink-500 transition-colors" 
                             title="Gerenciar Modelo & Assinatura (BoraMarka vs BoraEnkomenda)"
                           >
                             <Repeat className="w-3 h-3" />
                           </button>
                           <button 
                             onClick={() => subscription?.status === 'inactive' ? setShowPaywall(true) : openEditProfile()} 
                             className="text-slate-400 dark:text-white/25 hover:text-violet-650 dark:hover:text-violet-400 transition-colors" 
                             title="Editar Perfil"
                           >
                             <Pencil className="w-3 h-3" />
                           </button>
                         </div>
                       )}
                     </div>
                     <p className="text-[10px] text-violet-400 font-bold mt-0.5">
                       {operatorSession ? ` ${operatorSession.userName} (${operatorSession.roleTitle})` : `@${adminInfo.username.toLowerCase()}`}
                     </p>
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

        {/* Subcabeçalho Mobile — Título do Módulo Ativo com Espaçamento Limpo */}
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

      {/* Mobile Drawer Menu Overlay */}
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

            {/* Card de Destaque BoraEnkomenda APENAS para profissionais de Encomendas */}
            {currentBusinessType === 'PRODUCTS' && (
              <button
                onClick={() => {
                  setActiveTab('boraencomenda')
                  setMobileMenuOpen(false)
                }}
                className={`w-full p-4 rounded-2xl flex items-center justify-between font-bold text-sm transition-all mb-4 ${
                  activeTab === 'boraencomenda'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 ring-2 ring-pink-400'
                    : 'bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-pink-500/15 border border-pink-500/30 text-white hover:border-pink-500/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-pink-500 text-white shadow-md shadow-pink-500/30 shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">BoraEnkomenda</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-pink-500 text-white uppercase tracking-wider">
                        Vitrine & Pedidos
                      </span>
                    </div>
                    <p className="text-[11px] text-pink-400 dark:text-pink-300 font-medium">Cardápio, vitrine pública e Kanban</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-pink-400 shrink-0" />
              </button>
            )}

            <div className="space-y-3 pb-6">
              {filteredNavCategories.map(cat => {
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
                                } else if (item.id === 'recebimentos') {
                                  setPixInputKey(adminInfo?.pixKey || '')
                                  setMpInputToken(adminInfo?.mpAccessToken || '')
                                  setShowMpConfigModal(true)
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
        
        {/* Desktop Categorized Dropdown Navbar */}
        <div ref={dropdownRef} className="hidden md:flex items-center justify-start gap-2.5 mb-8 relative z-30 flex-wrap">
          {filteredNavCategories.map(cat => {
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
                              } else if (item.id === 'recebimentos') {
                                setPixInputKey(adminInfo?.pixKey || '')
                                setMpInputToken(adminInfo?.mpAccessToken || '')
                                setShowMpConfigModal(true)
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
        {/* TAB: BoraIA */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'boraia' && (
          <BoraIaTab subscription={subscription} adminInfo={adminInfo} showToast={showToast} />
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: BoraEnkomenda */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'boraencomenda' && (
          <BoraEncomendaTab
            user={adminInfo}
            subscription={subscription}
            setShowPaywall={setShowPaywall}
            onNavigateTab={setActiveTab}
            showToast={showToast}
          />
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: Overview */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            financeStats={financeStats}
            services={services}
            links={links}
            bookings={bookings}
            analyticsData={analyticsData}
            adminInfo={adminInfo}
            setActiveTab={setActiveTab as any}
            setPixInputKey={setPixInputKey}
            setMpInputToken={setMpInputToken}
            setShowMpConfigModal={setShowMpConfigModal}
          />
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: Financeiro */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'financeiro' && (
          <FinanceiroTab
            adminInfo={adminInfo}
            onUpdateAdminInfo={(newInfo) => {
              setAdminInfo((prev) => (prev ? { ...prev, ...newInfo } : newInfo))
            }}
            exportRevenueCSV={exportRevenueCSV}
            openPdfExportModal={openPdfExportModal}
            revenuePeriod={revenuePeriod}
            setRevenuePeriod={setRevenuePeriod}
            revenueStartDate={revenueStartDate}
            setRevenueStartDate={setRevenueStartDate}
            revenueEndDate={revenueEndDate}
            setRevenueEndDate={setRevenueEndDate}
            revenueReportData={revenueReportData}
            revenueLoading={revenueLoading}
            exportFinanceToCSV={exportFinanceToCSV}
            filteredTransactions={filteredTransactions}
            showToast={showToast}
            transactions={transactions}
            setShowNewTransaction={setShowNewTransaction}
            filteredFinanceStats={filteredFinanceStats}
            financeSearchQuery={financeSearchQuery}
            setFinanceSearchQuery={setFinanceSearchQuery}
            financePaidFilter={financePaidFilter}
            setFinancePaidFilter={setFinancePaidFilter}
            financeCategoryFilter={financeCategoryFilter}
            setFinanceCategoryFilter={setFinanceCategoryFilter}
            uniqueCategories={uniqueCategories}
            financeDateRange={financeDateRange}
            setFinanceDateRange={setFinanceDateRange}
            financeStartDate={financeStartDate}
            setFinanceStartDate={setFinanceStartDate}
            financeEndDate={financeEndDate}
            setFinanceEndDate={setFinanceEndDate}
            financeFilter={financeFilter}
            setFinanceFilter={setFinanceFilter}
            handleToggleTx={handleToggleTx}
            handleDeleteTx={handleDeleteTx}
            onRefreshData={() => fetchData(false)}
          />
        )}

        {activeTab === 'estornos' && (
          <div className="animate-slide-up space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                  <RotateCcw className="w-6 h-6 text-amber-500" />
                  Central de Estornos & Reembolsos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Gerencie o reembolso de agendamentos cancelados que continham sinal ou pagamento efetuado.
                </p>
              </div>
              <button
                onClick={fetchRefundRequests}
                className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs border border-slate-200 dark:border-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar Lista
              </button>
            </div>

            <div className="grid gap-4">
              {refundRequests.map(item => {
                const isPending = item.refundStatus === 'PENDING'
                const serviceName = item.timeSlot?.link?.service?.name || 'Serviço'
                const isProcessing = processingRefundId === item.id

                return (
                  <div key={item.id} className="bg-white dark:bg-[#0d0d12]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">{item.clientName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">({item.clientPhone})</span>
                        {isPending ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
                            Estorno Pendente
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            Estornado / Reembolsado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Serviço: <strong className="text-slate-900 dark:text-white">{serviceName}</strong> • Data: <strong className="text-slate-900 dark:text-white">{formatDate(item.timeSlot?.date || '')} às {item.timeSlot?.time}</strong>
                      </p>
                      {item.cancellationCode && (
                        <p className="text-[11px] text-slate-400 font-mono">
                          Cód: {item.cancellationCode} {item.mpPaymentId ? `• Ref MP: ${item.mpPaymentId}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-white/5 pt-3 md:pt-0">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Valor a Estornar</p>
                        <p className="text-lg font-black text-amber-500 dark:text-amber-400">
                          {formatCurrency(item.paidAmount || 0)}
                        </p>
                      </div>

                      {isPending ? (
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Confirma o estorno de ${formatCurrency(item.paidAmount || 0)} para ${item.clientName}?`)) return
                            setProcessingRefundId(item.id)
                            try {
                              const res = await api.processRefund(item.id)
                              setToast({ message: res.message || 'Estorno realizado com sucesso!', type: 'success' })
                              fetchRefundRequests()
                            } catch (err: any) {
                              setToast({ message: err.message || 'Erro ao processar estorno.', type: 'error' })
                            } finally {
                              setProcessingRefundId(null)
                            }
                          }}
                          disabled={isProcessing}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 text-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                          Realizar Estorno
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Concluído
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {refundRequests.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-[#0d0d12]/40 rounded-3xl border border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-600 italic">
                  Nenhuma solicitação de estorno pendente.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* Other Tabs (Simplified logic from before) */}
        {/* ═══════════════════════════════════════════ */}
        
        {activeTab === 'agendamentos' && (
          <AgendamentosTab
            searchBookingQuery={searchBookingQuery}
            setSearchBookingQuery={setSearchBookingQuery}
            exportBookingsToCSV={exportBookingsToCSV}
            filteredBookings={filteredBookings}
            showToast={showToast}
            openPdfExportModal={openPdfExportModal}
            bookings={bookings}
            setShowNewBookingModal={setShowNewBookingModal}
            handleToggleBookingDone={handleToggleBookingDone}
            handleConfirmBooking={handleConfirmBooking}
            handleCancelBooking={handleCancelBooking}
            handleSaveBookingNotes={handleSaveBookingNotes}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarioTab
            bookings={bookings}
            setShowNewBookingModal={setShowNewBookingModal}
            handleToggleBookingDone={handleToggleBookingDone}
            handleConfirmBooking={handleConfirmBooking}
            handleCancelBooking={handleCancelBooking}
            showToast={showToast}
          />
        )}

        {activeTab === 'fila' && (
          <FilaEsperaTab showToast={showToast} />
        )}

        {activeTab === 'pdv' && (
          <PDVTab
            services={services}
            showToast={showToast}
          />
        )}

        {activeTab === 'estoque' && (
          <EstoqueTab showToast={showToast} companyCnpj={adminInfo?.cnpj} />
        )}

        {activeTab === 'marketing' && (
          <MarketingTab showToast={showToast} />
        )}

        {activeTab === 'horarios' && (
          <HorariosTab
            slotDate={slotDate}
            setSlotDate={setSlotDate}
            calendarMonth={calendarMonth}
            setCalendarMonth={setCalendarMonth}
            isGoogleConnected={isGoogleConnected}
            googleEmail={googleEmail}
            setIsGoogleConnected={setIsGoogleConnected}
            setGoogleEmail={setGoogleEmail}
            showToast={showToast}
            selectedLinkId={selectedLinkId}
            setSelectedLinkId={setSelectedLinkId}
            links={links}
            services={services}
            slotInterval={slotInterval}
            setSlotInterval={setSlotInterval}
            isSingleSlot={isSingleSlot}
            setIsSingleSlot={setIsSingleSlot}
            slotStartTime={slotStartTime}
            setSlotStartTime={setSlotStartTime}
            slotEndTime={slotEndTime}
            setSlotEndTime={setSlotEndTime}
            handleCreateSlots={handleCreateSlots}
            slotsByDate={slotsByDate}
            handleDeleteSlot={handleDeleteSlot}
          />
        )}

        {activeTab === 'servicos' && (
          <ServicosTab
            subscription={subscription}
            setShowPaywall={setShowPaywall}
            setEditingService={setEditingService}
            setServiceForm={setServiceForm}
            setShowNewService={setShowNewService}
            services={services}
            handleDeleteService={handleDeleteService}
          />
        )}

        {activeTab === 'links' && (
          <LinksTab
            adminInfo={adminInfo}
            showToast={showToast}
            setActiveTab={setActiveTab}
            editingLink={editingLink}
            editLinkTitle={editLinkTitle}
            setEditLinkTitle={setEditLinkTitle}
            editLinkServiceId={editLinkServiceId}
            setEditLinkServiceId={setEditLinkServiceId}
            services={services}
            editLinkBookingFeeEnabled={editLinkBookingFeeEnabled}
            setEditLinkBookingFeeEnabled={setEditLinkBookingFeeEnabled}
            editLinkBookingFeeAmount={editLinkBookingFeeAmount}
            setEditLinkBookingFeeAmount={setEditLinkBookingFeeAmount}
            handleUpdateLink={handleUpdateLink}
            setEditingLink={setEditingLink}
            showNewLink={showNewLink}
            setShowNewLink={setShowNewLink}
            newLinkTitle={newLinkTitle}
            setNewLinkTitle={setNewLinkTitle}
            newLinkServiceId={newLinkServiceId}
            setNewLinkServiceId={setNewLinkServiceId}
            newLinkBookingFeeEnabled={newLinkBookingFeeEnabled}
            setNewLinkBookingFeeEnabled={setNewLinkBookingFeeEnabled}
            newLinkBookingFeeAmount={newLinkBookingFeeAmount}
            setNewLinkBookingFeeAmount={setNewLinkBookingFeeAmount}
            handleCreateLink={handleCreateLink}
            links={links}
            startEditingLink={startEditingLink}
            handleDeleteLink={handleDeleteLink}
          />
        )}

        {activeTab === 'clientes' && (
          <ClientesTab
            clientSearch={clientSearch}
            setClientSearch={setClientSearch}
            aggregatedClients={aggregatedClients}
            handleOpenClientDetails={handleOpenClientDetails}
          />
        )}

        {activeTab === 'personalizar' && (
          <PersonalizarTab
            handleBrandingSubmit={handleBrandingSubmit}
            brandingForm={brandingForm}
            setBrandingForm={setBrandingForm}
            brandingAvatarInputRef={brandingAvatarInputRef}
            handleBrandingAvatarChange={handleBrandingAvatarChange}
            brandingBannerInputRef={brandingBannerInputRef}
            handleBrandingBannerChange={handleBrandingBannerChange}
            adminInfo={adminInfo}
            subscription={subscription}
            showToast={showToast}
            savingBranding={savingBranding}
            brandingSuccess={brandingSuccess}
          />
        )}
        {activeTab === 'faturamento' && (
          <FaturamentoTab
            subscription={subscription}
            usageData={usageData}
            handleCheckout={handleCheckout}
            businessType={adminInfo?.businessType === 'PRODUCTS' ? 'PRODUCTS' : 'SERVICES'}
            onToggleBusinessType={handleToggleBusinessType}
          />
        )}
        {activeTab === 'cupons' && (
          <CuponsTab
            handleCreateCoupon={handleCreateCoupon}
            couponForm={couponForm}
            setCouponForm={setCouponForm}
            coupons={coupons}
            handleDeleteCoupon={handleDeleteCoupon}
          />
        )}

        {activeTab === 'memberships' && (
          <MembershipsTab
            clientSubscriptions={clientSubscriptions}
            membershipPlans={membershipPlans}
            handleCreateMembershipPlan={handleCreateMembershipPlan}
            planForm={planForm}
            setPlanForm={setPlanForm}
            handleCreateClientSubscription={handleCreateClientSubscription}
            subForm={subForm}
            setSubForm={setSubForm}
            handleDeleteMembershipPlan={handleDeleteMembershipPlan}
            handleDeleteClientSubscription={handleDeleteClientSubscription}
          />
        )}
        {activeTab === 'estornos' && (
          <EstornosTab
            refundRequests={refundRequests}
            processingRefundId={processingRefundId}
            handleApproveRefund={async (id: number) => {
              setProcessingRefundId(id)
              try {
                await api.processRefund(id)
                showToast('Estorno aprovado e reembolso processado no Mercado Pago!')
                fetchRefundRequests()
              } catch (err: any) {
                showToast(err.message || 'Erro ao aprovar estorno', 'error')
              } finally {
                setProcessingRefundId(null)
              }
            }}
            handleRejectRefund={async (id: number) => {
              if (!confirm('Deseja rejeitar este pedido de estorno?')) return
              setProcessingRefundId(id)
              try {
                await api.processRefund(id)
                showToast('Solicitação de estorno processada.')
                fetchRefundRequests()
              } catch (err: any) {
                showToast(err.message || 'Erro ao rejeitar estorno', 'error')
              } finally {
                setProcessingRefundId(null)
              }
            }}
          />
        )}
        {activeTab === 'trash' && (
          <TrashTab
            deletedLinks={deletedLinks}
            handleRestoreLink={async (id: number) => {
              try {
                await api.restoreLink(id)
                showToast('Link restaurado com sucesso!')
                fetchData()
              } catch (err: any) {
                showToast(err.message, 'error')
              }
            }}
            handlePermanentDeleteLink={async (id: number) => {
              if (!confirm('Deseja excluir permanentemente este link? Esta ação não pode ser desfeita.')) return
              try {
                await api.deleteLinkPermanent(id)
                showToast('Link excluído permanentemente!')
                fetchData()
              } catch (err: any) {
                showToast(err.message, 'error')
              }
            }}
          />
        )}

        {activeTab === 'rh' && (
          <RHTab
            subscription={subscription}
            isMaster={isMaster}
            setActiveTab={setActiveTab}
            setEditingEmployee={setEditingEmployee}
            setEmployeeForm={setEmployeeForm}
            setEmployeeModalOpen={setEmployeeModalOpen}
            employees={employees}
            rhSubTab={rhSubTab}
            setRhSubTab={setRhSubTab}
            rhPaystubs={rhPaystubs}
            rhVacations={rhVacations}
            rhProfileRequests={rhProfileRequests}
            rhAnnouncements={rhAnnouncements}
            rhSearch={rhSearch}
            setRhSearch={setRhSearch}
            rhPendingStatusFilter={rhPendingStatusFilter}
            setRhPendingStatusFilter={setRhPendingStatusFilter}
            rhPendingTypeFilter={rhPendingTypeFilter}
            setRhPendingTypeFilter={setRhPendingTypeFilter}
            loadingEmployees={loadingEmployees}
            openDocManager={openDocManager}
            openEditEmployee={openEditEmployee}
            openDismissModal={openDismissModal}
            handleResolvePending={handleResolvePending}
            handleArchiveEmployee={handleArchiveEmployee}
            handleRestoreEmployee={handleRestoreEmployee}
            handleDeleteEmployee={handleDeleteEmployee}
            setPortalLinkModal={setPortalLinkModal}
            showToast={showToast}
            fetchEmployees={fetchEmployees}
            fetchRhData={fetchRhData}
            setRhPaystubModalOpen={setRhPaystubModalOpen}
            setRhAnnouncementModalOpen={setRhAnnouncementModalOpen}
          />
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: Logs de Auditoria & Registro de Ações */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <AuditTab
            auditSearch={auditSearch}
            setAuditSearch={setAuditSearch}
            auditSeverityFilter={auditSeverityFilter}
            setAuditSeverityFilter={setAuditSeverityFilter}
            auditEntityFilter={auditEntityFilter}
            setAuditEntityFilter={setAuditEntityFilter}
            loadingAuditLogs={loadingAuditLogs}
            auditLogs={auditLogs}
            fetchAuditLogs={fetchAuditLogs}
          />
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: Módulo de Segurança & Controle de Permissões (RBAC) */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'seguranca' && (
          <SecurityTab
            securityPermissions={securityPermissions}
            loadingSecurity={loadingSecurity}
            openNewSecurityModal={openNewSecurityModal}
            fetchSecurityPermissions={fetchSecurityPermissions}
            handleToggleSecurityActive={handleToggleSecurityActive}
            openEditSecurityModal={openEditSecurityModal}
            handleDeleteSecurityPermission={handleDeleteSecurityPermission}
          />
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: Social Network & Direct Messages Chat */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'social' && (
          <SocialTab
            socialSearch={socialSearch}
            setSocialSearch={setSocialSearch}
            loadingExplore={loadingExplore}
            exploreList={exploreList}
            activeChatPartner={activeChatPartner}
            setActiveChatPartner={setActiveChatPartner}
            setChatMessages={setChatMessages}
            chatMessages={chatMessages}
            loadInboxList={loadInboxList}
            handleSendChatMessage={handleSendChatMessage}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            inboxList={inboxList}
          />
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

      <NewTransactionModal
        showNewTransaction={showNewTransaction}
        setShowNewTransaction={setShowNewTransaction}
        newTx={newTx}
        setNewTx={setNewTx}
        handleCreateTransaction={handleCreateTransaction}
      />

      <NewServiceModal
        showNewService={showNewService}
        setShowNewService={setShowNewService}
        editingService={editingService}
        serviceForm={serviceForm}
        setServiceForm={setServiceForm}
        handleCreateService={handleCreateService}
      />

      <NewBookingModal
        showNewBookingModal={showNewBookingModal}
        setShowNewBookingModal={setShowNewBookingModal}
        newBookingData={newBookingData}
        setNewBookingData={setNewBookingData}
        links={links}
        handleCreateManualBooking={handleCreateManualBooking}
      />

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
"

              {/* WhatsApp API Real Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                      
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Integração WhatsApp API Real</h4>
                      <p className="text-[10px] font-bold text-slate-400">Notificações automáticas de agendamento & lembretes</p>
                    </div>
                  </div>
                  {waStatus && (
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      waStatus.isConfigured
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    }`}>
                      {waStatus.isConfigured ? `${waStatus.details}` : 'Modo wa.me'}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Testar Envio Real de Mensagem WhatsApp
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={waTestPhone}
                      onChange={e => setWaTestPhone(e.target.value)}
                      placeholder="DDD + Telefone (ex: 11999999999)"
                      className="input-simple text-xs py-2 px-3 flex-1 bg-white dark:bg-[#131826]"
                    />
                    <button
                      type="button"
                      onClick={handleTestWhatsAppSend}
                      disabled={waTestLoading}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {waTestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Testar Envio'}
                    </button>
                  </div>
                  {waTestResult && (
                    <div className={`p-2.5 rounded-xl text-xs font-bold border ${
                      waTestResult.success
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                    }`}>
                      {waTestResult.success ? (
                        <span>
                          {waTestResult.method === 'meta' && 'Mensagem enviada via Meta Cloud API Oficial!'}
                          {waTestResult.method === 'gateway' && 'Mensagem enviada via Gateway HTTP!'}
                          {waTestResult.method === 'link' && 'Link wa.me gerado (Modo Fallback sem credenciais API).'}
                        </span>
                      ) : (
                        <span>Erro: {waTestResult.error || 'Falha no disparo'}</span>
                      )}
                    </div>
                  )}
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
                                <p className="text-[10px] text-slate-400 font-bold mt-1">{dateFormatted} às {h.timeSlot.time}</p>
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
                      {docForm.fileName} ({docForm.fileSize})
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
                                   Vencido ({formatDate(doc.expiryDate)})
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

      {/* Security & Access Control Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-slate-100">
          <div className="bg-white dark:bg-[#131826] w-full max-w-2xl rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-200 dark:border-violet-500/30 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white flex items-center justify-center font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {editingSecurityPerm ? 'Editar Perfil de Segurança' : 'Novo Operador / Perfil de Acesso'}
                  </h3>
                  <p className="text-xs text-violet-600 dark:text-violet-400 font-bold">Defina as permissões individuais do operador</p>
                </div>
              </div>
              <button onClick={() => setShowSecurityModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveSecurityPermission} className="space-y-6 text-left">
              {/* Indicador da Empresa / Conta Principal */}
              <div className="p-3.5 rounded-2xl bg-violet-50/80 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-200 dark:bg-violet-500/20 text-violet-800 dark:text-violet-400 flex items-center justify-center font-bold shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-400 block">Empresa / Conta Principal</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                      {adminInfo?.businessName || 'Minha Empresa'}
                      <span className="text-violet-800 dark:text-violet-300 font-bold bg-violet-100 dark:bg-violet-500/15 px-2.5 py-0.5 rounded-lg border border-violet-300 dark:border-violet-500/30 text-[11px]">
                        @{adminInfo?.username || 'empresa'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">Nome do Operador / Usuário *</label>
                  <input
                    type="text"
                    value={securityForm.userName}
                    onChange={e => setSecurityForm({ ...securityForm, userName: e.target.value })}
                    placeholder="Ex: Amanda Lima (Recepção)"
                    className="input-simple font-bold text-xs"
                    required
                  />
                  <div className="mt-1.5 p-2.5 rounded-xl bg-violet-50 dark:bg-white/[0.04] border border-violet-200 dark:border-white/[0.08] text-[11px] text-slate-800 dark:text-slate-300 font-medium">
                    <span className="font-bold">Para entrar como colaborador:</span> Empresa: <code className="text-pink-600 dark:text-pink-400 font-bold">@{adminInfo?.username || 'empresa'}</code> + Operador: <code className="text-emerald-700 dark:text-emerald-400 font-bold">{securityForm.userName || 'usuario'}</code>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">E-mail (opcional)</label>
                  <input
                    type="email"
                    value={securityForm.email}
                    onChange={e => setSecurityForm({ ...securityForm, email: e.target.value })}
                    placeholder="Ex: amanda@empresa.com"
                    className="input-simple font-bold text-xs"
                  />
                </div>
              </div>

              {/* Password & Role Title Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {editingSecurityPerm ? 'Alterar Senha de Acesso (opcional)' : 'Senha de Acesso do Operador *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showOperatorPassword ? 'text' : 'password'}
                      value={securityForm.password}
                      onChange={e => setSecurityForm({ ...securityForm, password: e.target.value })}
                      placeholder={editingSecurityPerm ? 'Deixe em branco para manter a atual' : 'Crie uma senha de acesso'}
                      className="input-simple font-bold text-xs pr-10"
                      required={!editingSecurityPerm}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOperatorPassword(!showOperatorPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                      title={showOperatorPassword ? 'Ocultar Senha' : 'Exibir Senha'}
                    >
                      {showOperatorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">Título da Função / Cargo *</label>
                  <input
                    type="text"
                    value={securityForm.roleTitle}
                    onChange={e => setSecurityForm({ ...securityForm, roleTitle: e.target.value })}
                    placeholder="Ex: Recepcionista, Gerente, Barbeiro..."
                    className="input-simple font-bold text-xs"
                    required
                  />
                </div>
              </div>

              {/* Quick Role Presets */}
              <div className="p-4 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-2xl space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-800 dark:text-violet-300 block flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Perfis Rápidos Pré-configurados (1-Clique)
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyRolePreset('admin')}
                    className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <Crown className="w-3.5 h-3.5" /> Gestor Principal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyRolePreset('gerente')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Briefcase className="w-3.5 h-3.5" /> Gerente de Operação
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyRolePreset('recepcionista')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" /> Recepcionista
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyRolePreset('financeiro')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Financeiro
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyRolePreset('profissional')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Scissors className="w-3.5 h-3.5" /> Profissional
                  </button>
                </div>
              </div>

              {/* Toggles Matrix */}
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
                  Matriz de Permissões Granulares (Módulos & Submenus)
                </h4>

                {/* Módulo Operacional */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-violet-700 dark:text-violet-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" /> Módulo: Operacional
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-violet-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Agendamentos</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Lista e confirmação de horários agendados</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canAgendamentos}
                        onChange={e => setSecurityForm({ ...securityForm, canAgendamentos: e.target.checked })}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-violet-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Solicitações de Estorno</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Gerenciar cancelamentos com reembolso</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canEstornos}
                        onChange={e => setSecurityForm({ ...securityForm, canEstornos: e.target.checked })}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-violet-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Clientes</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Base completa e histórico de clientes</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canClientes}
                        onChange={e => setSecurityForm({ ...securityForm, canClientes: e.target.checked })}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-violet-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Gerenciar Agenda</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Configuração da grade de horários</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canHorarios}
                        onChange={e => setSecurityForm({ ...securityForm, canHorarios: e.target.checked })}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Módulo Comercial */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-pink-700 dark:text-pink-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Briefcase className="w-3.5 h-3.5" /> Módulo: Comercial
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Serviços</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Catálogo de serviços, preços e durações</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canServicos}
                        onChange={e => setSecurityForm({ ...securityForm, canServicos: e.target.checked })}
                        className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Links de Venda</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Links para clientes agendarem online</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canLinks}
                        onChange={e => setSecurityForm({ ...securityForm, canLinks: e.target.checked })}
                        className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Cupons de Desconto</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Crie códigos promocionais</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canCupons}
                        onChange={e => setSecurityForm({ ...securityForm, canCupons: e.target.checked })}
                        className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Clube de Assinaturas</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Planos e assinaturas recorrentes</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canMemberships}
                        onChange={e => setSecurityForm({ ...securityForm, canMemberships: e.target.checked })}
                        className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Módulo Gestão & Finanças */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5" /> Módulo: Gestão & Finanças
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Financeiro</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Fluxo de caixa, recebíveis e despesas</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canFinanceiro}
                        onChange={e => setSecurityForm({ ...securityForm, canFinanceiro: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">RH / Equipe</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Gestão de funcionários, funções e comissões</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canRh}
                        onChange={e => setSecurityForm({ ...securityForm, canRh: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Dados Bancários / Pix</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Gerenciar chave Pix e recebimentos</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canFinanceiro}
                        onChange={e => setSecurityForm({ ...securityForm, canFinanceiro: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Plano & Assinatura</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Gerenciar seu plano no BoraMarka</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canFaturamento}
                        onChange={e => setSecurityForm({ ...securityForm, canFaturamento: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Módulo Sistema & Ajustes */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Palette className="w-3.5 h-3.5" /> Módulo: Sistema & Ajustes
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Segurança & Permissões</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Controle granular de acesso por perfil</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canSeguranca}
                        onChange={e => setSecurityForm({ ...securityForm, canSeguranca: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Personalizar Página</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Identidade visual, tema e banner</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canPersonalizar}
                        onChange={e => setSecurityForm({ ...securityForm, canPersonalizar: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Explorar Rede</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Rede de contatos e chat</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canSocial}
                        onChange={e => setSecurityForm({ ...securityForm, canSocial: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Logs & Auditoria</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Registro de ações, logins e IP</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canAudit}
                        onChange={e => setSecurityForm({ ...securityForm, canAudit: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">Lixeira</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Recuperar itens excluídos recentemente</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securityForm.canTrash}
                        onChange={e => setSecurityForm({ ...securityForm, canTrash: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-violet-600/25 hover:opacity-95 text-xs uppercase tracking-wider cursor-pointer"
                >
                  {editingSecurityPerm ? 'Salvar Alterações de Permissão' : 'Cadastrar Operador & Atribuir Regras'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  className="px-5 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RH Modal: Link do Portal do Funcionário */}
      {portalLinkModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Link className="w-5 h-5 text-violet-400" /> Acesso ao Portal: {portalLinkModal.name}
              </h3>
              <button onClick={() => setPortalLinkModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-slate-400">Link de Acesso Direto do Funcionário</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={portalLinkModal.link}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-violet-300 select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(portalLinkModal.link);
                    showToast('Link do portal copiado!');
                  }}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs rounded-xl shrink-0"
                >
                  Copiar Link
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400">Redefinir Senha de Acesso</label>
                <button
                  onClick={async () => {
                    const newPass = window.prompt('Digite a nova senha para este funcionário:');
                    if (newPass) {
                      const emp = employees.find(e => e.name === portalLinkModal.name);
                      if (emp) {
                        await api.resetEmployeePassword(emp.id, newPass);
                        showToast('Senha redefinida com sucesso!');
                      }
                    }
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Definir Nova Senha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RH Modal: Lançar Holerite */}
      {rhPaystubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" /> Lançar Novo Holerite
              </h3>
              <button onClick={() => setRhPaystubModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!paystubForm.employeeId || !paystubForm.referenceMonth) {
                  showToast('Selecione o colaborador e mês de referência.', 'error');
                  return;
                }
                try {
                  await api.createEmployeePaystub({
                    employeeId: parseInt(paystubForm.employeeId),
                    referenceMonth: paystubForm.referenceMonth,
                    grossSalary: parseFloat(paystubForm.grossSalary || '0'),
                    netSalary: parseFloat(paystubForm.netSalary || '0'),
                    discounts: parseFloat(paystubForm.discounts || '0'),
                    fileUrl: paystubForm.fileUrl || undefined,
                    notes: paystubForm.notes || undefined,
                  });
                  showToast('Holerite lançado com sucesso!');
                  setRhPaystubModalOpen(false);
                  setPaystubForm({ employeeId: '', referenceMonth: '', grossSalary: '', netSalary: '', discounts: '', fileUrl: '', notes: '' });
                  fetchRhData();
                } catch (err: any) {
                  showToast(err.message || 'Erro ao criar holerite.', 'error');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Colaborador</label>
                <select
                  value={paystubForm.employeeId}
                  onChange={(e) => setPaystubForm({ ...paystubForm, employeeId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white"
                  required
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.filter(e => e.status === 'ACTIVE' || !e.status).map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Mês Ref. (Ex: 07/2026)</label>
                  <input
                    type="text"
                    value={paystubForm.referenceMonth}
                    onChange={(e) => setPaystubForm({ ...paystubForm, referenceMonth: e.target.value })}
                    placeholder="MM/AAAA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Salário Líquido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paystubForm.netSalary}
                    onChange={(e) => setPaystubForm({ ...paystubForm, netSalary: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Link / PDF do Holerite (Opcional)</label>
                <input
                  type="text"
                  value={paystubForm.fileUrl}
                  onChange={(e) => setPaystubForm({ ...paystubForm, fileUrl: e.target.value })}
                  placeholder="URL do arquivo PDF ou imagem"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRhPaystubModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black">
                  Lançar Holerite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RH Modal: Novo Comunicado */}
      {rhAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" /> Publicar Comunicado
              </h3>
              <button onClick={() => setRhAnnouncementModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.createEmployeeAnnouncement(announcementForm);
                  showToast('Comunicado publicado no mural!');
                  setRhAnnouncementModalOpen(false);
                  setAnnouncementForm({ title: '', content: '', targetGroup: 'ALL', priority: 'NORMAL' });
                  fetchRhData();
                } catch (err: any) {
                  showToast(err.message || 'Erro ao publicar comunicado.', 'error');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Título do Comunicado</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="Ex: Reunião Geral de Alinhamento"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Conteúdo da Mensagem</label>
                <textarea
                  rows={4}
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="Escreva os detalhes do aviso..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRhAnnouncementModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black">
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MpTutorialModal
        showMpTutorialModal={showMpTutorialModal}
        setShowMpTutorialModal={setShowMpTutorialModal}
      />

      <MpConfigModal
        showMpConfigModal={showMpConfigModal}
        setShowMpConfigModal={setShowMpConfigModal}
        adminInfo={adminInfo}
        setAdminInfo={setAdminInfo}
        pixInputKey={pixInputKey}
        setPixInputKey={setPixInputKey}
        mpInputToken={mpInputToken}
        setMpInputToken={setMpInputToken}
        setShowMpTutorialModal={setShowMpTutorialModal}
        showToast={showToast}
      />

      {/* Floating Support Chat Widget */}
      <SupportChatWidget />

      {/* Mobile Bottom Navigation Bar (Acesso Rápido Fixado no Rodapé) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0D111E]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 px-2 py-2 flex items-center justify-around shadow-2xl safe-area-pb">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'text-violet-600 dark:text-violet-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        {currentBusinessType === 'PRODUCTS' ? (
          <>
            <button
              onClick={() => setActiveTab('boraencomenda')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative ${
                activeTab === 'boraencomenda'
                  ? 'text-pink-500 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-pink-400'
              }`}
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
              </div>
              <span className="text-[10px] tracking-tight font-bold">Encomendas</span>
            </button>

            <button
              onClick={() => setActiveTab('clientes')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                activeTab === 'clientes'
                  ? 'text-pink-500 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Clientes</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('agendamentos')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                activeTab === 'agendamentos'
                  ? 'text-violet-600 dark:text-violet-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Agenda</span>
            </button>

            <button
              onClick={() => setActiveTab('calendario')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                activeTab === 'calendario'
                  ? 'text-violet-600 dark:text-violet-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Calendário</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('financeiro')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'financeiro'
              ? 'text-violet-600 dark:text-violet-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Financeiro</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Mais</span>
        </button>
      </nav>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  )
}
