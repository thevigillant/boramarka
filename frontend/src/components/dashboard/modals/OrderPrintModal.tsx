import { useRef } from 'react'
import { X, Printer, Calendar, Clock, MapPin, Phone, User, CheckSquare, Package, AlertCircle } from 'lucide-react'
import { formatCurrency } from '../../../utils/dashboardHelpers'
import type { OrderData } from '../../../types/dashboard'

interface OrderPrintModalProps {
  order: OrderData | null
  user: any
  isOpen: boolean
  onClose: () => void
}

export function OrderPrintModal({
  order,
  user,
  isOpen,
  onClose,
}: OrderPrintModalProps) {
  const printContentRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !order) return null

  const businessTitle = user?.businessName || user?.username || 'BoraEnkomenda'
  const isDelivery = order.deliveryType === 'DELIVERY'
  const remaining = order.remainingAmount || (order.total - (order.depositPaid ? order.depositAmount : 0))

  function handlePrint() {
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto print:max-h-none print:border-none print:shadow-none print:p-2 print:w-full print:max-w-none text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Actions (Oculto na impressão) ── */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-pink-500" />
            <h3 className="text-base font-black">Comanda de Produção / Bancada</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black text-xs shadow-md shadow-pink-500/20 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Comanda</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Conteúdo Imprimível da Comanda (Estilizado para impressão e visualização) ── */}
        <div
          ref={printContentRef}
          className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 text-slate-900 space-y-4 text-xs font-sans print:border-2 print:border-black print:p-4 print:rounded-none"
        >
          {/* Cabeçalho da Empresa */}
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
            <h2 className="text-lg font-black tracking-tight uppercase text-slate-950">
              {businessTitle}
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Ficha de Preparo · Cozinha & Bancada
            </p>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
              <span className="text-sm font-black text-slate-950 font-mono">
                PEDIDO {order.orderNumber}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                {order.status}
              </span>
            </div>
          </div>

          {/* Destaque de Entrega / Horário */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Data do Evento / Entrega:
              </span>
              <span className="text-sm font-black text-slate-950 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-pink-600" />
                {order.deliveryDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Horário Marcado:
              </span>
              <span className="text-sm font-black text-slate-950 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-pink-600" />
                {order.deliveryTime || 'Não informado'}
              </span>
            </div>
          </div>

          {/* Tipo de Atendimento & Endereço */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">
                Modalidade:
              </span>
              <span className="font-black text-[11px] uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                {isDelivery ? '🚗 Entrega no Endereço' : '📦 Retirada no Local'}
              </span>
            </div>
            {isDelivery && order.deliveryAddress && (
              <p className="text-xs font-bold text-slate-900 flex items-start gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-pink-600 mt-0.5" />
                <span>{order.deliveryAddress}</span>
              </p>
            )}
          </div>

          {/* Cliente */}
          <div className="flex justify-between items-center px-1 text-xs border-b border-slate-100 pb-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Cliente:</span>
              <span className="font-black text-slate-900 text-sm">{order.clientName}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block">Telefone:</span>
              <span className="font-bold text-slate-800 font-mono">{order.clientPhone}</span>
            </div>
          </div>

          {/* Itens do Pedido & Personalizações */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
              Itens a Produzir:
            </span>

            {order.items && order.items.length > 0 ? (
              <div className="space-y-2.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-start font-black text-slate-900">
                      <span className="text-xs">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-mono text-xs">{formatCurrency(item.subtotal)}</span>
                    </div>

                    {/* Customizações selecionadas pelo cliente */}
                    {item.customizations && (
                      <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                        {typeof item.customizations === 'string' ? (
                          <p className="font-medium whitespace-pre-line">{item.customizations}</p>
                        ) : (
                          Object.entries(item.customizations).map(([k, v]: [string, any]) => (
                            <p key={k}>
                              <strong className="text-slate-800">{k}:</strong> {String(v)}
                            </p>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">Nenhum item listado.</p>
            )}
          </div>

          {/* Observações da Encomenda */}
          {order.notes && (
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900">
              <span className="text-[10px] font-black uppercase tracking-wider block mb-0.5 text-amber-800">
                Observações Especiais do Pedido:
              </span>
              <p className="text-xs font-medium whitespace-pre-line">{order.notes}</p>
            </div>
          )}

          {/* Resumo Financeiro da Cobrança */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Itens:</span>
              <span className="font-mono">{formatCurrency(order.subtotal || order.total)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Taxa de Entrega:</span>
                <span className="font-mono">{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-slate-950 pt-1 border-t border-slate-200">
              <span>Total do Pedido:</span>
              <span className="font-mono text-sm">{formatCurrency(order.total)}</span>
            </div>

            <div className="pt-1.5 flex justify-between items-center text-[11px]">
              <span className="font-bold text-emerald-700">
                Entrada Paga (Sinal PIX): {formatCurrency(order.depositPaid ? order.depositAmount : 0)}
              </span>
              <span
                className={`font-black px-2 py-0.5 rounded ${
                  remaining <= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900 font-mono'
                }`}
              >
                {remaining <= 0 ? 'PAGO INTEGRALMENTE' : `A COBRAR: ${formatCurrency(remaining)}`}
              </span>
            </div>
          </div>

          {/* Checklist de Bancada / Qualidade */}
          <div className="pt-2 border-t-2 border-dashed border-slate-300">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
              Checklist de Produção:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="rounded" />
                <span>Insumos separados</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="rounded" />
                <span>Produção / Forno</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="rounded" />
                <span>Decoração & Finalização</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="rounded" />
                <span>Caixa & Embalagem</span>
              </label>
            </div>
          </div>

          {/* Rodapé da Comanda */}
          <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-slate-100">
            Impresso em {new Date().toLocaleString('pt-BR')} · BoraEnkomenda Sistema ERP
          </div>
        </div>
      </div>
    </div>
  )
}
