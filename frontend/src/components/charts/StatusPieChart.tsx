import { useRef, useEffect } from 'react'

interface StatusPieChartProps {
  data: Record<string, number>
  size?: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  'CONFIRMADO': { label: 'Confirmado', color: '#10b981' },
  'PENDENTE': { label: 'Pendente', color: '#f59e0b' },
  'CANCELADO': { label: 'Cancelado', color: '#ef4444' },
  'CONCLUIDO': { label: 'Concluído', color: '#06b6d4' },
  'AGUARDANDO_PAGAMENTO': { label: 'Aguardando Pgto', color: '#8b5cf6' },
}

const FALLBACK_COLOR = '#64748b'

export default function StatusPieChart({ data, size = 140 }: StatusPieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const entries = Object.entries(data || {}).filter(([, count]) => count > 0)
  const total = entries.reduce((sum, [, count]) => sum + count, 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, size, size)

    if (entries.length === 0 || total === 0) {
      // Empty state ring
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2)
      ctx.arc(size / 2, size / 2, (size / 2 - 4) * 0.65, Math.PI * 2, 0, true)
      ctx.closePath()
      ctx.fillStyle = 'rgba(148, 163, 184, 0.1)'
      ctx.fill()

      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'
      ctx.font = '600 10px "Plus Jakarta Sans", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Sem dados', size / 2, size / 2)
      return
    }

    const cx = size / 2
    const cy = size / 2
    const outerR = size / 2 - 4
    const innerR = outerR * 0.65
    let startAngle = -Math.PI / 2

    entries.forEach(([status, count]) => {
      const sliceAngle = (count / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle
      const color = STATUS_CONFIG[status]?.color || FALLBACK_COLOR

      ctx.beginPath()
      ctx.arc(cx, cy, outerR, startAngle, endAngle)
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()

      // Gap between slices
      if (entries.length > 1) {
        ctx.beginPath()
        ctx.arc(cx, cy, outerR, endAngle - 0.02, endAngle + 0.02)
        ctx.arc(cx, cy, innerR, endAngle + 0.02, endAngle - 0.02, true)
        ctx.closePath()
        ctx.fillStyle = '#080a16'
        ctx.fill()
      }

      startAngle = endAngle
    })

    // Center text
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.font = '700 9px "Plus Jakarta Sans", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('STATUS', cx, cy - 8)
    ctx.fillStyle = '#fff'
    ctx.font = '900 16px "Plus Jakarta Sans", system-ui, sans-serif'
    ctx.fillText(String(total), cx, cy + 10)
  }, [data, size, entries, total])

  if (entries.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: size }}>
        <p className="text-xs text-slate-400 dark:text-white/30 italic">Sem atendimentos ou pedidos registrados</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-5">
      <canvas ref={canvasRef} className="shrink-0" />
      <div className="space-y-1.5 flex-1 min-w-0">
        {entries.map(([status, count]) => {
          const config = STATUS_CONFIG[status] || { label: status, color: FALLBACK_COLOR }
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={status} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-white/70 truncate">{config.label}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 shrink-0">{count} ({pct}%)</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
