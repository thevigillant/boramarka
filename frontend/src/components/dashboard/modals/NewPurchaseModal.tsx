import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ShoppingCart, Plus, Trash2, Loader2, PackageCheck } from 'lucide-react'
import { api } from '../../../services/api'
import { SupplierData, PurchaseData } from '../../../types/dashboard'
import { formatCurrency } from '../../../utils/dashboardHelpers'
import { formatCNPJ } from '../../../utils/cnpjHelper'

interface NewPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onPurchaseCreated: (purchase: PurchaseData) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  onOpenNewSupplier: () => void
  suppliers: SupplierData[]
}

interface LocalPurchaseItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  unitPrice: number
  subtotal: number
  notes: string
  inventoryItemId?: number | null
}

export function NewPurchaseModal({
  isOpen,
  onClose,
  onPurchaseCreated,
  showToast,
  onOpenNewSupplier,
  suppliers,
}: NewPurchaseModalProps) {
  const [supplierId, setSupplierId] = useState<string>('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('BOLETO')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  const [inventoryList, setInventoryList] = useState<any[]>([])

  const [items, setItems] = useState<LocalPurchaseItem[]>([
    {
      id: '1',
      name: '',
      category: 'INSUMO',
      quantity: 1,
      unit: 'un',
      unitPrice: 0,
      subtotal: 0,
      notes: '',
    },
  ])

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      api.getInventoryItems().then(setInventoryList).catch(() => {})
      if (suppliers.length > 0 && !supplierId) {
        setSupplierId(String(suppliers[0].id))
      }
    }
  }, [isOpen, suppliers])

  if (!isOpen) return null

  const updateItem = (id: string, field: keyof LocalPurchaseItem, val: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: val }

        if (field === 'quantity' || field === 'unitPrice') {
          const q = field === 'quantity' ? Number(val) || 0 : item.quantity
          const p = field === 'unitPrice' ? Number(val) || 0 : item.unitPrice
          updated.subtotal = Number((q * p).toFixed(2))
        }

        if (field === 'inventoryItemId' && val) {
          const inv = inventoryList.find((i) => i.id === Number(val))
          if (inv) {
            if (!updated.name) updated.name = inv.name
            if (inv.unit) updated.unit = inv.unit
            if (inv.costPrice && !updated.unitPrice) {
              updated.unitPrice = inv.costPrice
              updated.subtotal = Number((updated.quantity * inv.costPrice).toFixed(2))
            }
          }
        }

        return updated
      })
    )
  }

  const addItem = () => {
    const newItem: LocalPurchaseItem = {
      id: Date.now().toString(),
      name: '',
      category: 'INSUMO',
      quantity: 1,
      unit: 'un',
      unitPrice: 0,
      subtotal: 0,
      notes: '',
    }
    setItems((prev) => [...prev, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      showToast('O pedido deve conter pelo menos 1 item.', 'error')
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const totalAmount = items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supplierId) {
      showToast('Selecione ou cadastre um Fornecedor.', 'error')
      return
    }

    const validItems = items.filter((it) => it.name.trim() || it.subtotal > 0)
    if (validItems.length === 0) {
      showToast('Adicione pelo menos um insumo ou material ao pedido.', 'error')
      return
    }

    setSaving(true)
    try {
      const created = await api.createPurchase({
        supplierId: Number(supplierId),
        purchaseDate,
        expectedDeliveryDate: expectedDeliveryDate || null,
        paymentMethod,
        dueDate: dueDate || null,
        notes: notes.trim(),
        items: validItems.map((it) => ({
          name: it.name.trim() || 'Insumo',
          category: it.category,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
          notes: it.notes.trim(),
          inventoryItemId: it.inventoryItemId || null,
        })),
      })

      showToast(`Pedido de compra ${created.purchaseNumber} criado com sucesso!`, 'success')
      onPurchaseCreated(created)
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar pedido de compra.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-[#131826] w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in text-slate-900 dark:text-slate-100 overflow-hidden my-auto">
        
        {/* ── Fixed Header ── */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Novo Pedido de Compra
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Pedido de insumos com fornecedores cadastrados por CNPJ
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

        {/* ── Scrollable Body ── */}
        <form id="new-purchase-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* Fornecedor e Datas */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Fornecedor *
                  </label>
                  <button
                    type="button"
                    onClick={onOpenNewSupplier}
                    className="text-[11px] font-black text-orange-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Novo
                  </button>
                </div>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Selecione...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tradeName || s.corporateName} ({formatCNPJ(s.cnpj)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Data do Pedido
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Previsão de Entrega
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="PIX">PIX</option>
                  <option value="CARTAO">Cartão de Crédito</option>
                  <option value="TRANSFERENCIA">Transferência / TED</option>
                  <option value="DINHEIRO">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Vencimento Previsto (Opcional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Itens & Insumos do Pedido ({items.length})
              </h4>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Item</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-white dark:bg-[#111726] rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Item #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Insumo / Material
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Ex: Chocolate Meio Amargo 2kg"
                        className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 sm:col-span-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qtd</label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Un</label>
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-1 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          <option value="un">un</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">l</option>
                          <option value="pct">pct</option>
                          <option value="cx">cx</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vlr Unit</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3 text-right">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subtotal</label>
                      <span className="text-xs font-black font-mono text-slate-900 dark:text-white block py-1">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>

                  {inventoryList.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px]">
                      <PackageCheck className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="text-slate-400">Vincular a item de estoque:</span>
                      <select
                        value={item.inventoryItemId || ''}
                        onChange={(e) => updateItem(item.id, 'inventoryItemId', e.target.value || null)}
                        className="bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        <option value="">Não vincular</option>
                        {inventoryList.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Observações do Pedido
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Entregar pela manhã na produção."
              className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none resize-none"
            />
          </div>
        </form>

        {/* ── Fixed Sticky Footer ── */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E131F] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-slate-400 font-bold">Total do Pedido:</span>
            <span className="text-base font-black font-mono text-orange-600 dark:text-orange-400">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="new-purchase-form"
              disabled={saving}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Criar Pedido de Compra</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
