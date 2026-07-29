import { useRef, useEffect } from 'react'

interface MiniDonutChartProps {
  data: { name: string; count: number; revenue: number }[]
  size?: number
}

const COLORS = ['#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#10b981']

export default function MiniDonutChart({ data, size = 160 }: MiniDonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    if (!data || data.length === 0) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
      ctx.font = '600 11px "Plus Jakarta Sans", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Sem dados', size / 2, size / 2)
      return
    }

    const total = data.reduce((sum, d) => sum + d.count, 0)
    if (total === 0) return

    const cx = size / 2
    const cy = size / 2
    const outerR = size / 2 - 4
    const innerR = outerR * 0.6
    let startAngle = -Math.PI / 2

    data.forEach((item, i) => {
      const sliceAngle = (item.count / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle

      ctx.beginPath()
      ctx.arc(cx, cy, outerR, startAngle, endAngle)
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = COLORS[i % COLORS.length]
      ctx.fill()

      startAngle = endAngle
    })

    // Center text
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)'
    ctx.font = '700 10px "Plus Jakarta Sans", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('TOTAL', cx, cy - 8)
    ctx.fillStyle = '#fff'
    ctx.font = '900 18px "Plus Jakarta Sans", system-ui, sans-serif'
    ctx.fillText(String(total), cx, cy + 10)
  }, [data, size])

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: size }}>
        <p className="text-xs text-slate-400 dark:text-white/30 italic">Sem serviços registrados</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-5">
      <canvas ref={canvasRef} className="shrink-0" />
      <div className="space-y-2 flex-1 min-w-0">
        {data.map((item, i) => {
          const total = data.reduce((s, d) => s + d.count, 0)
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
          return (
            <div key={item.name} className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-700 dark:text-white/70 truncate">{item.name}</p>
                <p className="text-[9px] text-slate-400 dark:text-white/30 font-semibold">{item.count}x — {pct}%</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
