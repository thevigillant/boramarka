import { useState, useEffect } from 'react'
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom'
import { Check, Calendar, Clock, ArrowLeft, Loader2, Sparkles, Bell, Star, Send, ThumbsUp } from 'lucide-react'
import { api } from '../services/api'

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const monthName = months[parseInt(m) - 1]
  return `${d} de ${monthName}`
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export default function BookingSuccess() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as {
    booking?: { id: number; clientName: string; clientPhone: string; date: string; time: string; cancellationCode?: string }
    whatsapp?: { success: boolean; method: 'api' | 'meta' | 'gateway' | 'link'; link?: string }
    payFullPrice?: boolean
  } | null

  // Check for bookingId in query params (return from Mercado Pago)
  const searchParams = new URLSearchParams(location.search)
  const queryBookingId = searchParams.get('bookingId')
  const paymentStatus = searchParams.get('payment')

  const [fetchedBooking, setFetchedBooking] = useState<{
    id: number; clientName: string; clientPhone: string; date: string; time: string;
    businessName: string; businessPhone: string; businessUsername: string; serviceName: string; price: number;
    selectedAddons?: string; totalAmount?: number; cancellationCode?: string;
  } | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(true)
  const [pushStatus, setPushStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle')
  const [pushRequesting, setPushRequesting] = useState(false)

  // Review Form State (A3)
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [reviewComment, setReviewComment] = useState<string>('')
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false)
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const bookingId = state?.booking?.id || (queryBookingId ? parseInt(queryBookingId) : null)
  const isPayFullPrice = state?.payFullPrice || false

  useEffect(() => {
    if (bookingId) {
      setFetchLoading(true)
      api.getPublicBookingDetails(bookingId)
        .then(data => setFetchedBooking(data))
        .catch(() => {})
        .finally(() => setFetchLoading(false))
    }
  }, [bookingId])

  // Check push notification support
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported');
    } else if (Notification.permission === 'granted') {
      setPushStatus('granted');
    } else if (Notification.permission === 'denied') {
      setPushStatus('denied');
    }
  }, []);

  // Request push notification permission and subscribe
  const handlePushSubscribe = async () => {
    if (!token || !booking) return;
    setPushRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus('denied');
        setPushRequesting(false);
        return;
      }

      // Register service worker
      const sw = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID key
      const { vapidPublicKey, configured } = await api.getVapidKey();
      if (!configured || !vapidPublicKey) {
        setPushStatus('granted');
        setPushRequesting(false);
        return;
      }

      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const subscription = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to backend
      await api.subscribeToPush(token, subscription.toJSON(), booking.clientPhone);
      setPushStatus('granted');
    } catch (err) {
      console.error('Erro ao registar push:', err);
    } finally {
      setPushRequesting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!booking?.id || !booking?.clientPhone) return;
    setReviewSubmitting(true);
    setReviewError(null);

    try {
      await api.submitReview({
        bookingId: booking.id,
        clientPhone: booking.clientPhone,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewSubmitted(true);
    } catch (err: any) {
      setReviewError(err.message || 'Falha ao enviar avaliação');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const booking = fetchedBooking || (state?.booking ? {
    id: state.booking.id,
    clientName: state.booking.clientName,
    clientPhone: state.booking.clientPhone,
    date: state.booking.date,
    time: state.booking.time,
    cancellationCode: state.booking.cancellationCode,
    businessName: '',
    businessPhone: '',
    businessUsername: '',
    serviceName: 'Serviço',
    price: 0
  } : null)

  const whatsapp = state?.whatsapp || null
  const isPaidViaMP = paymentStatus === 'success'

  // Construct complete cancellation URL & pre-filled WhatsApp message
  const cancelPath = token && booking?.id
    ? `${window.location.origin}/agendar/cancelar/${token}/${booking.id}${booking.cancellationCode ? `?code=${booking.cancellationCode}` : ''}`
    : '';

  const generateFullWaMessage = () => {
    if (!booking) return '';
    let msg = `Olá! Meu agendamento no BoraMarka foi confirmado com sucesso!\n\n`
    msg += `👤 *Cliente:* ${booking.clientName}\n`
    msg += `💈 *Serviço:* ${booking.serviceName}\n`
    msg += `📅 *Data:* ${formatDate(booking.date)}\n`
    msg += `⏰ *Horário:* ${booking.time}\n`
    if (booking.cancellationCode) {
      msg += `🔐 *Código de Cancelamento:* ${booking.cancellationCode}\n`
    }
    if (cancelPath) {
      msg += `🔗 *Link para Gerenciar/Cancelar:* ${cancelPath}\n`
    }
    msg += `\nObrigado!`
    return msg
  }

  const customWaLink = booking?.clientPhone
    ? `https://wa.me/55${booking.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(generateFullWaMessage())}`
    : (whatsapp?.link || '#')

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#131826] p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-4">Agendamento Realizado</h1>
          <p className="text-slate-400 mb-6">Seu horário foi reservado! Verifique as mensagens no seu WhatsApp para conferir os detalhes.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3.5 rounded-2xl"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  const profileLink = booking.businessUsername
    ? `/${booking.businessUsername}`
    : (token ? `/agendar/${token}` : '/')

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-pink-500/30">
      <div className="w-full max-w-md text-center">
        
        {/* Success Icon */}
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <Check className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-lg">
            Confirmado
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Agendamento Confirmado!
        </h1>
        <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">
          Prontinho, <strong className="text-slate-200">{booking.clientName}</strong>! Seu horário foi reservado e registrado com sucesso.
        </p>

        {/* Voucher / Card */}
        <div className="bg-[#131826] rounded-3xl p-6 border border-slate-800/80 shadow-2xl text-left mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none"></div>

          {booking.businessName && (
            <div className="mb-4 pb-3 border-b border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-black text-pink-500 uppercase tracking-widest">{booking.businessName}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                {isPaidViaMP || isPayFullPrice ? 'PAGO' : 'CONFIRMADO'}
              </span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Serviço</span>
              <span className="text-base font-black text-white">{booking.serviceName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Data</span>
                <span className="text-sm font-bold text-slate-200">{formatDate(booking.date)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Horário</span>
                <span className="text-sm font-bold text-slate-200">{booking.time}</span>
              </div>
            </div>

            {/* Addons List if present */}
            {(() => {
              let addons: Array<{ id: number; name: string; price: number }> = [];
              try {
                if (booking.selectedAddons) {
                  addons = JSON.parse(booking.selectedAddons);
                }
              } catch {
                addons = [];
              }
              if (addons.length === 0) return null;
              return (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-pink-500 font-black uppercase tracking-wider block">Adicionais Contratados:</span>
                  {addons.map((a, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span>{a.name}</span>
                      <span className="font-mono text-emerald-400">+{formatCurrency(a.price)}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {(booking.totalAmount || booking.price) > 0 && (
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Valor total</span>
                <span className="text-sm font-black text-pink-500">{formatCurrency(booking.totalAmount || booking.price)}</span>
              </div>
            )}

            {/* Cancellation & Management Code Block */}
            {booking.cancellationCode && (
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">Código de Gerenciamento / Cancelamento:</span>
                <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-2xl">
                  <span className="text-sm font-mono font-black text-amber-300 tracking-wider">{booking.cancellationCode}</span>
                  <span className="text-[10px] font-bold text-amber-400/80">Guarde seu código</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avaliação do Cliente Card (A3 Prova Social) */}
        <div className="bg-[#131826] rounded-3xl p-6 border border-slate-800/80 shadow-2xl text-left mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            <h3 className="font-black text-white text-sm">Como foi sua experiência de agendamento?</h3>
          </div>

          {reviewSubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2.5">
              <ThumbsUp className="w-4 h-4" />
              <span>Obrigado pela sua avaliação! Seu feedback é muito importante.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Dê uma nota para a praticidade do serviço:</p>
              
              {/* Star Picker */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        (hoverRating || reviewRating) >= star
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-400 ml-2">
                  {reviewRating === 5 ? '⭐ Excelente' : reviewRating === 4 ? '👍 Muito Bom' : reviewRating === 3 ? '👌 Bom' : 'Regular'}
                </span>
              </div>

              {/* Comment Input */}
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Deixe um comentário ou elogio ao profissional (opcional)..."
                rows={2}
                maxLength={500}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 resize-none"
              />

              {reviewError && (
                <p className="text-xs text-rose-400 font-bold">{reviewError}</p>
              )}

              <button
                onClick={handleReviewSubmit}
                disabled={reviewSubmitting}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {reviewSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-pink-400" />
                )}
                Enviar Avaliação
              </button>
            </div>
          )}
        </div>

        {whatsapp?.method === 'meta' || whatsapp?.method === 'gateway' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400 font-bold text-sm mb-6">
             Comprovante enviado automaticamente para seu WhatsApp!
          </div>
        ) : (
          <div className="mb-6 space-y-2">
            <p className="text-xs text-slate-400 font-bold">Clique no botão abaixo para abrir o WhatsApp com seu comprovante e código:</p>
            <a
              href={customWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[#25d366]/20 text-base cursor-pointer"
            >
              Abrir WhatsApp & Receber Comprovante
            </a>
          </div>
        )}

        {cancelPath && (
          <div className="mb-6">
            <Link
              to={`/agendar/cancelar/${token}/${booking.id}${booking.cancellationCode ? `?code=${booking.cancellationCode}` : ''}`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-pink-400 font-bold transition-colors underline decoration-slate-600 underline-offset-4"
            >
              Precisa alterar ou cancelar este agendamento? Clique aqui
            </Link>
          </div>
        )}

        <Link
          to={profileLink}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-pink-500 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Ir para o catálogo do profissional
        </Link>
      </div>

      {/* Elegant Confirmation Overlay Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#131826] w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-slate-800 animate-scale-in text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-black text-white leading-tight mb-2 tracking-tight">
              Você Agendou com <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-500 font-black">@{booking.businessUsername || booking.businessName}</span> no BoraMarka
            </h2>
            
            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
              Seu horário para <strong className="text-slate-200">{booking.serviceName}</strong> foi reservado com sucesso e o profissional já foi notificado.
            </p>

            <div className="bg-[#0B0F19] rounded-2xl p-4 mb-6 border border-slate-800/80 text-left">
              <div className="flex items-center gap-3 text-xs text-slate-300 font-bold mb-2">
                <Calendar className="w-4 h-4 text-pink-500" />
                <span>{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-bold">
                <Clock className="w-4 h-4 text-pink-500" />
                <span>às {booking.time}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowConfirmModal(false);
              }}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-black rounded-2xl transition-all shadow-lg hover:shadow-pink-500/15 text-sm uppercase tracking-wider"
            >
              Ver Detalhes do Comprovante
            </button>

            {/* Push Notification Opt-In */}
            {pushStatus === 'idle' && (
              <button
                onClick={handlePushSubscribe}
                disabled={pushRequesting}
                className="w-full mt-3 py-3 flex items-center justify-center gap-2 bg-[#0B0F19] border border-violet-500/30 text-violet-300 font-bold rounded-2xl transition-all hover:border-violet-500/60 hover:text-violet-200 text-xs"
              >
                {pushRequesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                Ativar lembretes por notificação
              </button>
            )}
            {pushStatus === 'granted' && (
              <p className="mt-3 text-xs text-emerald-400 font-bold">Notificações ativadas!</p>
            )}

            <button
              onClick={() => navigate(profileLink)}
              className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-slate-200 font-bold transition-all"
            >
              Voltar ao Catálogo do Profissional
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
