import { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Trash2,
  Share2,
  Copy,
  Check,
  Sparkles,
  ShoppingBag,
  Filter,
  Layers,
  ArrowRight,
  Package,
  AlertCircle,
  Loader2,
  RotateCcw,
  CheckSquare,
  Search,
} from 'lucide-react'
import { OrderData, ShoppingListData, ShoppingListItemData } from '../../../types/dashboard'
import { api } from '../../../services/api'
import { NewShoppingListModal } from '../modals/NewShoppingListModal'
import { ConfirmModal } from '../../common/ConfirmModal'
import {
  calculateShoppingProgress,
  formatShoppingListForWhatsApp,
} from '../../../utils/shoppingListHelpers'
import { formatCurrency, formatDate } from '../../../utils/dashboardHelpers'

interface BoraEncomendaComprasSubTabProps {
  orders: OrderData[]
  showToast: (msg: string, type?: 'success' | 'error') => void
  onNavigateTab?: (tab: any) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  'Laticínios & Ovos': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Secos & Farinhas': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Doces & Chocolates': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  'Embalagens': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Hortifruti': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Geral': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export function BoraEncomendaComprasSubTab({
  orders,
  showToast,
  onNavigateTab,
}: BoraEncomendaComprasSubTabProps) {
  const [lists, setLists] = useState<ShoppingListData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'checked'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false)
  const [generatingFromOrders, setGeneratingFromOrders] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // In-line fast adder state
  const [quickName, setQuickName] = useState('')
  const [quickQty, setQuickQty] = useState<number>(1)
  const [quickUnit, setQuickUnit] = useState('un')
  const [addingQuickItem, setAddingQuickItem] = useState(false)

  // Carrega listas do backend
  const loadLists = async () => {
    try {
      setLoading(true)
      const res = await api.getShoppingLists()
      setLists(res.lists || [])
      if (res.lists && res.lists.length > 0 && !selectedListId) {
        setSelectedListId(res.lists[0].id)
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar listas de compras.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLists()
  }, [])

  // Lista selecionada atualmente
  const activeList = useMemo(() => {
    return lists.find((l) => l.id === selectedListId) || lists[0] || null
  }, [lists, selectedListId])

  // KPIs agregados
  const stats = useMemo(() => {
    const totalLists = lists.length
    const openLists = lists.filter((l) => l.status === 'ABERTA').length
    let totalItems = 0
    let checkedItems = 0
    let totalEstimated = 0

    lists.forEach((l) => {
      totalItems += l.totalItems || l.items?.length || 0
      checkedItems += l.checkedItems || l.items?.filter((i) => i.checked).length || 0
      totalEstimated += l.estimatedTotal || 0
    })

    const globalProgress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

    return {
      totalLists,
      openLists,
      totalItems,
      checkedItems,
      pendingItems: totalItems - checkedItems,
      globalProgress,
      totalEstimated,
    }
  }, [lists])

  // Itens filtrados da lista ativa
  const filteredItems = useMemo(() => {
    if (!activeList || !activeList.items) return []
    let listItems = [...activeList.items]

    if (filterStatus === 'pending') {
      listItems = listItems.filter((i) => !i.checked)
    } else if (filterStatus === 'checked') {
      listItems = listItems.filter((i) => i.checked)
    }

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase()
      listItems = listItems.filter(
        (i) => i.name.toLowerCase().includes(s) || i.category?.toLowerCase().includes(s)
      )
    }

    return listItems
  }, [activeList, filterStatus, searchTerm])

