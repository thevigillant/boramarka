import { useRef, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface WeekdayChartProps {
  data: { day: number; count: number }[]
  height?: number
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function WeekdayChart({ data, height = 180 }: WeekdayChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const maxDay = data?.length ? data.reduce((best, d) => d.count > best.count ? d : best, data[0]) : null
  const minDay = data?.length ? data.filter(d => d.count > 0).reduce((worst, d) => d.count < worst.count ? d : worst, data.filter(d => d.count > 0)[0] || data[0]) : null

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = height
    const padding = { top: 10, right: 40, bottom: 8, left: 38 }
    const chartW = w - padding.left - padding.right
    const chartH = h - padding.top - padding.bottom

    ctx.clearRect(0, 0, w, h)

    const isAllZero = !data || data.length === 0 || data.every(d => d.count === 0)
    if (isAllZero) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'
      ctx.font = '600 12px "Plus Jakarta Sans", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Nenhum movimento registrado na semana', w / 2, h / 2)
      return
    }

    const maxVal = Math.max(...data.map(d => d.count), 1)
    const barH = Math.min(18, (chartH - 6 * 4) / 7)
    const totalH = barH * 7 + 4 * 6
    const offsetY = padding.top + (chartH - totalH) / 2

    data.forEach((item, i) => {
      const y = offsetY + i * (barH + 4)
      const barW = (item.count / maxVal) * chartW
      const isMax = maxDay && item.day === maxDay.day && item.count > 0

      // Day label
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)'
      ctx.font = '700 10px "Plus Jakarta Sans", system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(DAY_LABELS[item.day], padding.left - 8, y + barH / 2)

      // Bar
      const grad = ctx.createLinearGradient(padding.left, y, padding.left + barW, y)
      if (isMax) {
        grad.addColorStop(0, '#8b5cf6')
        grad.addColorStop(1, '#ec4899')
      } else {
        grad.addColorStop(0, 'rgba(139, 92, 246, 0.25)')
        grad.addColorStop(1, 'rgba(236, 72, 153, 0.15)')
      }
      ctx.fillStyle = grad

      const radius = Math.min(6, barH / 2)
      const bw = Math.max(barW, 4)
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + bw - radius, y)
      ctx.quadraticCurveTo(padding.left + bw, y, padding.left + bw, y + radius)
      ctx.lineTo(padding.left + bw, y + barH - radius)
      ctx.quadraticCurveTo(padding.left + bw, y + barH, padding.left + bw - radius, y + barH)
      ctx.lineTo(padding.left, y + barH)
      ctx.closePath()
      ctx.fill()

      // Count label
      if (item.count > 0) {
        ctx.fillStyle = isMax ? '#ec4899' : 'rgba(148, 163, 184, 0.6)'
        ctx.font = `${isMax ? '800' : '700'} 10px "Plus Jakarta Sans", system-ui, sans-serif`
        ctx.textAlign = 'left'
        ctx.fillText(String(item.count), padding.left + bw + 6, y + barH / 2)
      }
    })
  }, [data, height])

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="w-full">
        <canvas ref={canvasRef} className="w-full" />
      </div>
      {maxDay && maxDay.count > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>Dia mais forte: {DAY_LABELS[maxDay.day]} ({maxDay.count})</span>
          </span>
          {minDay && minDay.day !== maxDay.day && minDay.count > 0 && (
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              <span>Dia mais fraco: {DAY_LABELS[minDay.day]} ({minDay.count})</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
