import { useRef, useEffect } from 'react'

interface MiniBarChartProps {
  data: { month: string; total: number }[]
  height?: number
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

export default function MiniBarChart({ data, height = 200 }: MiniBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
    const padding = { top: 20, right: 16, bottom: 40, left: 60 }
    const chartW = w - padding.left - padding.right
    const chartH = h - padding.top - padding.bottom

    ctx.clearRect(0, 0, w, h)

    if (!data || data.length === 0) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
      ctx.font = '600 12px "Plus Jakarta Sans", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Sem dados de receita ainda', w / 2, h / 2)
      return
    }

    const maxVal = Math.max(...data.map(d => d.total), 1)
    const barCount = data.length
    const barGap = 12
    const barW = Math.min(40, (chartW - barGap * (barCount - 1)) / barCount)
    const totalBarsW = barW * barCount + barGap * (barCount - 1)
    const offsetX = padding.left + (chartW - totalBarsW) / 2

    // Grid lines
    const gridLines = 4
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)'
    ctx.lineWidth = 1
    ctx.font = '600 10px "Plus Jakarta Sans", system-ui, sans-serif'
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.textAlign = 'right'

    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i
      const val = maxVal - (maxVal / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(w - padding.right, y)
      ctx.stroke()

      const label = val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)
      ctx.fillText(`R$ ${label}`, padding.left - 8, y + 4)
    }

    // Bars with gradient
    data.forEach((item, i) => {
      const barH = (item.total / maxVal) * chartH
      const x = offsetX + i * (barW + barGap)
      const y = padding.top + chartH - barH

      // Bar gradient
      const grad = ctx.createLinearGradient(x, y, x, y + barH)
      grad.addColorStop(0, '#8b5cf6')
      grad.addColorStop(1, '#ec4899')
      ctx.fillStyle = grad

      // Rounded top corners
      const radius = Math.min(6, barW / 2)
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + barW - radius, y)
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius)
      ctx.lineTo(x + barW, y + barH)
      ctx.lineTo(x, y + barH)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.fill()

      // Month label
      const monthKey = item.month.split('-')[1]
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)'
      ctx.font = '700 10px "Plus Jakarta Sans", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(MONTH_NAMES[monthKey] || monthKey, x + barW / 2, h - padding.bottom + 18)

      // Value on top of bar
      if (item.total > 0) {
        ctx.fillStyle = 'rgba(139, 92, 246, 0.9)'
        ctx.font = '800 9px "Plus Jakarta Sans", system-ui, sans-serif'
        const valLabel = item.total >= 1000 ? `${(item.total / 1000).toFixed(1)}k` : item.total.toFixed(0)
        ctx.fillText(`R$${valLabel}`, x + barW / 2, y - 6)
      }
    })
  }, [data, height])

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  )
}
