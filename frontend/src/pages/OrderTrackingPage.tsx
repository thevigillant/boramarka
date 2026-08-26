import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Package,
  Calendar,
  MapPin,
  CheckCircle,
  Truck,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  QrCode,
  ChefHat,
  ShoppingBag,
  RefreshCw,
  Star,
  PartyPopper,
} from 'lucide-react'
import { api } from '../services/api'
import { formatCurrency, formatImageUrl } from '../utils/dashboardHelpers'
import { generatePixPayload, generatePixQrCodeDataUrl } from '../utils/pixPayload'

export function OrderTrackingPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [copiedPix, setCopiedPix] = useState(false)
  const [copiedPixPayload, setCopiedPixPayload] = useState(false)
  const [pixPayloadCode, setPixPayloadCode] = useState('')
  const [pixQrCodeDataUrl, setPixQrCodeDataUrl] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [secondsToRefresh, setSecondsToRefresh] = useState(30)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchOrder() {
    if (!orderNumber) return
    try {
      const data = await api.trackPublicOrder(orderNumber, code)
      setOrder(data)
      setSecondsToRefresh(30)

      if (data?.admin?.pixKey && !data?.depositPaid) {
        const payload = generatePixPayload({
          pixKey: data.admin.pixKey,
          merchantName: data.admin.businessName || 'BoraMarka',
          amount: Number(data.depositAmount || 0) > 0 ? Number(data.depositAmount) : undefined,
          txid: data.orderNumber?.replace(/[^a-zA-Z0-9]/g, '') || 'ENK',
          description: `Pedido ${data.orderNumber || ''}`,
        })
        setPixPayloadCode(payload)
        generatePixQrCodeDataUrl(payload).then(url => setPixQrCodeDataUrl(url))
      }
    } catch (err: any) {
      setError(err.message || 'Pedido não encontrado')
    }
  }

  useEffect(() => {
    fetchOrder().finally(() => setLoading(false))

    intervalRef.current = setInterval(() => {
      setSecondsToRefresh(s => {
        if (s <= 1) {
          fetchOrder()
          return 30
        }
        return s - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [orderNumber, code])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-pink-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Carregando seu pedido...</p>
        </div>
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
    { key: 'NOVO', label: 'Pedido Recebido', icon: ShoppingBag, desc: 'Aguardando confirmação da loja', color: 'amber' },
    { key: 'CONFIRMADO', label: 'Confirmado', icon: CheckCircle, desc: 'Tudo certo! Preparativos organizados', color: 'blue' },
    { key: 'EM_PRODUCAO', label: 'Em Produção', icon: ChefHat, desc: 'Sendo preparado com cuidado agora 🔥', color: 'purple' },
    {
      key: 'PRONTO',
      label: order.deliveryType === 'DELIVERY' ? 'Pronto p/ Entrega' : 'Pronto p/ Retirada',
      icon: PartyPopper,
      desc: order.deliveryType === 'DELIVERY' ? 'A caminho!' : 'Pode vir retirar!',
      color: 'emerald',
    },
    { key: 'ENTREGUE', label: 'Entregue', icon: Star, desc: 'Pedido entregue com sucesso! 🙏', color: 'pink' },
  ]

  const statusHierarchy: Record<string, number> = {
    NOVO: 0, CONFIRMADO: 1, EM_PRODUCAO: 2, PRONTO: 3, ENTREGUE: 4, CANCELADO: -1,
  }

  const currentStepIndex = statusHierarchy[order.status] ?? 0
  const isCanceled = order.status === 'CANCELADO'
  const isLive = ['CONFIRMADO', 'EM_PRODUCAO', 'PRONTO'].includes(order.status)

  const rawAdminPhone = (order.admin?.phone || '').replace(/\D/g, '')
  let formattedAdminPhone = ''
  if (rawAdminPhone.length >= 10) {
    if ((rawAdminPhone.length === 12 || rawAdminPhone.length === 13) && rawAdminPhone.startsWith('55')) {
      formattedAdminPhone = rawAdminPhone
    } else {
      formattedAdminPhone = `55${rawAdminPhone}`
    }
  }
  const whatsappUrl = formattedAdminPhone
    ? `https://wa.me/${formattedAdminPhone}?text=${encodeURIComponent(`Olá! Gostaria de falar sobre meu pedido *${order.orderNumber}*!`)}`
    : undefined

  const heroGradients: Record<string, string> = {
    NOVO: 'from-amber-600 via-orange-500 to-amber-500',
    CONFIRMADO: 'from-blue-700 via-blue-500 to-indigo-500',
    EM_PRODUCAO: 'from-purple-700 via-purple-500 to-pink-500',
    PRONTO: 'from-emerald-600 via-emerald-500 to-teal-500',
    ENTREGUE: 'from-pink-600 via-rose-500 to-pink-400',
    CANCELADO: 'from-slate-700 via-slate-600 to-slate-500',
  }

  const colorTextMap: Record<string, string> = {
    amber: 'text-amber-400', blue: 'text-blue-400',
    purple: 'text-purple-400', emerald: 'text-emerald-400', pink: 'text-pink-400',
  }

  const colorBgMap: Record<string, string> = {
    amber: 'bg-amber-500/20 border-amber-500/40',
    blue: 'bg-blue-500/20 border-blue-500/40',
    purple: 'bg-purple-500/20 border-purple-500/40',
    emerald: 'bg-emerald-500/20 border-emerald-500/40',
    pink: 'bg-pink-500/20 border-pink-500/40',
  }

  const trackingUrl = window.location.href

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pb-32 font-sans">
      {/* ── Hero dinâmico por status ── */}
      <div className={`relative bg-gradient-to-br ${heroGradients[order.status] || heroGradients.NOVO} px-6 pt-14 pb-28 overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.12),_transparent_55%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0B0F19] to-transparent pointer-events-none" />

        <div className="max-w-lg mx-auto relative z-10 text-center">
          {isLive && (
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-wider">Acompanhamento ao vivo</span>
            </div>
          )}
          <span className="text-xs font-black uppercase tracking-widest text-white/70 block mb-1">
            {order.admin?.businessName || 'BoraMarka'}
          </span>
          <h1 className="text-4xl font-black text-white drop-shadow-lg mb-1">{order.orderNumber}</h1>
          <p className="text-sm text-white/80 font-medium">{order.clientName}</p>
          <button
            onClick={() => fetchOrder()}
            className="mt-4 inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-[11px] text-white/70 font-medium hover:bg-black/30 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Atualiza em {secondsToRefresh}s
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-14 space-y-5 relative z-10">

        {/* ── Timeline ── */}
        <div className="bg-[#131826] rounded-3xl p-6 shadow-2xl border border-slate-800/80">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
            Status da Produção
          </h2>

          {isCanceled ? (
            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-2">
              <span className="text-3xl block">❌</span>
              <span className="text-red-400 font-black text-base block">Pedido Cancelado</span>
              <p className="text-xs text-slate-400">Entre em contato com a loja para mais informações.</p>
            </div>
          ) : (
            <div className="relative pl-10 space-y-7">
              {/* Linha de progresso */}
              <div className="absolute left-[18px] top-3 bottom-3 w-0.5 bg-slate-800" />
              <div
                className="absolute left-[18px] top-3 w-0.5 bg-gradient-to-b from-pink-500 to-purple-500 transition-all duration-1000 ease-out"
                style={{ height: `calc(${Math.min(100, (currentStepIndex / (steps.length - 1)) * 100)}% - 24px)` }}
              />

              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex
                const isCurrent = idx === currentStepIndex
                const Icon = step.icon

                return (
                  <div key={step.key} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 border ${
                        isCurrent
                          ? `${colorBgMap[step.color]} shadow-lg ${step.key === 'EM_PRODUCAO' ? 'animate-pulse' : ''}`
                          : isPassed
                          ? 'bg-gradient-to-tr from-pink-500 to-purple-500 border-transparent shadow-md shadow-pink-500/20'
                          : 'bg-slate-800/60 border-slate-700'
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      ) : (
                        <Icon className={`w-4 h-4 ${isCurrent ? colorTextMap[step.color] : 'text-slate-600'}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-black transition-colors ${
                          isCurrent ? colorTextMap[step.color] : isPassed ? 'text-white' : 'text-slate-600'
                        }`}>
                          {step.label}
                        </h4>
                        {isCurrent && step.key === 'EM_PRODUCAO' && (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Agora
                          </span>
                        )}
                      </div>
                      {isCurrent && (
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{step.desc}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Previsão ── */}
        <div className="bg-[#131826] rounded-3xl p-5 shadow-xl border border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Previsão de {order.deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada'}
              </span>
              <p className="text-base font-black text-white">
                {order.deliveryDate} às {order.deliveryTime}
              </p>
              <span className="text-xs text-pink-400 font-bold flex items-center gap-1 mt-0.5">
                {order.deliveryType === 'DELIVERY'
                  ? <><Truck className="w-3.5 h-3.5" /> Entrega a domicílio</>
                  : <><Package className="w-3.5 h-3.5" /> Retirada no local</>
                }
              </span>
            </div>
          </div>
          {order.deliveryAddress && (
            <p className="text-xs text-slate-500 flex items-start gap-2 mt-3 pt-3 border-t border-slate-800">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> {order.deliveryAddress}
            </p>
          )}
        </div>

        {/* ── Itens ── */}
        <div className="bg-[#131826] rounded-3xl p-5 shadow-xl border border-slate-800/80">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Itens da Encomenda</h3>
          <div className="space-y-3">
            {order.items?.map((item: any, idx: number) => {
              let customAnswers: Record<string, any> = {}
              try { customAnswers = JSON.parse(item.customizations || '{}') } catch {}
              return (
                <div key={idx} className="flex gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                  {item.product?.photos?.[0]?.url ? (
                    <img
                      src={formatImageUrl(item.product.photos[0].url)}
                      alt={item.productName}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/100x100/1e293b/f43f5e?text=' + encodeURIComponent(item.productName) }}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-black text-white">{item.quantity}x {item.productName}</p>
                      <span className="text-sm font-black text-pink-400 shrink-0">{formatCurrency(item.subtotal)}</span>
                    </div>
                    {Object.entries(customAnswers).map(([k, v], cIdx) => (
                      <span key={cIdx} className="text-[10px] text-slate-500 block">{k}: {String(v)}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-4 mt-3 border-t border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Total</span><span className="font-bold">{formatCurrency(order.total)}</span>
            </div>
            <div className={`flex justify-between font-black ${order.depositPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span>Entrada ({order.depositPercentage}%) {order.depositPaid ? '✓ PAGO' : '⚠️ PENDENTE'}</span>
              <span>{formatCurrency(order.depositAmount)}</span>
            </div>
            {order.remainingAmount > 0 && (
              <div className="flex justify-between text-slate-300 font-bold">
                <span>Saldo na {order.deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada'}</span>
                <span>{formatCurrency(order.remainingAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── PIX pendente com QR Code e Copia e Cola ── */}
        {!order.depositPaid && order.admin?.pixKey && (
          <div className="bg-[#131826] rounded-3xl p-5 shadow-xl border border-emerald-500/20 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-500" /> Pagar Entrada via PIX
              </span>
              <span className="text-sm font-black text-emerald-400 font-mono">{formatCurrency(order.depositAmount)}</span>
            </div>

            {/* QR Code Oficial */}
            {pixQrCodeDataUrl && (
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <img
                  src={pixQrCodeDataUrl}
                  alt="QR Code PIX"
                  className="w-44 h-44 object-contain rounded-lg"
                />
                <span className="text-[10px] font-bold text-slate-700 mt-1 uppercase tracking-wider">
                  Escaneie no app do seu banco
                </span>
              </div>
            )}

            {/* Botão Copiar PIX Copia e Cola */}
            {pixPayloadCode ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pixPayloadCode)
                    setCopiedPixPayload(true)
                    setTimeout(() => setCopiedPixPayload(false), 3000)
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                    copiedPixPayload
                      ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 active:scale-95'
                  }`}
                >
                  {copiedPixPayload ? (
                    <>
                      <Check className="w-4 h-4" /> Código PIX Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar PIX Copia e Cola (Valor Automático)
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Ou copie apenas a chave:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(order.admin.pixKey)
                      setCopiedPix(true)
                      setTimeout(() => setCopiedPix(false), 3000)
                    }}
                    className="text-pink-400 hover:text-pink-300 font-bold underline"
                  >
                    {copiedPix ? 'Chave copiada!' : `Chave: ${order.admin.pixKey}`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={order.admin.pixKey}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white select-all focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(order.admin.pixKey); setCopiedPix(true); setTimeout(() => setCopiedPix(false), 3000) }}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 ${copiedPix ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                >
                  {copiedPix ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar</>}
                </button>
              </div>
            )}

            <p className="text-[11px] text-slate-500 mt-2">Após o PIX, envie o comprovante no WhatsApp abaixo. 👇</p>
          </div>
        )}

        {/* ── Compartilhar link ── */}
        <div className="bg-[#131826] rounded-3xl p-5 shadow-xl border border-slate-800/80">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Compartilhar este Pedido</h3>
          <div className="flex gap-2">
            <input readOnly value={trackingUrl} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-[11px] font-mono text-slate-400 focus:outline-none truncate" />
            <button
              onClick={() => { navigator.clipboard.writeText(trackingUrl); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 3000) }}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 ${copiedLink ? 'bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
            >
              {copiedLink ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── WhatsApp fixo no rodapé ── */}
      {whatsappUrl && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/95 to-transparent z-40">
          <div className="max-w-lg mx-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl font-black text-sm shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Falar com {order.admin?.businessName || 'a Loja'} no WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
