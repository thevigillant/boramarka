import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed top-6 right-6 left-6 sm:left-auto sm:w-96 z-[9999] animate-slide-up transition-all ${
      type === 'success' 
        ? 'bg-emerald-600/95 dark:bg-emerald-700/95 text-white shadow-emerald-500/25 border-emerald-400/30' 
        : 'bg-rose-600/95 dark:bg-rose-700/95 text-white shadow-rose-500/25 border-rose-400/30'
    } backdrop-blur-xl px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3.5 text-sm border`}>
      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
        {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-snug">{message}</p>
      </div>
      <button 
        type="button" 
        onClick={onClose} 
        className="p-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0 cursor-pointer"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4 text-white/80 hover:text-white" />
      </button>
    </div>
  )
}

