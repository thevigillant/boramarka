import { useState, useMemo, useEffect } from 'react'
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Wallet,
  Download,
  Filter,
  ChevronDown,
  ChevronRight,
  Receipt,
  ShoppingBag,
} from 'lucide-react'
import { Transaction, InvoiceData, OrderData } from '../../../types/dashboard'
import { formatCurrency, formatDate } from '../../../utils/dashboardHelpers'
import { api } from '../../../services/api'

interface FluxoProjetadoSubTabProps {
  currentBalance: number
  transactions: Transaction[]
  invoices: InvoiceData[]
  showToast: (msg: string, type?: 'success' | 'error') => void
}

interface ProjectedDay {
  dateStr: string
  dateLabel: string
  dayOfWeek: string
  isToday: boolean
  inflows: Array<{
    description: string
    amount: number
    type: 'transaction' | 'order'
    id: number | string
  }>
  outflows: Array<{
    description: string
    amount: number
    type: 'transaction' | 'invoice'
    id: number | string
  }>
  totalInflow: number
  totalOutflow: number
  netChange: number
  projectedBalance: number
}

export function FluxoProjetadoSubTab({
  currentBalance,
  transactions,
  invoices,
  showToast,
}: FluxoProjetadoSubTabProps) {
  const [periodDays, setPeriodDays] = useState<15 | 30 | 60>(30)
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})

  // Busca encomendas pendentes de recebimento
  useEffect(() => {
    let isMounted = true
    setLoadingOrders(true)
    api.getOrders()
      .then((data) => {
        if (isMounted) setOrders(data || [])
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingOrders(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Toggle expansão do dia
  const toggleDayExpand = (dateStr: string) => {
    setExpandedDays((prev) => ({ ...prev, [dateStr]: !prev[dateStr] }))
  }

  // Gera dias da projeção
  const projection = useMemo(() => {
    const today = new Date()
    const days: ProjectedDay[] = []
    let runningBalance = currentBalance

    const todayStr = today.toISOString().split('T')[0]

    // Transações a receber pendentes
    const pendingReceivables = transactions.filter(
      (t) => t.type === 'receivable' && !t.paid
    )
    // Transações a pagar pendentes
    const pendingPayables = transactions.filter(
      (t) => t.type === 'payable' && !t.paid
    )
    // Notas fiscais pendentes
    const pendingInvoices = invoices.filter((inv) => !inv.paid)
    // Encomendas com saldo pendente e data de entrega válida
    const pendingOrders = orders.filter(
      (o) => o.status !== 'CANCELADO' && o.status !== 'ENTREGUE'
    )

    const weekDaysNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    for (let i = 0; i <= periodDays; i++) {
      const d = new Date()
      d.setDate(today.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const isToday = dateStr === todayStr

      const inflows: ProjectedDay['inflows'] = []
      const outflows: ProjectedDay['outflows'] = []

      // 1. Recebíveis da data
      for (const tx of pendingReceivables) {
        if (tx.dueDate === dateStr) {
          inflows.push({
            id: tx.id,
            description: tx.description || tx.category || 'Recebimento Previsto',
            amount: tx.amount,
            type: 'transaction',
          })
        }
      }

      // 2. Encomendas com entrega na data (recebimento do saldo restante ou total)
      for (const ord of pendingOrders) {
        if (ord.deliveryDate === dateStr) {
          const remaining = ord.remainingAmount !== undefined
            ? ord.remainingAmount
            : ord.depositPaid
            ? ord.total - (ord.depositAmount || 0)
            : ord.total

          if (remaining > 0) {
            inflows.push({
              id: ord.orderNumber,
              description: `Encomenda ${ord.orderNumber} (${ord.clientName})`,
              amount: remaining,
              type: 'order',
            })
          }
        }
      }

      // 3. Contas a pagar da data
      for (const tx of pendingPayables) {
        if (tx.dueDate === dateStr) {
          outflows.push({
            id: tx.id,
            description: tx.description || tx.category || 'Pagamento Previsto',
            amount: tx.amount,
            type: 'transaction',
          })
        }
      }

      // 4. Notas Fiscais a pagar na data
      for (const inv of pendingInvoices) {
        if (inv.dueDate === dateStr) {
          outflows.push({
            id: `nf-${inv.id}`,
            description: `NF-e #${inv.invoiceNumber} (${inv.supplier?.tradeName || inv.supplier?.corporateName || 'Fornecedor'})`,
            amount: inv.totalAmount,
            type: 'invoice',
          })
        }
      }

      const totalInflow = inflows.reduce((sum, item) => sum + item.amount, 0)
      const totalOutflow = outflows.reduce((sum, item) => sum + item.amount, 0)
      const netChange = totalInflow - totalOutflow
      runningBalance += netChange

      const [y, m, dayNum] = dateStr.split('-')
      const dateLabel = `${dayNum}/${m}`
      const dayOfWeek = weekDaysNames[d.getDay()]

      days.push({
        dateStr,
        dateLabel,
        dayOfWeek,
        isToday,
        inflows,
        outflows,
        totalInflow,
        totalOutflow,
        netChange,
        projectedBalance: runningBalance,
      })
    }

    return days
  }, [currentBalance, transactions, invoices, orders, periodDays])

  // Métricas da projeção
  const totalInflowsPeriod = useMemo(() => {
    return projection.reduce((sum, d) => sum + d.totalInflow, 0)
  }, [projection])

  const totalOutflowsPeriod = useMemo(() => {
    return projection.reduce((sum, d) => sum + d.totalOutflow, 0)
  }, [projection])

  const endProjectedBalance = useMemo(() => {
    if (projection.length === 0) return currentBalance
    return projection[projection.length - 1].projectedBalance
  }, [projection, currentBalance])

  // Menor saldo previsto (para alerta de insolvência)
  const minProjectedDay = useMemo(() => {
    if (projection.length === 0) return null
    let minDay = projection[0]
    for (const d of projection) {
      if (d.projectedBalance < minDay.projectedBalance) {
        minDay = d
      }
    }
    return minDay
  }, [projection])

  const hasNegativeBalanceRisk = minProjectedDay && minProjectedDay.projectedBalance < 0

  // Exportar Projeção para CSV
  const handleExportCSV = () => {
    const headers = [
      'Data',
      'Dia da Semana',
      'Entradas Previstas (R$)',
      'Saídas Previstas (R$)',
      'Resultado do Dia (R$)',
      'Saldo Projetado Acumulado (R$)',
      'Status de Caixa',
    ]

    const rows = projection.map((d) => [
      `"${d.dateLabel}"`,
      `"${d.dayOfWeek}"`,
      `"${d.totalInflow.toFixed(2)}"`,
      `"${d.totalOutflow.toFixed(2)}"`,
      `"${d.netChange.toFixed(2)}"`,
      `"${d.projectedBalance.toFixed(2)}"`,
      `"${d.projectedBalance < 0 ? 'ALERTA: Saldo Negativo' : 'Saudável'}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `fluxo_de_caixa_projetado_${periodDays}dias.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Projeção de fluxo de caixa exportada com sucesso!', 'success')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Barra Superior & Filtros de Prazo ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 dark:bg-[#131826] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Fluxo de Caixa Projetado
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Projeção Inteligente
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Previsibilidade de liquidez consolidando encomendas agendadas, contas a receber e a pagar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Seletor de Horizonte */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1A2235] p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            {[15, 30, 60].map((days) => (
              <button
                key={days}
                onClick={() => setPeriodDays(days as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  periodDays === days
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {days} Dias
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 text-xs font-black transition-all border border-emerald-500/30 cursor-pointer"
            title="Exportar projeção diária para Excel / CSV"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* ── Banner de Alerta se Houver Risco de Saldo Negativo ── */}
      {hasNegativeBalanceRisk && minProjectedDay && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start sm:items-center gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5 sm:mt-0" />
          <div className="text-xs">
            <span className="font-black">Atenção ao Caixa: </span>
            No dia <strong>{minProjectedDay.dateLabel} ({minProjectedDay.dayOfWeek})</strong>, o saldo acumulado previsto é de{' '}
            <strong className="font-mono text-rose-500">{formatCurrency(minProjectedDay.projectedBalance)}</strong>.
            Considere antecipar encomendas ou renegociar despesas para manter saldo positivo.
          </div>
        </div>
      )}

      {/* ── Cards de Resumo da Projeção ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Atual */}
        <div className="card-simple p-5 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Saldo Inicial Realizado
            </span>
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-black font-mono mt-2 text-slate-900 dark:text-white">
            {formatCurrency(currentBalance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Disponível em caixa hoje</p>
        </div>

        {/* Entradas no Período */}
        <div className="card-simple p-5 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Previsto a Entrar ({periodDays}d)
            </span>
            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalInflowsPeriod)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Encomendas agendadas + contas a receber</p>
        </div>

        {/* Saídas no Período */}
        <div className="card-simple p-5 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Previsto a Sair ({periodDays}d)
            </span>
            <ArrowDownRight className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(totalOutflowsPeriod)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Notas fiscais + despesas a vencer</p>
        </div>

        {/* Saldo Final Projetado */}
        <div
          className={`card-simple p-5 border shadow-sm ${
            endProjectedBalance >= 0
              ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-none'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider opacity-90">
              Saldo Projetado em {periodDays}d
            </span>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-2xl font-black font-mono mt-2">
            {formatCurrency(endProjectedBalance)}
          </p>
          <p className="text-[11px] opacity-80 mt-1">
            {endProjectedBalance >= currentBalance ? 'Caixa em crescimento 📈' : 'Redução líquida de caixa 📉'}
          </p>
        </div>
      </div>

      {/* ── Linha do Tempo e Tabela Detalhada de Projeção Diária ── */}
      <div className="bg-white/80 dark:bg-[#131826] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Cronograma Diário de Liquidez
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Clique no dia com lançamentos para expandir os detalhes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#182032]/50 text-[10px] uppercase tracking-wider font-black text-slate-400">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Entradas Previstas</th>
                <th className="py-3 px-4">Saídas Previstas</th>
                <th className="py-3 px-4">Variação do Dia</th>
                <th className="py-3 px-4">Saldo Acumulado</th>
                <th className="py-3 px-4 text-center">Operações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {projection.map((day) => {
                const hasOperations = day.inflows.length > 0 || day.outflows.length > 0
                const isExpanded = expandedDays[day.dateStr]
                const isNegative = day.projectedBalance < 0

                return (
                  <tr
                    key={day.dateStr}
                    className={`transition-colors ${
                      day.isToday
                        ? 'bg-purple-500/5 dark:bg-purple-500/10 font-bold'
                        : isNegative
                        ? 'bg-rose-500/5'
                        : 'hover:bg-slate-50/70 dark:hover:bg-[#182032]/40'
                    }`}
                  >
                    <td colSpan={6} className="p-0">
                      <div
                        onClick={() => hasOperations && toggleDayExpand(day.dateStr)}
                        className={`flex items-center justify-between py-3 px-4 ${
                          hasOperations ? 'cursor-pointer' : ''
                        }`}
                      >
                        {/* Data */}
                        <div className="w-[18%] flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 dark:text-white">
                            {day.dateLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">
                            ({day.dayOfWeek})
                          </span>
                          {day.isToday && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500 text-white font-bold">
                              Hoje
                            </span>
                          )}
                        </div>

                        {/* Entradas */}
                        <div className="w-[18%] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {day.totalInflow > 0 ? `+${formatCurrency(day.totalInflow)}` : '—'}
                        </div>

                        {/* Saídas */}
                        <div className="w-[18%] font-mono font-bold text-rose-600 dark:text-rose-400">
                          {day.totalOutflow > 0 ? `-${formatCurrency(day.totalOutflow)}` : '—'}
                        </div>

                        {/* Variação */}
                        <div className="w-[18%] font-mono font-bold">
                          {day.netChange > 0 ? (
                            <span className="text-emerald-500">+{formatCurrency(day.netChange)}</span>
                          ) : day.netChange < 0 ? (
                            <span className="text-rose-500">{formatCurrency(day.netChange)}</span>
                          ) : (
                            <span className="text-slate-400">R$ 0,00</span>
                          )}
                        </div>

                        {/* Saldo Acumulado */}
                        <div className="w-[18%] font-mono font-black text-sm">
                          <span
                            className={
                              day.projectedBalance < 0
                                ? 'text-rose-500'
                                : 'text-slate-900 dark:text-white'
                            }
                          >
                            {formatCurrency(day.projectedBalance)}
                          </span>
                        </div>

                        {/* Operações (Expandir) */}
                        <div className="w-[10%] text-center">
                          {hasOperations ? (
                            <button
                              type="button"
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-purple-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px]">—</span>
                          )}
                        </div>
                      </div>

                      {/* Subtabela de detalhes ao expandir o dia */}
                      {isExpanded && hasOperations && (
                        <div className="bg-slate-100/80 dark:bg-[#0E131F] p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Lançamentos Programados para {day.dateLabel}
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Entradas detalhadas */}
                            {day.inflows.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                                  <ArrowUpRight className="w-3 h-3" /> Entradas Previstas
                                </span>
                                {day.inflows.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#182032] border border-slate-200 dark:border-slate-800 text-xs"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      {item.type === 'order' ? (
                                        <ShoppingBag className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                      ) : (
                                        <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      )}
                                      <span className="truncate font-medium">{item.description}</span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                                      +{formatCurrency(item.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Saídas detalhadas */}
                            {day.outflows.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                                  <ArrowDownRight className="w-3 h-3" /> Saídas Previstas
                                </span>
                                {day.outflows.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#182032] border border-slate-200 dark:border-slate-800 text-xs"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      {item.type === 'invoice' ? (
                                        <Receipt className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                      ) : (
                                        <Wallet className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                      )}
                                      <span className="truncate font-medium">{item.description}</span>
                                    </div>
                                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0 ml-2">
                                      -{formatCurrency(item.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
