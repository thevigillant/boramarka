import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ShoppingBag,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Phone,
  DollarSign,
  TrendingUp,
  Copy,
  ExternalLink,
  Store,
  Layers,
  CheckCircle,
  Truck,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  RefreshCw,
  X,
  LayoutGrid,
  Settings,
  BarChart3,
  ChevronRight,
  User,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Link2,
  Send,
  Bell,
  RotateCcw,
} from 'lucide-react'
import { api } from '../../../services/api'
import { formatCurrency, formatImageUrl } from '../../../utils/dashboardHelpers'
import { NewProductModal } from '../modals/NewProductModal'
import { OrderDetailModal } from '../modals/OrderDetailModal'
import type {
  ProductData,
  ProductCategoryData,
  OrderData,
  OrderSettingsData,
  OrderStatsData,
} from '../../../types/dashboard'

interface BoraEncomendaTabProps {
  user: any
  subscription: any
  setShowPaywall: (open: boolean) => void
}

export function BoraEncomendaTab({ user, subscription, setShowPaywall }: BoraEncomendaTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'kanban' | 'products' | 'store' | 'reports'>('kanban')
  const [loading, setLoading] = useState(true)

  // Data states
  const [orders, setOrders] = useState<OrderData[]>([])
  const [products, setProducts] = useState<ProductData[]>([])
  const [categories, setCategories] = useState<ProductCategoryData[]>([])
  const [settings, setSettings] = useState<OrderSettingsData | null>(null)
  const [stats, setStats] = useState<OrderStatsData | null>(null)

  // Modals & UI states
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  // WhatsApp Notification Modal
  const [whatsappModal, setWhatsappModal] = useState<{
    open: boolean
    clientName: string
    clientPhone: string
    message: string
    statusLabel: string
    color: string
    emoji: string
  } | null>(null)
  const whatsappTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const storeUrl = `${window.location.origin}/${user?.username || ''}/loja`

  // Gera a URL de rastreamento para o cliente
  function getTrackingUrl(order: OrderData) {
    const num = order.orderNumber.replace('#', '')
    const code = (order as any).cancellationCode || ''
    return `${window.location.origin}/pedido/${num}/rastrear${code ? `?code=${code}` : ''}`
  }

  // Monta mensagem WhatsApp por status e dispara o modal de notificação
  function triggerWhatsAppNotification(order: OrderData, newStatus: string) {
    const cleanPhone = order.clientPhone.replace(/\D/g, '')
    const trackingUrl = getTrackingUrl(order)
    const storeName = user?.businessName || user?.username || 'a loja'

    const configs: Record<string, { label: string; emoji: string; color: string; msg: string }> = {
      CONFIRMADO: {
        label: 'Pedido Confirmado',
        emoji: '✅',
        color: 'from-blue-500 to-blue-600',
        msg:
          `✅ Olá, *${order.clientName}*! Seu pedido *${order.orderNumber}* foi *CONFIRMADO* por ${storeName}!\n\n` +
          `🗓️ Previsão: ${order.deliveryDate} às ${order.deliveryTime}\n\n` +
          `Acompanhe em tempo real:\n${trackingUrl}`,
      },
      EM_PRODUCAO: {
        label: 'Em Produção',
        emoji: '👩‍🍳',
        color: 'from-purple-500 to-purple-600',
        msg:
          `👩‍🍳 Olá, *${order.clientName}*! Sua encomenda *${order.orderNumber}* está sendo *PREPARADA* agora! 🎉\n\n` +
          `Acompanhe o progresso:\n${trackingUrl}`,
      },
      PRONTO: {
        label: 'Pronto!',
        emoji: '🎉',
        color: 'from-emerald-500 to-emerald-600',
        msg:
          `🎉 Olá, *${order.clientName}*! Sua encomenda *${order.orderNumber}* está *PRONTA*!\n\n` +
          (order.deliveryType === 'DELIVERY'
            ? `🚗 Estamos saindo para entrega!`
            : `📦 Pode retirar a qualquer momento!`) +
          `\n\nAcompanhe: ${trackingUrl}`,
      },
      ENTREGUE: {
        label: 'Entregue',
        emoji: '🙏',
        color: 'from-slate-600 to-slate-700',
        msg:
          `🙏 Olá, *${order.clientName}*! Sua encomenda *${order.orderNumber}* foi *ENTREGUE*! Obrigado pela preferência!\n\n` +
          `Se puder nos avaliar, ficamos muito felizes! 💕`,
      },
      CANCELADO: {
        label: 'Pedido Pausado / Lixeira',
        emoji: '⏸️',
        color: 'from-red-500 to-red-600',
        msg:
          `⚠️ Olá, *${order.clientName}*! Informamos que o seu pedido *${order.orderNumber}* foi *PAUSADO/CANCELADO* por ${storeName}.\n\n` +
          `Caso tenha alguma dúvida, queira reagendar ou retomar a sua encomenda, favor nos responder diretamente por aqui! 🙏`,
      },
    }

    const cfg = configs[newStatus]
    if (!cfg) return

    if (whatsappTimerRef.current) clearTimeout(whatsappTimerRef.current)

    setWhatsappModal({
      open: true,
      clientName: order.clientName,
      clientPhone: cleanPhone,
      message: cfg.msg,
      statusLabel: cfg.label,
      color: cfg.color,
      emoji: cfg.emoji,
    })

    // Fecha automaticamente após 60 segundos
    whatsappTimerRef.current = setTimeout(() => setWhatsappModal(null), 60000)
  }

  function closeWhatsappModal() {
    if (whatsappTimerRef.current) clearTimeout(whatsappTimerRef.current)
    setWhatsappModal(null)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersRes, productsRes, catsRes, settingsRes, statsRes] = await Promise.all([
        api.getOrders().catch(() => []),
        api.getProducts().catch(() => []),
        api.getProductCategories().catch(() => []),
        api.getOrderSettings().catch(() => null),
        api.getOrderStats().catch(() => null),
      ])
      setOrders(ordersRes || [])
      setProducts(productsRes || [])
      setCategories(catsRes || [])
      setSettings(settingsRes)
      setStats(statsRes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handlers para Produtos
  async function handleSaveProduct(payload: any) {
    if (editingProduct) {
      await api.updateProduct(editingProduct.id, payload)
    } else {
      await api.createProduct(payload)
    }
    loadData()
  }

  async function handleDeleteProduct(id: number) {
    if (!confirm('Tem certeza que deseja excluir este produto do cardápio?')) return
    await api.deleteProduct(id)
    loadData()
  }

  // Handlers para Categorias
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    await api.createProductCategory({ name: newCategoryName.trim() })
    setNewCategoryName('')
    const updated = await api.getProductCategories()
    setCategories(updated || [])
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Excluir esta categoria? Os produtos associados ficarão sem categoria.')) return
    await api.deleteProductCategory(id)
    const updated = await api.getProductCategories()
    setCategories(updated || [])
  }

  // Handlers para Pedidos
  async function handleUpdateOrderStatus(id: number, status: string, note?: string, orderForNotif?: OrderData) {
    await api.updateOrderStatus(id, status, note)
    const updatedOrders = await api.getOrders()
    setOrders(updatedOrders || [])
    if (selectedOrder && selectedOrder.id === id) {
      const single = await api.getOrder(id)
      setSelectedOrder(single)
    }
    // Dispara modal WhatsApp para avisar cliente
    if (orderForNotif) {
      triggerWhatsAppNotification(orderForNotif, status)
    }
  }

  async function handleUpdateOrderPayment(id: number, depositPaid: boolean) {
    await api.updateOrderPayment(id, depositPaid)
    const updatedOrders = await api.getOrders()
    setOrders(updatedOrders || [])
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, depositPaid })
    }
  }

  async function handleMoveToTrash(id: number, orderNumber?: string, directOrder?: OrderData) {
    const targetOrder = directOrder || orders.find(o => o.id === id) || (selectedOrder?.id === id ? selectedOrder : null)
    const proceed = confirm(`Mover o pedido ${orderNumber || targetOrder?.orderNumber || `#${id}`} para a Lixeira / Cancelados?\n\nVocê poderá avisar o cliente no WhatsApp que o pedido foi pausado.`)
    if (!proceed) return
    await api.updateOrderStatus(id, 'CANCELADO', 'Movido para a lixeira pelo profissional')
    const updatedOrders = await api.getOrders()
    setOrders(updatedOrders || [])
    if (selectedOrder && selectedOrder.id === id) {
      const single = await api.getOrder(id)
      setSelectedOrder(single)
    }
    if (targetOrder) {
      triggerWhatsAppNotification(targetOrder, 'CANCELADO')
    }
  }

  async function handleRestoreOrder(id: number, orderNumber?: string) {
    await api.updateOrderStatus(id, 'NOVO', 'Restaurado da lixeira pelo profissional')
    const updatedOrders = await api.getOrders()
    setOrders(updatedOrders || [])
    if (selectedOrder && selectedOrder.id === id) {
      const single = await api.getOrder(id)
      setSelectedOrder(single)
    }
  }

  async function handlePermanentDeleteOrder(id: number, orderNumber?: string) {
    const proceed = confirm(`⚠️ EXCLUSÃO PERMANENTE:\n\nTem certeza que deseja excluir o pedido ${orderNumber || `#${id}`} definitivamente do sistema? Esta ação não pode ser desfeita.`)
    if (!proceed) return
    await api.deleteOrder(id)
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder(null)
    }
    const updatedOrders = await api.getOrders()
    setOrders(updatedOrders || [])
  }

  // Handlers para Configurações da Loja
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSavingSettings(true)
    try {
      const updated = await api.updateOrderSettings(settings)
      setSettings(updated)
      alert('Configurações da loja salvas com sucesso!')
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações')
    } finally {
      setSavingSettings(false)
    }
  }

  function copyStoreLink() {
    navigator.clipboard.writeText(storeUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const kanbanColumns = [
    {
      key: 'NOVO',
      title: 'Novos Pedidos',
      dotColor: 'bg-amber-400',
      badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      borderLeft: 'border-l-amber-500',
    },
    {
      key: 'CONFIRMADO',
      title: 'Confirmados',
      dotColor: 'bg-blue-400',
      badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      borderLeft: 'border-l-blue-500',
    },
    {
      key: 'EM_PRODUCAO',
      title: 'Em Produção',
      dotColor: 'bg-purple-400',
      badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      borderLeft: 'border-l-purple-500',
    },
    {
      key: 'PRONTO',
      title: 'Prontos',
      dotColor: 'bg-emerald-400',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      borderLeft: 'border-l-emerald-500',
    },
    {
      key: 'ENTREGUE',
      title: 'Entregues',
      dotColor: 'bg-slate-400',
      badgeClass: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
      borderLeft: 'border-l-slate-500',
    },
    {
      key: 'CANCELADO',
      title: 'Lixeira / Cancelados',
      dotColor: 'bg-red-400',
      badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
      borderLeft: 'border-l-red-500',
    },
  ]

  return (
    <div className="animate-slide-up space-y-6">
      {/* ── Header Principal (Design Sóbrio & Premium) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#131826] border border-slate-800/80 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                Módulo de Encomendas
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Cardápio Digital & Produção
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              BoraEncomenda
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl font-medium leading-relaxed">
              Gestão completa de pedidos sob encomenda com cardápio digital, recebimento de entrada online e acompanhamento de produção.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={copyStoreLink}
              className="flex-1 md:flex-initial py-3 px-5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all shadow-md"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copiar Link da Loja</span>
                </>
              )}
            </button>

            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 transition-all"
              title="Abrir Vitrine Pública"
            >
              <span>Abrir Vitrine</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ── KPI Cards (Métricas Elegantes) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#131826] rounded-2xl p-5 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pedidos Ativos
            </span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {stats?.activeOrders || 0}
          </p>
          <span className="text-[11px] text-pink-400 font-semibold mt-1 block">
            Em fluxo de preparo
          </span>
        </div>

        <div className="bg-[#131826] rounded-2xl p-5 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Faturamento Total
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {formatCurrency(stats?.totalRevenue || 0)}
          </p>
          <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
            Total acumulado
          </span>
        </div>

        <div className="bg-[#131826] rounded-2xl p-5 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Entradas Pagas
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {formatCurrency(stats?.receivedRevenue || 0)}
          </p>
          <span className="text-[11px] text-emerald-400/80 font-semibold mt-1 block">
            Recebido online
          </span>
        </div>

        <div className="bg-[#131826] rounded-2xl p-5 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo na Entrega
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400">
            {formatCurrency(stats?.pendingBalance || 0)}
          </p>
          <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
            A cobrar na entrega
          </span>
        </div>
      </div>

      {/* ── Sub Navigation (Pill Tabs Modernas) ── */}
      <div className="bg-[#131826] p-1.5 rounded-2xl border border-slate-800/80 flex gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('kanban')}
          className={`py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'kanban'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-pink-400" />
          <span>Kanban de Produção</span>
          <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('products')}
          className={`py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'products'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-pink-400" />
          <span>Cardápio & Produtos</span>
          <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('store')}
          className={`py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'store'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-pink-400" />
          <span>Configurações da Loja</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'reports'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-pink-400" />
          <span>Relatórios</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 1. Kanban de Produção (Layout Limpo sem Sobreposição) */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSubTab === 'kanban' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div>
              <h3 className="text-base font-black text-white">
                Fluxo de Produção
              </h3>
              <p className="text-xs text-slate-400">
                Acompanhe e avance os pedidos conforme as etapas de preparo
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-all"
              title="Atualizar Pedidos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Container horizontal com scroll sem overflow/overlap */}
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1 no-scrollbar items-start">
            {kanbanColumns.map(col => {
              const colOrders = orders.filter(o => o.status === col.key)
              return (
                <div
                  key={col.key}
                  className="w-[280px] sm:w-[310px] flex-shrink-0 bg-[#131826] rounded-2xl p-4 border border-slate-800/90 flex flex-col min-h-[480px] shadow-sm"
                >
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                      <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                        {col.title}
                      </h4>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeClass}`}>
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Orders Cards Container */}
                  <div className="space-y-3 flex-1">
                    {colOrders.map(order => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`bg-[#1A2235] hover:bg-[#202b42] p-4 rounded-xl cursor-pointer transition-all border border-slate-800 hover:border-slate-700 border-l-4 ${col.borderLeft} shadow-sm hover:shadow-md flex flex-col justify-between group`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className="text-xs font-black text-white font-mono">
                                {order.orderNumber}
                              </span>
                              {order.status === 'CANCELADO' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                                  Lixeira
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black text-pink-400 font-mono">
                                {formatCurrency(order.total)}
                              </span>
                              {order.status !== 'CANCELADO' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToTrash(order.id, order.orderNumber);
                                  }}
                                  className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                                  title="Mover para Lixeira / Cancelar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs font-bold text-slate-200 truncate mb-2">
                            {order.clientName}
                          </p>

                          <div className="flex items-center gap-1.5 text-[11px] text-pink-400/90 font-semibold bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/15">
                            <Calendar className="w-3 h-3" />
                            <span>{order.deliveryDate} às {order.deliveryTime}</span>
                          </div>

                          <div className="text-[11px] text-slate-400 font-medium mt-2 line-clamp-2">
                            {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center text-[10px]">
                          <span className={`font-bold ${order.status === 'CANCELADO' ? 'text-red-400' : order.depositPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {order.status === 'CANCELADO' ? '🗑️ Cancelado / Lixeira' : order.depositPaid ? '✓ Entrada Paga' : '⚠️ Entrada Pendente'}
                          </span>
                          <span className="text-slate-400 group-hover:text-white flex items-center gap-0.5 transition-colors">
                            Detalhes <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>

                        {/* Botões de Ação Rápida no Card */}
                        {order.status === 'CANCELADO' && (
                          <div className="flex gap-1.5 mt-2.5">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleRestoreOrder(order.id, order.orderNumber);
                              }}
                              className="flex-1 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1 active:scale-95"
                            >
                              <RotateCcw className="w-3 h-3" /> Restaurar
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handlePermanentDeleteOrder(order.id, order.orderNumber);
                              }}
                              className="py-1.5 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1 active:scale-95"
                              title="Excluir Definitivamente"
                            >
                              <Trash2 className="w-3 h-3" /> Excluir
                            </button>
                          </div>
                        )}

                        {order.status === 'NOVO' && !order.depositPaid && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleUpdateOrderPayment(order.id, true);
                              await handleUpdateOrderStatus(order.id, 'CONFIRMADO', 'PIX confirmado pelo painel', order);
                            }}
                            className="w-full mt-2.5 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Confirmar PIX & Avançar
                          </button>
                        )}

                        {order.status === 'NOVO' && order.depositPaid && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleUpdateOrderStatus(order.id, 'CONFIRMADO', 'Aprovado para produção', order);
                            }}
                            className="w-full mt-2.5 py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Confirmar Pedido
                          </button>
                        )}

                        {order.status === 'CONFIRMADO' && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!order.depositPaid) {
                                const proceed = confirm(
                                  '⚠️ ALERTA DE SEGURANÇA:\n\nA entrada deste pedido ainda NÃO foi confirmada na sua conta bancária!\n\nIniciar a produção agora pode gerar prejuízo caso o cliente não pague. Deseja iniciar a produção mesmo assim?'
                                );
                                if (!proceed) return;
                              }
                              await handleUpdateOrderStatus(order.id, 'EM_PRODUCAO', 'Iniciado preparo', order);
                            }}
                            className="w-full mt-2.5 py-2 px-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-95"
                          >
                            <Clock className="w-3.5 h-3.5" /> Iniciar Produção
                          </button>
                        )}

                        {order.status === 'EM_PRODUCAO' && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleUpdateOrderStatus(order.id, 'PRONTO', 'Pedido finalizado e pronto', order);
                            }}
                            className="w-full mt-2.5 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Marcar como Pronto
                          </button>
                        )}

                        {order.status === 'PRONTO' && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleUpdateOrderStatus(order.id, 'ENTREGUE', 'Entregue ao cliente', order);
                            }}
                            className="w-full mt-2.5 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                          >
                            <Truck className="w-3.5 h-3.5" /> Concluir Entrega
                          </button>
                        )}
                      </div>
                    ))}

                    {colOrders.length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-slate-800/80 rounded-xl text-slate-500 text-xs font-semibold">
                        Nenhum pedido
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 2. Cardápio & Produtos */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-white">Cardápio de Encomendas</h3>
              <p className="text-xs text-slate-400">Gerencie produtos, fotos, preços e personalizações disponíveis</p>
            </div>

            <button
              onClick={() => {
                if (subscription?.status === 'inactive') {
                  setShowPaywall(true)
                } else {
                  setEditingProduct(null)
                  setShowProductModal(true)
                }
              }}
              className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Produto
            </button>
          </div>

          {/* Gerenciamento de Categorias */}
          <div className="p-4 rounded-2xl bg-[#131826] border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Categorias:</span>
              {categories.map(cat => (
                <span
                  key={cat.id}
                  className="text-xs font-bold px-3 py-1 bg-[#1A2235] border border-slate-700/80 rounded-xl flex items-center gap-2 text-slate-200"
                >
                  {cat.name}
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    title="Excluir Categoria"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {categories.length === 0 && (
                <span className="text-xs text-slate-500 font-medium">Nenhuma categoria cadastrada</span>
              )}
            </div>

            <form onSubmit={handleCreateCategory} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Nome da categoria (ex: Bolos)"
                className="input-simple py-2 px-3 text-xs font-bold"
              />
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all whitespace-nowrap"
              >
                Adicionar
              </button>
            </form>
          </div>

          {/* Grid de Produtos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map(prod => (
              <div
                key={prod.id}
                className="bg-[#131826] rounded-2xl overflow-hidden border border-slate-800/90 hover:border-slate-600 shadow-md hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {prod.photos?.[0]?.url ? (
                    <div className="w-full aspect-square overflow-hidden bg-slate-900 relative flex items-center justify-center">
                      <img
                        src={formatImageUrl(prod.photos[0].url)}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.img-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'img-fallback text-center text-slate-500 py-8';
                            fallback.innerHTML = '<svg class="w-8 h-8 mx-auto mb-1 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><p class="text-[10px] font-bold uppercase tracking-widest">Sem foto</p>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                      {prod.photos.length > 1 && (
                        <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {prod.photos.length} fotos
                        </span>
                      )}
                      {prod.featured && (
                        <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                          Destaque
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-slate-900 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sem foto</p>
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    {prod.category && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 mb-1 block">
                        {prod.category.name}
                      </span>
                    )}

                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-black text-white leading-tight line-clamp-2 flex-1">
                        {prod.name}
                      </h4>
                      <p className="text-sm font-black text-pink-400 ml-2 shrink-0 font-mono">
                        {formatCurrency(prod.price)}
                      </p>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                      {prod.description || 'Sem descrição.'}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                      <span>Mín. {prod.minDaysNotice}d</span>
                      <span>·</span>
                      <span>{prod.unitLabel}</span>
                      {prod.customFields?.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-pink-400/70">{prod.customFields.length} opções</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-0 flex gap-2 border-t border-slate-800/80 mt-1 pt-3">
                  <button
                    onClick={() => {
                      setEditingProduct(prod)
                      setShowProductModal(true)
                    }}
                    className="flex-1 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 rounded-xl transition-all"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    className="flex-1 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}

            {products.length === 0 && (
              <div className="col-span-full bg-[#131826] rounded-2xl py-16 text-center border-2 border-dashed border-slate-800">
                <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                  Cardápio vazio
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Cadastre produtos para disponibilizar na sua vitrine pública
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 3. Configurações da Loja */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSubTab === 'store' && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
          <div className="bg-[#131826] rounded-2xl p-6 sm:p-8 border border-slate-800/90 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">
                Configurações da Vitrine de Encomendas
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste os parâmetros de funcionamento da sua loja pública
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-4 h-4 text-pink-500 rounded focus:ring-pink-400"
                />
                <div>
                  <span className="text-xs font-black text-white block">
                    Loja Aberta para Receber Encomendas
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Desative temporariamente se a agenda estiver lotada ou em recesso
                  </span>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nome da Loja
                </label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                  placeholder="Nome comercial da sua loja"
                  className="input-simple font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Apresentação & Bio
                </label>
                <textarea
                  value={settings.storeDescription}
                  onChange={e => setSettings({ ...settings, storeDescription: e.target.value })}
                  placeholder="Conte um pouco sobre sua produção e diferenciais..."
                  className="input-simple font-medium text-xs min-h-[70px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Porcentagem de Entrada Online (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.depositPercentage}
                      onChange={e => setSettings({ ...settings, depositPercentage: parseFloat(e.target.value) || 0 })}
                      className="input-simple font-black text-pink-400 text-center"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Cobrado no checkout (padrão 50%)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Antecedência Mínima Global
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={settings.minAdvanceDays}
                      onChange={e => setSettings({ ...settings, minAdvanceDays: parseInt(e.target.value) || 2 })}
                      className="input-simple font-bold text-center"
                    />
                    <span className="text-xs font-bold text-slate-400">dias</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Pedido Mínimo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.minOrderAmount}
                    onChange={e => setSettings({ ...settings, minOrderAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    className="input-simple font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Taxa Fixa de Entrega (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.deliveryFee}
                    onChange={e => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    className="input-simple font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowScheduledPickup}
                    onChange={e => setSettings({ ...settings, allowScheduledPickup: e.target.checked })}
                    className="w-4 h-4 text-pink-500 rounded"
                  />
                  <span className="text-xs font-bold text-slate-300">
                    Permitir Retirada no Local
                  </span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowDelivery}
                    onChange={e => setSettings({ ...settings, allowDelivery: e.target.checked })}
                    className="w-4 h-4 text-pink-500 rounded"
                  />
                  <span className="text-xs font-bold text-slate-300">
                    Permitir Entrega a Domicílio
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Chave PIX do Estabelecimento
                </label>
                <input
                  type="text"
                  value={settings.pixKey}
                  onChange={e => setSettings({ ...settings, pixKey: e.target.value })}
                  placeholder="Chave Pix para pagamentos diretos"
                  className="input-simple font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-bold text-sm shadow-xl shadow-pink-500/20 hover:opacity-95 transition-all disabled:opacity-50"
            >
              {savingSettings ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 4. Relatórios */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSubTab === 'reports' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#131826] rounded-2xl p-6 border border-slate-800/90 shadow-md space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Produtos Mais Encomendados
              </h4>
              <div className="space-y-3">
                {stats.topProducts.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-[#1A2235] border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-pink-500/10 text-pink-400 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{p.name}</p>
                        <span className="text-[10px] text-slate-400 font-medium">{p.quantity} unidades</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-pink-400 font-mono">{formatCurrency(p.total)}</span>
                  </div>
                ))}
                {stats.topProducts.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">Nenhum dado registrado</p>
                )}
              </div>
            </div>

            <div className="bg-[#131826] rounded-2xl p-6 border border-slate-800/90 shadow-md space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Pedidos por Etapa
              </h4>
              <div className="space-y-2.5">
                {Object.entries(stats.statusCounts).map(([st, count]) => (
                  <div key={st} className="flex justify-between items-center p-3 rounded-xl bg-[#1A2235] border border-slate-800">
                    <span className="text-xs font-bold text-slate-300">{st}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <NewProductModal
        show={showProductModal}
        onClose={() => {
          setShowProductModal(false)
          setEditingProduct(null)
        }}
        editingProduct={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
      />

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateOrderStatus}
        onUpdatePayment={handleUpdateOrderPayment}
        onMoveToTrash={handleMoveToTrash}
        onRestoreOrder={handleRestoreOrder}
        onPermanentDelete={handlePermanentDeleteOrder}
      />

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 🔔 Modal de Notificação WhatsApp — Aparece após mudança   */}
      {/* de status. Um botão, o profissional clica e avisa o       */}
      {/* cliente instantaneamente via WhatsApp pré-preenchido.     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {whatsappModal?.open && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#131826] w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/80 animate-slide-up pb-10 sm:pb-8">
            {/* Mobile Top Drag Indicator */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl">
                  {whatsappModal.emoji}
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Pedido avançado!
                  </p>
                  <h3 className="text-base font-black text-white">
                    {whatsappModal.statusLabel}
                  </h3>
                </div>
              </div>
              <button
                onClick={closeWhatsappModal}
                className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview da mensagem */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-5 relative">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                Mensagem para {whatsappModal.clientName}
              </span>
              <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-line line-clamp-5">
                {whatsappModal.message}
              </p>
              <div className="absolute -bottom-1 left-5 w-3 h-3 bg-slate-900/80 border-r border-b border-slate-800 rotate-45" />
            </div>

            {/* CTA Principal — O único botão que importa */}
            <a
              href={`https://wa.me/55${whatsappModal.clientPhone}?text=${encodeURIComponent(whatsappModal.message)}`}
              target="_blank"
              rel="noreferrer"
              onClick={closeWhatsappModal}
              className={`w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-base shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-3`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Avisar {whatsappModal.clientName} agora
            </a>

            <button
              onClick={closeWhatsappModal}
              className="w-full py-3 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
            >
              Pular por agora — avisar depois
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
