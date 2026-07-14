import { useState, useEffect } from 'react'
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom'
import { Check, Calendar, Clock, ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '../services/api'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function BookingSuccess() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as {
    booking?: { id: number; clientName: string; clientPhone: string; date: string; time: string }
    whatsapp?: { success: boolean; method: 'api' | 'link'; link?: string }
  } | null

  // Check for bookingId in query params (return from Mercado Pago)
  const searchParams = new URLSearchParams(location.search)
  const queryBookingId = searchParams.get('bookingId')
  const paymentStatus = searchParams.get('payment')

  const [fetchedBooking, setFetchedBooking] = useState<{
    id: number; clientName: string; clientPhone: string; date: string; time: string;
    businessName: string; businessPhone: string; serviceName: string; price: number;
  } | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)

  useEffect(() => {
    // If we have no state but have a bookingId from query params, fetch booking details
    if (!state?.booking && queryBookingId) {
      setFetchLoading(true)
      api.getPublicBookingDetails(parseInt(queryBookingId))
        .then(data => setFetchedBooking(data))
        .catch(() => {})
        .finally(() => setFetchLoading(false))
    }
  }, [state, queryBookingId])

  // Use state booking or fetched booking
  const booking = state?.booking || (fetchedBooking ? {
    id: fetchedBooking.id,
    clientName: fetchedBooking.clientName,
    clientPhone: fetchedBooking.clientPhone,
    date: fetchedBooking.date,
    time: fetchedBooking.time,
  } : null)

  const whatsapp = state?.whatsapp || null

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <button onClick={() => navigate('/')} className="text-pink-500 font-bold">Voltar para o início</button>
        </div>
      </div>
    )
  }

  const isPaidViaMP = paymentStatus === 'success' && !state?.booking

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-slide-up text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
          <Check className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2">Agendado!</h1>
        <p className="text-slate-500 mb-8 font-medium">Tudo certo, {booking.clientName.split(' ')[0]}!</p>

        {isPaidViaMP && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-700 font-bold text-sm mb-6">
            ✅ Sinal pago diretamente ao profissional com sucesso!
          </div>
        )}

        <div className="card-simple p-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-left p-3 bg-slate-50 rounded-xl">
              <Calendar className="w-6 h-6 text-pink-500" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Dia</p>
                <p className="font-bold text-slate-900">{formatDate(booking.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-left p-3 bg-slate-50 rounded-xl">
              <Clock className="w-6 h-6 text-pink-500" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Horário</p>
                <p className="font-bold text-slate-900">{booking.time}</p>
              </div>
            </div>
          </div>
        </div>

        {whatsapp?.method === 'api' ? (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-700 font-bold text-sm mb-6">
             ✅ Comprovante enviado no WhatsApp!
          </div>
        ) : whatsapp?.link ? (
          <div className="mb-8">
            <p className="text-sm text-slate-600 font-bold mb-4">Clique no botão abaixo para receber o comprovante:</p>
            <a
              href={whatsapp.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-black py-4 rounded-2xl transition-all shadow-md text-lg"
            >
              <span className="text-2xl">💬</span>
              Abrir WhatsApp
            </a>
          </div>
        ) : null}

        <div className="mb-6">
          <Link
            to={`/agendar/${token}/cancelar/${booking.id}`}
            className="text-xs text-red-500 hover:text-red-600 font-bold hover:underline"
          >
            Precisa cancelar este horário? Clique aqui
          </Link>
        </div>

        <Link
          to={`/agendar/${token}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-pink-500 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para o início
        </Link>
      </div>
    </div>
  )
}
