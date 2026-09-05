import { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Printer,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Sliders,
  Save,
  Download,
} from 'lucide-react'
import { OrderData, OrderSettingsData } from '../../../types/dashboard'
import { formatCurrency } from '../../../utils/dashboardHelpers'
import { api } from '../../../services/api'

interface BoraEncomendaCalendarSubTabProps {
  orders: OrderData[]
  settings: OrderSettingsData | null
  onUpdateSettings: (newSettings: OrderSettingsData) => void
  onSelectOrder: (order: OrderData) => void
  onPrintOrder: (order: OrderData) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function BoraEncomendaCalendarSubTab({
  orders,
  settings,
  onUpdateSettings,
  onSelectOrder,
  onPrintOrder,
  showToast,
}: BoraEncomendaCalendarSubTabProps) {
  const today = useMemo(() => new Date(), [])
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()) // 0-indexed

  // Dia selecionado para exibir no painel lateral
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })

  // Edição rápida de capacidade máxima diária
  const [editingCapacity, setEditingCapacity] = useState(false)
  const [capacityInput, setCapacityInput] = useState<string>(
    String(settings?.maxOrdersPerDay || 0)
  )
  const [savingCapacity, setSavingCapacity] = useState(false)

  const maxOrdersPerDay = settings?.maxOrdersPerDay || 0

  // Navegação de mês
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    setSelectedDayStr(`${y}-${m}-${d}`)
  }

  // Salva nova capacidade diária
  const handleSaveCapacity = async () => {
    const val = parseInt(capacityInput, 10)
    if (isNaN(val) || val < 0) {
      showToast('Digite um número válido (0 para ilimitado).', 'error')
      return
    }
    setSavingCapacity(true)
    try {
      const updated = await api.updateOrderSettings({
        maxOrdersPerDay: val,
      })
      onUpdateSettings(updated)
      setEditingCapacity(false)
      showToast(
        val === 0
          ? 'Capacidade diária configurada como ILIMITADA.'
          : `Capacidade diária atualizada para ${val} encomendas/dia.`,
        'success'
      )
    } catch {
      showToast('Erro ao salvar capacidade diária.', 'error')
    } finally {
      setSavingCapacity(false)
    }
  }

  // Agrupa pedidos por data de entrega (YYYY-MM-DD)
  const ordersByDate = useMemo(() => {
    const map: Record<string, OrderData[]> = {}
    for (const ord of orders) {
      if (!ord.deliveryDate) continue
      // Normaliza para YYYY-MM-DD
      const dateKey = ord.deliveryDate.split('T')[0]
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(ord)
    }
    return map
  }, [orders])

  // Pedidos do mês atual para métricas
  const monthOrders = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
    return orders.filter((o) => o.deliveryDate?.startsWith(prefix) && o.status !== 'CANCELADO')
  }, [orders, currentYear, currentMonth])

  const monthRevenue = useMemo(() => {
    return monthOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  }, [monthOrders])

  const overloadedDaysCount = useMemo(() => {
    if (maxOrdersPerDay <= 0) return 0
    let count = 0
    for (const [dateStr, dayOrders] of Object.entries(ordersByDate)) {
      const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      if (dateStr.startsWith(prefix)) {
        const active = dayOrders.filter((o) => o.status !== 'CANCELADO')
        if (active.length >= maxOrdersPerDay) count++
      }
    }
    return count
  }, [ordersByDate, maxOrdersPerDay, currentYear, currentMonth])

  // Estrutura do calendário: dias do mês + preenchimento inicial/final
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay() // 0 = Domingo
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const totalDaysPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

    const cells: Array<{
      dateStr: string
      dayNumber: number
      isCurrentMonth: boolean
      isToday: boolean
      dayOrders: OrderData[]
    }> = []

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Dias do mês anterior para completar primeira semana
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = totalDaysPrevMonth - i
      const prevM = currentMonth === 0 ? 12 : currentMonth
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        dayOrders: ordersByDate[dateStr] || [],
      })
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        dayOrders: ordersByDate[dateStr] || [],
      })
    }

    // Dias do próximo mês para completar grid de 7 colunas (múltiplo de 7)
    const remaining = 7 - (cells.length % 7)
    if (remaining < 7) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear
      for (let d = 1; d <= remaining; d++) {
        const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        cells.push({
          dateStr,
          dayNumber: d,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          dayOrders: ordersByDate[dateStr] || [],
        })
      }
    }

    return cells
  }, [currentYear, currentMonth, ordersByDate, today])

  // Pedidos do dia selecionado
  const selectedDayOrders = useMemo(() => {
    return (ordersByDate[selectedDayStr] || []).filter((o) => o.status !== 'CANCELADO')
  }, [ordersByDate, selectedDayStr])

  const selectedDayTotal = useMemo(() => {
    return selectedDayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  }, [selectedDayOrders])

  // Helper para cor do status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return { label: 'Pendente', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
      case 'CONFIRMADO':
        return { label: 'Confirmado', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
      case 'EM_PRODUCAO':
        return { label: 'Em Produção', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
      case 'PRONTO':
        return { label: 'Pronto', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
      case 'ENTREGUE':
        return { label: 'Entregue', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
      default:
        return { label: status, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
    }
  }

  // Exportar pedidos para CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast('Nenhum pedido para exportar.', 'error')
      return
    }

    const headers = [
      'Pedido',
      'Data Entrega',
      'Horário',
      'Cliente',
      'WhatsApp',
      'Tipo Entrega',
      'Endereço',
      'Itens',
      'Valor Total',
      'Sinal Pago',
      'Saldo Restante',
      'Status',
      'Observações',
    ]

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.deliveryDate || ''}"`,
      `"${o.deliveryTime || ''}"`,
      `"${(o.clientName || '').replace(/"/g, '""')}"`,
      `"${o.clientPhone || ''}"`,
      `"${o.deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada'}"`,
      `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
      `"${(o.items || []).map((i) => `${i.quantity}x ${i.productName}`).join('; ').replace(/"/g, '""')}"`,
      `"${(o.total || 0).toFixed(2)}"`,
      `"${(o.depositAmount || 0).toFixed(2)}"`,
      `"${(o.remainingAmount || 0).toFixed(2)}"`,
      `"${o.status}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `encomendas_producao_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Planilha de pedidos exportada com sucesso!', 'success')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Barra Superior do Calendário ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#131826] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Calendário & Capacidade de Produção
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/20">
                ERP Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Planejamento diário de bancada, sobrecarga e controle de vagas
            </p>
          </div>
        </div>

        {/* Controles de navegação do mês + Ações */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1 bg-[#1A2235] p-1 rounded-2xl border border-slate-700/70">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-white min-w-[130px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleGoToToday}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            Hoje
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold transition-all border border-emerald-500/30 cursor-pointer"
            title="Exportar todas as encomendas para Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* ── KPIs de Produção do Mês & Limite Diário ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total do Mês */}
        <div className="p-4 rounded-2xl bg-[#131826] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Encomendas no Mês
            </span>
            <p className="text-2xl font-black text-white mt-1">{monthOrders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 font-mono font-black">
            {monthOrders.length}
          </div>
        </div>

        {/* Faturamento Previsto */}
        <div className="p-4 rounded-2xl bg-[#131826] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Faturamento Previsto
            </span>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {formatCurrency(monthRevenue)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            R$
          </div>
        </div>

        {/* Alerta de Sobrecarga */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            overloadedDaysCount > 0
              ? 'bg-rose-500/10 border-rose-500/30'
              : 'bg-[#131826] border-slate-800'
          }`}
        >
          <div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                overloadedDaysCount > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              Dias com Sobrecarga
            </span>
            <p
              className={`text-2xl font-black mt-1 ${
                overloadedDaysCount > 0 ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              {overloadedDaysCount}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              overloadedDaysCount > 0
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Capacidade Diária Máxima Configurável */}
        <div className="p-4 rounded-2xl bg-[#131826] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Capacidade Máx. Diária
            </span>
            {!editingCapacity && (
              <button
                onClick={() => {
                  setCapacityInput(String(maxOrdersPerDay))
                  setEditingCapacity(true)
                }}
                className="text-[10px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                Alterar
              </button>
            )}
          </div>

          {editingCapacity ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                min="0"
                max="999"
                value={capacityInput}
                onChange={(e) => setCapacityInput(e.target.value)}
                className="w-20 px-2 py-1 bg-slate-900 border border-pink-500/50 rounded-lg text-white font-mono font-bold text-sm focus:outline-none"
                placeholder="0"
                autoFocus
              />
              <button
                onClick={handleSaveCapacity}
                disabled={savingCapacity}
                className="px-2.5 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3 h-3" />
                Salvar
              </button>
              <button
                onClick={() => setEditingCapacity(false)}
                className="px-2 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-pink-400">
                {maxOrdersPerDay > 0 ? maxOrdersPerDay : 'Ilimitado'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {maxOrdersPerDay > 0 ? 'pedidos/dia' : '(sem bloqueio)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Grid Principal: Calendário + Painel do Dia Selecionado ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Calendário Mensal (XL: 8 colunas) */}
        <div className="xl:col-span-8 bg-[#131826] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-sm space-y-4">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {WEEK_DAYS.map((wd, i) => (
              <div
                key={wd}
                className={`text-[11px] font-black uppercase tracking-wider py-1.5 ${
                  i === 0 || i === 6 ? 'text-pink-400/80' : 'text-slate-400'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell) => {
              const activeCount = cell.dayOrders.filter((o) => o.status !== 'CANCELADO').length
              const isSelected = cell.dateStr === selectedDayStr
              const isOverloaded = maxOrdersPerDay > 0 && activeCount >= maxOrdersPerDay
              const isWarning =
                maxOrdersPerDay > 0 &&
                activeCount >= Math.ceil(maxOrdersPerDay * 0.7) &&
                !isOverloaded

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDayStr(cell.dateStr)}
                  className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isSelected
                      ? 'border-pink-500 bg-pink-500/10 shadow-md shadow-pink-500/10 ring-1 ring-pink-500/40'
                      : cell.isCurrentMonth
                      ? 'bg-[#182032] hover:bg-[#1f2940] border-slate-800'
                      : 'bg-[#0e131f] hover:bg-[#141b2b] border-slate-900 opacity-50'
                  }`}
                >
                  {/* Topo da célula: Número do dia + Tag de status */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-black rounded-lg px-1.5 py-0.5 ${
                        cell.isToday
                          ? 'bg-pink-500 text-white shadow-sm'
                          : cell.isCurrentMonth
                          ? 'text-white'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Badge de contagem / capacidade */}
                    {activeCount > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md border ${
                          isOverloaded
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                        title={
                          maxOrdersPerDay > 0
                            ? `${activeCount} de ${maxOrdersPerDay} vagas ocupadas`
                            : `${activeCount} encomendas`
                        }
                      >
                        {maxOrdersPerDay > 0 ? `${activeCount}/${maxOrdersPerDay}` : `${activeCount}`}
                      </span>
                    )}
                  </div>

                  {/* Chips de prévia de pedidos no dia */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {cell.dayOrders
                      .filter((o) => o.status !== 'CANCELADO')
                      .slice(0, 2)
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="text-[10px] font-medium text-slate-300 truncate bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              ord.status === 'EM_PRODUCAO'
                                ? 'bg-purple-400'
                                : ord.status === 'PRONTO'
                                ? 'bg-emerald-400'
                                : ord.status === 'CONFIRMADO'
                                ? 'bg-blue-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span className="truncate">{ord.clientName.split(' ')[0]}</span>
                        </div>
                      ))}

                    {activeCount > 2 && (
                      <div className="text-[9px] font-bold text-slate-400 text-center">
                        +{activeCount - 2} mais
                      </div>
                    )}
                  </div>

                  {/* Rodapé: Total R$ do dia */}
                  <div className="text-[10px] font-mono font-bold text-slate-400 text-right">
                    {activeCount > 0 && (
                      <span className="text-emerald-400/90">
                        {formatCurrency(
                          cell.dayOrders
                            .filter((o) => o.status !== 'CANCELADO')
                            .reduce((s, o) => s + (o.total || 0), 0)
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legenda de Capacidade */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Vagas Livres
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Quase Cheio (70%+)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Capacidade Esgotada
              </span>
            </div>
            <span>Clique em qualquer dia para ver a bancada</span>
          </div>
        </div>

        {/* ── Painel do Dia Selecionado (XL: 4 colunas) ── */}
        <div className="xl:col-span-4 bg-[#131826] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                Bancada de Produção
              </span>
              <h3 className="text-base font-black text-white mt-0.5">
                {selectedDayStr ? selectedDayStr.split('-').reverse().join('/') : 'Selecione uma data'}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total do Dia
              </span>
              <span className="text-sm font-black font-mono text-emerald-400">
                {formatCurrency(selectedDayTotal)}
              </span>
            </div>
          </div>

          {/* Indicador de Capacidade do Dia */}
          {maxOrdersPerDay > 0 && (
            <div className="p-3 rounded-2xl bg-[#182032] border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Vagas Ocupadas</span>
                <span
                  className={`font-mono font-bold ${
                    selectedDayOrders.length >= maxOrdersPerDay
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {selectedDayOrders.length} de {maxOrdersPerDay}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    selectedDayOrders.length >= maxOrdersPerDay
                      ? 'bg-rose-500'
                      : selectedDayOrders.length >= Math.ceil(maxOrdersPerDay * 0.7)
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (selectedDayOrders.length / maxOrdersPerDay) * 100)}%`,
                  }}
                />
              </div>
              {selectedDayOrders.length >= maxOrdersPerDay && (
                <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1 pt-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Capacidade esgotada. Vitrine pública bloqueou novas encomendas nesta data.
                </p>
              )}
            </div>
          )}

          {/* Lista de Encomendas do Dia */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
            {selectedDayOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
                Nenhuma encomenda agendada para esta data.
              </div>
            ) : (
              selectedDayOrders.map((ord) => {
                const statusBadge = getStatusBadge(ord.status)
                return (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-2xl bg-[#182032] hover:bg-[#1d273d] border border-slate-800 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-white text-xs">
                            {ord.orderNumber}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${statusBadge.bg}`}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 mt-0.5">{ord.clientName}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-white block">
                          {formatCurrency(ord.total || 0)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center justify-end gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {ord.deliveryTime || 'Sem hora'}
                        </span>
                      </div>
                    </div>

                    {/* Itens */}
                    <div className="text-[11px] text-slate-400 line-clamp-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800/80">
                      {(ord.items || [])
                        .map((i) => `${i.quantity}x ${i.productName}`)
                        .join(' · ')}
                    </div>

                    {/* Informações de entrega e botões de ação rápida */}
                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        {ord.deliveryType === 'DELIVERY' ? (
                          <>
                            <Truck className="w-3 h-3 text-pink-400" /> Entrega
                          </>
                        ) : (
                          <>
                            <Package className="w-3 h-3 text-emerald-400" /> Retirada
                          </>
                        )}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onPrintOrder(ord)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Imprimir Comanda Térmica / Ficha de Bancada"
                        >
                          <Printer className="w-3 h-3 text-pink-400" />
                          <span>Comanda</span>
                        </button>
                        <button
                          onClick={() => onSelectOrder(ord)}
                          className="px-2 py-1 bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Abrir Detalhes do Pedido"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
