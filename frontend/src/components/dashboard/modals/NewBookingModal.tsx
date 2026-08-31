import { X } from 'lucide-react'
import type { LinkData } from '../../../types/dashboard'

interface NewBookingModalProps {
  showNewBookingModal: boolean
  setShowNewBookingModal: (show: boolean) => void
  newBookingData: {
    linkId: string
    date: string
    time: string
    clientName: string
    clientPhone: string
  }
  setNewBookingData: (data: any) => void
  links: LinkData[]
  handleCreateManualBooking: (e: React.FormEvent) => void
}

export function NewBookingModal({
  showNewBookingModal,
  setShowNewBookingModal,
  newBookingData,
  setNewBookingData,
  links,
  handleCreateManualBooking,
}: NewBookingModalProps) {
  if (!showNewBookingModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#131826] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Bora Agendar Novo!</h3>
          <button onClick={() => setShowNewBookingModal(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleCreateManualBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Serviço / Link de Venda</label>
            <select
              value={newBookingData.linkId}
              onChange={e => setNewBookingData({...newBookingData, linkId: e.target.value})}
              className="input-simple font-bold"
              required
            >
              <option value="">Selecione...</option>
              {links.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Data</label>
              <input
                type="date"
                value={newBookingData.date}
                onChange={e => setNewBookingData({...newBookingData, date: e.target.value})}
                className="input-simple font-bold text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Horário (HH:MM)</label>
              <input
                type="time"
                value={newBookingData.time}
                onChange={e => setNewBookingData({...newBookingData, time: e.target.value})}
                className="input-simple font-bold text-xs"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Nome do Cliente</label>
            <input
              type="text"
              value={newBookingData.clientName}
              onChange={e => setNewBookingData({...newBookingData, clientName: e.target.value})}
              placeholder="Nome completo do cliente"
              className="input-simple font-bold text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Celular do Cliente</label>
            <input
              type="text"
              value={newBookingData.clientPhone}
              onChange={e => setNewBookingData({...newBookingData, clientPhone: e.target.value})}
              placeholder="Ex: (11) 99999-9999"
              className="input-simple font-bold text-sm"
              required
            />
          </div>

          <button type="submit" className="w-full py-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-lg transition-all shadow-xl shadow-pink-500/20 mt-4">
            Agendar Horário
          </button>
        </form>
      </div>
    </div>
  )
}
