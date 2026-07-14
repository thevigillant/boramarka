import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Calendar, Clock, User, Phone, Loader2, AlertCircle } from 'lucide-react'

// Phone mask for Brazilian numbers: (XX) XXXXX-XXXX
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatDateLabel(dateStr: string): { day: string; weekday: string; month: string } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return {
    day: d.toString().padStart(2, '0'),
    weekday: weekdays[date.getDay()],
    month: months[date.getMonth()],
  }
}

export default function BookingPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [slotsByDate, setSlotsByDate] = useState<Record<string, { id: number; time: string }[]>>({})
  
  // Booking fee states
  const [bookingFeeEnabled, setBookingFeeEnabled] = useState(false)
  const [bookingFeeAmount, setBookingFeeAmount] = useState(0)
  const [serviceName, setServiceName] = useState('')
  const [servicePrice, setServicePrice] = useState(0)

  // Selection state
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)

  // Form state
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountType: 'percentage' | 'fixed'; discountValue: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponValidating, setCouponValidating] = useState(false)
  const [activeMembership, setActiveMembership] = useState<{ planName: string; expiresAt: string } | null>(null)
  
  // Payment redirect / simulation state
  const [pendingPaymentBooking, setPendingPaymentBooking] = useState<any>(null)
  const [isSubmittingSimulation, setIsSubmittingSimulation] = useState(false)

  useEffect(() => {
    if (!token) return
    api.getSchedule(token)
      .then(data => {
        setTitle(data.title)
        setDates(data.dates)
        setSlotsByDate(data.slotsByDate)
        setBookingFeeEnabled(data.bookingFeeEnabled)
        setBookingFeeAmount(data.bookingFeeAmount)
        setServiceName(data.serviceName)
        setServicePrice(data.servicePrice)
        if (data.dates.length > 0) setSelectedDate(data.dates[0])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    const cleanPhone = clientPhone.replace(/\D/g, '')
    if (cleanPhone.length >= 10 && token) {
      api.validateClientSubscription(token, cleanPhone)
        .then(res => {
          if (res.active) {
            setActiveMembership({ planName: res.planName || '', expiresAt: res.expiresAt || '' })
          } else {
            setActiveMembership(null)
          }
        })
        .catch(() => setActiveMembership(null))
    } else {
      setActiveMembership(null)
    }
  }, [clientPhone, token])

  const selectedSlotTime = useMemo(() => {
    if (!selectedDate || !selectedSlotId) return null
    const slot = slotsByDate[selectedDate]?.find(s => s.id === selectedSlotId)
    return slot?.time || null
  }, [selectedDate, selectedSlotId, slotsByDate])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !token) return
    setCouponValidating(true)
    setCouponError('')
    try {
      const result = await api.validateCoupon(token, couponCode.trim())
      setAppliedCoupon(result)
    } catch (err: any) {
      setCouponError(err.message || 'Cupom inválido ou expirado.')
    } finally {
      setCouponValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !selectedSlotId) return

    const cleanPhone = clientPhone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setSubmitError('Por favor, coloque seu celular corretamente.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const result = await api.bookSlot(token, {
        timeSlotId: selectedSlotId,
        clientName: clientName.trim(),
        clientPhone: cleanPhone,
      })

      if (result.paymentRequired) {
        setPendingPaymentBooking({
          booking: result.booking,
          paymentUrl: result.paymentUrl,
        })
      } else {
        if (result.whatsapp?.link) {
          window.open(result.whatsapp.link, '_blank')
        }

        navigate(`/agendar/${token}/sucesso`, {
          state: {
            booking: result.booking,
            whatsapp: result.whatsapp,
          },
        })
      }
    } catch (err: any) {
      setSubmitError(err.message)
      if (err.message.includes('reservado') || err.message.includes('ocupado')) {
        const data = await api.getSchedule(token)
        setDates(data.dates)
        setSlotsByDate(data.slotsByDate)
        setSelectedSlotId(null)
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
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Erro</h1>
          <p className="text-slate-400 mb-6">{error}</p>
        </div>
      </div>
    )
  }

  if (pendingPaymentBooking) {
    const booking = pendingPaymentBooking.booking;
    const isSimulated = pendingPaymentBooking.paymentUrl.includes('pagar-simulado');
    const { day, weekday, month } = formatDateLabel(booking.date);

    const handleSimulationPayment = async () => {
      setIsSubmittingSimulation(true);
      setSubmitError('');
      try {
        const result = await api.confirmSimulationBooking(booking.id);
        navigate(`/agendar/${token}/sucesso`, {
          state: {
            booking: result.booking,
            whatsapp: { success: true, method: 'link', link: `https://wa.me/55${booking.clientPhone.replace(/\D/g, '')}` }
          }
        });
      } catch (err: any) {
        setSubmitError(err.message || 'Erro ao simular pagamento.');
      } finally {
        setIsSubmittingSimulation(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#0B0F19] pb-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 pt-12 pb-24 text-white text-center">
          <div className="max-w-xl mx-auto">
            <h1 className="text-3xl font-black mb-2">Sinal de Reserva</h1>
            <p className="opacity-90 font-medium">Pague o sinal diretamente ao profissional para garantir seu horário</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-16 animate-slide-up">
          <div className="bg-[#131826] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl">💳</span>
              <h2 className="text-xl font-black text-white">Sinal de Reserva</h2>
              <p className="text-slate-400 text-sm font-semibold">
                O profissional solicita um sinal antecipado para reservar seu horário. Esse valor vai direto para o profissional e será descontado do preço total do serviço no dia do atendimento.
              </p>
            </div>

            {/* Resume Card */}
            <div className="bg-[#1A2235] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase">Serviço</span>
                <span className="text-sm font-bold text-white">{serviceName || 'Serviço'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase">Data e Hora</span>
                <span className="text-sm font-bold text-pink-500">{day} de {month} ({weekday}) às {booking.time}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase">Preço Total do Serviço</span>
                <span className="text-sm font-bold text-white">R$ {(servicePrice || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-black text-slate-300">Sinal (pago ao profissional)</span>
                <span className="text-xl font-black text-emerald-400">R$ {(bookingFeeAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-sm font-semibold text-center">
                {submitError}
              </div>
            )}

            {isSimulated ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-pink-500/20 rounded-2xl p-4 text-center space-y-2">
                  <p className="text-orange-400 text-xs font-black uppercase tracking-widest">Modo de Teste / Simulador</p>
                  <p className="text-slate-300 text-xs font-semibold">
                    Este profissional configurou as credenciais como <strong>SIMULADOR</strong>. Você pode simular o pagamento clicando no botão abaixo.
                  </p>
                </div>

                <button
                  onClick={handleSimulationPayment}
                  disabled={isSubmittingSimulation}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-pink-500/20 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmittingSimulation ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      Confirmar Pagamento Simulado
                    </>
                  )}
                </button>
              </div>
            ) : (
              <a
                href={pendingPaymentBooking.paymentUrl}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-pink-500/20 hover:opacity-90 transition-opacity text-center text-lg"
              >
                <span>💳</span>
                Pagar com Mercado Pago
              </a>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setPendingPaymentBooking(null);
                  api.getSchedule(token!)
                    .then(data => {
                      setDates(data.dates)
                      setSlotsByDate(data.slotsByDate)
                      setSelectedSlotId(null)
                    });
                }}
                className="text-slate-500 hover:text-slate-400 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancelar e voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 pt-12 pb-24 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-black mb-2">{title}</h1>
          <p className="opacity-90 font-medium">Escolha o melhor dia e horário para você</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-16 animate-slide-up">
        <div className="bg-[#131826] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Step 1: Date */}
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> 1. Escolha o dia
            </h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {dates.map(date => {
                const { day, weekday, month } = formatDateLabel(date)
                const isSelected = selectedDate === date
                return (
                  <button
                    key={date}
                    onClick={() => { setSelectedDate(date); setSelectedSlotId(null) }}
                    className={`flex-shrink-0 w-20 py-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/20 scale-105'
                        : 'bg-[#1A2235] border-slate-700 text-slate-400 hover:border-pink-500/50'
                    }`}
                  >
                    <p className={`text-[10px] font-bold uppercase ${isSelected ? 'opacity-90' : 'text-slate-500'}`}>{weekday}</p>
                    <p className="text-2xl font-black">{day}</p>
                    <p className={`text-[10px] font-bold uppercase ${isSelected ? 'opacity-90' : 'text-slate-500'}`}>{month}</p>
                  </button>
                )
              })}
              {dates.length === 0 && (
                <div className="w-full py-8 text-center bg-[#1A2235] rounded-2xl border-2 border-dashed border-slate-700">
                  <p className="text-slate-500 font-bold text-sm">Nenhum horário disponível para este serviço no momento.</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Time */}
          {selectedDate && (
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> 2. Escolha o horário
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {(slotsByDate[selectedDate] || []).map(slot => {
                  const isSelected = selectedSlotId === slot.id
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`py-4 rounded-xl font-bold border transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500 to-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/20'
                          : 'bg-[#1A2235] border-slate-700 text-slate-300 hover:border-pink-500/50'
                      }`}
                    >
                      {slot.time}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Form */}
          {selectedSlotId && (
            <form onSubmit={handleSubmit} className="p-6 animate-slide-up">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <User className="w-4 h-4" /> 3. Confirme seus dados
              </h2>

              <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-pink-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-lg">{formatDateLabel(selectedDate!).day}/{formatDateLabel(selectedDate!).month} às {selectedSlotTime}</p>
                  <p className="text-pink-400 text-xs font-bold uppercase tracking-widest">{formatDateLabel(selectedDate!).weekday}</p>
                </div>
                <button type="button" onClick={() => setSelectedSlotId(null)} className="text-pink-400 font-bold text-sm hover:text-pink-300 transition-colors">Mudar</button>
              </div>

              {submitError && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-sm font-semibold mb-4">
                  {submitError}
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 px-1">Seu Nome</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Digite seu nome"
                    required
                    className="w-full px-4 py-3.5 bg-[#1A2235] border border-slate-700 rounded-xl text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 px-1">Seu WhatsApp</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    required
                    className="w-full px-4 py-3.5 bg-[#1A2235] border border-slate-700 rounded-xl text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 px-1">Cupom de Desconto (opcional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="Código do cupom"
                      className="flex-grow px-4 py-3 bg-[#1A2235] border border-slate-700 rounded-xl text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-pink-500 transition-colors uppercase text-sm"
                      disabled={couponValidating || !!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode('');
                        }}
                        className="px-4 py-3 bg-red-500/20 text-red-400 font-black rounded-xl text-xs border border-red-500/30 hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponValidating || !couponCode.trim()}
                        className="px-4 py-3 bg-slate-800 text-white font-black rounded-xl text-xs border border-slate-700 hover:border-pink-500 transition-all uppercase tracking-wider disabled:opacity-50"
                      >
                        {couponValidating ? 'Aplicando...' : 'Aplicar'}
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <p className="text-red-400 text-xs font-semibold mt-1 px-1">{couponError}</p>
                  )}
                  {appliedCoupon && (
                    <p className="text-emerald-400 text-xs font-semibold mt-1 px-1">
                      Cupom {appliedCoupon.code} aplicado! ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `R$ ${appliedCoupon.discountValue.toFixed(2)}`})
                    </p>
                  )}
                </div>
              </div>

              {/* Price Summary Breakdown */}
              <div className="bg-[#1A2235] border border-slate-800 rounded-2xl p-4 mb-6 space-y-2.5 text-left">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>Preço do Serviço</span>
                  <span>R$ {servicePrice.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-400 text-xs font-bold">
                    <span>Cupom ({appliedCoupon.code})</span>
                    <span>-{appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `R$ ${appliedCoupon.discountValue.toFixed(2)}`}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-800/80">
                  <span className="text-xs font-black text-slate-300">Total a pagar no local</span>
                  <span className="text-lg font-black text-pink-500">
                    R$ {(() => {
                      if (!appliedCoupon) return servicePrice;
                      if (appliedCoupon.discountType === 'percentage') {
                        return Math.max(0, servicePrice - (servicePrice * (appliedCoupon.discountValue / 100)));
                      } else {
                        return Math.max(0, servicePrice - appliedCoupon.discountValue);
                      }
                    })().toFixed(2)}
                  </span>
                </div>
              </div>

              {bookingFeeEnabled && bookingFeeAmount > 0 && !activeMembership && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 text-center space-y-1">
                  <p className="text-amber-400 text-xs font-black uppercase tracking-widest">💳 Sinal de Reserva</p>
                  <p className="text-white font-black text-lg">R$ {bookingFeeAmount.toFixed(2)}</p>
                  <p className="text-slate-400 text-xs font-semibold">O profissional solicita um sinal antecipado para garantir seu horário. Esse valor vai direto para ele e será descontado do total no dia.</p>
                </div>
              )}

              {activeMembership && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-6 text-center space-y-1">
                  <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">✨ Assinatura Ativa Detectada</p>
                  <p className="text-white font-bold text-sm">Plano: {activeMembership.planName}</p>
                  <p className="text-slate-400 text-[10px] font-semibold">Você faz parte do clube de assinaturas deste profissional. O sinal de reserva foi isentado!</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !clientName.trim() || clientPhone.replace(/\D/g, '').length < 10}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black py-5 text-xl rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-pink-500/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Marcando...
                  </>
                ) : (
                  <>
                    <span className="text-2xl">✅</span>
                    Confirmar Horário
                  </>
                )}
              </button>
              
              <p className="text-center text-slate-500 text-xs mt-6 font-medium">
                Você receberá um comprovante no WhatsApp
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
