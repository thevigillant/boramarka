import { useState, useEffect } from 'react'
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom'
import { Check, Calendar, Clock, ArrowLeft, Loader2, Sparkles, Bell } from 'lucide-react'
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
    booking?: { id: number; clientName: string; clientPhone: string; date: string; time: string }
    whatsapp?: { success: boolean; method: 'api' | 'link'; link?: string }
    payFullPrice?: boolean
  } | null

  // Check for bookingId in query params (return from Mercado Pago)
  const searchParams = new URLSearchParams(location.search)
  const queryBookingId = searchParams.get('bookingId')
  const paymentStatus = searchParams.get('payment')

  const [fetchedBooking, setFetchedBooking] = useState<{
    id: number; clientName: string; clientPhone: string; date: string; time: string;
    businessName: string; businessPhone: string; businessUsername: string; serviceName: string; price: number;
    selectedAddons?: string; totalAmount?: number;
  } | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(true)
  const [pushStatus, setPushStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle')
  const [pushRequesting, setPushRequesting] = useState(false)

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

  const booking = fetchedBooking || (state?.booking ? {
    id: state.booking.id,
    clientName: state.booking.clientName,
    clientPhone: state.booking.clientPhone,
    date: state.booking.date,
    time: state.booking.time,
    businessName: '',
    businessPhone: '',
    businessUsername: '',
    serviceName: 'Serviço',
    price: 0
  } : null)

  const whatsapp = state?.whatsapp || null
  const isPaidViaMP = paymentStatus === 'success'

  // Loading state (including waiting for state / backend load)
  if (fetchLoading || (bookingId && !booking)) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin z-10" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="text-center z-10 bg-[#131826]/40 backdrop-blur-md p-8 rounded-3xl border border-slate-800">
          <p className="text-slate-400 font-bold mb-4">Nenhum agendamento encontrado.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-pink-500/15">
            Voltar para o início
          </button>
        </div>
      </div>
    )
  }

  const profileLink = booking.businessUsername ? `/p/${booking.businessUsername}` : `/agendar/${token}`;

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4 relative overflow-hidden text-slate-100">
      {/* Background Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#131826]/40 backdrop-blur-md p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative z-10 text-center animate-slide-up">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
          <Check className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-2">Agendado com Sucesso!</h1>
        <p className="text-slate-400 mb-6 font-semibold">Tudo certo, {booking.clientName.split(' ')[0]}!</p>

        {isPaidViaMP && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400 font-bold text-sm mb-6">
            {isPayFullPrice
              ? '✅ Valor total do serviço pago via Mercado Pago! Nada a pagar no dia! 🎉'
              : '✅ Taxa de agendamento paga via Mercado Pago!'}
          </div>
        )}

        {/* Ticket Container */}
        <div className="bg-[#0B0F19]/60 border border-slate-800 rounded-3xl p-6 mb-6 text-left relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl"></div>
          
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Detalhes do Agendamento</h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Serviço</span>
              <span className="text-sm font-bold text-slate-200">{booking.serviceName}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                      <span>➕ {a.name}</span>
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
          </div>
        </div>

        {whatsapp?.method === 'api' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400 font-bold text-sm mb-6">
             ✅ Comprovante enviado no seu WhatsApp!
          </div>
        ) : whatsapp?.link ? (
          <div className="mb-6">
            <p className="text-xs text-slate-400 font-bold mb-3">Clique no botão abaixo para receber o comprovante no WhatsApp:</p>
            <a
              href={whatsapp.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-[#25d366]/10 text-base"
            >
              💬 Abrir WhatsApp
            </a>
          </div>
        ) : null}

        <div className="mb-6">
          <Link
            to={`/agendar/${token}/cancelar/${booking.id}`}
            className="text-xs text-slate-500 hover:text-red-400 font-bold transition-colors"
          >
            Precisa alterar ou cancelar? Clique aqui
          </Link>
        </div>

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
                🔔 Ativar lembretes por notificação
              </button>
            )}
            {pushStatus === 'granted' && (
              <p className="mt-3 text-xs text-emerald-400 font-bold">✅ Notificações ativadas!</p>
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
