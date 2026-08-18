import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Package,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  Truck,
  MessageSquare,
  AlertCircle,
  Loader2,
  Store,
} from 'lucide-react'
import { api } from '../services/api'
import { formatCurrency } from '../utils/dashboardHelpers'
import type { OrderData } from '../types/dashboard'

export function OrderTrackingPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (!orderNumber) return
    api.trackPublicOrder(orderNumber)
      .then(data => setOrder(data))
      .catch(err => setError(err.message || 'Pedido não encontrado'))
      .finally(() => setLoading(false))
  }, [orderNumber])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 text-white text-center">
        <div className="bg-[#131826] p-8 rounded-3xl max-w-sm w-full border border-slate-800 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Pedido não encontrado</h2>
          <p className="text-sm text-slate-400">{error || 'Verifique o número do pedido.'}</p>
        </div>
      </div>
    )
  }

  const steps = [
    { key: 'NOVO', label: 'Pedido Recebido' },
    { key: 'CONFIRMADO', label: 'Confirmado' },
    { key: 'EM_PRODUCAO', label: 'Em Produção' },
    { key: 'PRONTO', label: order.deliveryType === 'DELIVERY' ? 'Pronto p/ Entrega' : 'Pronto p/ Retirada' },
    { key: 'ENTREGUE', label: 'Entregue' },
  ]

  const statusHierarchy: Record<string, number> = {
    NOVO: 0,
    CONFIRMADO: 1,
    EM_PRODUCAO: 2,
    PRONTO: 3,
    ENTREGUE: 4,
    CANCELADO: -1,
  }

  const currentStepIndex = statusHierarchy[order.status] ?? 0
  const isCanceled = order.status === 'CANCELADO'

  const cleanAdminPhone = order.admin?.phone?.replace(/\D/g, '') || ''
  const whatsappUrl = cleanAdminPhone
    ? `https://wa.me/55${cleanAdminPhone}?text=${encodeURIComponent(
        `Olá! Gostaria de falar sobre o meu pedido *${order.orderNumber}*!`
      )}`
    : undefined

  return (
    <div className={`min-h-screen ${order.admin?.publicTheme === 'dark' ? 'dark bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-900'} pb-16 font-sans`}>
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-6 pt-12 pb-24 text-center">
        <div className="max-w-xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
            Rastreamento de Encomenda
          </span>
          <h1 className="text-3xl font-black mt-2">{order.orderNumber}</h1>
          <p className="text-sm opacity-90 mt-1 font-medium">
            {order.admin?.businessName || 'BoraMarka'}
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-16 animate-slide-up space-y-6">
        {/* ── Timeline de Status ── */}
        <div className="bg-white dark:bg-[#131826] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800/80">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
            Status da Produção
          </h2>

          {isCanceled ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
              <span className="text-red-500 font-black text-base">❌ Este pedido foi cancelado</span>
            </div>
          ) : (
            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex
                const isCurrent = idx === currentStepIndex

                return (
                  <div key={step.key} className="relative flex items-start gap-4">
                    <div
                      className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isPassed
                          ? 'bg-gradient-to-tr from-orange-500 to-pink-500 text-white shadow-md shadow-pink-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-pink-500/20 scale-110' : ''}`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>

                    <div className="flex-1">
                      <h4
                        className={`text-sm font-black ${
                          isCurrent
                            ? 'text-pink-600 dark:text-pink-400'
                            : isPassed
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </h4>

                      {isCurrent && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          {step.key === 'NOVO' && 'Aguardando confirmação dos detalhes pelo estabelecimento.'}
                          {step.key === 'CONFIRMADO' && 'Tudo certo! Ingredientes e preparativos organizados.'}
                          {step.key === 'EM_PRODUCAO' && 'Sua encomenda está sendo preparada com todo cuidado.'}
                          {step.key === 'PRONTO' && 'Pronto! Já pode retirar ou aguardar a entrega.'}
                          {step.key === 'ENTREGUE' && 'Pedido entregue com sucesso.'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Detalhes da Entrega ── */}
        <div className="bg-white dark:bg-[#131826] rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800/80 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Previsão de Entrega / Retirada
          </h3>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/40">
            <Calendar className="w-6 h-6 text-pink-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {order.deliveryDate} às {order.deliveryTime}
              </p>
              <span className="text-xs text-pink-600 dark:text-pink-400 font-bold flex items-center gap-1 mt-0.5">
                {order.deliveryType === 'DELIVERY' ? (
                  <>
                    <Truck className="w-3.5 h-3.5" /> Entrega a domicílio
                  </>
                ) : (
                  <>
                    <Package className="w-3.5 h-3.5" /> Retirada no local
                  </>
                )}
              </span>
            </div>
          </div>

          {order.deliveryAddress && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              {order.deliveryAddress}
            </p>
          )}
        </div>

        {/* ── Itens do Pedido ── */}
        <div className="bg-white dark:bg-[#131826] rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800/80 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Itens da Encomenda
          </h3>

          <div className="space-y-3">
            {order.items?.map((item: any, idx: number) => {
              let customAnswers: Record<string, any> = {}
              try {
                customAnswers = JSON.parse(item.customizations || '{}')
              } catch {}

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-3 text-xs"
                >
                  {item.product?.photos?.[0]?.url ? (
                    <img
                      src={item.product.photos[0].url}
                      alt={item.productName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-black text-slate-900 dark:text-white">
                        {item.quantity}x {item.productName}
                      </p>
                      <span className="font-black text-pink-500 ml-2">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>

                    {Object.entries(customAnswers).map(([k, v], cIdx) => (
                      <span key={cIdx} className="text-[10px] text-slate-400 block mt-0.5">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumo de Pagamento */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between font-medium text-slate-500">
              <span>Total da Encomenda</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-500">
              <span>Entrada ({order.depositPercentage}%)</span>
              <span>{order.depositPaid ? '✓ PAGO' : 'PENDENTE'} ({formatCurrency(order.depositAmount)})</span>
            </div>
            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
              <span>Saldo na Entrega</span>
              <span>{formatCurrency(order.remainingAmount)}</span>
            </div>
          </div>
        </div>

        {/* ── WhatsApp CTA ── */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" /> Falar com o Estabelecimento no WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
