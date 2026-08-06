import { Plus, Trash2, Clock, Briefcase } from 'lucide-react'
import { CalendarWidget } from '../CalendarWidget'
import { formatDate, getWeekday } from '../../../utils/dashboardHelpers'
import { api } from '../../../services/api'

interface HorariosTabProps {
  slotDate: string
  setSlotDate: (date: string) => void
  calendarMonth: Date
  setCalendarMonth: (date: Date) => void
  isGoogleConnected: boolean
  googleEmail: string
  setIsGoogleConnected: (val: boolean) => void
  setGoogleEmail: (email: string) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  selectedLinkId: number | null
  setSelectedLinkId: (id: number | null) => void
  links: any[]
  services: any[]
  slotInterval: number
  setSlotInterval: (interval: number) => void
  isSingleSlot: boolean
  setIsSingleSlot: (val: boolean) => void
  slotStartTime: string
  setSlotStartTime: (val: string) => void
  slotEndTime: string
  setSlotEndTime: (val: string) => void
  handleCreateSlots: () => void
  slotsByDate: Record<string, any[]>
  handleDeleteSlot: (id: number, time: string) => void
}

export function HorariosTab({
  slotDate,
  setSlotDate,
  calendarMonth,
  setCalendarMonth,
  isGoogleConnected,
  googleEmail,
  setIsGoogleConnected,
  setGoogleEmail,
  showToast,
  selectedLinkId,
  setSelectedLinkId,
  links,
  services,
  slotInterval,
  setSlotInterval,
  isSingleSlot,
  setIsSingleSlot,
  slotStartTime,
  setSlotStartTime,
  slotEndTime,
  setSlotEndTime,
  handleCreateSlots,
  slotsByDate,
  handleDeleteSlot,
}: HorariosTabProps) {
  return (
    <div className="animate-slide-up">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
        
        {/* Left Column: Calendar & Service Selector */}
        <div className="space-y-6">
          {/* Calendar Card */}
          <div className="card-simple p-6 bg-slate-50 dark:bg-[#0B0F19] border-slate-200 dark:border-[#1E293B]">
            <CalendarWidget 
              selectedDate={slotDate} 
              onSelectDate={setSlotDate} 
              currentMonth={calendarMonth} 
              setCurrentMonth={setCalendarMonth} 
            />
          </div>
          
          {/* Google Calendar Card */}
          <div className="card-simple p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xl"></span>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Google Agenda</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Sincronize seus agendamentos</p>
              </div>
            </div>
            
            {isGoogleConnected ? (
              <div className="space-y-3 text-left">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-emerald-500 text-[10px] font-black uppercase tracking-wider flex items-center justify-between">
                  <span>Sincronizado</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">Conectado a: <strong>{googleEmail}</strong></p>
                <button 
                  onClick={async () => {
                    try {
                      await api.disconnectGoogleCalendar();
                      setIsGoogleConnected(false);
                      setGoogleEmail('');
                      showToast('Integração com Google Agenda removida com sucesso!');
                    } catch (err: any) {
                      showToast(err.message, 'error');
                    }
                  }}
                  className="w-full text-center py-2 text-[10px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-dashed border-red-500/30 rounded-xl transition-all uppercase tracking-wider"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                  window.location.href = `http://localhost:3001/api/admin/google-calendar/connect?token=${token}`;
                }}
                className="w-full py-2.5 bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-800 hover:border-pink-500 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.567 0-6.46-2.893-6.46-6.46s2.893-6.46 6.46-6.46c1.626 0 3.102.602 4.232 1.6l3.057-3.057C19.347 2.308 15.993 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c5.77 0 10.58-4.14 10.97-9.715H12.24z"/>
                </svg>
                Sincronizar Google Agenda
              </button>
            )}
          </div>
          
          {/* Service Selector Card */}
          <div className="card-simple p-6">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">Configurar agenda para:</label>
            <select
              value={selectedLinkId || ''}
              onChange={e => {
                const val = e.target.value ? parseInt(e.target.value) : null
                setSelectedLinkId(val)
                if (val) {
                  const matchedLink = links.find(l => l.id === val)
                  const matchedService = services.find(s => s.id === (matchedLink?.service as any)?.id)
                  const duration = (matchedLink?.service as any)?.duration || matchedService?.duration
                  if (duration) {
                    setSlotInterval(duration)
                  }
                }
              }}
              className="input-simple font-bold w-full bg-slate-50 dark:bg-[#131826]"
            >
              <option value="">Selecione o Serviço...</option>
              {links.map(l => {
                const matchedService = services.find(s => s.id === (l.service as any)?.id)
                const duration = (l.service as any)?.duration || matchedService?.duration
                return (
                  <option key={l.id} value={l.id}>
                    {l.title} {duration ? `(${duration} min)` : ''}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Right Column: Add Slots & Grid */}
        <div className="space-y-6">
          {/* Add Slots Card */}
          <div className="card-simple p-6 border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19]">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="font-bold text-sm flex items-center gap-2 text-pink-500 uppercase tracking-widest"><Plus className="w-5 h-5" /> Abrir Novos Horários</h3>
              <label className="flex items-center gap-2 ml-auto cursor-pointer border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131826] px-3 py-1.5 rounded-lg shadow-sm hover:border-pink-300 dark:hover:border-pink-500/50 transition-colors">
                <input type="checkbox" checked={isSingleSlot} onChange={e => setIsSingleSlot(e.target.checked)} className="w-4 h-4 text-pink-500 rounded border-slate-300 focus:ring-pink-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Horário Único</span>
              </label>
            </div>
            <div className={`grid gap-4 mb-6 ${isSingleSlot ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
              <div><label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Dia</label><input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} className="input-simple text-sm bg-white dark:bg-[#131826]" /></div>
              {!isSingleSlot && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
                    Intervalo
                  </label>
                  <select value={slotInterval} onChange={e => setSlotInterval(parseInt(e.target.value))} className="input-simple text-sm bg-white dark:bg-[#131826]">
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={30}>30 min</option>
                    <option value={40}>40 min</option>
                    <option value={45}>45 min</option>
                    <option value={50}>50 min</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1h 30m</option>
                    <option value={120}>2 horas</option>
                    {![15, 20, 30, 40, 45, 50, 60, 90, 120].includes(slotInterval) && (
                      <option value={slotInterval}>{slotInterval} min</option>
                    )}
                  </select>
                </div>
              )}
              <div><label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">{isSingleSlot ? 'Horário' : 'Início'}</label><input type="time" value={slotStartTime} onChange={e => setSlotStartTime(e.target.value)} className="input-simple text-sm bg-white dark:bg-[#131826]" /></div>
              {!isSingleSlot && <div><label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Fim</label><input type="time" value={slotEndTime} onChange={e => setSlotEndTime(e.target.value)} className="input-simple text-sm bg-white dark:bg-[#131826]" /></div>}
            </div>
            <button onClick={handleCreateSlots} disabled={!slotDate || !selectedLinkId} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">GERAR HORÁRIOS NA AGENDA</button>
          </div>

          {/* Slots Grid Card */}
          <div className="card-simple p-6 min-h-[300px]">
            {slotDate && selectedLinkId ? (
              <>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">{getWeekday(slotDate)} — {formatDate(slotDate)}</h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Grade de Vagas</span>
                </div>
                {slotsByDate[slotDate] && slotsByDate[slotDate].length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {slotsByDate[slotDate].map(slot => (
                      <div key={slot.id} className={`relative group p-4 text-center rounded-2xl border transition-all flex flex-col justify-center min-h-[80px] ${slot.isAvailable ? 'bg-transparent border-slate-200 dark:border-slate-700 hover:border-pink-500/50' : 'bg-gradient-to-r from-orange-500 to-pink-500 border-transparent text-white shadow-md shadow-orange-500/20'}`}>
                        {slot.isAvailable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSlot(slot.id, slot.time);
                            }}
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Excluir Horário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <p className={`font-black text-lg leading-tight ${slot.isAvailable ? 'text-slate-900 dark:text-white' : 'text-white'}`}>{slot.time}</p>
                        <p className={`text-[10px] font-bold truncate mt-1 uppercase tracking-wider ${slot.isAvailable ? 'text-slate-400 dark:text-slate-500' : 'text-white/90'}`}>{slot.booking ? slot.booking.clientName : (slot.isAvailable ? 'Livre' : 'Ocupado')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    Nenhum horário gerado para esta data.
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-10">
                {selectedLinkId ? (
                  <>
                    <Clock className="w-12 h-12 mb-4 opacity-50" />
                    <p className="font-bold">Selecione um dia no calendário</p>
                    <p className="text-xs mt-1">Para visualizar a grade de horários da data.</p>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-12 h-12 mb-4 opacity-50" />
                    <p className="font-bold">Selecione um serviço na lateral</p>
                    <p className="text-xs mt-1">Para gerenciar os horários da sua agenda.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
