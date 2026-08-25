import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { Calendar, Clock, Loader2, AlertCircle, Phone, XCircle, CheckCircle2, ChevronLeft, Sparkles, RefreshCw, Key } from 'lucide-react'

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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Query parameter code
  const urlCode = searchParams.get('code') || ''

  // General States
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelCodeInput, setCancelCodeInput] = useState(urlCode)
  const [refundInfo, setRefundInfo] = useState<{ isPending: boolean; amount: number; message: string } | null>(null)
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
    paidAmount?: number
    status?: string
    cancellationCode?: string
    refundStatus?: string
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
    if (!bookingId) return
    api.getPublicBookingDetails(Number(bookingId), urlCode)
      .then(data => {
        setBooking(data)
        setBusinessPhone(data.businessPhone)
        if (data.cancellationCode && !urlCode) {
          setCancelCodeInput(data.cancellationCode)
        }
      })
      .catch(err => {
        setError(err.message || 'Agendamento não encontrado.')
      })
      .finally(() => setLoading(false))
  }, [bookingId, urlCode])

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
      const res = await api.cancelPublicBooking(Number(bookingId), cancelCodeInput)
      if (res.refundPending) {
        setRefundInfo({
          isPending: true,
          amount: res.refundAmount || booking?.paidAmount || 0,
          message: res.message || 'Solicitação de estorno enviada ao profissional.'
        })
      }
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
      
      await api.reschedulePublicBooking(Number(bookingId), selectedSlotId, cancelCodeInput)
      
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
      <div className="min-h-screen bg-[#050507] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse" />
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin relative z-10" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="text-center bg-[#131826]/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 text-slate-100">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Erro</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all border border-slate-700"
          >
            Voltar para o agendamento
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'cancelled') {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="text-center bg-[#131826]/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 text-slate-100">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 rounded-full mx-auto mb-5 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black mb-2">Cancelado com Sucesso!</h1>
          <p className="text-slate-400 text-sm font-semibold mb-4 leading-relaxed">
            Seu horário foi cancelado e a vaga foi liberada na agenda de <span className="text-slate-100 font-bold">{booking?.businessName}</span>.
          </p>

          {refundInfo?.isPending && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 text-left space-y-1">
              <p className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" /> Solicitação de Estorno Enviada
              </p>
              <p className="text-[11.5px] text-amber-200/80 leading-relaxed">
                Como você realizou o pagamento de <strong className="text-white">R$ {refundInfo.amount.toFixed(2)}</strong>, o profissional foi notificado para efetuar o reembolso.
              </p>
            </div>
          )}

          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-pink-500/20 text-sm"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'rescheduled') {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="text-center bg-[#131826]/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 text-slate-100">
          <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 rounded-full mx-auto mb-5 shadow-lg shadow-violet-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black mb-2">Remarcado com Sucesso!</h1>
          <p className="text-slate-400 text-sm font-semibold mb-6 leading-relaxed">
            Seu agendamento foi alterado para o dia <span className="text-slate-100 font-bold">{formatDate(newDateTime.date)}</span> às <span className="text-violet-400 font-bold">{newDateTime.time}</span>.
          </p>
          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-pink-500/20 text-sm"
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
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="text-center bg-[#131826]/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 text-slate-100">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 rounded-full mx-auto mb-5 animate-pulse">
            <AlertCircle className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black mb-2 text-slate-100">Prazo Expirado!</h1>
          <p className="text-slate-400 text-sm font-semibold mb-6 leading-relaxed">
            Alterações online só são permitidas com até <span className="text-slate-100 font-bold">2 horas</span> de antecedência.
            <br /><br />
            Para reagendar seu horário de hoje às <span className="text-amber-400 font-bold">{booking?.time}</span>, fale direto com o profissional no WhatsApp.
          </p>
          
          <div className="space-y-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25d366]/20 text-sm"
            >
              <Phone className="w-4 h-4" /> Chamar no WhatsApp
            </a>
            <button
              onClick={() => {
                setPolicyError('')
                setMode('manage')
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl transition-all border border-slate-700 text-xs"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050507] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-slate-800/60 border border-slate-700/80 px-3.5 py-1.5 rounded-full mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-[11px] font-black tracking-wider text-slate-300 uppercase">Portal do Cliente</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">Gerenciar Agendamento</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Cancele ou escolha um novo horário sem complicações</p>
        </div>

        {/* Main Panel */}
        <div className="bg-[#131826]/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/80 shadow-2xl relative z-10 text-left">
          
          {mode === 'manage' ? (
            <div className="space-y-6">
              
              {/* Details Ticket Container */}
              <div className="bg-[#0B0F19]/60 border border-slate-800 rounded-2xl p-5 space-y-3.5 relative overflow-hidden">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Profissional</span>
                  <span className="text-xs font-bold text-slate-200">{booking?.businessName}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Serviço</span>
                  <span className="text-xs font-bold text-slate-200">{booking?.serviceName}</span>
                </div>
                {booking?.cancellationCode && (
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Cód. Cancelamento</span>
                    <span className="text-xs font-black text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-mono tracking-wider">
                      {booking.cancellationCode}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Valor</span>
                  <span className="text-xs font-black text-pink-500">
                    {booking ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(booking.price) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Data e Hora</span>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {booking ? formatDate(booking.date) : ''} às {booking?.time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Cliente</span>
                  <span className="text-xs font-bold text-slate-200">{booking?.clientName}</span>
                </div>
              </div>

              {/* Main Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleOpenReschedule}
                  className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-pink-500/15 text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4.5 h-4.5" />
                  Remarcar para Outro Horário
                </button>

                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  className="w-full py-4 text-sm font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <button
                  onClick={() => setMode('manage')}
                  className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-sm text-slate-200">Remarcar Horário</h3>
              </div>

              {loadingSlots ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                </div>
              ) : dates.length === 0 ? (
                <p className="text-center py-10 text-slate-500 text-sm italic">
                  Não há novos horários disponíveis no momento.
                </p>
              ) : (
                <div className="space-y-5">
                  {/* Date Selector */}
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2">Selecione o Dia</p>
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
                            className={`flex flex-col items-center justify-center p-2.5 min-w-[64px] rounded-2xl border transition-all text-center ${
                              isSelected
                                ? 'bg-pink-500/20 border-pink-500 text-white shadow-lg shadow-pink-500/10'
                                : 'bg-[#0B0F19]/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-widest block opacity-70">
                              {getWeekday(date)}
                            </span>
                            <span className="text-sm font-black block mt-0.5">
                              {date.split('-')[2]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Slots Grid */}
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2">Selecione o Horário</p>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                      {(slotsByDate[selectedDate] || []).map(slot => {
                        const isSelected = selectedSlotId === slot.id
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-gradient-to-r from-violet-600 to-pink-600 border-pink-500 text-white shadow-md shadow-pink-500/10'
                                : 'bg-[#0B0F19]/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            {slot.time}
                          </button>
                        )
                      })}
                      {(slotsByDate[selectedDate] || []).length === 0 && (
                        <div className="col-span-4 text-center py-6 text-slate-500 text-xs italic">
                          Esgotado para este dia
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reschedule Button */}
                  <button
                    onClick={handleRescheduleSubmit}
                    disabled={!selectedSlotId || submitting}
                    className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-pink-500/15 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Home Back button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate(`/agendar/${token}`)}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-pink-400 font-bold text-xs transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Voltar para o Início
          </button>
        </div>

      </div>
    </div>
  )
}
