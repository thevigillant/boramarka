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
  
  const [pendingPaymentBooking, setPendingPaymentBooking] = useState<any>(null)
  const [isSubmittingSimulation, setIsSubmittingSimulation] = useState(false)
  const [payFullPrice, setPayFullPrice] = useState(false)
  const [activeCoupons, setActiveCoupons] = useState<Array<{ code: string; discountType: 'percentage' | 'fixed'; discountValue: number }>>([])
  const [accentColor, setAccentColor] = useState('#f97316')
  const [secondaryColor, setSecondaryColor] = useState('#ec4899')
  const [publicTheme, setPublicTheme] = useState('light')
  
  // Upsell / Addons state
  const [availableUpsells, setAvailableUpsells] = useState<Array<{ id: number; name: string; price: number; duration: number; description?: string; upsellDiscount?: number }>>([])
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([])

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
        setActiveCoupons(data.activeCoupons || [])
        setAvailableUpsells(data.availableUpsells || [])
        setAccentColor(data.accentColor || '#f97316')
        setSecondaryColor(data.secondaryColor || '#ec4899')
        setPublicTheme(data.publicTheme || 'light')
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

  const selectedAddonsTotal = useMemo(() => {
    if (!availableUpsells || availableUpsells.length === 0) return 0;
    return selectedAddonIds.reduce((sum, id) => {
      const addon = availableUpsells.find(u => u.id === id);
      if (!addon) return sum;
      const discount = addon.upsellDiscount || 0;
      const finalPrice = Math.max(0, addon.price * (1 - discount / 100));
      return sum + finalPrice;
    }, 0);
  }, [availableUpsells, selectedAddonIds]);

  const selectedAddonsDuration = useMemo(() => {
    if (!availableUpsells || availableUpsells.length === 0) return 0;
    return selectedAddonIds.reduce((sum, id) => {
      const addon = availableUpsells.find(u => u.id === id);
      return sum + (addon?.duration || 0);
    }, 0);
  }, [availableUpsells, selectedAddonIds]);

  const totalServicePrice = servicePrice + selectedAddonsTotal;

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
        payFullPrice: bookingFeeEnabled && bookingFeeAmount > 0 && !activeMembership ? payFullPrice : undefined,
        addonIds: selectedAddonIds,
      })

      if (result.paymentRequired) {
        setPendingPaymentBooking({
          booking: result.booking,
          paymentUrl: result.paymentUrl,
          paymentAmount: result.paymentAmount,
          payFullPrice: result.payFullPrice,
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
        const result = await api.confirmSimulationBooking(booking.id, pendingPaymentBooking.payFullPrice);
        navigate(`/agendar/${token}/sucesso`, {
          state: {
            booking: result.booking,
            whatsapp: { success: true, method: 'link', link: `https://wa.me/55${booking.clientPhone.replace(/\D/g, '')}` },
            payFullPrice: pendingPaymentBooking.payFullPrice,
          }
        });
      } catch (err: any) {
        setSubmitError(err.message || 'Erro ao simular pagamento.');
      } finally {
        setIsSubmittingSimulation(false);
      }
    };

    return (
      <div className={`min-h-screen ${publicTheme === 'dark' ? 'dark bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-800'} pb-16 font-sans`}>
        <style>{`
          .custom-accent-color { color: ${accentColor} !important; }
          .custom-accent-bg { background-color: ${accentColor} !important; }
          .custom-accent-border { border-color: ${accentColor} !important; }
          .custom-gradient-bg { background: linear-gradient(135deg, ${accentColor}, ${secondaryColor}) !important; }
          .custom-accent-glow {
            box-shadow: 0 10px 15px -3px ${accentColor}30, 0 4px 6px -4px ${accentColor}30 !important;
          }
        `}</style>
        {/* Header */}
        <div className="custom-gradient-bg px-6 pt-12 pb-24 text-white text-center">
          <div className="max-w-xl mx-auto">
            <h1 className="text-3xl font-black mb-2">{pendingPaymentBooking.payFullPrice ? 'Pagamento Total' : 'Sinal de Reserva'}</h1>
            <p className="opacity-90 font-medium">{pendingPaymentBooking.payFullPrice ? 'Pague o valor total do serviço agora e não se preocupe no dia!' : 'Pague o sinal diretamente ao profissional para garantir seu horário'}</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-16 animate-slide-up">
          <div className="bg-white dark:bg-[#131826] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl">{pendingPaymentBooking.payFullPrice ? '✨' : '💳'}</span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{pendingPaymentBooking.payFullPrice ? 'Pagamento Total' : 'Sinal de Reserva'}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
                {pendingPaymentBooking.payFullPrice
                  ? 'Você optou por pagar o valor total do serviço agora. Nada será cobrado no dia do atendimento!'
                  : 'O profissional solicita um sinal antecipado para reservar seu horário. Esse valor vai direto para o profissional e será descontado do preço total do serviço no dia do atendimento.'
                }
              </p>
            </div>

            {/* Resume Card */}
            <div className="bg-slate-50 dark:bg-[#1A2235] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Serviço</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{serviceName || 'Serviço'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data e Hora</span>
                <span className="text-sm font-bold text-pink-600 dark:text-pink-500">{day} de {month} ({weekday}) às {booking.time}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Preço Total do Serviço</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">R$ {(servicePrice || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-black text-slate-700 dark:text-slate-350">{pendingPaymentBooking.payFullPrice ? 'Valor Total (pago agora)' : 'Sinal (pago ao profissional)'}</span>
                <span className="text-xl font-black text-emerald-650 dark:text-emerald-400">R$ {(pendingPaymentBooking.paymentAmount || bookingFeeAmount || 0).toFixed(2)}</span>
              </div>
              {!pendingPaymentBooking.payFullPrice && servicePrice > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                  <span className="text-xs font-bold text-slate-500">Restante a pagar no dia</span>
                  <span className="text-sm font-bold text-slate-750 dark:text-slate-400">R$ {(servicePrice - (pendingPaymentBooking.paymentAmount || bookingFeeAmount || 0)).toFixed(2)}</span>
                </div>
              )}
              {pendingPaymentBooking.payFullPrice && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">Restante a pagar no dia</span>
                  <span className="text-sm font-black text-emerald-650 dark:text-emerald-400">R$ 0,00 🎉</span>
                </div>
              )}
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-sm font-semibold text-center">
                {submitError}
              </div>
            )}

            {isSimulated ? (
              <div className="space-y-4">
                <div className="bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 text-center space-y-2">
                  <p className="text-orange-500 dark:text-orange-400 text-xs font-black uppercase tracking-widest">Modo de Teste / Simulador</p>
                  <p className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                    Este profissional configurou as credenciais como <strong>SIMULADOR</strong>. Você pode simular o pagamento clicando no botão abaixo.
                  </p>
                </div>

                <button
                  onClick={handleSimulationPayment}
                  disabled={isSubmittingSimulation}
                  className="w-full custom-gradient-bg text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl custom-accent-glow hover:opacity-90 transition-opacity disabled:opacity-50"
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
                className="w-full custom-gradient-bg text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl custom-accent-glow hover:opacity-90 transition-opacity text-center text-lg"
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
    <div className={`min-h-screen ${publicTheme === 'dark' ? 'dark bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-800'} pb-16 font-sans`}>
      <style>{`
        .custom-accent-color { color: ${accentColor} !important; }
        .custom-accent-bg { background-color: ${accentColor} !important; }
        .custom-accent-border { border-color: ${accentColor} !important; }
        .custom-accent-hover-border:hover { border-color: ${accentColor} !important; }
        .custom-gradient-bg { background: linear-gradient(135deg, ${accentColor}, ${secondaryColor}) !important; }
        .custom-gradient-text {
          background: linear-gradient(135deg, ${accentColor}, ${secondaryColor});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .custom-accent-glow {
          box-shadow: 0 10px 15px -3px ${accentColor}30, 0 4px 6px -4px ${accentColor}30 !important;
        }
      `}</style>
      {/* Header */}
      <div className="custom-gradient-bg px-6 pt-12 pb-24 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-black mb-2">{title}</h1>
          <p className="opacity-90 font-medium">Escolha o melhor dia e horário para você</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-16 animate-slide-up">
        <div className="bg-white dark:bg-[#131826] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-2xl overflow-hidden">
          {/* Step 1: Date */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-4 flex items-center gap-2">
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
                        ? 'custom-gradient-bg border-transparent text-white shadow-lg scale-105'
                        : 'bg-slate-50 dark:bg-[#1A2235] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-pink-500/50'
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
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> 2. Escolha o horário
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {(slotsByDate[selectedDate] || []).map(slot => {
                  const isSelected = selectedSlotId === slot.id
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`py-3.5 px-3 min-h-[44px] rounded-xl font-bold border text-sm sm:text-base flex items-center justify-center transition-all ${
                        isSelected
                          ? 'custom-gradient-bg border-transparent text-white shadow-md scale-105'
                          : 'bg-slate-50 dark:bg-[#1A2235] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-pink-500/50'
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
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-6 flex items-center gap-2">
                <User className="w-4 h-4" /> 3. Confirme seus dados
              </h2>

              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-slate-900 dark:text-white font-bold text-lg">{formatDateLabel(selectedDate!).day}/{formatDateLabel(selectedDate!).month} às {selectedSlotTime}</p>
                  <p className="text-pink-600 dark:text-pink-450 text-xs font-bold uppercase tracking-widest">{formatDateLabel(selectedDate!).weekday}</p>
                </div>
                <button type="button" onClick={() => setSelectedSlotId(null)} className="text-pink-600 dark:text-pink-400 font-bold text-sm hover:text-pink-500 transition-colors">Mudar</button>
              </div>

              {/* Upsell / Addons Selection Card */}
              {availableUpsells.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-violet-600/15 via-pink-600/15 to-orange-500/15 border-2 border-pink-500/30 dark:border-pink-500/40 rounded-3xl p-5 space-y-3.5 shadow-xl shadow-pink-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-pink-500/20">
                        ✨
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          Aproveite a visita e complete seu visual!
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Adicione cuidados extras ao seu horário com 1 clique</p>
                      </div>
                    </div>
                    {selectedAddonIds.length > 0 && (
                      <span className="text-[10px] font-black bg-gradient-to-r from-pink-500 to-violet-500 text-white px-3 py-1 rounded-full shadow-md shadow-pink-500/20 animate-pulse">
                        +{selectedAddonIds.length} adicionado(s)
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {availableUpsells.map(addon => {
                      const isSelected = selectedAddonIds.includes(addon.id);
                      const discount = addon.upsellDiscount || 0;
                      const finalPrice = Math.max(0, addon.price * (1 - discount / 100));

                      return (
                        <div
                          key={addon.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAddonIds(prev => prev.filter(id => id !== addon.id));
                            } else {
                              setSelectedAddonIds(prev => [...prev, addon.id]);
                            }
                          }}
                          className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-white dark:bg-[#1A2235] border-pink-500 shadow-lg shadow-pink-500/10 scale-[1.01]'
                              : 'bg-white/80 dark:bg-[#131826]/90 border-slate-200 dark:border-slate-800 hover:border-pink-500/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'bg-gradient-to-tr from-pink-500 to-violet-500 border-transparent text-white shadow-md' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                            }`}>
                              {isSelected && <span className="text-xs font-black">✓</span>}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 dark:text-white">{addon.name}</p>
                              {addon.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{addon.description}</p>
                              )}
                              <span className="text-[10px] text-slate-400 font-bold">⏱️ +{addon.duration} min</span>
                            </div>
                          </div>

                          <div className="text-right">
                            {discount > 0 ? (
                              <div>
                                <span className="text-[10px] text-slate-400 line-through mr-1 font-mono">R$ {addon.price.toFixed(2)}</span>
                                <span className="text-sm font-black text-emerald-500 font-mono">R$ {finalPrice.toFixed(2)}</span>
                                <span className="block text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">-{discount}% OFF</span>
                              </div>
                            ) : (
                              <span className="text-sm font-black text-pink-600 dark:text-pink-400 font-mono">+R$ {finalPrice.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {submitError && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-sm font-semibold mb-4">
                  {submitError}
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 px-1">Seu Nome</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Digite seu nome"
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 font-semibold focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 px-1">Seu WhatsApp</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 font-semibold focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 px-1">Cupom de Desconto (opcional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="Código do cupom"
                      className="flex-grow px-4 py-3 bg-slate-50 dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 font-semibold focus:outline-none focus:border-pink-500 transition-colors uppercase text-sm"
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
                  
                  {activeCoupons.length > 0 && !appliedCoupon && (
                    <div className="mt-3 animate-fade-in">
                      <p className="text-[11px] font-black text-slate-650 dark:text-slate-350 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span>💡</span> Cupons Disponíveis (Clique para aplicar)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {activeCoupons.map((coupon) => (
                          <button
                            key={coupon.code}
                            type="button"
                            onClick={async () => {
                              setCouponCode(coupon.code);
                              setCouponError('');
                              setCouponValidating(true);
                              try {
                                const result = await api.validateCoupon(token!, coupon.code);
                                setAppliedCoupon(result);
                              } catch (err: any) {
                                setCouponError(err.message || 'Erro ao aplicar cupom.');
                              } finally {
                                setCouponValidating(false);
                              }
                            }}
                            className="bg-slate-100 dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 hover:border-pink-500 rounded-xl px-3 py-2 text-left flex items-center justify-between gap-3 text-xs transition-all hover:scale-[1.02] cursor-pointer shadow-sm group"
                          >
                            <span className="font-mono font-black text-pink-600 dark:text-pink-400 group-hover:text-pink-500 dark:group-hover:text-pink-350">
                              {coupon.code}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300 font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-[10px]">
                              {coupon.discountType === 'percentage'
                                ? `-${coupon.discountValue}%`
                                : `-R$ ${coupon.discountValue.toFixed(2)}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Summary Breakdown */}
              <div className="bg-slate-50 dark:bg-[#1A2235] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 space-y-2.5 text-left shadow-sm">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-350">
                  <span>Preço do Serviço Principal</span>
                  <span className="text-slate-800 dark:text-slate-200">R$ {servicePrice.toFixed(2)}</span>
                </div>
                {selectedAddonsTotal > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-pink-500">
                    <span>Adicionais ({selectedAddonIds.length})</span>
                    <span>+R$ {selectedAddonsTotal.toFixed(2)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <span>Cupom ({appliedCoupon.code})</span>
                    <span>-{appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `R$ ${appliedCoupon.discountValue.toFixed(2)}`}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">Total a pagar no local</span>
                  <span className="text-lg font-black text-pink-600 dark:text-pink-500">
                    R$ {(() => {
                      if (!appliedCoupon) return totalServicePrice;
                      if (appliedCoupon.discountType === 'percentage') {
                        return Math.max(0, totalServicePrice - (totalServicePrice * (appliedCoupon.discountValue / 100)));
                      } else {
                        return Math.max(0, totalServicePrice - appliedCoupon.discountValue);
                      }
                    })().toFixed(2)}
                  </span>
                </div>
              </div>

              {bookingFeeEnabled && bookingFeeAmount > 0 && !activeMembership && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-550/30 rounded-2xl p-4 mb-6 text-center space-y-3">
                  <p className="text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest">💳 Forma de Pagamento</p>
                  <p className="text-slate-600 dark:text-slate-350 text-xs font-semibold">O profissional solicita um sinal para garantir seu horário. Escolha como deseja pagar:</p>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setPayFullPrice(false)}
                      className={`py-4 px-3 rounded-2xl border-2 transition-all text-left ${
                        !payFullPrice
                          ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2235] hover:border-slate-350 dark:hover:border-slate-600'
                      }`}
                    >
                      <p className={`text-xs font-black uppercase tracking-wider mb-1 ${!payFullPrice ? 'text-amber-600 dark:text-amber-450' : 'text-slate-400 dark:text-slate-500'}`}>
                        Só o Sinal
                      </p>
                      <p className={`text-lg font-black ${!payFullPrice ? 'text-slate-900 dark:text-white' : 'text-slate-650 dark:text-slate-400'}`}>
                        R$ {bookingFeeAmount.toFixed(2)}
                      </p>
                      <p className={`text-[10px] font-semibold mt-1 ${!payFullPrice ? 'text-amber-800 dark:text-amber-300/80' : 'text-slate-500 dark:text-slate-450'}`}>Paga o restante no dia</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPayFullPrice(true)}
                      className={`py-4 px-3 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${
                        payFullPrice
                          ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/10'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2235] hover:border-slate-350 dark:hover:border-slate-600'
                      }`}
                    >
                      {!payFullPrice && (
                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Sem preocupação
                        </span>
                      )}
                      <p className={`text-xs font-black uppercase tracking-wider mb-1 ${payFullPrice ? 'text-emerald-600 dark:text-emerald-450' : 'text-slate-400 dark:text-slate-500'}`}>
                        Valor Total
                      </p>
                      <p className={`text-lg font-black ${payFullPrice ? 'text-slate-900 dark:text-white' : 'text-slate-650 dark:text-slate-400'}`}>
                        R$ {servicePrice.toFixed(2)}
                      </p>
                      <p className={`text-[10px] font-semibold mt-1 ${payFullPrice ? 'text-emerald-800 dark:text-emerald-300/80' : 'text-slate-500 dark:text-slate-450'}`}>Nada a pagar no dia 🎉</p>
                    </button>
                  </div>
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
                className="w-full custom-gradient-bg text-white font-black py-5 text-xl rounded-2xl flex items-center justify-center gap-3 shadow-xl custom-accent-glow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
