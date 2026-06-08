import { useLocation, useParams, useNavigate, Link } from 'react-router-dom'
import { Check, Calendar, Clock, ExternalLink, ArrowLeft } from 'lucide-react'

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

  if (!state?.booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <button onClick={() => navigate('/')} className="text-pink-500 font-bold">Voltar para o início</button>
        </div>
      </div>
    )
  }

  const { booking, whatsapp } = state

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-slide-up text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
          <Check className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2">Agendado!</h1>
        <p className="text-slate-500 mb-8 font-medium">Tudo certo, {booking.clientName.split(' ')[0]}!</p>

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
