import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, User, Check, X, Phone, CalendarDays, List } from 'lucide-react'
import { BookingData } from '../../../types/dashboard'
import { formatCurrency } from '../../../utils/dashboardHelpers'

interface CalendarioTabProps {
  bookings: BookingData[]
  setShowNewBookingModal: (open: boolean) => void
  handleToggleBookingDone: (booking: BookingData) => void
  handleConfirmBooking: (id: number) => void
  handleCancelBooking: (id: number) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAY_FULL  = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MONTH_NAMES   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function statusColor(status: string) {
  switch (status) {
    case 'CONFIRMADO': return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
    case 'PAGO':       return 'bg-blue-500/20 border-blue-500/50 text-blue-300'
    case 'CONCLUIDO': return 'bg-slate-500/20 border-slate-500/40 text-slate-400'
    case 'CANCELADO': return 'bg-red-500/15 border-red-500/40 text-red-400 opacity-60'
    default:           return 'bg-violet-500/15 border-violet-500/40 text-violet-300'
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', PAGO: 'Pago',
    CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado',
  }
  return map[status] || status
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toDateStr(date: Date) {
  return date.toISOString().slice(0, 10)
}

// Extrai data YYYY-MM-DD de um booking
function bookingDate(b: BookingData): string {
  return (b as any).date || (b as any).timeSlot?.date || ''
}

// Extrai hora HH:mm de um booking
function bookingTime(b: BookingData): string {
  return (b as any).time || (b as any).timeSlot?.time || ''
}

export function CalendarioTab({
  bookings,
  setShowNewBookingModal,
  handleToggleBookingDone,
  handleConfirmBooking,
  handleCancelBooking,
}: CalendarioTabProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  , [weekStart])

  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingData[]> = {}
    bookings.forEach(b => {
      const d = bookingDate(b)
      if (!d) return
      if (!map[d]) map[d] = []
      map[d].push(b)
    })
    // Sort by time inside each day
    Object.keys(map).forEach(d => {
      map[d].sort((a, b2) => bookingTime(a).localeCompare(bookingTime(b2)))
    })
    return map
  }, [bookings])

  const todayStr = toDateStr(new Date())

  const prevWeek = useCallback(() => setWeekStart(d => addDays(d, -7)), [])
  const nextWeek = useCallback(() => setWeekStart(d => addDays(d, 7)), [])
  const goToday  = useCallback(() => {
    setWeekStart(startOfWeek(new Date()))
    setSelectedDay(new Date())
  }, [])

  const weekLabel = useMemo(() => {
    const start = weekDays[0]
    const end   = weekDays[6]
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} – ${end.getDate()} de ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`
    }
    return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`
  }, [weekDays])

  // Day view bookings
  const dayBookings = useMemo(() =>
    (bookingsByDate[toDateStr(selectedDay)] || [])
  , [bookingsByDate, selectedDay])

  return (
    <div className="animate-slide-up space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Calendário de Agenda</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visualize todos os agendamentos da semana</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Semana
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <List className="w-3.5 h-3.5" /> Dia
            </button>
          </div>

          <button onClick={goToday} className="px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold text-xs rounded-xl border border-violet-500/20 transition-all">
            Hoje
          </button>

          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-700 dark:text-white min-w-[220px] text-center">{weekLabel}</span>
            <button onClick={nextWeek} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowNewBookingModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black py-2 px-4 rounded-xl transition-all shadow-md shadow-pink-500/20 text-xs"
          >
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>
      </div>

      {/* ── WEEK VIEW ── */}
      {viewMode === 'week' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/50">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700/60 min-w-[700px]">
            {weekDays.map((day, i) => {
              const dayStr = toDateStr(day)
              const isToday = dayStr === todayStr
              const cnt = (bookingsByDate[dayStr] || []).length
              return (
                <div
                  key={i}
                  onClick={() => { setSelectedDay(day); setViewMode('day') }}
                  className={`p-3 text-center cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${i < 6 ? 'border-r border-slate-200 dark:border-slate-700/60' : ''}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{WEEKDAY_SHORT[day.getDay()]}</p>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 ${isToday ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white' : 'text-slate-700 dark:text-white'}`}>
                    <span className="text-sm font-black">{day.getDate()}</span>
                  </div>
                  {cnt > 0 && (
                    <div className="mt-1.5 flex justify-center">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-500 dark:text-violet-400">{cnt}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Booking columns */}
          <div className="grid grid-cols-7 min-w-[700px] min-h-[400px]">
            {weekDays.map((day, i) => {
              const dayStr = toDateStr(day)
              const dayBookings = bookingsByDate[dayStr] || []
              const isToday = dayStr === todayStr
              return (
                <div
                  key={i}
                  className={`p-2 space-y-2 ${isToday ? 'bg-violet-500/[0.03] dark:bg-violet-500/[0.05]' : ''} ${i < 6 ? 'border-r border-slate-200 dark:border-slate-700/40' : ''}`}
                >
                  {dayBookings.length === 0 && (
                    <div className="h-24 flex items-center justify-center">
                      <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">livre</span>
                    </div>
                  )}
                  {dayBookings.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className={`w-full text-left p-2 rounded-xl border text-[10px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${statusColor(b.status)}`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span className="font-mono">{bookingTime(b)}</span>
                      </div>
                      <p className="font-bold text-[11px] truncate">{b.clientName}</p>
                      {b.status !== 'CANCELADO' && (
                        <p className="text-[9px] opacity-70 truncate">{statusLabel(b.status)}</p>
                      )}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── DAY VIEW ── */}
      {viewMode === 'day' && (
        <div className="space-y-3">
          {/* Day selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {weekDays.map((day, i) => {
              const dayStr = toDateStr(day)
              const isActive = toDateStr(selectedDay) === dayStr
              const isToday = dayStr === todayStr
              const cnt = (bookingsByDate[dayStr] || []).length
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center p-3 rounded-2xl min-w-[60px] transition-all border ${isActive ? 'bg-gradient-to-br from-orange-500/20 to-pink-500/20 border-pink-500/40 text-white' : isToday ? 'border-violet-500/30 bg-violet-500/10 text-violet-400' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  <span className="text-[10px] font-bold uppercase">{WEEKDAY_SHORT[day.getDay()]}</span>
                  <span className={`text-lg font-black mt-0.5 ${isActive ? 'text-white' : ''}`}>{day.getDate()}</span>
                  {cnt > 0 && <span className="text-[9px] font-black text-pink-400 mt-0.5">{cnt}</span>}
                </button>
              )
            })}
          </div>

          {/* Day bookings list */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">
              {WEEKDAY_FULL[selectedDay.getDay()]}, {selectedDay.getDate()} de {MONTH_NAMES[selectedDay.getMonth()]}
              {dayBookings.length > 0 && <span className="ml-2 text-xs font-medium text-slate-400">• {dayBookings.length} agendamento{dayBookings.length !== 1 ? 's' : ''}</span>}
            </h3>

            {dayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Nenhum agendamento neste dia</p>
                <button onClick={() => setShowNewBookingModal(true)} className="mt-4 flex items-center gap-1.5 text-xs text-violet-500 hover:text-violet-400 font-bold transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Adicionar agendamento
                </button>
              </div>
            ) : (
              dayBookings.map(b => (
                <div key={b.id} className={`p-4 rounded-2xl border flex items-start gap-4 ${statusColor(b.status)}`}>
                  <div className="flex flex-col items-center min-w-[48px]">
                    <span className="text-sm font-black font-mono">{bookingTime(b)}</span>
                    <Clock className="w-3.5 h-3.5 mt-1 opacity-60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{b.clientName}</p>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">{statusLabel(b.status)}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" /> {b.clientPhone}
                    </p>
                    {((b.paidAmount || b.timeSlot?.link?.service?.price || (b as any).totalAmount || 0) > 0) && (
                      <p className="text-xs font-bold text-emerald-500 mt-1">
                        {formatCurrency(b.paidAmount || b.timeSlot?.link?.service?.price || (b as any).totalAmount || 0)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {b.status === 'PENDENTE' && (
                      <button onClick={() => handleConfirmBooking(b.id)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-all" title="Confirmar">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {b.status !== 'CANCELADO' && b.status !== 'CONCLUIDO' && (
                      <button onClick={() => handleCancelBooking(b.id)} className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-all" title="Cancelar">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(b.status === 'CONFIRMADO' || b.status === 'PAGO') && (
                      <button onClick={() => handleToggleBookingDone(b)} className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all" title="Marcar como concluído">
                        <User className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Booking Detail Modal ── */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedBooking.clientName}</h3>
                <p className="text-xs text-slate-400">{bookingDate(selectedBooking)} às {bookingTime(selectedBooking)}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Telefone</span>
                <span className="font-bold dark:text-white">{selectedBooking.clientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${statusColor(selectedBooking.status)}`}>{statusLabel(selectedBooking.status)}</span>
              </div>
              {(selectedBooking.paidAmount || selectedBooking.timeSlot?.link?.service?.price || (selectedBooking as any).totalAmount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor</span>
                  <span className="font-black text-emerald-500">
                    {formatCurrency(selectedBooking.paidAmount || selectedBooking.timeSlot?.link?.service?.price || (selectedBooking as any).totalAmount || 0)}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {selectedBooking.status === 'PENDENTE' && (
                <button onClick={() => { handleConfirmBooking(selectedBooking.id); setSelectedBooking(null) }} className="py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Confirmar
                </button>
              )}
              {(selectedBooking.status === 'CONFIRMADO' || selectedBooking.status === 'PAGO') && (
                <button onClick={() => { handleToggleBookingDone(selectedBooking); setSelectedBooking(null) }} className="py-2.5 rounded-xl bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Concluir
                </button>
              )}
              {selectedBooking.status !== 'CANCELADO' && selectedBooking.status !== 'CONCLUIDO' && (
                <button onClick={() => { handleCancelBooking(selectedBooking.id); setSelectedBooking(null) }} className="py-2.5 rounded-xl bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/30 flex items-center justify-center gap-1.5">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
