import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Calendar, Clock, Loader2, AlertCircle, Phone, XCircle, CheckCircle2 } from 'lucide-react'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function BookingCancel() {
  const { token, bookingId } = useParams<{ token: string; bookingId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState<{
    id: number
    clientName: string
    clientPhone: string
    date: string
    time: string
    businessName: string
    businessPhone: string
    serviceName: string
    price: number
  } | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [policyError, setPolicyError] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')

  useEffect(() => {
    if (!bookingId) return
    api.getPublicBookingDetails(Number(bookingId))
      .then(data => {
        setBooking(data)
        setBusinessPhone(data.businessPhone)
      })
      .catch(err => {
        setError(err.message || 'Agendamento não encontrado.')
      })
      .finally(() => setLoading(false))
  }, [bookingId])

  const handleCancel = async () => {
    if (!bookingId) return
    setSubmitting(true)
    setPolicyError('')

    try {
      await api.cancelPublicBooking(Number(bookingId))
      setCancelled(true)
    } catch (err: any) {
      if (err.error === 'PRAZO_LIMITE_EXPIRADO') {
        setPolicyError(err.message)
        if (err.businessPhone) {
          setBusinessPhone(err.businessPhone)
        }
      } else {
        setError(err.message || 'Ocorreu um erro ao cancelar o agendamento.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
        <div className="text-center bg-[#131826] border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Erro</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="w-full bg-[#1A2235] border border-slate-700 hover:border-slate-600 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            Voltar para o agendamento
          </button>
        </div>
      </div>
    )
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
        <div className="text-center bg-[#131826] border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-white">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 rounded-full mx-auto mb-5 shadow-lg shadow-emerald-500/5">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black mb-2">Cancelado com Sucesso!</h1>
          <p className="text-slate-400 text-sm font-semibold mb-6 leading-relaxed">
            Seu horário foi cancelado. A vaga foi liberada na agenda de <span className="text-white font-bold">{booking?.businessName}</span>.
          </p>
          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black py-4 rounded-xl shadow-lg shadow-pink-500/20"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    )
  }

  if (policyError) {
    const waText = encodeURIComponent(
      `Olá! Gostaria de falar sobre o cancelamento do meu agendamento de ${booking ? formatDate(booking.date) : ''} às ${booking?.time} (${booking?.serviceName}).`
    )
    const whatsappLink = `https://wa.me/${businessPhone.replace(/\D/g, '')}?text=${waText}`

    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
        <div className="text-center bg-[#131826] border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-white">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 rounded-full mx-auto mb-5 animate-pulse">
            <AlertCircle className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black mb-2">Prazo Expirado!</h1>
          <p className="text-slate-400 text-sm font-semibold mb-6 leading-relaxed">
            Cancelamentos online só são permitidos com até <span className="text-white font-bold">2 horas</span> de antecedência.
            <br /><br />
            Para cancelar seu horário de hoje às <span className="text-orange-400 font-bold">{booking?.time}</span>, entre em contato direto com o profissional.
          </p>
          
          <div className="space-y-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm"
            >
              <Phone className="w-4 h-4" /> Chamar no WhatsApp
            </a>
            <button
              onClick={() => navigate(`/agendar/${token}`)}
              className="w-full bg-[#1A2235] border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all text-xs"
            >
              Voltar para agendamento
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#131826] border border-slate-800 rounded-3xl p-6 shadow-2xl text-white text-center">
        <h1 className="text-2xl font-black mb-2 text-white">Cancelar Horário</h1>
        <p className="text-slate-400 text-sm font-semibold mb-6">Confirme os detalhes abaixo para desmarcar:</p>

        {/* Info Ticket */}
        <div className="bg-[#1A2235] border border-slate-800 rounded-2xl p-5 text-left mb-6 space-y-3">
          <div className="flex justify-between border-b border-slate-800/60 pb-2.5">
            <span className="text-slate-400 text-xs font-semibold">Profissional:</span>
            <span className="text-white font-bold text-xs">{booking?.businessName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/60 pb-2.5">
            <span className="text-slate-400 text-xs font-semibold">Serviço:</span>
            <span className="text-white font-bold text-xs">{booking?.serviceName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/60 pb-2.5">
            <span className="text-slate-400 text-xs font-semibold">Data/Hora:</span>
            <span className="text-orange-400 font-bold text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {booking ? formatDate(booking.date) : ''} às {booking?.time}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-xs font-semibold">Cliente:</span>
            <span className="text-white font-bold text-xs">{booking?.clientName}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 text-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Confirmar Cancelamento'
            )}
          </button>
          
          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="w-full bg-[#1A2235] border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all text-xs"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
