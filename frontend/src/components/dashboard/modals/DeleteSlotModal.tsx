import { X } from 'lucide-react'

interface DeleteSlotModalProps {
  showDeleteSlotModal: boolean
  setShowDeleteSlotModal: (show: boolean) => void
  slotToDeleteTime: string
  deleteAllDayFreeSlots: boolean
  setDeleteAllDayFreeSlots: (val: boolean) => void
  confirmDeleteSlot: () => void
}

export function DeleteSlotModal({
  showDeleteSlotModal,
  setShowDeleteSlotModal,
  slotToDeleteTime,
  deleteAllDayFreeSlots,
  setDeleteAllDayFreeSlots,
  confirmDeleteSlot,
}: DeleteSlotModalProps) {
  if (!showDeleteSlotModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#131826] w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Excluir Horário</h3>
          <button onClick={() => setShowDeleteSlotModal(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-semibold text-left">
            Tem certeza que deseja excluir o horário das <span className="text-pink-500 font-bold">{slotToDeleteTime}</span>?
          </p>

          <label className="flex items-center gap-3 p-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/50 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer text-left">
            <input
              type="checkbox"
              checked={deleteAllDayFreeSlots}
              onChange={e => setDeleteAllDayFreeSlots(e.target.checked)}
              className="w-4 h-4 text-pink-500 rounded border-slate-300 focus:ring-pink-500 cursor-pointer"
            />
            <div className="flex-1">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block uppercase tracking-wider">Limpar o dia todo</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Excluir TODOS os horários livres desta data</span>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={confirmDeleteSlot}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all shadow-md shadow-red-500/10 text-sm"
            >
              Excluir
            </button>
            <button
              onClick={() => setShowDeleteSlotModal(false)}
              className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-xl transition-all text-sm"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
