import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CreditCard, Plus, Trash2, Search, ShoppingBag, DollarSign,
  Receipt, ArrowRight, CheckCircle2, User, Scissors, Box,
  AlertCircle, RefreshCw, X, Loader2, MessageSquare, Percent,
  Calendar, Check
} from 'lucide-react'
import { api } from '../../../services/api'
import { formatCurrency } from '../../../utils/dashboardHelpers'
import { ServiceData, EmployeeData } from '../../../types/dashboard'
import { InventoryItemData } from './EstoqueTab'

interface CartItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  itemType: 'SERVICE' | 'PRODUCT' | 'CUSTOM'
  inventoryItemId?: number
}

interface SaleItemResponse {
  id: number
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  itemType: string
}

interface SaleResponse {
  id: number
  total: number
  discount: number
  paymentMethod: string
  status: string
  notes: string
  createdAt: string
  items: SaleItemResponse[]
}

interface PDVTabProps {
  services: ServiceData[]
  showToast: (msg: string, type?: 'success' | 'error') => void
}

export function PDVTab({ services, showToast }: PDVTabProps) {
  // Catalogs
  const [inventoryItems, setInventoryItems] = useState<InventoryItemData[]>([])
  const [employees, setEmployees] = useState<EmployeeData[]>([])
  const [salesHistory, setSalesHistory] = useState<SaleResponse[]>([])
  const [stats, setStats] = useState<{
    today: { total: number; count: number }
    month: { total: number; count: number }
    all: { total: number; count: number }
  }>({
    today: { total: 0, count: 0 },
    month: { total: 0, count: 0 },
    all: { total: 0, count: 0 },
  })

  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [activeCatalogTab, setActiveCatalogTab] = useState<'SERVICES' | 'PRODUCTS' | 'HISTORY'>('SERVICES')
  const [catalogSearch, setCatalogSearch] = useState('')

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState<number | string>('')
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO'>('PIX')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [saleNotes, setSaleNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Success Receipt Modal
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Custom Item Modal
  const [showCustomItemModal, setShowCustomItemModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState<number | string>('')

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [invRes, empRes, statsRes] = await Promise.all([
        api.request('/inventory').catch(() => []),
        api.getEmployees().catch(() => []),
        api.request('/pdv/stats').catch(() => null),
      ])
      setInventoryItems(invRes || [])
      setEmployees(empRes || [])
      if (statsRes) setStats(statsRes)
    } catch (err: any) {
      showToast('Erro ao carregar dados do PDV.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await api.request('/pdv/sales?limit=50')
      setSalesHistory(res.sales || [])
    } catch (err: any) {
      showToast('Erro ao carregar histórico de vendas.', 'error')
    } finally {
      setHistoryLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeCatalogTab === 'HISTORY') {
      fetchHistory()
    }
  }, [activeCatalogTab, fetchHistory])

  // Cart operations
  function handleAddService(svc: ServiceData) {
    setCart(prev => {
      const existing = prev.find(i => i.name === svc.name && i.itemType === 'SERVICE')
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        id: `svc-${svc.id}-${Date.now()}`,
        name: svc.name,
        quantity: 1,
        unitPrice: svc.price,
        itemType: 'SERVICE',
      }]
    })
    showToast(`"${svc.name}" adicionado ao carrinho!`, 'success')
  }

  function handleAddProduct(item: InventoryItemData) {
    if (item.quantity <= 0) {
      return showToast('Item sem estoque disponível.', 'error')
    }
    setCart(prev => {
      const existing = prev.find(i => i.inventoryItemId === item.id)
      if (existing) {
        if (existing.quantity >= item.quantity) {
          showToast('Limite de estoque atingido para este item.', 'error')
          return prev
        }
        return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        id: `prod-${item.id}-${Date.now()}`,
        name: item.name,
        quantity: 1,
        unitPrice: item.salePrice || 0,
        itemType: 'PRODUCT',
        inventoryItemId: item.id,
      }]
    })
    showToast(`"${item.name}" adicionado ao carrinho!`, 'success')
  }

  function handleAddCustomItem() {
    if (!customName.trim() || !customPrice || Number(customPrice) <= 0) {
      return showToast('Informe nome e valor válidos.', 'error')
    }
    setCart(prev => [...prev, {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      quantity: 1,
      unitPrice: Number(customPrice),
      itemType: 'CUSTOM',
    }])
    setCustomName('')
    setCustomPrice('')
    setShowCustomItemModal(false)
    showToast('Item avulso adicionado!', 'success')
  }

  function handleUpdateQuantity(id: string, delta: number) {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }))
  }

  function handleRemoveItem(id: string) {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  function handleClearCart() {
    setCart([])
    setDiscount('')
    setSaleNotes('')
  }

  // Totais
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)
  }, [cart])

  const discountVal = Number(discount) || 0
  const finalTotal = Math.max(0, subtotal - discountVal)

  // Finalizar Venda
  async function handleFinalizeSale() {
    if (cart.length === 0) return showToast('O carrinho está vazio.', 'error')

    setSubmitting(true)
    try {
      const payload = {
        employeeId: selectedEmployeeId || null,
        paymentMethod,
        discount: discountVal,
        notes: `${customerName ? `Cliente: ${customerName}. ` : ''}${customerPhone ? `Tel: ${customerPhone}. ` : ''}${saleNotes}`.trim(),
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          itemType: item.itemType,
          inventoryItemId: item.inventoryItemId || null,
        })),
      }

      const res = await api.request('/pdv/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      showToast('🎉 Venda finalizada com sucesso!', 'success')
      setCompletedSale(res)
      setShowReceiptModal(true)
      handleClearCart()
      fetchData()
    } catch (err: any) {
      showToast(err.message || 'Erro ao finalizar venda.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Disparar recibo por WhatsApp
  function handleSendReceipt() {
    if (!completedSale) return
    const phone = customerPhone.replace(/\D/g, '')
    const itemsList = completedSale.items
      ?.map(i => `• ${i.quantity}x ${i.name} — ${formatCurrency(i.unitPrice * i.quantity)}`)
      .join('\n') || ''

    const message = `🧾 *COMPROVANTE DE PAGAMENTO*\n\n` +
      `Obrigado pela preferência! Segue o resumo do seu atendimento:\n\n` +
      `${itemsList}\n\n` +
      (completedSale.discount > 0 ? `Desconto: -${formatCurrency(completedSale.discount)}\n` : '') +
      `*Total Pago: ${formatCurrency(completedSale.total)}*\n` +
      `Forma: ${completedSale.paymentMethod}\n` +
      `Data: ${new Date(completedSale.createdAt).toLocaleDateString('pt-BR')} às ${new Date(completedSale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `_Emitido via BoraMarka_`

    const url = phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`

    window.open(url, '_blank')
  }

  return (
    <div className="animate-slide-up space-y-6">
      {/* ── Top KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-simple p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendas Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(stats.today.total)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.today.count} atendimento(s) finalizado(s)</p>
        </div>

        <div className="card-simple p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total do Mês</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-black">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(stats.month.total)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.month.count} vendas no mês</p>
        </div>

        <div className="card-simple p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket Médio</span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-black">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-pink-500 mt-2">
            {formatCurrency(stats.today.count > 0 ? stats.today.total / stats.today.count : (stats.month.count > 0 ? stats.month.total / stats.month.count : 0))}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Por cliente atendido</p>
        </div>

        <div className="card-simple p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Geral</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-black">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(stats.all.total)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.all.count} vendas registradas</p>
        </div>
      </div>

      {/* ── Main Layout: Catalog vs Cart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Catalog & History (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Catalog Tab Toggle & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.02] p-2.5 rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveCatalogTab('SERVICES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeCatalogTab === 'SERVICES'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" /> Serviços ({services.length})
              </button>
              <button
                onClick={() => setActiveCatalogTab('PRODUCTS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeCatalogTab === 'PRODUCTS'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" /> Produtos ({inventoryItems.filter(i => i.category === 'PRODUTO').length})
              </button>
              <button
                onClick={() => setActiveCatalogTab('HISTORY')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeCatalogTab === 'HISTORY'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> Histórico
              </button>
            </div>

            {activeCatalogTab !== 'HISTORY' && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar catálogo..."
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowCustomItemModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 font-bold text-xs border border-pink-500/20 flex items-center gap-1 whitespace-nowrap transition-all"
                  title="Item Avulso"
                >
                  <Plus className="w-3.5 h-3.5" /> Item Avulso
                </button>
              </div>
            )}
          </div>

          {/* Catalog Content */}
          {activeCatalogTab === 'SERVICES' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
              {services
                .filter(s => s.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                .map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => handleAddService(svc)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 hover:shadow-md transition-all text-left flex items-center justify-between gap-3 group active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{svc.name}</p>
                      <span className="text-[10px] text-slate-400">{svc.duration} min</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(svc.price)}
                      </p>
                      <span className="text-[9px] font-bold text-pink-500 group-hover:underline flex items-center gap-0.5 justify-end mt-0.5">
                        + Adicionar
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          )}

          {activeCatalogTab === 'PRODUCTS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
              {inventoryItems
                .filter(i => i.category === 'PRODUTO' && i.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                .map(item => {
                  const outOfStock = item.quantity <= 0
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAddProduct(item)}
                      disabled={outOfStock}
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                        outOfStock
                          ? 'bg-slate-100/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-pink-500/50 hover:shadow-md active:scale-[0.99] group'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.name}</p>
                        <span className={`text-[10px] ${item.quantity <= item.minQuantity ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                          Estoque: {item.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.salePrice || 0)}
                        </p>
                        {!outOfStock && (
                          <span className="text-[9px] font-bold text-pink-500 group-hover:underline flex items-center gap-0.5 justify-end mt-0.5">
                            + Adicionar
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
            </div>
          )}

          {activeCatalogTab === 'HISTORY' && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {historyLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>
              ) : salesHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">Nenhuma venda registrada ainda.</div>
              ) : (
                salesHistory.map(sale => (
                  <div
                    key={sale.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white">Venda #{sale.id}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {sale.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Atendimento'}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(sale.createdAt).toLocaleDateString('pt-BR')} às {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(sale.total)}
                      </p>
                      {sale.discount > 0 && (
                        <p className="text-[10px] text-amber-500 font-medium">Desc: -{formatCurrency(sale.discount)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Side: Checkout Cart (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Frente de Caixa</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-[11px] text-red-400 hover:text-red-500 font-bold transition-colors"
              >
                Limpar Carrinho
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Clique nos serviços ou produtos ao lado para adicionar ao carrinho.
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{formatCurrency(item.unitPrice)} un.</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[60px] shrink-0">
                    <p className="font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Form Options */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Payment Method */}
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Forma de Pagamento</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['PIX', 'DINHEIRO', 'DEBITO', 'CREDITO'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-1 text-center font-bold text-[11px] rounded-xl border transition-all ${
                      paymentMethod === method
                        ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-white border-pink-500/50 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Professional & Discount */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Profissional (Comissão)</label>
                <select
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                >
                  <option value="">Sem vínculo</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Desconto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Customer Identification */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Nome do Cliente</label>
                <input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">WhatsApp (Recibo)</label>
                <input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Subtotal & Final Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-amber-500 font-bold">
                <span>Desconto:</span>
                <span className="font-mono">-{formatCurrency(discountVal)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1">
              <span>Total a Cobrar:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-lg">
                {formatCurrency(finalTotal)}
              </span>
            </div>

            <button
              onClick={handleFinalizeSale}
              disabled={submitting || cart.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>Finalizar Venda & Emitir Recibo</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal: Recibo Digital / Sucesso ── */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReceiptModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Venda Concluída!</h3>
              <p className="text-2xl font-black font-mono text-emerald-500">{formatCurrency(completedSale.total)}</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Código da Venda:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">#{completedSale.id}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Forma:</span>
                <span className="font-bold text-slate-900 dark:text-white">{completedSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Itens:</span>
                <span className="font-bold text-slate-900 dark:text-white">{completedSale.items?.length || 0} item(ns)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleSendReceipt}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Recibo pelo WhatsApp</span>
              </button>

              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Adicionar Item Avulso ── */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCustomItemModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Item Avulso / Personalizado</h3>
              <button onClick={() => setShowCustomItemModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Nome do Item *</label>
                <input
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Ex: Taxa de deslocamento, Adicional especial"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowCustomItemModal(false)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-xl shadow-md"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
