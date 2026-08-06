import { RotateCcw, Trash2 } from 'lucide-react'
import { formatDate } from '../../../utils/dashboardHelpers'

interface TrashTabProps {
  deletedLinks: any[]
  handleRestoreLink: (id: number) => void
  handlePermanentDeleteLink: (id: number) => void
}

export function TrashTab({
  deletedLinks,
  handleRestoreLink,
  handlePermanentDeleteLink,
}: TrashTabProps) {
  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Lixeira</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Links de venda excluídos recentemente</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deletedLinks.map(link => (
          <div key={link.id} className="card-simple p-6 opacity-80 hover:opacity-100 transition-all border-dashed">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-400 line-through">{link.title}</h3>
                <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mt-1">Excluído em {formatDate(link.deletedAt?.split('T')[0])}</p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => handleRestoreLink(link.id)}
                className="flex-1 py-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> RESTAURAR
              </button>
              <button 
                onClick={() => handlePermanentDeleteLink(link.id)}
                className="flex-1 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> EXCLUIR PERMANENTEMENTE
              </button>
            </div>
          </div>
        ))}
        
        {deletedLinks.length === 0 && (
          <div className="col-span-full card-simple py-20 text-center border-dashed border-2">
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Sua lixeira está vazia</p>
          </div>
        )}
      </div>
    </div>
  )
}
