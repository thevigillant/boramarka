import { useEffect } from 'react'
import { Check, AlertCircle } from 'lucide-react'

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed top-6 right-6 left-6 sm:left-auto sm:w-80 z-50 animate-slide-up ${
      type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90'
    } backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm border border-white/10`}>
      {type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="flex-1 font-semibold">{message}</span>
    </div>
  )
}
