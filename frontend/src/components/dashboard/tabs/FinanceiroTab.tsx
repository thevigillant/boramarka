import { BarChart3, Download, FileText, Loader2, Plus, Wallet, Filter, Search, Check, Trash2 } from 'lucide-react'
import { formatDate, formatCurrency } from '../../../utils/dashboardHelpers'
import { Transaction } from '../../../types/dashboard'

interface FinanceiroTabProps {
  exportRevenueCSV: () => void
  openPdfExportModal: (type: 'finance' | 'bookings') => void
  revenuePeriod: string
  setRevenuePeriod: (period: any) => void
  revenueStartDate: string
  setRevenueStartDate: (val: string) => void
  revenueEndDate: string
  setRevenueEndDate: (val: string) => void
  revenueReportData: any
  revenueLoading: boolean
  exportFinanceToCSV: (txs: any[]) => boolean
  filteredTransactions: Transaction[]
  showToast: (msg: string, type?: 'success' | 'error') => void
  transactions: Transaction[]
  setShowNewTransaction: (open: boolean) => void
  filteredFinanceStats: {
    balance: number
    pendingReceivable: number
    pendingPayable: number
  }
  financeSearchQuery: string
  setFinanceSearchQuery: (val: string) => void
  financePaidFilter: string
  setFinancePaidFilter: (val: any) => void
  financeCategoryFilter: string
  setFinanceCategoryFilter: (val: string) => void
  uniqueCategories: string[]
  financeDateRange: string
  setFinanceDateRange: (val: any) => void
  financeStartDate: string
  setFinanceStartDate: (val: string) => void
  financeEndDate: string
  setFinanceEndDate: (val: string) => void
  financeFilter: 'all' | 'receivable' | 'payable'
  setFinanceFilter: (val: 'all' | 'receivable' | 'payable') => void
  handleToggleTx: (id: number) => void
  handleDeleteTx: (id: number) => void
}

