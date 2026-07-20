import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'gradient' | 'monochrome'
  showText?: boolean
  showSlogan?: boolean
  className?: string
}

export const BoraMarkaLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'gradient',
  showText = true,
  showSlogan = false,
  className = ''
}) => {
  const dimensions = {
    sm: { box: 'w-7 h-7', text: 'text-sm', icon: 'w-6 h-6', sub: 'text-[7.5px]' },
    md: { box: 'w-9 h-9', text: 'text-base', icon: 'w-8 h-8', sub: 'text-[9px]' },
    lg: { box: 'w-12 h-12', text: 'text-xl', icon: 'w-10 h-10', sub: 'text-[10.5px]' },
    xl: { box: 'w-16 h-16', text: 'text-3xl', icon: 'w-14 h-14', sub: 'text-xs' }
  }

  const dim = dimensions[size]

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* 🤙 Shaka + Checkmark Icon */}
      <div className={`relative ${dim.box} flex items-center justify-center shrink-0 group`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${dim.icon} transition-transform duration-300 group-hover:scale-105 drop-shadow-md`}
        >
          <defs>
            <linearGradient id="bmShakaMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
            <linearGradient id="bmCheckAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>

          {/* Extended Pinky (Right) */}
          <path
            d="M38 28 C 42 22, 50 12, 54 12 C 57 12, 58 15, 54 21 C 49 28, 43 36, 42 40"
            stroke={variant === 'gradient' ? "url(#bmShakaMain)" : "currentColor"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3 Folded Middle Fingers */}
          <path
            d="M31 24 C 31 19, 36 19, 36 24 C 36 28, 31 28, 31 24 Z"
            stroke={variant === 'gradient' ? "url(#bmShakaMain)" : "currentColor"}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25 26 C 25 21, 30 21, 30 26 C 30 30, 25 30, 25 26 Z"
            stroke={variant === 'gradient' ? "url(#bmShakaMain)" : "currentColor"}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 28 C 19 23, 24 23, 24 28 C 24 32, 19 32, 19 28 Z"
            stroke={variant === 'gradient' ? "url(#bmShakaMain)" : "currentColor"}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Extended Thumb (Left) */}
          <path
            d="M20 32 C 16 28, 11 20, 8 20 C 5 20, 4 23, 7 28 C 11 34, 17 40, 20 44"
            stroke={variant === 'gradient' ? "url(#bmShakaMain)" : "currentColor"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Wrist Base Curve */}
          <path
            d="M17 42 C 22 52, 42 52, 45 38"
            stroke={variant === 'gradient' ? "url(#bmShakaMain)" : "currentColor"}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Bold Checkmark in Palm Center */}
          <path
            d="M24 38 L30 44 L44 26"
            stroke={variant === 'gradient' ? "url(#bmCheckAccent)" : "currentColor"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ✒️ Typography & Subtitle */}
      {showText && (
        <div className="flex flex-col justify-center text-left">
          <div className={`font-black tracking-tight leading-none text-slate-900 dark:text-white ${dim.text}`}>
            Bora<span className="bg-gradient-to-r from-violet-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">Marka</span>
          </div>
          {showSlogan && (
            <span className={`${dim.sub} font-extrabold text-slate-400 dark:text-white/40 uppercase tracking-widest mt-1`}>
              SISTEMA DE AGENDAMENTO
            </span>
          )}
        </div>
      )}
    </div>
  )
}
