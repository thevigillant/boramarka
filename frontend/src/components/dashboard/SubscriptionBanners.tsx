import { useState, useEffect } from 'react'

export function TrialBanner({ 
  trialEndsAt, 
  onCheckout,
  onLogout,
  onRestoreSuperAdmin
}: { 
  trialEndsAt: string; 
  onCheckout: (plan: 'mensal' | 'anual') => void;
  onLogout: () => void;
  onRestoreSuperAdmin?: (() => void) | null;
}) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime()
      const end = new Date(trialEndsAt).getTime()
      const diff = end - now

      if (diff <= 0) {
        setExpired(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [trialEndsAt])

  if (expired) return null

  const isUrgent = timeLeft.days <= 1

  return (
    <div className={`relative z-50 ${isUrgent ? 'bg-gradient-to-r from-red-600 to-pink-600' : 'bg-gradient-to-r from-orange-500 to-pink-500'} text-white shadow-md`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-bold">⏳ Período Grátis</span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="bg-white/20 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-lg text-center min-w-[28px] sm:min-w-[36px]">
              <span className="text-xs sm:text-sm font-black leading-none">{timeLeft.days}</span>
              <p className="text-[6px] sm:text-[7px] font-bold uppercase opacity-80">dias</p>
            </div>
            <span className="font-black text-xs sm:text-sm">:</span>
            <div className="bg-white/20 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-lg text-center min-w-[28px] sm:min-w-[36px]">
              <span className="text-xs sm:text-sm font-black leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
              <p className="text-[6px] sm:text-[7px] font-bold uppercase opacity-80">hrs</p>
            </div>
            <span className="font-black text-xs sm:text-sm">:</span>
            <div className="bg-white/20 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-lg text-center min-w-[28px] sm:min-w-[36px]">
              <span className="text-xs sm:text-sm font-black leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <p className="text-[6px] sm:text-[7px] font-bold uppercase opacity-80">min</p>
            </div>
            <span className="font-black text-xs sm:text-sm">:</span>
            <div className="bg-white/20 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-lg text-center min-w-[28px] sm:min-w-[36px]">
              <span className="text-xs sm:text-sm font-black leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <p className="text-[6px] sm:text-[7px] font-bold uppercase opacity-80">seg</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onCheckout('mensal')}
            className="bg-white text-pink-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black hover:bg-white/90 transition-all hover:scale-105 shadow-md cursor-pointer"
          >
            Assinar Agora
          </button>
          
          {onRestoreSuperAdmin && (
            <button
              onClick={onRestoreSuperAdmin}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center gap-1 border border-white/25"
            >
              SuperAdmin
            </button>
          )}

          <button
            onClick={onLogout}
            className="bg-black/30 hover:bg-black/55 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}

export function InactiveBanner({ 
  onSubscribe,
  onLogout,
  onRestoreSuperAdmin
}: { 
  onSubscribe: () => void;
  onLogout: () => void;
  onRestoreSuperAdmin?: (() => void) | null;
}) {
  return (
    <div className="relative z-50 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
            Assinatura Inativa
          </span>
          <span className="text-[11px] sm:text-xs opacity-90 hidden sm:inline">— Seu catálogo está visível, mas novas marcações e edições estão suspensas.</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onSubscribe}
            className="bg-white text-red-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black hover:bg-white/90 transition-all hover:scale-105 shadow-md cursor-pointer"
          >
            Assinar Agora
          </button>

          {onRestoreSuperAdmin && (
            <button
              onClick={onRestoreSuperAdmin}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 border border-white/25"
            >
              Voltar SuperAdmin
            </button>
          )}

          <button
            onClick={onLogout}
            className="bg-black/30 hover:bg-black/55 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
