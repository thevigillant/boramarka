import { useState } from 'react'
import {
  X,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Package,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { api } from '../../../services/api'
import { formatCurrency } from '../../../utils/dashboardHelpers'
import type { OrderData } from '../../../types/dashboard'

interface OrderReturnModalProps {
  order: OrderData | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

const COMMON_REASONS = [
  'Produto com defeito ou avaria na entrega',
  'Sabor, personalização ou tamanho incorreto',
  'Atraso excessivo no horário combinado',
  'Cliente desistiu da compra / Não retirou',
  'Incompatibilidade ou reação alérgica',
  'Outro motivo',
]

export function OrderReturnModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  showToast,
}: OrderReturnModalProps) {
  const [type, setType] = useState<'DEVOLUCAO' | 'TROCA'>('DEVOLUCAO')
  const [reasonPreset, setReasonPreset] = useState(COMMON_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [refundAmount, setRefundAmount] = useState<string>(
    order?.total ? order.total.toString() : '0'
  )
  const [restockItems, setRestockItems] = useState(true)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !order) return null

  const finalReason = reasonPreset === 'Outro motivo' ? customReason : reasonPreset

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!order) return

    if (!finalReason.trim()) {
      showToast('Por favor, informe o motivo da devolução ou troca.', 'error')
      return
    }

    const refundNum = parseFloat(refundAmount.replace(',', '.')) || 0

    setSubmitting(true)
    try {
      await api.createOrderReturn(order.id, {
        type,
        reason: finalReason.trim(),
        refundAmount: refundNum,
        restockItems,
        notes: notes.trim() || undefined,
      })

      showToast(
        type === 'DEVOLUCAO'
          ? 'Devolução registrada com sucesso! Estoque e financeiro atualizados.'
          : 'Troca registrada com sucesso! Pedido e estoque atualizados.',
        'success'
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar devolução/troca.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Cabeçalho ── */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Devolução ou Troca
              </h3>
              <p className="text-xs font-bold text-pink-500 mt-0.5">
                Pedido {order.orderNumber} · {order.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Resumo do Pedido ── */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 font-medium">Valor Total do Pedido:</span>
            <p className="text-base font-black font-mono text-slate-900 dark:text-white">
              {formatCurrency(order.total)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-slate-400 font-medium">Status Atual:</span>
            <p className="font-bold text-slate-700 dark:text-slate-300">{order.status}</p>
          </div>
        </div>

        {/* ── Formulário ── */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tipo: DEVOLUÇÃO vs TROCA */}
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Tipo de Operação *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('DEVOLUCAO')
                  setRefundAmount(order.total ? order.total.toString() : '0')
                }}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                  type === 'DEVOLUCAO'
                    ? 'bg-red-500/15 text-red-500 border-red-500/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Devolução com Reembolso</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('TROCA')
                  setRefundAmount('0')
                }}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                  type === 'TROCA'
                    ? 'bg-blue-500/15 text-blue-500 border-blue-500/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Troca de Produto</span>
              </button>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
              Motivo Principal *
            </label>
            <select
              value={reasonPreset}
              onChange={(e) => setReasonPreset(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500 transition-all text-xs"
              required
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reasonPreset === 'Outro motivo' && (
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                Descreva o Motivo *
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Informe o motivo detalhado..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500 transition-all text-xs"
                required
              />
            </div>
          )}

          {/* Valor a Estornar / Reembolsar */}
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
              Valor a Reembolsar ao Cliente (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-pink-500 transition-all text-xs"
              />
            </div>
            {parseFloat(refundAmount) > 0 && (
              <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Uma despesa financeira de {formatCurrency(parseFloat(refundAmount) || 0)} será criada no ERP para controle do caixa.
              </p>
            )}
          </div>

          {/* Reestocar Itens / Insumos */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="restockItemsCheckbox"
              checked={restockItems}
              onChange={(e) => setRestockItems(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="restockItemsCheckbox" className="text-xs cursor-pointer select-none">
              <span className="font-bold text-slate-900 dark:text-white block">
                Devolver insumos da receita ao Estoque automaticamente
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                Se os produtos puderem ser reaproveitados ou não tiverem sido descartados, o estoque das matérias-primas será reabastecido.
              </span>
            </label>
          </div>

          {/* Observações / Anotações */}
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
              Observações Internas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anotações para controle interno e equipe..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500 transition-all text-xs resize-none"
            />
          </div>

          {/* Botões */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-red-500/20 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmar Registro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