export function FinanceiroTab({
  exportRevenueCSV,
  openPdfExportModal,
  revenuePeriod,
  setRevenuePeriod,
  revenueStartDate,
  setRevenueStartDate,
  revenueEndDate,
  setRevenueEndDate,
  revenueReportData,
  revenueLoading,
  exportFinanceToCSV,
  filteredTransactions,
  showToast,
  transactions,
  setShowNewTransaction,
  filteredFinanceStats,
  financeSearchQuery,
  setFinanceSearchQuery,
  financePaidFilter,
  setFinancePaidFilter,
  financeCategoryFilter,
  setFinanceCategoryFilter,
  uniqueCategories,
  financeDateRange,
  setFinanceDateRange,
  financeStartDate,
  setFinanceStartDate,
  financeEndDate,
  setFinanceEndDate,
  financeFilter,
  setFinanceFilter,
  handleToggleTx,
  handleDeleteTx,
}: FinanceiroTabProps) {
  return (
    <div className="animate-slide-up space-y-6">
      {/* Relatório Executivo de Faturamento por Serviço & Período (Etapa 3-F) */}
      <div className="card-simple p-6 sm:p-8 bg-gradient-to-br from-white to-slate-50 dark:from-[#131826] dark:to-[#0D111E] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-black">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Faturamento por Serviço & Período</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">Análise detalhada de rentabilidade, ticket médio e participação de receitas</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={exportRevenueCSV}
              className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded-xl transition-all border border-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              title="Exportar dados do relatório em arquivo CSV/Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={() => openPdfExportModal('finance')}
              className="px-3.5 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 text-xs font-bold rounded-xl transition-all border border-pink-500/20 flex items-center gap-1.5 cursor-pointer"
              title="Gerar relatório em formato PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Imprimir PDF</span>
            </button>
          </div>
        </div>

        {/* Filtros de Período */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-100/80 dark:bg-[#1A2235] p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto custom-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'thisWeek', label: 'Esta Semana' },
              { id: 'thisMonth', label: 'Este Mês' },
              { id: 'lastMonth', label: 'Mês Passado' },
              { id: 'thisYear', label: 'Ano Atual' },
              { id: 'custom', label: 'Personalizado' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setRevenuePeriod(p.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  revenuePeriod === p.id
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-pink-500/20 scale-[1.02]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {revenuePeriod === 'custom' && (
            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <input
                type="date"
                value={revenueStartDate}
                onChange={e => setRevenueStartDate(e.target.value)}
                className="input-simple text-xs py-1.5 px-3 font-mono font-bold"
              />
              <span className="text-xs text-slate-400 font-bold">até</span>
              <input
                type="date"
                value={revenueEndDate}
                onChange={e => setRevenueEndDate(e.target.value)}
                className="input-simple text-xs py-1.5 px-3 font-mono font-bold"
              />
            </div>
          )}
        </div>

        {/* Cards de Métricas do Período */}
        {revenueReportData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">Faturamento Realizado</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(revenueReportData.summary.totalRevenue)}</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">Faturamento Pendente</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{formatCurrency(revenueReportData.summary.pendingRevenue)}</span>
            </div>
            <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 block mb-1">Atendimentos Concluídos</span>
              <span className="text-xl font-black text-pink-600 dark:text-pink-400">{revenueReportData.summary.totalCompletedBookings} serviço(s)</span>
            </div>
            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 block mb-1">Ticket Médio Geral</span>
              <span className="text-xl font-black text-violet-600 dark:text-violet-400 font-mono">{formatCurrency(revenueReportData.summary.averageTicket)}</span>
            </div>
          </div>
        )}

        {/* Tabela & Barras Visuais por Serviço */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Detalhamento de Faturamento por Serviço</h4>
          {revenueLoading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Gerando relatório do período...</p>
            </div>
          ) : !revenueReportData || revenueReportData.byService.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              Nenhum serviço faturado neste período.
            </div>
          ) : (
            <div className="space-y-3">
              {revenueReportData.byService.map((s: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2235] border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-pink-500/10 text-pink-500 font-black text-[10px] flex items-center justify-center">
                        #{i + 1}
                      </span>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-sm">{s.serviceName}</p>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                          {s.completedBookings} de {s.totalBookings} atendimento(s) concluído(s) • Ticket Médio: <span className="font-mono">{formatCurrency(s.avgTicket)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-500 font-mono text-base block">{formatCurrency(s.totalRevenue)}</span>
                      <span className="text-[10px] font-bold text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20 inline-block mt-0.5">
                        {s.percentageOfTotal}% da receita
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso da Receita */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(s.percentageOfTotal, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Financeiro</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Contas a pagar e a receber</p>
        </div>
        <div className="flex flex-wrap w-full sm:w-auto items-center gap-3">
          <button
            onClick={() => {
              const ok = exportFinanceToCSV(filteredTransactions)
              if (!ok) showToast('Nenhuma transação para exportar.', 'error')
              else showToast('Lançamentos financeiros exportados para Excel (CSV)!', 'success')
            }}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            title="Exportar lançamentos financeiros em planilha Excel (CSV)"
          >
            <Download className="w-4 h-4 text-white" />
            Exportar Excel (CSV)
          </button>
          <button
            onClick={() => openPdfExportModal('finance')}
            disabled={transactions.length === 0}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black py-2.5 px-4 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            title="Exportar dados financeiros para PDF"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={() => setShowNewTransaction(true)}
            className="w-full sm:w-auto btn-primary-simple flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Lançar Valor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-simple p-6 bg-emerald-600 dark:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-600/20">
          <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Saldo Atual</p>
          <p className="text-3xl font-black">{formatCurrency(filteredFinanceStats.balance)}</p>
          <Wallet className="w-12 h-12 absolute -right-2 -bottom-2 opacity-10" />
        </div>
        <div className="card-simple p-6 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Pendentes de Entrada</p>
          <p className="text-3xl font-black text-cyan-600 dark:text-cyan-400">{formatCurrency(filteredFinanceStats.pendingReceivable)}</p>
        </div>
        <div className="card-simple p-6 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Contas Pendentes</p>
          <p className="text-3xl font-black text-red-600 dark:text-red-500">{formatCurrency(filteredFinanceStats.pendingPayable)}</p>
        </div>
      </div>

      {/* Advanced Finance Filter Panel */}
      <div className="card-simple p-5 space-y-4 bg-white/60 dark:bg-[#131826]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-visible">
        <div className="flex items-center gap-2 text-slate-700 dark:text-white">
          <Filter className="w-4 h-4 text-pink-500" />
          <span className="text-xs font-black uppercase tracking-wider">Filtros Avançados</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search Text Input */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Busca Rápida
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Descrição ou cliente..."
                value={financeSearchQuery}
                onChange={e => setFinanceSearchQuery(e.target.value)}
                className="input-simple pl-9 py-2 text-xs w-full"
              />
            </div>
          </div>

          {/* Status: Paid or Unpaid */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Status de Pagamento
            </label>
            <select
              value={financePaidFilter}
              onChange={e => setFinancePaidFilter(e.target.value as any)}
              className="input-simple py-2 text-xs w-full cursor-pointer bg-white text-slate-900 dark:bg-[#131826] dark:text-white"
            >
              <option value="all" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Todos os Status</option>
              <option value="paid" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Pagas / Recebidas</option>
              <option value="unpaid" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Pendentes</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Categoria
            </label>
            <select
              value={financeCategoryFilter}
              onChange={e => setFinanceCategoryFilter(e.target.value)}
              className="input-simple py-2 text-xs w-full cursor-pointer bg-white text-slate-900 dark:bg-[#131826] dark:text-white"
            >
              <option value="all" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Todas as Categorias</option>
              {uniqueCategories.map((cat: string) => (
                <option key={cat} value={cat} className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Period/Date Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Período
            </label>
            <select
              value={financeDateRange}
              onChange={e => setFinanceDateRange(e.target.value as any)}
              className="input-simple py-2 text-xs w-full cursor-pointer bg-white text-slate-900 dark:bg-[#131826] dark:text-white"
            >
              <option value="all" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Qualquer Período</option>
              <option value="today" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Hoje</option>
              <option value="thisMonth" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Este Mês</option>
              <option value="lastMonth" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Mês Passado</option>
              <option value="last30" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Últimos 30 Dias</option>
              <option value="last90" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Últimos 90 Dias</option>
              <option value="custom" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Personalizado...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Panel */}
        {financeDateRange === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 animate-fade-in">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Data Inicial
              </label>
              <input
                type="date"
                value={financeStartDate}
                onChange={e => setFinanceStartDate(e.target.value)}
                className="input-simple py-2 text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Data Final
              </label>
              <input
                type="date"
                value={financeEndDate}
                onChange={e => setFinanceEndDate(e.target.value)}
                className="input-simple py-2 text-xs w-full"
              />
            </div>
          </div>
        )}
      </div>

      <div className="card-simple overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Lançamentos Filtrados</span>
          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
            <button 
              onClick={() => setFinanceFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${financeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
            >
              Tudo
            </button>
            <button 
              onClick={() => setFinanceFilter('receivable')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${financeFilter === 'receivable' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
            >
              Entradas
            </button>
            <button 
              onClick={() => setFinanceFilter('payable')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${financeFilter === 'payable' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'}`}
            >
              Saídas
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Data Vencimento</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.filter(tx => financeFilter === 'all' || tx.type === financeFilter)
                .map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleTx(tx.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        tx.paid
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {tx.paid && <Check className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{tx.description}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      tx.type === 'receivable' ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-500' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {tx.type === 'receivable' ? 'Entrada' : 'Saída'}
                    </span>
                      {tx.category && (
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                          {tx.category}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-bold">
                    {formatDate(tx.dueDate)}
                  </td>
                  <td className={`px-6 py-4 text-right font-black text-sm ${
                    tx.type === 'receivable' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {tx.type === 'receivable' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteTx(tx.id)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.filter((tx: Transaction) => financeFilter === 'all' || tx.type === financeFilter).length === 0 && (
             <div className="text-center py-20 italic text-slate-450 dark:text-slate-500">Nenhum lançamento encontrado</div>
           )}
        </div>
      </div>
    </div>
  )
}
