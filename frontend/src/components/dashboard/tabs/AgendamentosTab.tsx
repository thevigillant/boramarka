import { Search, Download, FileText, Plus } from 'lucide-react'
import { BookingCard } from '../../BookingCard'
import { BookingData } from '../../../types/dashboard'
import { formatDate, formatCurrency } from '../../../utils/dashboardHelpers'

interface AgendamentosTabProps {
  searchBookingQuery: string
  setSearchBookingQuery: (val: string) => void
  exportBookingsToCSV: (bookings: BookingData[]) => boolean
  filteredBookings: BookingData[]
  showToast: (msg: string, type?: 'success' | 'error') => void
  openPdfExportModal: (type: 'finance' | 'bookings') => void
  bookings: BookingData[]
  setShowNewBookingModal: (open: boolean) => void
  handleToggleBookingDone: (booking: BookingData) => void
  handleConfirmBooking: (id: number) => void
  handleCancelBooking: (id: number) => void
  handleSaveBookingNotes: (id: number, notes: string) => void
}

export function AgendamentosTab({
  searchBookingQuery,
  setSearchBookingQuery,
  exportBookingsToCSV,
  filteredBookings,
  showToast,
  openPdfExportModal,
  bookings,
  setShowNewBookingModal,
  handleToggleBookingDone,
  handleConfirmBooking,
  handleCancelBooking,
  handleSaveBookingNotes,
}: AgendamentosTabProps) {
  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Gerenciar Seus Agendamentos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fácil de editar, filtrar e gerenciar as datas.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchBookingQuery}
              onChange={e => setSearchBookingQuery(e.target.value)}
              className="input-simple pl-10 py-2 text-sm max-w-full sm:max-w-[200px]"
            />
          </div>
          <button
            onClick={() => {
              const ok = exportBookingsToCSV(filteredBookings)
              if (!ok) showToast('Nenhum agendamento para exportar.', 'error')
              else showToast('Agendamentos exportados para Excel (CSV)!', 'success')
            }}
            disabled={filteredBookings.length === 0}
            className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold text-xs rounded-xl transition-all border border-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
            title="Exportar agendamentos em planilha Excel (CSV)"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Exportar Excel (CSV)</span>
          </button>
          <button
            onClick={() => openPdfExportModal('bookings')}
            disabled={bookings.length === 0}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-xs rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
            title="Exportar Relatório PDF de Agendamentos"
          >
            <FileText className="w-4 h-4 text-pink-500" />
            <span>Exportar PDF</span>
          </button>
          <button
            onClick={() => setShowNewBookingModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black py-2.5 px-6 rounded-xl transition-all shadow-md shadow-pink-500/20 whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4" />
            Bora Agendar Novo!
          </button>
        </div>
      </div>
      <div className="grid gap-4">
        {filteredBookings.map(booking => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onToggleDone={handleToggleBookingDone}
            onConfirm={handleConfirmBooking}
            onCancel={handleCancelBooking}
            onSaveNotes={handleSaveBookingNotes}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
        ))}
        {filteredBookings.length === 0 && (
          <div className="text-center py-20 italic text-slate-400 dark:text-slate-600">
            Nenhum agendamento encontrado
          </div>
        )}
      </div>
    </div>
  )
}
