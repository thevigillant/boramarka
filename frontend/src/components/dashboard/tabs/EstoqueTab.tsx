import { useState, useEffect, useCallback } from 'react'
import {
  Package, Plus, Search, Filter, AlertTriangle, ArrowUpRight, ArrowDownRight,
  RefreshCw, Edit2, Trash2, Check, X, Loader2, ArrowUpDown, DollarSign,
  TrendingDown, Layers, Box, ShoppingCart
} from 'lucide-react'
import { api } from '../../../services/api'
import { formatCurrency } from '../../../utils/dashboardHelpers'

export interface InventoryItemData {
  id: number
  name: string
  description: string
  category: string
  unit: string
  costPrice: number
  salePrice: number
  quantity: number
  minQuantity: number
  photoUrl: string
  active: boolean
  lowStock?: boolean
  movements?: {
    id: number
    type: 'ENTRADA' | 'SAIDA' | 'AJUSTE'
    quantity: number
    reason: string
    createdAt: string
  }[]
}

interface EstoqueTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void
}

export function EstoqueTab({ showToast }: EstoqueTabProps) {
  const [items, setItems] = useState<InventoryItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PRODUTO' | 'INSUMO'>('ALL')
  const [onlyLowStock, setOnlyLowStock] = useState(false)

  // Modals state
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItemData | null>(null)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [selectedItemForMove, setSelectedItemForMove] = useState<InventoryItemData | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('PRODUTO')
  const [unit, setUnit] = useState('unidade')
  const [costPrice, setCostPrice] = useState<number | string>('')
  const [salePrice, setSalePrice] = useState<number | string>('')
  const [quantity, setQuantity] = useState<number | string>('')
  const [minQuantity, setMinQuantity] = useState<number | string>(5)
  const [submitting, setSubmitting] = useState(false)

  // Movement Form
  const [moveType, setMoveType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA')
  const [moveQuantity, setMoveQuantity] = useState<number | string>('')
  const [moveReason, setMoveReason] = useState('')
  const [moveSubmitting, setMoveSubmitting] = useState(false)

  const fetchItems = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await api.request('/inventory')
      setItems(data || [])
    } catch (err: any) {
      if (!silent) showToast(err.message || 'Erro ao carregar estoque.', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function handleOpenCreate() {
    setEditingItem(null)
    setName('')
    setDescription('')
    setCategory('PRODUTO')
    setUnit('unidade')
    setCostPrice('')
    setSalePrice('')
    setQuantity('')
    setMinQuantity(5)
    setShowItemModal(true)
  }

  function handleOpenEdit(item: InventoryItemData) {
    setEditingItem(item)
    setName(item.name)
    setDescription(item.description || '')
    setCategory(item.category || 'PRODUTO')
    setUnit(item.unit || 'unidade')
    setCostPrice(item.costPrice || '')
    setSalePrice(item.salePrice || '')
    setQuantity(item.quantity)
    setMinQuantity(item.minQuantity)
    setShowItemModal(true)
  }

  function handleOpenMovement(item: InventoryItemData) {
    setSelectedItemForMove(item)
    setMoveType('ENTRADA')
    setMoveQuantity('')
    setMoveReason('')
    setShowMovementModal(true)
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return showToast('Nome do item é obrigatório.', 'error')

    setSubmitting(true)
    try {
      if (editingItem) {
        await api.request(`/inventory/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            description,
            category,
            unit,
            costPrice: Number(costPrice) || 0,
            salePrice: Number(salePrice) || 0,
            minQuantity: Number(minQuantity) || 0,
          }),
        })
        showToast('Item atualizado com sucesso!', 'success')
      } else {
        await api.request('/inventory', {
          method: 'POST',
          body: JSON.stringify({
            name,
            description,
            category,
            unit,
            costPrice: Number(costPrice) || 0,
            salePrice: Number(salePrice) || 0,
            quantity: Number(quantity) || 0,
            minQuantity: Number(minQuantity) || 5,
          }),
        })
        showToast('Novo item cadastrado no estoque!', 'success')
      }
      setShowItemModal(false)
      fetchItems(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar item.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveMovement(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItemForMove) return
    const qty = Number(moveQuantity)
    if (!qty || qty <= 0) return showToast('Informe uma quantidade válida.', 'error')

    setMoveSubmitting(true)
    try {
      await api.request(`/inventory/${selectedItemForMove.id}/movement`, {
        method: 'POST',
        body: JSON.stringify({
          type: moveType,
          quantity: qty,
          reason: moveReason || `Movimentação manual (${moveType})`,
        }),
      })
      showToast('Movimentação de estoque registrada!', 'success')
      setShowMovementModal(false)
      fetchItems(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar movimentação.', 'error')
    } finally {
      setMoveSubmitting(false)
    }
  }

  async function handleDeleteItem(item: InventoryItemData) {
    if (!confirm(`Deseja realmente remover "${item.name}" do estoque?`)) return
    try {
      await api.request(`/inventory/${item.id}`, { method: 'DELETE' })
      showToast('Item desativado com sucesso.', 'success')
      fetchItems(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir item.', 'error')
    }
  }

  // Filtragem
  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter
    const matchLow = !onlyLowStock || (item.quantity <= item.minQuantity)
    return matchSearch && matchCat && matchLow
  })

  // Totais & Métricas
  const totalItemsCount = items.reduce((acc, i) => acc + i.quantity, 0)
  const totalStockValue = items.reduce((acc, i) => acc + (i.quantity * (i.costPrice || 0)), 0)
  const totalSaleValue = items.reduce((acc, i) => acc + (i.quantity * (i.salePrice || 0)), 0)
  const lowStockCount = items.filter(i => i.quantity <= i.minQuantity).length

  return (
    <div className="animate-slide-up space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Controle de Estoque & Insumos</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle produtos para revenda, insumos e receba avisos de reposição automática.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => fetchItems(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
            title="Atualizar Estoque"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black py-2.5 px-5 rounded-xl transition-all shadow-md shadow-pink-500/20 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Produto / Insumo</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-simple p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Produtos Totais</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{items.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{totalItemsCount} unidades no acervo</p>
        </div>

        <div className="card-simple p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custo em Estoque</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{formatCurrency(totalStockValue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Capital investido</p>
        </div>

        <div className="card-simple p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Potencial de Venda</span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{formatCurrency(totalSaleValue)}</p>
          <p className="text-[11px] text-emerald-500 font-bold mt-0.5">Lucro: {formatCurrency(Math.max(0, totalSaleValue - totalStockValue))}</p>
        </div>

        <div className={`card-simple p-4 rounded-2xl border transition-all ${
          lowStockCount > 0
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Estoque Baixo</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-500 mt-2">{lowStockCount}</p>
          <p className="text-[11px] text-amber-400/80 mt-0.5">
            {lowStockCount > 0 ? 'Requer reposição urgente' : 'Nenhum alerta pendente'}
          </p>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200 dark:border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setCategoryFilter('PRODUTO')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                categoryFilter === 'PRODUTO'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Revenda
            </button>
            <button
              onClick={() => setCategoryFilter('INSUMO')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                categoryFilter === 'INSUMO'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Insumos
            </button>
          </div>

          {/* Only Low Stock Toggle */}
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              onlyLowStock
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500/30'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alerta Baixo</span>
          </button>
        </div>
      </div>

      {/* ── Table / Grid ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white/40 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhum item encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || onlyLowStock || categoryFilter !== 'ALL'
              ? 'Tente ajustar os filtros de busca para encontrar o item desejado.'
              : 'Comece adicionando seu primeiro produto ou insumo de estoque.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold rounded-xl shadow-md"
          >
            + Cadastrar Item
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Item / Categoria</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4">Preço Custo</th>
                <th className="py-3 px-4">Preço Venda</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredItems.map(item => {
                const isLow = item.quantity <= item.minQuantity
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-white truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {item.category === 'INSUMO' ? 'Insumo Interno' : 'Produto de Revenda'}
                            </span>
                            <span className="text-[10px] text-slate-400">Unidade: {item.unit}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-base font-black font-mono ${isLow ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-[9px] text-slate-400">Mín: {item.minQuantity}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                      {formatCurrency(item.costPrice || 0)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.salePrice || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" /> Baixo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          <Check className="w-3 h-3" /> Normal
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenMovement(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold text-xs flex items-center gap-1 transition-all"
                          title="Entrada / Saída de Estoque"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          <span>Movimentar</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-500/10 transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal: Criar / Editar Item ── */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowItemModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-lg p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingItem ? 'Editar Item do Estoque' : 'Novo Produto ou Insumo'}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Nome do Item *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Pomada Modeladora Matte 150g"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Finalidade / Categoria</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                  >
                    <option value="PRODUTO">Venda / Revenda ao Cliente</option>
                    <option value="INSUMO">Insumo de Uso Interno</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Unidade de Medida</label>
                  <input
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="unidade, ml, kg, tubo"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={e => setSalePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!editingItem && (
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Estoque Inicial</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                    />
                  </div>
                )}
                <div className={editingItem ? 'col-span-2' : ''}>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Estoque Mínimo (Alerta)</label>
                  <input
                    type="number"
                    value={minQuantity}
                    onChange={e => setMinQuantity(e.target.value)}
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Descrição / Detalhes</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Informações adicionais do produto..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black rounded-xl transition-all shadow-md shadow-pink-500/20 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? 'Salvar Alterações' : 'Cadastrar Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Movimentação de Estoque (Entrada/Saída/Ajuste) ── */}
      {showMovementModal && selectedItemForMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowMovementModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Movimentar Estoque</h3>
                <p className="text-xs text-pink-500 font-bold mt-0.5">{selectedItemForMove.name}</p>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estoque Atual:</span>
              <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                {selectedItemForMove.quantity} {selectedItemForMove.unit}
              </span>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1.5">Tipo de Movimentação</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMoveType('ENTRADA')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1 ${
                      moveType === 'ENTRADA'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoveType('SAIDA')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1 ${
                      moveType === 'SAIDA'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" /> Saída
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoveType('AJUSTE')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1 ${
                      moveType === 'AJUSTE'
                        ? 'bg-violet-500/20 text-violet-400 border-violet-500/40 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" /> Ajuste
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {moveType === 'AJUSTE' ? 'Nova Quantidade Absoluta *' : 'Quantidade *'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={moveQuantity}
                  onChange={e => setMoveQuantity(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Motivo da Movimentação</label>
                <input
                  value={moveReason}
                  onChange={e => setMoveReason(e.target.value)}
                  placeholder="Ex: Compra de lote novo, quebra, consumo em atendimento"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={moveSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {moveSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirmar Movimentação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
