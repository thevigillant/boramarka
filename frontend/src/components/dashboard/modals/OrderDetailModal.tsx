import { X, Calendar, Clock, MapPin, Phone, MessageSquare, CheckCircle, Package, Truck, AlertCircle } from 'lucide-react'
import { formatCurrency } from '../../../utils/dashboardHelpers'
import type { OrderData } from '../../../types/dashboard'

interface OrderDetailModalProps {
  order: OrderData | null
  onClose: () => void
  onUpdateStatus: (id: number, status: string, note?: string) => Promise<void>
  onUpdatePayment: (id: number, depositPaid: boolean) => Promise<void>
}

export function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  onUpdatePayment,
}: OrderDetailModalProps) {
  if (!order) return null

  const cleanPhone = order.clientPhone.replace(/\D/g, '')

  const statusColors: Record<string, string> = {
    NOVO: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300',
    CONFIRMADO: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300',
    EM_PRODUCAO: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-300',
    PRONTO: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300',
    ENTREGUE: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300',
    CANCELADO: 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-300',
  }

  const statusLabels: Record<string, string> = {
    NOVO: 'Novo Pedido',
    CONFIRMADO: 'Confirmado',
    EM_PRODUCAO: 'Em Produção',
    PRONTO: 'Pronto p/ Entrega',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado',
  }

  const nextStatusOptions: Record<string, { label: string; next: string }> = {
    NOVO: { label: 'Confirmar Pedido', next: 'CONFIRMADO' },
    CONFIRMADO: { label: 'Iniciar Produção', next: 'EM_PRODUCAO' },
    EM_PRODUCAO: { label: 'Marcar como Pronto', next: 'PRONTO' },
    PRONTO: { label: 'Marcar como Entregue', next: 'ENTREGUE' },
  }

  const nextAction = nextStatusOptions[order.status]

  function getWhatsAppUrl(msgType: 'confirm' | 'production' | 'ready' | 'delivered') {
    let msg = ''
    if (msgType === 'confirm') {
      msg = `Olá ${order?.clientName}! Seu pedido *${order?.orderNumber}* foi *CONFIRMADO*! Estamos organizando os preparativos para o dia ${order?.deliveryDate}. Qualquer dúvida estamos à disposição!`
    } else if (msgType === 'production') {
      msg = `Olá ${order?.clientName}! O seu pedido *${order?.orderNumber}* já está *EM PRODUÇÃO*! Preparado com todo o cuidado e dedicação.`
    } else if (msgType === 'ready') {
      msg = `Olá ${order?.clientName}! Seu pedido *${order?.orderNumber}* está *PRONTO* para ${order?.deliveryType === 'DELIVERY' ? 'sair para entrega' : 'retirada'}!`
    } else {
      msg = `Olá ${order?.clientName}! Tudo bem? Gostaria de saber o que achou do seu pedido *${order?.orderNumber}*! Se puder nos avaliar, agradecemos muito!`
    }
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#131826] w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100 overflow-y-auto max-h-[90vh]">
        {/* ── Header ── */}
        <div className="flex justify-between items-start pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {order.orderNumber}
              </span>
              <span className={`text-xs font-black px-3 py-1 rounded-full border ${statusColors[order.status] || ''}`}>
                {statusLabels[order.status] || order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Pedido criado em {new Date(order.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6 pt-5">
          {/* ── Dados do Cliente & Entrega ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Cliente
              </span>
              <p className="font-black text-sm text-slate-900 dark:text-white">{order.clientName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <Phone className="w-3.5 h-3.5 text-emerald-500" /> {order.clientPhone}
              </p>
              {order.clientEmail && (
                <p className="text-xs text-slate-400 mt-0.5">{order.clientEmail}</p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Data & Forma de Entrega
              </span>
              <p className="font-black text-sm text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {order.deliveryDate} às {order.deliveryTime}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 mt-1">
                {order.deliveryType === 'DELIVERY' ? (
                  <>
                    <Truck className="w-3.5 h-3.5 text-blue-500" /> Entrega a domicílio
                  </>
                ) : (
                  <>
                    <Package className="w-3.5 h-3.5 text-amber-500" /> Retirada no Local
                  </>
                )}
              </p>
              {order.deliveryAddress && (
                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  {order.deliveryAddress}
                </p>
              )}
            </div>
          </div>

          {/* ── Itens do Pedido ── */}
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">
              Itens Encomendados ({order.items.length})
            </span>
            <div className="space-y-3">
              {order.items.map((item, idx) => {
                let customAnswers: Record<string, any> = {}
                try {
                  customAnswers = JSON.parse(item.customizations || '{}')
                } catch {}

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-3"
                  >
                    {item.product?.photos?.[0]?.url ? (
                      <img
                        src={item.product.photos[0].url}
                        alt={item.productName}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h5 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                          {item.quantity}x {item.productName}
                        </h5>
                        <span className="text-sm font-black text-pink-500 ml-2">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        Unitário: {formatCurrency(item.unitPrice)}
                      </p>

                      {/* Customizações */}
                      {Object.keys(customAnswers).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1">
                          {Object.entries(customAnswers).map(([k, v], cIdx) => (
                            <div key={cIdx} className="text-xs flex gap-1.5">
                              <span className="font-bold text-slate-500 dark:text-slate-400">{k}:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg mt-2 font-medium">
                          Observação: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Observações Gerais ── */}
          {order.notes && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">
                Observações do Cliente
              </span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{order.notes}</p>
            </div>
          )}

          {/* ── Resumo Financeiro ── */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Subtotal dos itens</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Taxa de Entrega</span>
                <span>+{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span>Total do Pedido</span>
              <span className="text-pink-400">{formatCurrency(order.total)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <div className="bg-slate-800/80 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block">
                  Entrada ({order.depositPercentage}%)
                </span>
                <span className="text-sm font-black text-emerald-400">
                  {formatCurrency(order.depositAmount)}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${order.depositPaid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {order.depositPaid ? '✓ PAGO' : 'PENDENTE'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdatePayment(order.id, !order.depositPaid)}
                    className="text-[10px] text-pink-400 hover:underline font-bold"
                  >
                    Alternar
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block">Restante na Entrega</span>
                <span className="text-sm font-black text-slate-200">
                  {formatCurrency(order.remainingAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Cobrar na entrega/retirada</span>
              </div>
            </div>
          </div>

          {/* ── Ações Rápidas de WhatsApp ── */}
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
              Mensagens Rápidas WhatsApp
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href={getWhatsAppUrl('confirm')}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all text-center"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Confirmado
              </a>
              <a
                href={getWhatsAppUrl('production')}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all text-center"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Produção
              </a>
              <a
                href={getWhatsAppUrl('ready')}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all text-center"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Pronto!
              </a>
              <a
                href={getWhatsAppUrl('delivered')}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all text-center"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Feedback
              </a>
            </div>
          </div>

          {/* ── Próximo Passo do Kanban ── */}
          {nextAction && (
            <button
              onClick={async () => {
                await onUpdateStatus(order.id, nextAction.next)
              }}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-base shadow-xl shadow-pink-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Avançar Pedido: {nextAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
