import React from 'react'
import { X, Loader2, Pencil, Trash2, Calendar } from 'lucide-react'
import { maskPhone } from '../../../utils/dashboardHelpers'

interface ClientDetailsModalProps {
  selectedClientPhone: string | null
  selectedClientName: string
  onClose: () => void
  loadingClientDetails: boolean
  newNoteContent: string
  setNewNoteContent: (val: string) => void
  handleCreateClientNote: (e: React.FormEvent) => void
  clientNotes: Array<{ id: number; content: string; createdAt: string }>
  handleDeleteClientNote: (id: number) => void
  clientHistory: Array<{
    id: number
    status: string
    timeSlot: {
      date: string
      time: string
      link: {
        service?: {
          name: string
        }
      }
    }
  }>
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  selectedClientPhone,
  selectedClientName,
  onClose,
  loadingClientDetails,
  newNoteContent,
  setNewNoteContent,
  handleCreateClientNote,
  clientNotes,
  handleDeleteClientNote,
  clientHistory
}) => {
  if (!selectedClientPhone) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="bg-white dark:bg-[#131826] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[85vh] text-left border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-slate-150 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-[#1A2235]/30">
          <div>
            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest block">Ficha do Cliente</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{selectedClientName}</h3>
            <span className="text-xs font-bold text-slate-400 font-mono block mt-0.5">{maskPhone(selectedClientPhone)}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {loadingClientDetails ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              <p className="text-xs font-bold text-slate-400">Carregando histórico do cliente...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

              {/* Left Column: Notes Form & Notes List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Anotações & Prontuário
                </h4>

                <form onSubmit={handleCreateClientNote} className="space-y-2">
                  <textarea
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                    placeholder="Adicione notas de prontuário (ex: Alergias, preferências de corte, fórmulas químicas)..."
                    className="w-full input-simple text-xs font-bold h-20 bg-slate-50 dark:bg-[#0f131f] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"
                    required
                  />
                  <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-black text-[10px] rounded-xl uppercase tracking-wider transition-all">
                      Salvar Nota
                    </button>
                  </div>
                </form>

                <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                  {clientNotes.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold italic text-center py-4 bg-slate-50/50 dark:bg-[#0f131f]/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      Nenhuma anotação registrada ainda.
                    </p>
                  ) : (
                    clientNotes.map(note => (
                      <div key={note.id} className="p-3 bg-slate-50 dark:bg-[#0f131f]/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex justify-between gap-3 items-start">
                        <div className="space-y-1 text-left">
                          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium whitespace-pre-line leading-relaxed">{note.content}</p>
                          <span className="text-[9px] text-slate-400 font-semibold block">
                            Criado em {new Date(note.createdAt).toLocaleDateString('pt-BR')} às {new Date(note.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteClientNote(note.id)}
                          className="p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors shrink-0"
                          title="Excluir Nota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Appointment History */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Histórico de Agendamentos ({clientHistory.length})
                </h4>

                <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                  {clientHistory.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold italic text-center py-4 bg-slate-50/50 dark:bg-[#0f131f]/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      Nenhum atendimento no histórico.
                    </p>
                  ) : (
                    clientHistory.map(h => {
                      const dateFormatted = h.timeSlot.date.split('-').reverse().join('/')
                      return (
                        <div key={h.id} className="p-3 bg-slate-50/55 dark:bg-[#0f131f]/30 rounded-2xl border border-slate-150 dark:border-slate-800/80 flex items-center justify-between">
                          <div className="text-left">
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white">{h.timeSlot.link.service?.name || 'Serviço'}</h5>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{dateFormatted} às {h.timeSlot.time}</p>
                          </div>

                          <div className="text-right">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              h.status === 'CONFIRMADO' || h.status === 'PAGO'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : h.status === 'PENDENTE'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {h.status}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
