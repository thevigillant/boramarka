import { useState, useEffect } from 'react'
import {
  X,
  ChefHat,
  Plus,
  Trash2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  CheckCircle,
  Loader2,
  Info,
} from 'lucide-react'
import { api } from '../../../services/api'
import { formatCurrency } from '../../../utils/dashboardHelpers'
import type { ProductData } from '../../../types/dashboard'

interface ProductRecipeModalProps {
  product: ProductData | null
  isOpen: boolean
  onClose: () => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

interface RecipeItemState {
  id?: number
  inventoryItemId: number
  name: string
  unit: string
  quantity: number
  unitCost: number
}

export function ProductRecipeModal({
  product,
  isOpen,
  onClose,
  showToast,
}: ProductRecipeModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<RecipeItemState[]>([])
  const [inventoryList, setInventoryList] = useState<any[]>([])

  // Form for adding new ingredient
  const [selectedInvId, setSelectedInvId] = useState<string>('')
  const [inputQty, setInputQty] = useState<string>('')
  const [inputUnit, setInputUnit] = useState<string>('unidade')

  useEffect(() => {
    if (!isOpen || !product) return

    setLoading(true)
    Promise.all([
      api.getProductRecipe(product.id).catch(() => null),
      api.request('/inventory').catch(() => []),
    ])
      .then(([recipeData, invData]) => {
        setInventoryList(invData || [])

        if (recipeData && recipeData.recipeItems) {
          setItems(
            recipeData.recipeItems.map((it) => ({
              id: it.id,
              inventoryItemId: it.inventoryItemId,
              name: it.inventoryItem?.name || `Insumo #${it.inventoryItemId}`,
              unit: it.unit || it.inventoryItem?.unit || 'unidade',
              quantity: it.quantity,
              unitCost: it.inventoryItem?.costPrice || 0,
            }))
          )
        } else {
          setItems([])
        }
      })
      .catch((err) => {
        showToast(err.message || 'Erro ao carregar receita.', 'error')
      })
      .finally(() => setLoading(false))
  }, [isOpen, product, showToast])

  if (!isOpen || !product) return null

  // Auto-fill unit when selecting inventory item
  function handleSelectInventory(itemIdStr: string) {
    setSelectedInvId(itemIdStr)
    const found = inventoryList.find((i) => i.id === Number(itemIdStr))
    if (found?.unit) {
      setInputUnit(found.unit)
    }
  }

  function handleAddIngredient(e: React.FormEvent) {
    e.preventDefault()
    const invId = Number(selectedInvId)
    const qty = parseFloat(inputQty.replace(',', '.'))

    if (!invId) {
      showToast('Selecione um insumo do estoque.', 'error')
      return
    }
    if (isNaN(qty) || qty <= 0) {
      showToast('Informe uma quantidade válida maior que zero.', 'error')
      return
    }

    const existingIndex = items.findIndex((i) => i.inventoryItemId === invId)
    const invItem = inventoryList.find((i) => i.id === invId)
    const cost = invItem?.costPrice || 0

    if (existingIndex >= 0) {
      // Atualiza quantidade do item existente
      const updated = [...items]
      updated[existingIndex].quantity += qty
      updated[existingIndex].unit = inputUnit || updated[existingIndex].unit
      setItems(updated)
    } else {
      setItems([
        ...items,
        {
          inventoryItemId: invId,
          name: invItem?.name || `Insumo #${invId}`,
          unit: inputUnit || invItem?.unit || 'unidade',
          quantity: qty,
          unitCost: cost,
        },
      ])
    }

    setSelectedInvId('')
    setInputQty('')
    showToast('Insumo adicionado à ficha técnica!', 'success')
  }

  function handleRemoveIngredient(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Cálculos em tempo real
  const totalCost = items.reduce((acc, it) => acc + it.quantity * it.unitCost, 0)
  const sellingPrice = product ? (product.price || 0) : 0
  const grossMargin = sellingPrice - totalCost
  const marginPercentage = sellingPrice > 0 ? (grossMargin / sellingPrice) * 100 : 0

  async function handleSaveRecipe() {
    if (!product) return
    setSaving(true)
    try {
      const payload = items.map((it) => ({
        inventoryItemId: it.inventoryItemId,
        quantity: it.quantity,
        unit: it.unit,
      }))

      await api.setProductRecipe(product.id, payload)
      showToast('Ficha técnica e custo de produção salvos com sucesso!', 'success')
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar ficha técnica.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Cabeçalho ── */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Ficha Técnica de Produção (BOM)
              </h3>
              <p className="text-xs font-bold text-pink-500 mt-0.5">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500 mb-2" />
            <p className="text-xs text-slate-400 font-bold">Carregando insumos e ficha técnica...</p>
          </div>
        ) : (
          <>
            {/* ── Painel de Rentabilidade & Métricas do ERP ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Preço de Venda
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                  {formatCurrency(sellingPrice)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Custo Insumos (CMP)
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-orange-500">
                  {formatCurrency(totalCost)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lucro Bruto Unit.
                </span>
                <span
                  className={`text-sm sm:text-base font-black font-mono ${
                    grossMargin >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {formatCurrency(grossMargin)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Margem de Lucro
                </span>
                <span
                  className={`text-sm sm:text-base font-black font-mono ${
                    marginPercentage >= 30
                      ? 'text-emerald-500'
                      : marginPercentage >= 15
                      ? 'text-amber-500'
                      : 'text-red-500'
                  }`}
                >
                  {marginPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* ── Formulário para Adicionar Insumo ── */}
            <form
              onSubmit={handleAddIngredient}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/5 to-pink-500/5 dark:from-orange-950/20 dark:to-pink-950/20 border border-orange-500/20 space-y-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
                <Plus className="w-3.5 h-3.5 text-pink-500" />
                <span>Adicionar Insumo do Estoque à Receita</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-6">
                  <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1 text-[11px]">
                    Insumo / Matéria-Prima *
                  </label>
                  <select
                    value={selectedInvId}
                    onChange={(e) => handleSelectInventory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500 transition-all text-xs"
                    required
                  >
                    <option value="">Selecione um item do estoque...</option>
                    {inventoryList.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} (Estoque: {inv.quantity} {inv.unit} · Custo CMP: {formatCurrency(inv.costPrice || 0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1 text-[11px]">
                    Qtd por Unidade *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={inputQty}
                    onChange={(e) => setInputQty(e.target.value)}
                    placeholder="Ex: 0.25"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500 transition-all text-xs"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1 text-[11px]">
                    Unidade
                  </label>
                  <input
                    type="text"
                    value={inputUnit}
                    onChange={(e) => setInputUnit(e.target.value)}
                    placeholder="kg, g, ml, un"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500 transition-all text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-pink-500/20 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir Insumo</span>
                </button>
              </div>
            </form>

            {/* ── Tabela de Insumos da Ficha Técnica ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
                  Ingredientes & Proporções ({items.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Total em insumos: <strong className="text-slate-900 dark:text-white">{formatCurrency(totalCost)}</strong>
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-8 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-1.5">
                  <Package className="w-7 h-7 mx-auto text-slate-400 opacity-60" />
                  <p className="text-xs font-bold">Nenhum insumo configurado ainda.</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Adicione os ingredientes acima para que o BoraMarka calcule automaticamente seu custo de fabricação e
                    dê baixa no estoque quando o pedido for para produção.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Insumo</th>
                        <th className="py-2.5 px-3 text-center">Consumo Unitário</th>
                        <th className="py-2.5 px-3 text-right">Custo Insumo</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        <th className="py-2.5 px-3 text-center w-12">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {items.map((it, idx) => {
                        const subtotal = it.quantity * it.unitCost
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{it.name}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              {formatCurrency(it.unitCost)}/{it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-orange-500">
                              {formatCurrency(subtotal)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(idx)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Remover da receita"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Informações e Dica de Automação ERP ── */}
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Automação Ativa:</strong> Ao avançar qualquer encomenda deste produto para{' '}
                <span className="font-bold underline">Em Produção</span> no Kanban, o sistema deduzirá exatamente estas
                quantidades da matéria-prima no seu estoque com registro de rastreabilidade.
              </p>
            </div>

            {/* ── Botões de Ação ── */}
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-pink-500/20 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Salvar Ficha Técnica</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
