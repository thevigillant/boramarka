import { useEffect } from 'react'
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Fecha com ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel, onConfirm])

  if (!isOpen) return null

  const typeConfig = {
    danger: {
      icon: Trash2,
      badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      iconBg: 'bg-rose-500/20 text-rose-500',
      confirmBtn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
    },
    warning: {
      icon: AlertTriangle,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      iconBg: 'bg-amber-500/20 text-amber-400',
      confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
    },
    info: {
      icon: HelpCircle,
      badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      iconBg: 'bg-pink-500/20 text-pink-400',
      confirmBtn: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-pink-500/30',
    },
  }[type]

  const IconComponent = typeConfig.icon

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md bg-[#0E1424] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 text-white animate-scale-in space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 ${typeConfig.iconBg}`}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeConfig.badgeColor}`}
              >
                Confirmação do Sistema
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensagem descritiva com quebra de linhas */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-xs sm:text-sm text-slate-300 font-medium leading-relaxed whitespace-pre-line">
          {message}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer text-center"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all shadow-lg hover:opacity-95 active:scale-95 cursor-pointer text-center ${typeConfig.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
