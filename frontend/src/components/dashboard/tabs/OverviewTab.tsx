import { Users, Wallet, TrendingUp, TrendingDown, Sparkles, CheckCircle2, ArrowUpRight, ArrowDownRight, Phone, Calendar, DollarSign, Plus, Copy, Zap } from 'lucide-react'
import { StatCard } from '../StatCard'
import MiniBarChart from '../../charts/MiniBarChart'
import MiniDonutChart from '../../charts/MiniDonutChart'
import WeekdayChart from '../../charts/WeekdayChart'
import StatusPieChart from '../../charts/StatusPieChart'
import { formatDate, formatCurrency } from '../../../utils/dashboardHelpers'
import type { ServiceData, LinkData, BookingData, FinanceStats } from '../../../types/dashboard'
import type { AnalyticsData } from '../../../services/api'

interface OverviewTabProps {
  stats: { totalBookings: number }
  financeStats: FinanceStats
  services: ServiceData[]
  links: LinkData[]
  bookings: BookingData[]
  analyticsData: AnalyticsData | null
  adminInfo: {
    pixKey?: string
    mpAccessToken?: string
  } | null
  setActiveTab: (tab: string) => void
  setPixInputKey: (key: string) => void
  setMpInputToken: (token: string) => void
  setShowMpConfigModal: (show: boolean) => void
}

