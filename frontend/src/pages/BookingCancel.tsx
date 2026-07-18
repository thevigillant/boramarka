import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Calendar, Clock, Loader2, AlertCircle, Phone, XCircle, CheckCircle2, ChevronLeft, Sparkles, RefreshCw } from 'lucide-react'

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function getWeekday(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return weekdays[date.getDay()]
}

export default function BookingCancel() {
  const { token, bookingId } = useParams<{ token: string; bookingId: string }>()
  const navigate = useNavigate()

  // General States
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

  // Booking Flow States
  const [mode, setMode] = useState<'manage' | 'reschedule' | 'cancelled' | 'rescheduled'>('manage')
  const [submitting, setSubmitting] = useState(false)
  const [policyError, setPolicyError] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')

  // Reschedule Calendar/Slots States
  const [dates, setDates] = useState<string[]>([])
  const [slotsByDate, setSlotsByDate] = useState<Record<string, { id: number; time: string }[]>>({})
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [newDateTime, setNewDateTime] = useState({ date: '', time: '' })

  useEffect(() => {
    document.documentElement.classList.add('dark')
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

  // Load available slots when switching to reschedule mode
  const handleOpenReschedule = async () => {
    if (!token) return
    setLoadingSlots(true)
    setMode('reschedule')
    try {
      const schedule = await api.getSchedule(token)
      setDates(schedule.dates)
      setSlotsByDate(schedule.slotsByDate)
      if (schedule.dates.length > 0) {
        setSelectedDate(schedule.dates[0])
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar horários disponíveis.')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleCancel = async () => {
    if (!bookingId) return
    setSubmitting(true)
    setPolicyError('')

    try {
      await api.cancelPublicBooking(Number(bookingId))
      setMode('cancelled')
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

  const handleRescheduleSubmit = async () => {
    if (!bookingId || !selectedSlotId) return
    setSubmitting(true)
    setPolicyError('')

    try {
      // Find time slot data for message display
      const activeSlots = slotsByDate[selectedDate] || []
      const chosenSlot = activeSlots.find(s => s.id === selectedSlotId)
      
      await api.reschedulePublicBooking(Number(bookingId), selectedSlotId)
      
      setNewDateTime({
        date: selectedDate,
        time: chosenSlot?.time || ''
      })
      setMode('rescheduled')
    } catch (err: any) {
      if (err.error === 'PRAZO_LIMITE_EXPIRADO') {
        setPolicyError(err.message)
        if (err.businessPhone) {
          setBusinessPhone(err.businessPhone)
        }
      } else {
        setError(err.message || 'Ocorreu um erro ao remarcar o agendamento.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center relative overflow-hidden grain">
        <div className="orb w-[300px] h-[300px] bg-violet-600/10 top-1/4 left-1/4 blur-[100px]" />
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin relative z-10" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden grain">
        <div className="orb w-[300px] h-[300px] bg-red-600/5 top-1/4 left-1/4 blur-[100px]" />
        <div className="text-center bg-[#0d0d12]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Erro</h1>
          <p className="text-white/45 text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="w-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-white font-bold py-3.5 rounded-xl transition-all"
          >
            Voltar para o agendamento
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'cancelled') {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden grain">
        <div className="orb w-[300px] h-[300px] bg-emerald-600/5 top-1/3 left-1/3 blur-[100px]" />
        <div className="text-center bg-[#0d0d12]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 text-white">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 rounded-full mx-auto mb-5 shadow-lg shadow-emerald-500/5">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black mb-2">Cancelado com Sucesso!</h1>
          <p className="text-white/45 text-sm font-semibold mb-6 leading-relaxed">
            Seu horário foi cancelado. A vaga foi liberada na agenda de <span className="text-white font-bold">{booking?.businessName}</span>.
          </p>
          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-600/20 text-sm"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'rescheduled') {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden grain">
        <div className="orb w-[300px] h-[300px] bg-violet-600/5 top-1/3 left-1/3 blur-[100px]" />
        <div className="text-center bg-[#0d0d12]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 text-white">
          <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 rounded-full mx-auto mb-5 shadow-lg shadow-violet-500/5">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black mb-2">Remarcado com Sucesso!</h1>
          <p className="text-white/45 text-sm font-semibold mb-6 leading-relaxed">
            Seu agendamento foi alterado para o dia <span className="text-white font-bold">{formatDate(newDateTime.date)}</span> às <span className="text-violet-400 font-bold">{newDateTime.time}</span>.
          </p>
          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-600/20 text-sm"
          >
            Voltar para a Agenda
          </button>
        </div>
      </div>
    )
  }

  if (policyError) {
    const waText = encodeURIComponent(
      `Olá! Gostaria de falar sobre o cancelamento/remarcação do meu agendamento de ${booking ? formatDate(booking.date) : ''} às ${booking?.time} (${booking?.serviceName}).`
    )
    const whatsappLink = `https://wa.me/${businessPhone.replace(/\D/g, '')}?text=${waText}`

    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden grain">
        <div className="orb w-[300px] h-[300px] bg-orange-600/5 top-1/3 left-1/3 blur-[100px]" />
        <div className="text-center bg-[#0d0d12]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 text-white">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 rounded-full mx-auto mb-5 animate-pulse">
            <AlertCircle className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black mb-2">Prazo Expirado!</h1>
          <p className="text-white/45 text-sm font-semibold mb-6 leading-relaxed">
            Alterações online só são permitidas com até <span className="text-white font-bold">2 horas</span> de antecedência.
            <br /><br />
            Para reagendar seu horário de hoje às <span className="text-orange-400 font-bold">{booking?.time}</span>, fale direto com o profissional no WhatsApp.
          </p>
          
          <div className="space-y-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm"
            >
              <Phone className="w-4 h-4" /> Chamar no WhatsApp
            </a>
            <button
              onClick={() => {
                setPolicyError('')
                setMode('manage')
              }}
              className="w-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-white font-bold py-3 rounded-xl transition-all text-xs"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center p-4 relative overflow-hidden grain">
      {/* Mesh Orbs */}
      <div className="orb w-[500px] h-[500px] bg-violet-600/[0.04] top-[-100px] left-[-100px] blur-[130px]" />
      <div className="orb w-[400px] h-[400px] bg-pink-600/[0.03] bottom-[-100px] right-[-100px] blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] px-3.5 py-1.5 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-bold tracking-wider text-white/70 uppercase">Portal do Cliente</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white/90">Gerenciar Agendamento</h1>
          <p className="text-xs text-white/40 mt-1">Cancele ou escolha um novo horário sem complicações</p>
        </div>

        {/* Main Panel */}
        <div className="card-simple">
          <div className="card-simple-inner p-6">
            
            {mode === 'manage' ? (
              <div className="space-y-6">
                
                {/* Details Ticket */}
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4.5 space-y-3">
                  <div className="flex justify-between items-center pb-2.5 border-b border-white/[0.04]">
                    <span className="text-[11px] text-white/30 font-bold uppercase tracking-wider">Profissional</span>
                    <span className="text-xs font-bold text-white/80">{booking?.businessName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-white/[0.04]">
                    <span className="text-[11px] text-white/30 font-bold uppercase tracking-wider">Serviço</span>
                    <span className="text-xs font-bold text-white/80">{booking?.serviceName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-white/[0.04]">
                    <span className="text-[11px] text-white/30 font-bold uppercase tracking-wider">Valor</span>
                    <span className="text-xs font-bold text-violet-400">
                      {booking ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(booking.price) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-white/[0.04]">
                    <span className="text-[11px] text-white/30 font-bold uppercase tracking-wider">Data e Hora</span>
                    <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {booking ? formatDate(booking.date) : ''} às {booking?.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-white/30 font-bold uppercase tracking-wider">Cliente</span>
                    <span className="text-xs font-bold text-white/80">{booking?.clientName}</span>
                  </div>
                </div>

                {/* Main Actions */}
                <div className="space-y-2.5">
                  <button
                    onClick={handleOpenReschedule}
                    className="w-full btn-primary-simple py-4 text-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4.5 h-4.5" />
                    Remarcar para Outro Horário
                  </button>

                  <button
                    onClick={handleCancel}
                    disabled={submitting}
                    className="w-full py-4 text-sm font-bold text-red-400 hover:text-red-300 bg-red-500/[0.03] border border-red-500/10 hover:border-red-500/25 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      'Cancelar Agendamento'
                    )}
                  </button>
                </div>

              </div>
            ) : (
              
              // Reschedule mode
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.04]">
                  <button
                    onClick={() => setMode('manage')}
                    className="p-1.5 rounded-lg bg-white/[0.04] text-white/60 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-sm text-white/80">Remarcar Horário</h3>
                </div>

                {loadingSlots ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                  </div>
                ) : dates.length === 0 ? (
                  <p className="text-center py-10 text-white/30 text-sm italic">
                    Não há novos horários disponíveis no momento.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {/* Date Selector */}
                    <div>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2">Selecione o Dia</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {dates.map(date => {
                          const isSelected = selectedDate === date
                          return (
                            <button
                              key={date}
                              onClick={() => {
                                setSelectedDate(date)
                                setSelectedSlotId(null)
                              }}
                              className={`flex flex-col items-center justify-center p-2.5 min-w-[64px] rounded-xl border transition-all text-center ${
                                isSelected
                                  ? 'bg-violet-600/20 border-violet-500/60 text-white shadow-lg shadow-violet-600/10'
                                  : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-white/[0.04] hover:text-white/80'
                              }`}
                            >
                              <span className="text-[9px] font-bold uppercase tracking-widest block opacity-70">
                                {getWeekday(date)}
                              </span>
                              <span className="text-sm font-extrabold block mt-0.5">
                                {date.split('-')[2]}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Slots Grid */}
                    <div>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2">Selecione o Horário</p>
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                        {(slotsByDate[selectedDate] || []).map(slot => {
                          const isSelected = selectedSlotId === slot.id
                          return (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 border-violet-500 text-white shadow-md shadow-violet-600/10'
                                  : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.04] hover:text-white/90'
                              }`}
                            >
                              {slot.time}
                            </button>
                          )
                        })}
                        {(slotsByDate[selectedDate] || []).length === 0 && (
                          <div className="col-span-4 text-center py-6 text-white/30 text-xs italic">
                            Esgotado para este dia
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reschedule Button */}
                    <button
                      onClick={handleRescheduleSubmit}
                      disabled={!selectedSlotId || submitting}
                      className="w-full btn-primary-simple py-4 text-sm flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          Remarcando...
                        </>
                      ) : (
                        'Confirmar Remarcação'
                      )}
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

        {/* Home Back button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 font-semibold text-xs transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Voltar para o Início
          </button>
        </div>

      </div>
    </div>
  )
}
