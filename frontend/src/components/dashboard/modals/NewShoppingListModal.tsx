import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ShoppingBag,
  ListPlus,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { OrderData, ShoppingListData } from '../../../types/dashboard'
import { api } from '../../../services/api'
import { parseQuickShoppingItemsText } from '../../../utils/shoppingListHelpers'

interface NewShoppingListModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (newList: ShoppingListData) => void
  orders: OrderData[]
  showToast: (msg: string, type?: 'success' | 'error') => void
}

interface DraftItem {
  name: string
  quantity: number
  unit: string
  category: string
  estimatedPrice: number
  notes: string
}

const TEMPLATES = [
  '🎂 Encomendas do Fim de Semana',
  '🛒 Supermercado / Atacado de Insumos',
  '📦 Embalagens, Caixas e Fitas',
  '🍓 Feira & Frutas Frescas',
  '🍫 Chocolates, Recheios & Confeitos',
]

const CATEGORIES = [
  'Geral',
  'Laticínios & Ovos',
  'Secos & Farinhas',
  'Doces & Chocolates',
  'Embalagens',
  'Hortifruti',
]

const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'pct', 'cx', 'lata', 'garrafa']

export function NewShoppingListModal({
  isOpen,
  onClose,
  onCreated,
  orders,
  showToast,
}: NewShoppingListModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('')
  const [inputMode, setInputMode] = useState<'individual' | 'bulk'>('individual')
  const [bulkText, setBulkText] = useState('')
  const [items, setItems] = useState<DraftItem[]>([
    { name: '', quantity: 1, unit: 'un', category: 'Geral', estimatedPrice: 0, notes: '' },
  ])
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { name: '', quantity: 1, unit: 'un', category: 'Geral', estimatedPrice: 0, notes: '' },
    ])
  }

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateItemRow = (index: number, field: keyof DraftItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: val }
      return copy
    })
  }

  const handleApplyBulkText = () => {
    if (!bulkText.trim()) return
    const parsed = parseQuickShoppingItemsText(bulkText)
    if (parsed.length > 0) {
      const newDraftItems: DraftItem[] = parsed.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        unit: p.unit,
        category: p.category,
        estimatedPrice: 0,
        notes: '',
      }))
      setItems((prev) => [...prev.filter((i) => i.name.trim().length > 0), ...newDraftItems])
      setBulkText('')
      setInputMode('individual')
      showToast(`${parsed.length} itens interpretados e adicionados!`, 'success')
    }
  }

  const handleSelectOrder = (orderIdVal: string) => {
    const idNum = orderIdVal ? Number(orderIdVal) : ''
    setSelectedOrderId(idNum)

    if (idNum) {
      const ord = orders.find((o) => o.id === idNum)
      if (ord) {
        if (!title) {
          setTitle(`Compras Encomenda ${ord.orderNumber} (${ord.clientName})`)
        }
        // Sugere itens baseados nos itens da encomenda
        if (ord.items && ord.items.length > 0) {
          const suggested = ord.items.map((oi) => ({
            name: oi.productName || 'Ingrediente Encomenda',
            quantity: oi.quantity,
            unit: 'un',
            category: 'Doces & Chocolates',
            estimatedPrice: 0,
            notes: `Encomenda ${ord.orderNumber}`,
          }))
          setItems((prev) => [
            ...prev.filter((i) => i.name.trim().length > 0),
            ...suggested,
          ])
          showToast(`Itens da encomenda ${ord.orderNumber} sugeridos na lista!`, 'success')
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      showToast('Informe o nome da lista de compras.', 'error')
      return
    }

    // Se estiver no modo lote com texto pendente, processa antes
    let finalItems = [...items]
    if (inputMode === 'bulk' && bulkText.trim()) {
      const parsed = parseQuickShoppingItemsText(bulkText)
      finalItems = [
        ...finalItems.filter((i) => i.name.trim().length > 0),
        ...parsed.map((p) => ({
          name: p.name,
          quantity: p.quantity,
          unit: p.unit,
          category: p.category,
          estimatedPrice: 0,
          notes: '',
        })),
      ]
    }

    const validItems = finalItems
      .filter((i) => i.name && i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: Number(i.quantity) || 1,
        unit: i.unit || 'un',
        category: i.category || 'Geral',
        estimatedPrice: Number(i.estimatedPrice) || 0,
        notes: i.notes?.trim() || '',
      }))

    setSaving(true)
    try {
      const res = await api.createShoppingList({
        title: title.trim(),
        description: description.trim(),
        targetDate: targetDate || undefined,
        orderId: selectedOrderId ? Number(selectedOrderId) : undefined,
        items: validItems,
      })

      showToast(`Lista de compras "${title}" criada com sucesso!`, 'success')
      onCreated(res.list)
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar lista de compras.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-[#131826] w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in text-slate-900 dark:text-slate-100 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Nova Lista de Compras
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
                  BoraEnkomenda
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Organize ingredientes, embalagens e insumos com checklist para o mercado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* Templates rápidos */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
              Sugestões Rápidas de Título:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTitle(tmpl.replace(/^[^\w\s]+\s*/, ''))}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-pink-500/10 hover:text-pink-500 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Dados Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Nome da Lista *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Compras Supermercado - Sexta"
                required
                className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Data Prevista das Compras
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Vínculo Opcional com Encomenda */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-pink-500" />
                Vincular a uma Encomenda Ativa (Opcional)
              </span>
              <span className="text-[10px] text-slate-400">Puxa itens sugeridos</span>
            </div>

            <select
              value={selectedOrderId}
              onChange={(e) => handleSelectOrder(e.target.value)}
              className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              <option value="">Nenhuma encomenda vinculada (Lista Geral)</option>
              {orders
                .filter((o) => o.status !== 'CANCELADO' && o.status !== 'ENTREGUE')
                .map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderNumber} — {ord.clientName} (Entrega: {ord.deliveryDate})
                  </option>
                ))}
            </select>
          </div>

          {/* Alternância de Modo de Entrada de Itens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Itens da Lista ({items.filter((i) => i.name.trim()).length})
                </span>
              </div>

              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInputMode('individual')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inputMode === 'individual'
                      ? 'bg-white dark:bg-[#131826] text-pink-500 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Grade Detalhada
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('bulk')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inputMode === 'bulk'
                      ? 'bg-white dark:bg-[#131826] text-pink-500 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Colar Lista Rápida
                </button>
              </div>
            </div>

            {/* MODO 1: GRADE DETALHADA */}
            {inputMode === 'individual' && (
              <div className="space-y-2.5">
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200 dark:border-slate-800 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) => handleUpdateItemRow(idx, 'name', e.target.value)}
                          placeholder="Nome do produto/ingrediente..."
                          className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            value={it.quantity || ''}
                            onChange={(e) => handleUpdateItemRow(idx, 'quantity', parseFloat(e.target.value) || 1)}
                            className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:border-pink-500"
                          />
                          <select
                            value={it.unit}
                            onChange={(e) => handleUpdateItemRow(idx, 'unit', e.target.value)}
                            className="bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-1.5 py-1.5 font-bold text-slate-600 dark:text-slate-300 text-center"
                          >
                            {UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <select
                          value={it.category}
                          onChange={(e) => handleUpdateItemRow(idx, 'category', e.target.value)}
                          className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 font-bold text-slate-700 dark:text-slate-300"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={items.length === 1}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-pink-500 rounded-xl text-xs font-bold text-slate-500 hover:text-pink-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Mais um Item</span>
                </button>
              </div>
            )}

            {/* MODO 2: COLAR LISTA EM LOTE */}
            {inputMode === 'bulk' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-pink-500" />
                    Cole sua lista (uma linha por produto)
                  </span>
                  <span className="text-[11px] text-slate-400">Ex: "4 latas Leite condensado"</span>
                </div>

                <textarea
                  rows={5}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`5 latas Leite Moça\n2 kg Farinha de trigo especial\n3x Barra de chocolate belga\n2 caixas Morangos frescos\n10 un Embalagem para bolo G60`}
                  className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500 resize-none"
                />

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    O sistema detecta quantidade, unidade e categoria automaticamente.
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyBulkText}
                    disabled={!bulkText.trim()}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Processar Linhas</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Observações Gerais */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Observações / Local de Compra
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Comprar no Atacadão ou Distribuidora de Embalagens Centro"
              className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Sticky Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-lg shadow-pink-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando Lista...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Criar Lista de Compras</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