export function OverviewTab({
  stats,
  financeStats,
  services,
  links,
  bookings,
  analyticsData,
  adminInfo,
  setActiveTab,
  setPixInputKey,
  setMpInputToken,
  setShowMpConfigModal,
}: OverviewTabProps) {
  return (
    <div className="animate-slide-up space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
        <StatCard title="Total de Clientes" value={stats.totalBookings} icon={Users} color="#8b5cf6" />
        <StatCard title="Saldo Financeiro" value={formatCurrency(financeStats.balance)} icon={Wallet} color="#10b981" />
        <StatCard title="A Receber" value={formatCurrency(financeStats.pendingReceivable)} icon={TrendingUp} color="#06b6d4" />
        <StatCard title="A Pagar" value={formatCurrency(financeStats.pendingPayable)} icon={TrendingDown} color="#ef4444" />
      </div>

      {/* Quick Action Bar / Atalhos Rápidos */}
      <div className="card-simple p-4 sm:p-5 bg-white/60 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Ações Rápidas & Atalhos</h3>
              <p className="text-[11px] text-slate-400 dark:text-white/40">Navegue rapidamente para as principais tarefas do seu dia</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveTab('agendamentos')}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold text-xs border border-violet-500/20 transition-all active:scale-[0.98]"
          >
            <Calendar className="w-4 h-4" />
            <span>Ver Agendamentos</span>
          </button>

          <button
            onClick={() => setActiveTab('financeiro')}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <DollarSign className="w-4 h-4" />
            <span>Lançar Finança</span>
          </button>

          <button
            onClick={() => setActiveTab('servicos')}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold text-xs border border-pink-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Serviço</span>
          </button>

          <button
            onClick={() => {
              if (links[0]?.token) {
                const publicUrl = `${window.location.origin}/book/${links[0].token}`
                navigator.clipboard.writeText(publicUrl)
                alert('Link de agendamento copiado com sucesso!')
              } else {
                setActiveTab('links')
              }
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs border border-orange-500/20 transition-all active:scale-[0.98]"
          >
            <Copy className="w-4 h-4" />
            <span>Copiar Link Público</span>
          </button>
        </div>
      </div>

      {/* Onboarding Checklist (Primeiros Passos) */}
      {(!services.length || !links.length || (!adminInfo?.pixKey && !adminInfo?.mpAccessToken)) && (
        <div className="card-simple p-5 sm:p-6 bg-gradient-to-r from-violet-600/10 via-pink-600/10 to-transparent border border-violet-500/20 rounded-3xl animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-600/20 flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Primeiros Passos para sua Agenda Cheia</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Complete as configurações para divulgar seu perfil e receber marcações 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-violet-500 dark:text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                {[services.length > 0, links.length > 0, (!!adminInfo?.pixKey || !!adminInfo?.mpAccessToken)].filter(Boolean).length} de 3 concluídos
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full mb-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-pink-600 transition-all duration-500 rounded-full"
              style={{ width: `${([services.length > 0, links.length > 0, (!!adminInfo?.pixKey || !!adminInfo?.mpAccessToken)].filter(Boolean).length / 3) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1: Serviços */}
            <div 
              onClick={() => setActiveTab('servicos')} 
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                services.length > 0 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-white/40 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-violet-500/40 text-slate-800 dark:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                services.length > 0 ? 'bg-emerald-500 text-white' : 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
              }`}>
                {services.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold">Cadastrar seus Serviços</h4>
                <p className="text-[11px] opacity-70">{services.length > 0 ? `${services.length} serviços cadastrados` : 'Configure preços e durações'}</p>
              </div>
              <span className="text-xs font-bold opacity-60">→</span>
            </div>

            {/* Step 2: Link de Agendamento */}
            <div 
              onClick={() => setActiveTab('links')} 
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                links.length > 0 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-white/40 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-violet-500/40 text-slate-800 dark:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                links.length > 0 ? 'bg-emerald-500 text-white' : 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
              }`}>
                {links.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold">Gerar Link de Agendamento</h4>
                <p className="text-[11px] opacity-70">{links.length > 0 ? `${links.length} links de horários ativos` : 'Crie horários para seus clientes'}</p>
              </div>
              <span className="text-xs font-bold opacity-60">→</span>
            </div>

            {/* Step 3: Cadastrar Chave PIX */}
            <div 
              onClick={() => { 
                setPixInputKey(adminInfo?.pixKey || '')
                setMpInputToken(adminInfo?.mpAccessToken || '')
                setShowMpConfigModal(true) 
              }} 
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                (adminInfo?.pixKey || adminInfo?.mpAccessToken) 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500 text-slate-800 dark:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                (adminInfo?.pixKey || adminInfo?.mpAccessToken) ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {(adminInfo?.pixKey || adminInfo?.mpAccessToken) ? <CheckCircle2 className="w-4 h-4" /> : '3'}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold">Cadastrar Chave PIX</h4>
                <p className="text-[11px] opacity-70">
                  {(adminInfo?.pixKey || adminInfo?.mpAccessToken) ? 'Chave Pix cadastrada' : 'Receba sinal no Pix sem complicações'}
                </p>
              </div>
              <span className="text-xs font-bold opacity-60">→</span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Faturamento Mensal */}
        <div className="card-simple">
          <div className="card-simple-inner p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-[15px] text-slate-800 dark:text-white/80">Evolução do Faturamento</h3>
                <p className="text-[10px] text-slate-400 dark:text-white/30 font-semibold">Receita bruta dos últimos 6 meses</p>
              </div>
              {analyticsData?.trends?.revenueChangePercent !== undefined && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${
                  analyticsData.trends.revenueChangePercent >= 0
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {analyticsData.trends.revenueChangePercent >= 0 ? '↑' : '↓'} {Math.abs(analyticsData.trends.revenueChangePercent)}% vs mês anterior
                </span>
              )}
            </div>
            <MiniBarChart data={analyticsData?.revenueByMonth || []} height={190} />
          </div>
        </div>

        {/* Chart 2: Movimentação por Dia da Semana */}
        <div className="card-simple">
          <div className="card-simple-inner p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-[15px] text-slate-800 dark:text-white/80">Movimento por Dia</h3>
                <p className="text-[10px] text-slate-400 dark:text-white/30 font-semibold">Distribuição semanal de agendamentos</p>
              </div>
            </div>
            <WeekdayChart data={analyticsData?.bookingsByWeekday || []} height={180} />
          </div>
        </div>

        {/* Chart 3: Top Serviços */}
        <div className="card-simple">
          <div className="card-simple-inner p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-[15px] text-slate-800 dark:text-white/80">Serviços Mais Vendidos</h3>
                <p className="text-[10px] text-slate-400 dark:text-white/30 font-semibold">Ranking por volume de atendimentos</p>
              </div>
            </div>
            <MiniDonutChart data={analyticsData?.topServices || []} size={150} />
          </div>
        </div>

        {/* Chart 4: Status dos Agendamentos */}
        <div className="card-simple">
          <div className="card-simple-inner p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-[15px] text-slate-800 dark:text-white/80">Status dos Agendamentos</h3>
                <p className="text-[10px] text-slate-400 dark:text-white/30 font-semibold">Proporção por estado de agendamento</p>
              </div>
            </div>
            <StatusPieChart data={analyticsData?.statusDistribution || {}} size={140} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bookings */}
        <div className="card-simple">
          <div className="card-simple-inner p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-[15px] text-slate-800 dark:text-white/80">Últimos Agendamentos</h3>
              <button onClick={() => setActiveTab('agendamentos')} className="text-violet-500 dark:text-violet-400 text-[11px] font-semibold hover:underline uppercase tracking-wider">Ver todos</button>
            </div>
            <div className="space-y-3">
              {bookings.slice(0, 5).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-150 dark:border-white/[0.04] transition-all hover:border-violet-500/20">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-white/[0.04] rounded-lg flex items-center justify-center font-bold text-violet-500 dark:text-violet-400 text-sm border border-slate-200 dark:border-white/[0.06]">
                    {b.clientName[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800 dark:text-white/80">{b.clientName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-white/25 font-semibold uppercase">{formatDate(b.timeSlot.date)} — {b.timeSlot.time}</p>
                  </div>
                  <a href={`https://wa.me/${b.clientPhone}`} target="_blank" className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/[0.06] rounded-lg transition-all">
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              ))}
              {bookings.length === 0 && <p className="text-center py-10 text-slate-400 dark:text-white/20 text-sm italic">Nenhum agendamento recente</p>}
            </div>
          </div>
        </div>
        {/* Financial Summary */}
        <div className="card-simple">
          <div className="card-simple-inner p-6 overflow-hidden relative">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-[15px] text-slate-800 dark:text-white/80">Resumo Financeiro</h3>
               <button onClick={() => setActiveTab('financeiro')} className="text-violet-500 dark:text-violet-400 text-[11px] font-semibold hover:underline uppercase tracking-wider">Gestão completa</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/[0.04] border border-emerald-500/20 dark:border-emerald-500/10">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400/80 uppercase tracking-widest">Recebido</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(financeStats.receivedAmount)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/[0.06] flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="flex justify-between items-center p-5 rounded-xl bg-red-500/10 dark:bg-red-500/[0.04] border border-red-500/20 dark:border-red-500/10">
                <div>
                  <p className="text-[10px] font-bold text-red-650 dark:text-red-400/80 uppercase tracking-widest">Pago</p>
                  <p className="text-2xl font-black text-red-600 dark:text-red-400">{formatCurrency(financeStats.paidAmount)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/[0.06] flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
