import React, { useState } from 'react'
import { Check, Clock, Phone, Trash2, RefreshCw, Pencil, CheckCircle2 } from 'lucide-react'

export interface BookingData {
  id: number
  clientName: string
  clientPhone: string
  status: string
  notes?: string
  paidAmount?: number
  createdAt: string
  timeSlot: {
    date: string
    time: string
    link: {
      title: string
      token: string
      service: {
        id: number
        name: string
        price: number
        duration: number
      } | null
    }
  }
}

interface BookingCardProps {
  booking: BookingData
  onToggleDone: (booking: BookingData) => void
  onConfirm: (id: number) => void
  onCancel: (id: number) => void
  onSaveNotes: (id: number, notes: string) => void
  onReschedule?: (booking: BookingData) => void
  onOpenClientHistory?: (name: string, phone: string) => void
  formatDate: (dateStr: string) => string
  formatCurrency: (value: number) => string
}

export function BookingCard({
  booking,
  onToggleDone,
  onConfirm,
  onCancel,
  onSaveNotes,
  onReschedule,
  onOpenClientHistory,
  formatDate,
  formatCurrency
}: BookingCardProps) {
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteInput, setNoteInput] = useState(booking.notes || '')

  const handleSave = () => {
    onSaveNotes(booking.id, noteInput)
    setIsEditingNote(false)
  }

  const isDone = booking.status === 'CONCLUIDO'

  return (
    <div
      className={`card-simple p-5 flex flex-col justify-between gap-3.5 transition-all group ${
        isDone
          ? 'border-emerald-500/40 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.04]'
          : 'hover:border-pink-200 dark:hover:border-pink-500/50'
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3.5 items-center flex-1">
          {/* 1-Click Checkbox Button (Dar Check) */}
          <button
            onClick={() => onToggleDone(booking)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all shrink-0 cursor-pointer border ${
              isDone
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25 scale-105'
                : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-400 hover:border-emerald-500 hover:text-emerald-500'
            }`}
            title={isDone ? 'Concluído (Clique para desmarcar)' : 'Marcar como concluído (Dar Check)'}
          >
            <Check className="w-5 h-5 stroke-[3]" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                onClick={() => onOpenClientHistory?.(booking.clientName, booking.clientPhone)}
                className={`font-black text-lg leading-none transition-colors cursor-pointer hover:text-pink-500 flex items-center gap-1.5 ${
                  isDone ? 'line-through text-slate-400 dark:text-slate-400 opacity-80' : 'text-slate-900 dark:text-white'
                }`}
                title="Clique para ver Ficha Rápida & Histórico do Cliente"
              >
                <span>{booking.clientName}</span>
                <span className="text-[10px] font-bold bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-full border border-pink-500/20 opacity-80 group-hover:opacity-100 transition-opacity">Ficha</span>
              </h4>
              {isDone ? (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  ✓ Concluído
                </span>
              ) : booking.status === 'PENDENTE' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Pendente
                </span>
              ) : booking.status === 'AGUARDANDO_PAGAMENTO' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  ⏳ Aguardando Pgto
                </span>
              ) : booking.status === 'PAGO' && (booking.paidAmount || 0) > 0 ? (
                (booking.paidAmount || 0) >= (booking.timeSlot.link?.service?.price || Infinity) ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    💰 Pago Total
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    💳 Sinal Pago
                  </span>
                )
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Confirmado
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-pink-500 mt-1">
              {booking.timeSlot.link?.service?.name || booking.timeSlot.link?.title}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-bold">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(booking.timeSlot.date)} às {booking.timeSlot.time}
              </span>
              {booking.timeSlot.link?.service && (
                <span className="flex items-center gap-1 font-bold">
                  • {formatCurrency(booking.timeSlot.link.service.price)}
                </span>
              )}
              <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                📞 {booking.clientPhone}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
          {onReschedule && (
            <button
              onClick={() => onReschedule(booking)}
              className="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-pink-500/20 cursor-pointer"
              title="Reagendar data e horário deste cliente"
            >
              <Clock className="w-3.5 h-3.5 text-pink-500" />
              <span>Reagendar</span>
            </button>
          )}

          {booking.status === 'PENDENTE' && (
            <button
              onClick={() => onConfirm(booking.id)}
              className="p-2.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all cursor-pointer"
              title="Confirmar Agendamento"
            >
              <Check className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              const token = booking.timeSlot.link?.token
              if (!token) return
              const cancelLink = `${window.location.origin}/agendar/${token}/cancelar/${booking.id}`
              const msg = `Olá, ${booking.clientName}! ✨\n\nCaso precise cancelar ou remarcar o seu agendamento de *${
                booking.timeSlot.link?.service?.name || 'Serviço'
              }*:\n\n📅 Data: *${formatDate(booking.timeSlot.date)}*\n⏰ Hora: *${
                booking.timeSlot.time
              }*\n\nAcesse o link do seu portal de atendimento para remarcar ou cancelar:\n🔗 ${cancelLink}\n\nQualquer dúvida, estamos à disposição!`
              const cleanPhone = booking.clientPhone.replace(/\D/g, '')
              const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
              window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank')
            }}
            className="px-3 py-1.5 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-[#8b5cf6]/20 cursor-pointer"
            title="Enviar link de cancelamento/remarcação para o cliente"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cancelamento</span>
          </button>
          <a
            href={`https://wa.me/${booking.clientPhone}`}
            target="_blank"
            rel="noreferrer"
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Chamar no WhatsApp"
          >
            <Phone className="w-5 h-5" />
          </a>
          <button
            onClick={() => onCancel(booking.id)}
            className="p-2.5 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-xl transition-all cursor-pointer"
            title="Cancelar Agendamento"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Inline Note Bar (Escrever no Agendamento) */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between gap-2">
        {isEditingNote ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') setIsEditingNote(false)
              }}
              placeholder="Escreva uma anotação neste agendamento (ex: preferência de horário, observações)..."
              className="flex-1 input-simple text-xs py-1.5 px-3 bg-white dark:bg-white/[0.05] font-medium"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 cursor-pointer"
            >
              Salvar
            </button>
            <button
              onClick={() => setIsEditingNote(false)}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white font-medium cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 dark:text-white/40 font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <Pencil className="w-3 h-3 text-violet-400" /> Nota:
              </span>
              {booking.notes ? (
                <span className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.05] px-2.5 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/10 text-xs">
                  {booking.notes}
                </span>
              ) : (
                <span className="text-slate-400 dark:text-white/25 italic text-[11px]">
                  Nenhuma anotação
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setNoteInput(booking.notes || '')
                setIsEditingNote(true)
              }}
              className="text-xs font-bold text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              {booking.notes ? 'Editar nota' : '+ Add nota'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