  // Alternar check do item (com update otimista)
  const handleToggleItem = async (itemId: number) => {
    if (!activeList) return

    // Otimista
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== activeList.id) return l
        const updatedItems = l.items.map((i) => {
          if (i.id !== itemId) return i
          return { ...i, checked: !i.checked, checkedAt: !i.checked ? new Date().toISOString() : null }
        })
        const total = updatedItems.length
        const checkedCount = updatedItems.filter((i) => i.checked).length
        const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0
        return { ...l, items: updatedItems, checkedItems: checkedCount, progress }
      })
    )

    try {
      const res = await api.toggleShoppingListItem(activeList.id, itemId)
      if (res.allChecked) {
        showToast('🎉 Parabéns! Todos os itens desta lista foram pegos!', 'success')
      }
    } catch {
      showToast('Erro ao atualizar status do item.', 'error')
      loadLists()
    }
  }

  // Adição rápida in-line
  const handleAddQuickItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeList || !quickName.trim()) return

    setAddingQuickItem(true)
    try {
      const res = await api.addShoppingListItem(activeList.id, {
        name: quickName.trim(),
        quantity: Number(quickQty) || 1,
        unit: quickUnit,
      })

      setLists((prev) =>
        prev.map((l) => {
          if (l.id !== activeList.id) return l
          const newItems = [...(l.items || []), res.item]
          return {
            ...l,
            items: newItems,
            totalItems: newItems.length,
            checkedItems: newItems.filter((i) => i.checked).length,
            progress: Math.round((newItems.filter((i) => i.checked).length / newItems.length) * 100),
          }
        })
      )

      setQuickName('')
      setQuickQty(1)
      showToast(`Item "${quickName}" adicionado à lista!`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Erro ao adicionar item.', 'error')
    } finally {
      setAddingQuickItem(false)
    }
  }

  // Remover item
  const handleDeleteItem = async (itemId: number) => {
    if (!activeList) return

    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== activeList.id) return l
        const newItems = l.items.filter((i) => i.id !== itemId)
        const checkedCount = newItems.filter((i) => i.checked).length
        return {
          ...l,
          items: newItems,
          totalItems: newItems.length,
          checkedItems: checkedCount,
          progress: newItems.length > 0 ? Math.round((checkedCount / newItems.length) * 100) : 0,
        }
      })
    )

    try {
      await api.deleteShoppingListItem(activeList.id, itemId)
    } catch {
      showToast('Erro ao remover item.', 'error')
      loadLists()
    }
  }

  // Alternar status da lista (ABERTA <-> CONCLUIDA)
  const handleToggleListStatus = async () => {
    if (!activeList) return
    const nextStatus = activeList.status === 'ABERTA' ? 'CONCLUIDA' : 'ABERTA'

    try {
      await api.updateShoppingList(activeList.id, { status: nextStatus })
      setLists((prev) =>
        prev.map((l) => (l.id === activeList.id ? { ...l, status: nextStatus } : l))
      )
      showToast(
        nextStatus === 'CONCLUIDA'
          ? 'Lista marcada como concluída!'
          : 'Lista reaberta para novas compras!',
        'success'
      )
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar status da lista.', 'error')
    }
  }

  // Excluir lista
  const handleDeleteList = () => {
    if (!activeList) return
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteList = async () => {
    if (!activeList) return
    setDeleteConfirmOpen(false)
    try {
      await api.deleteShoppingList(activeList.id)
      const remaining = lists.filter((l) => l.id !== activeList.id)
      setLists(remaining)
      setSelectedListId(remaining.length > 0 ? remaining[0].id : null)
      showToast('Lista de compras excluída com sucesso.', 'success')
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir lista.', 'error')
    }
  }

  // Copiar checklist para WhatsApp
  const handleCopyForWhatsApp = () => {
    if (!activeList) return
    const text = formatShoppingListForWhatsApp(activeList)
    navigator.clipboard.writeText(text)
    setCopiedWhatsapp(true)
    showToast('Checklist formatado copiado! Cole no WhatsApp para enviar.', 'success')
    setTimeout(() => setCopiedWhatsapp(false), 2500)
  }

  // Gerar lista automática a partir de encomendas ativas
  const handleGenerateFromOrders = async () => {
    setGeneratingFromOrders(true)
    try {
      const res = await api.generateShoppingListFromOrders()
      setLists((prev) => [res.list, ...prev])
      setSelectedListId(res.list.id)
      showToast(`Lista "${res.list.title}" gerada com os itens das encomendas!`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Nenhuma encomenda ativa para gerar lista.', 'error')
    } finally {
      setGeneratingFromOrders(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ── Header do Submódulo ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#131826] p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-pink-500/10 via-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
              Modo Mercado
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Checklist Interativo de Insumos
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-pink-500" />
            Lista de Compras de Produção
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl font-medium">
            Crie listas de compras manuais ou automáticas por encomenda e marque com 1 toque no celular os itens que já colocou no carrinho.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={handleGenerateFromOrders}
            disabled={generatingFromOrders}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Agrupa itens de todas as encomendas em produção e gera uma lista pronta"
          >
            {generatingFromOrders ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            )}
            <span>Puxar de Encomendas</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Lista de Compras</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#131826] rounded-2xl p-4 border border-slate-800 shadow-md">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Listas Abertas
          </span>
          <p className="text-2xl font-black text-white">{stats.openLists}</p>
          <span className="text-[10px] text-pink-400 font-semibold mt-0.5 block">
            {stats.totalLists} lista(s) no total
          </span>
        </div>

        <div className="bg-[#131826] rounded-2xl p-4 border border-slate-800 shadow-md">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Itens a Comprar
          </span>
          <p className="text-2xl font-black text-amber-400">{stats.pendingItems}</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
            Pendentes nas gôndolas
          </span>
        </div>

        <div className="bg-[#131826] rounded-2xl p-4 border border-slate-800 shadow-md">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            No Carrinho
          </span>
          <p className="text-2xl font-black text-emerald-400">{stats.checkedItems}</p>
          <span className="text-[10px] text-emerald-400/80 font-semibold mt-0.5 block">
            {stats.globalProgress}% já pegos
          </span>
        </div>

        <div className="bg-[#131826] rounded-2xl p-4 border border-slate-800 shadow-md">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Total de Itens
          </span>
          <p className="text-2xl font-black text-purple-400">{stats.totalItems}</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
            Em todas as listas
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto" />
          <p className="text-xs font-bold text-slate-400">Carregando listas de compras...</p>
        </div>
      ) : lists.length === 0 ? (
        /* ── Empty State ── */
        <div className="p-12 text-center rounded-3xl bg-[#131826] border border-dashed border-slate-800 space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-3xl bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-black text-white">Nenhuma Lista de Compras Ativa</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Crie uma nova lista para comprar os ingredientes da semana ou gere uma automaticamente a partir das suas encomendas ativas!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button
              onClick={() => setShowNewModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-black text-xs transition-all shadow-md cursor-pointer"
            >
              Criar Primeira Lista
            </button>
            <button
              onClick={handleGenerateFromOrders}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 cursor-pointer"
            >
              Puxar das Encomendas
            </button>
          </div>
        </div>
      ) : (
        /* ── Layout com Seletor de Listas e Checklist Ativo ── */
        <div className="space-y-4">
          
          {/* Carrossel de Abas das Listas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {lists.map((l) => {
              const isSelected = activeList?.id === l.id
              return (
                <button
                  key={l.id}
                  onClick={() => setSelectedListId(l.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all shrink-0 min-w-[220px] max-w-[280px] cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-pink-500/50 shadow-lg shadow-pink-500/5'
                      : 'bg-[#131826] border-slate-800/80 hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-black text-xs text-white truncate">{l.title}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        l.status === 'CONCLUIDA'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {l.status === 'CONCLUIDA' ? 'Feita' : 'Aberta'}
                    </span>
                  </div>

                  {/* Barra de Progresso Mini */}
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>
                        {l.checkedItems || 0}/{l.totalItems || 0} pegos
                      </span>
                      <span className="font-bold text-pink-400">{l.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${l.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* ── Painel da Lista Ativa (Modo Supermercado) ── */}
          {activeList && (
            <div className="bg-[#131826] rounded-3xl border border-slate-800 p-5 sm:p-7 shadow-xl space-y-5">
              
              {/* Header da Lista Ativa */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-lg sm:text-xl font-black text-white">{activeList.title}</h4>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        activeList.status === 'CONCLUIDA'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {activeList.status === 'CONCLUIDA' ? '✅ Concluída' : '🛒 Em Aberto'}
                    </span>
                    {activeList.targetDate && (
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-pink-400" />
                        {formatDate(activeList.targetDate)}
                      </span>
                    )}
                  </div>

                  {activeList.description && (
                    <p className="text-xs text-slate-400 font-medium">{activeList.description}</p>
                  )}

                  {activeList.order && (
                    <p className="text-[11px] text-pink-400/90 font-semibold flex items-center gap-1 mt-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Vinculada à Encomenda:</span>
                      <strong>
                        {activeList.order.orderNumber} ({activeList.order.clientName})
                      </strong>
                    </p>
                  )}
                </div>

                {/* Ações da Lista */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleCopyForWhatsApp}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    title="Copiar checklist em texto para enviar no WhatsApp"
                  >
                    {copiedWhatsapp ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{copiedWhatsapp ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
                  </button>

                  <button
                    onClick={handleToggleListStatus}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeList.status === 'CONCLUIDA'
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{activeList.status === 'CONCLUIDA' ? 'Reabrir Lista' : 'Finalizar Lista'}</span>
                  </button>

                  <button
                    onClick={handleDeleteList}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    title="Excluir Lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Barra de Progresso em Destaque (Modo Mercado) ── */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#182032] to-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white">No Carrinho de Compras:</span>
                    <span className="font-black text-pink-400 font-mono">
                      {activeList.checkedItems || 0} de {activeList.totalItems || 0} itens pegos
                    </span>
                  </div>
                  <span className="font-black text-base text-pink-400 font-mono">
                    {activeList.progress || 0}%
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${activeList.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* ── Filtros e Busca Rápida ── */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                {/* Abas de Filtro */}
                <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterStatus === 'all'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todos ({activeList.items?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterStatus === 'pending'
                        ? 'bg-slate-800 text-amber-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    A Pegar ({(activeList.items || []).filter((i) => !i.checked).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('checked')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterStatus === 'checked'
                        ? 'bg-slate-800 text-emerald-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    No Carrinho ({(activeList.items || []).filter((i) => i.checked).length})
                  </button>
                </div>

                {/* Campo de Busca */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar produtos..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* ── Checklist Interativo de Itens ── */}
              <div className="space-y-2">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400">
                    {filterStatus === 'pending'
                      ? '🎉 Todos os itens já foram pegos nesta lista!'
                      : 'Nenhum item encontrado com o filtro selecionado.'}
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isChecked = item.checked
                    const catClass =
                      CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Geral']

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 select-none cursor-pointer group ${
                          isChecked
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400'
                            : 'bg-slate-900/80 hover:bg-slate-800/70 border-slate-800/90 text-white'
                        }`}
                      >
                        {/* Checkbox + Nome */}
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleItem(item.id)
                            }}
                            className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 scale-105'
                                : 'border-2 border-slate-600 hover:border-pink-500 text-transparent'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>

                          <div className="truncate">
                            <p
                              className={`text-xs sm:text-sm font-bold truncate transition-all ${
                                isChecked
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.name}
                            </p>
                            {item.notes && (
                              <p className="text-[11px] text-slate-400 truncate italic mt-0.5">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Qtd, Categoria e Ações */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Badge da Categoria */}
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border hidden sm:inline-block ${catClass}`}
                          >
                            {item.category || 'Geral'}
                          </span>

                          {/* Quantidade */}
                          <span
                            className={`font-mono text-xs sm:text-sm font-black px-2.5 py-1 rounded-xl ${
                              isChecked
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                            }`}
                          >
                            {item.quantity} {item.unit}
                          </span>

                          {/* Excluir */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteItem(item.id)
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remover este item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* ── Adição Rápida In-Line (Modo Supermercado Ágil) ── */}
              <form
                onSubmit={handleAddQuickItem}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center gap-2"
              >
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="Adicionar produto rápido... (tecle Enter)"
                    className="w-full bg-[#111726] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1 w-32">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={quickQty || ''}
                      onChange={(e) => setQuickQty(parseFloat(e.target.value) || 1)}
                      className="w-14 bg-[#111726] border border-slate-700/80 rounded-xl px-2 py-2 text-xs font-bold text-white text-center focus:outline-none focus:border-pink-500"
                    />
                    <select
                      value={quickUnit}
                      onChange={(e) => setQuickUnit(e.target.value)}
                      className="bg-[#111726] border border-slate-700/80 rounded-xl px-1.5 py-2 text-xs font-bold text-slate-300 text-center cursor-pointer"
                    >
                      <option value="un">un</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="pct">pct</option>
                      <option value="cx">cx</option>
                      <option value="lata">lata</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={addingQuickItem || !quickName.trim()}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40 w-full sm:w-auto"
                  >
                    {addingQuickItem ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Adicionar</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── Modal de Nova Lista ── */}
      <NewShoppingListModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(newList) => {
          setLists((prev) => [newList, ...prev])
          setSelectedListId(newList.id)
        }}
        orders={orders}
        showToast={showToast}
      />

      {/* ── Modal de Confirmação do Sistema ── */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Excluir Lista de Compras"
        message={`Deseja realmente excluir a lista "${activeList?.title || 'Selecionada'}"?\n\nTodos os itens associados serão removidos permanentemente.`}
        type="danger"
        confirmText="Excluir Lista"
        cancelText="Cancelar"
        onConfirm={confirmDeleteList}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  )
}
