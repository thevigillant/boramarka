import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Download,
  FileText,
  Loader2,
  Plus,
  Wallet,
  Filter,
  Search,
  Check,
  Trash2,
  Building2,
  ShoppingCart,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  UploadCloud,
  ShieldCheck,
} from 'lucide-react'
import { formatDate, formatCurrency } from '../../../utils/dashboardHelpers'
import { formatCNPJ, isValidCNPJ, cleanCNPJ } from '../../../utils/cnpjHelper'
import {
  Transaction,
  SupplierData,
  PurchaseData,
  InvoiceData,
  DreReportData,
} from '../../../types/dashboard'
import { api } from '../../../services/api'
import { NewSupplierModal } from '../modals/NewSupplierModal'
import { NewInvoiceModal } from '../modals/NewInvoiceModal'
import { InvoiceDetailsModal } from '../modals/InvoiceDetailsModal'
import { NewPurchaseModal } from '../modals/NewPurchaseModal'
import { ImportXmlModal } from '../modals/ImportXmlModal'
import { CompanyCnpjModal } from '../modals/CompanyCnpjModal'
import { EmitSalesInvoiceModal } from '../modals/EmitSalesInvoiceModal'
import { ParsedNfeData } from '../../../utils/nfeXmlParser'

interface FinanceiroTabProps {
  adminInfo?: any
  onUpdateAdminInfo?: (info: any) => void
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
  onRefreshData?: () => void
}

type SubTabType = 'fluxo' | 'invoices' | 'compras' | 'fornecedores' | 'dre' | 'servicos'

export function FinanceiroTab({
  adminInfo,
  onUpdateAdminInfo,
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
  onRefreshData,
}: FinanceiroTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('fluxo')

  const companyCnpjClean = cleanCNPJ(adminInfo?.cnpj)
  const hasCompanyCnpj = isValidCNPJ(companyCnpjClean)

  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showEmitSalesModal, setShowEmitSalesModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showImportXmlModal, setShowImportXmlModal] = useState(false)
  const [showCompanyCnpjModal, setShowCompanyCnpjModal] = useState(false)
  const [importedXmlData, setImportedXmlData] = useState<ParsedNfeData | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false)

  // Submodule Data
  const [suppliers, setSuppliers] = useState<SupplierData[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')

  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoicePaidFilter, setInvoicePaidFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [invoiceDirectionFilter, setInvoiceDirectionFilter] = useState<'ALL' | 'ENTRADA' | 'SAIDA'>('ALL')

  const [purchases, setPurchases] = useState<PurchaseData[]>([])
  const [loadingPurchases, setLoadingPurchases] = useState(false)
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('ALL')

  const [dreData, setDreData] = useState<DreReportData | null>(null)
  const [dreLoading, setDreLoading] = useState(false)
  const [drePeriod, setDrePeriod] = useState<'thisMonth' | 'lastMonth' | 'last90' | 'thisYear'>('thisMonth')

  // Fetch Fornecedores
  const loadSuppliers = useCallback(async () => {
    setLoadingSuppliers(true)
    try {
      const data = await api.getSuppliers({ search: supplierSearch || undefined })
      setSuppliers(data)
    } catch {
      // silencioso
    } finally {
      setLoadingSuppliers(false)
    }
  }, [supplierSearch])

  // Fetch Notas Fiscais
  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true)
    try {
      const res = await api.getInvoices({
        search: invoiceSearch || undefined,
        paid: invoicePaidFilter === 'all' ? undefined : invoicePaidFilter === 'paid',
        direction: invoiceDirectionFilter !== 'ALL' ? invoiceDirectionFilter : undefined,
      })
      setInvoices(res.invoices || [])
    } catch {
      // silencioso
    } finally {
      setLoadingInvoices(false)
    }
  }, [invoiceSearch, invoicePaidFilter, invoiceDirectionFilter])

  // Fetch Compras
  const loadPurchases = useCallback(async () => {
    setLoadingPurchases(true)
    try {
      const res = await api.getPurchases({
        status: purchaseStatusFilter !== 'ALL' ? purchaseStatusFilter : undefined,
      })
      setPurchases(res.purchases || [])
    } catch {
      // silencioso
    } finally {
      setLoadingPurchases(false)
    }
  }, [purchaseStatusFilter])

  // Fetch DRE
  const loadDre = useCallback(async () => {
    setDreLoading(true)
    try {
      let start: string | undefined
      let end: string | undefined
      const now = new Date()

      if (drePeriod === 'thisMonth') {
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      } else if (drePeriod === 'lastMonth') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      } else if (drePeriod === 'last90') {
        const d = new Date()
        d.setDate(d.getDate() - 90)
        start = d.toISOString().split('T')[0]
        end = now.toISOString().split('T')[0]
      } else if (drePeriod === 'thisYear') {
        start = `${now.getFullYear()}-01-01`
        end = `${now.getFullYear()}-12-31`
      }

      const res = await api.getDreReport(start, end)
      setDreData(res)
    } catch {
      // silencioso
    } finally {
      setDreLoading(false)
    }
  }, [drePeriod])

  // Carrega dados iniciais e atualiza quando a aba muda
  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  useEffect(() => {
    if (activeSubTab === 'invoices') loadInvoices()
    if (activeSubTab === 'compras') loadPurchases()
    if (activeSubTab === 'fornecedores') loadSuppliers()
    if (activeSubTab === 'dre') loadDre()
  }, [activeSubTab, loadInvoices, loadPurchases, loadSuppliers, loadDre])

  // Handlers para Notas Fiscais
  const handleToggleInvoicePaid = async (id: number) => {
    try {
      const res = await api.toggleInvoicePaid(id)
      const updated = (res as any).invoice || res
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)))
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice(updated)
      }
      showToast(
        updated.paid ? 'Nota Fiscal marcada como paga!' : 'Nota Fiscal marcada como pendente!',
        'success'
      )
      if (onRefreshData) onRefreshData()
    } catch {
      showToast('Erro ao atualizar status da Nota Fiscal.', 'error')
    }
  }

  const handleDeleteInvoice = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Nota Fiscal? A despesa correspondente será removida do financeiro.')) {
      return
    }
    try {
      await api.deleteInvoice(id)
      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
      setShowInvoiceDetails(false)
      setSelectedInvoice(null)
      showToast('Nota Fiscal excluída com sucesso!', 'success')
      if (onRefreshData) onRefreshData()
    } catch {
      showToast('Erro ao excluir Nota Fiscal.', 'error')
    }
  }

  // Handlers para Compras
  const handleUpdatePurchaseStatus = async (id: number, status: string, updateStock = false) => {
    try {
      const updated = await api.updatePurchaseStatus(id, status, updateStock)
      setPurchases((prev) => prev.map((p) => (p.id === id ? updated : p)))
      showToast(`Pedido ${updated.purchaseNumber} atualizado para ${status}!`, 'success')
      if (onRefreshData) onRefreshData()
    } catch {
      showToast('Erro ao atualizar status da compra.', 'error')
    }
  }

  const handleDeletePurchase = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja cancelar/excluir este pedido de compra?')) return
    try {
      await api.deletePurchase(id)
      setPurchases((prev) => prev.filter((p) => p.id !== id))
      showToast('Pedido de compra removido.', 'success')
    } catch {
      showToast('Erro ao excluir pedido.', 'error')
    }
  }

  // Cálculos auxiliares do Fluxo de Caixa
  const todayStr = new Date().toISOString().split('T')[0]
  const overduePayables = transactions.filter(
    (t) => t.type === 'payable' && !t.paid && t.dueDate < todayStr
  )
  const overdueTotal = overduePayables.reduce((acc, t) => acc + t.amount, 0)

  const receivedTotal = transactions
    .filter((t) => t.type === 'receivable' && t.paid)
    .reduce((acc, t) => acc + t.amount, 0)

  const paidTotal = transactions
    .filter((t) => t.type === 'payable' && t.paid)
    .reduce((acc, t) => acc + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════ */}
      {/* BARRA SUPERIOR: TÍTULO & AÇÕES RÁPIDAS    */}
      {/* ═══════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 dark:bg-[#131826] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Financeiro</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-500 border border-pink-500/20">
              BoraEnkomenda Pro
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Fluxo de caixa inteligente, notas fiscais destrinchadas em gastos, compras e fornecedores
          </p>
        </div>

        {/* Action buttons toolbar: responsive grid on mobile, flex row on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => {
              setImportedXmlData(null)
              setShowInvoiceModal(true)
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            title="Dar Entrada em Nota Fiscal (alimenta estoque e contas a pagar)"
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>Dar Entrada NF</span>
          </button>

          <button
            onClick={() => {
              if (!hasCompanyCnpj) {
                setShowCompanyCnpjModal(true)
              } else {
                setShowEmitSalesModal(true)
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-95 text-white text-xs font-black transition-all shadow-md shadow-pink-500/20 cursor-pointer"
            title="Emitir Nota Fiscal de Venda (NF-e / NFC-e para clientes)"
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>Emitir NF Venda</span>
          </button>

          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white text-xs font-black transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            title="Criar novo pedido de compra de insumos"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>Nova Compra</span>
          </button>

          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2235] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Cadastrar novo fornecedor por CNPJ"
          >
            <Building2 className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Fornecedor</span>
          </button>

          <button
            onClick={() => setShowNewTransaction(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-black transition-all border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Lançamento manual avulso de entrada ou saída"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Lançar Avulso</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* NAVEGAÇÃO DE SUB-ABAS FINANCEIRAS          */}
      {/* ═══════════════════════════════════════════ */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-100 dark:bg-[#0E131F] rounded-2xl border border-slate-200 dark:border-slate-800 custom-scrollbar">
        {[
          { id: 'fluxo', label: 'Fluxo de Caixa', icon: Wallet },
          { id: 'invoices', label: 'Notas Fiscais (NF-e)', icon: Receipt, badge: invoices.length || undefined },
          { id: 'compras', label: 'Pedidos de Compras', icon: ShoppingCart, badge: purchases.length || undefined },
          { id: 'fornecedores', label: 'Fornecedores (CNPJ)', icon: Building2, badge: suppliers.length || undefined },
          { id: 'dre', label: 'DRE & Rentabilidade', icon: TrendingUp },
          { id: 'servicos', label: 'Faturamento por Serviço', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTabType)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#1E2638] text-pink-600 dark:text-pink-400 shadow-md border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-pink-500' : 'opacity-70'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-pink-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ABA 1: FLUXO DE CAIXA (ENTRADAS & SAÍDAS)  */}
      {/* ═══════════════════════════════════════════ */}
      {activeSubTab === 'fluxo' && (
        <div className="space-y-6 animate-fade-in">
          {/* CARDS DE SALDO & METRICAS PRINCIPAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Saldo Atual Realizado */}
            <div className="card-simple p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-lg shadow-emerald-600/20 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-90">
                  Saldo Realizado em Caixa
                </span>
                <Wallet className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-2xl font-black font-mono mt-2">
                {formatCurrency(filteredFinanceStats.balance)}
              </p>
              <p className="text-[11px] opacity-80 mt-1">
                Entradas pagas ({formatCurrency(receivedTotal)}) - Saídas pagas ({formatCurrency(paidTotal)})
              </p>
            </div>

            {/* Entradas Previstas */}
            <div className="card-simple p-5 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Entradas a Receber
                </span>
                <ArrowUpRight className="w-5 h-5 text-cyan-500" />
              </div>
              <p className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-2">
                {formatCurrency(filteredFinanceStats.pendingReceivable)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Restantes de encomendas e agendamentos</p>
            </div>

            {/* Contas a Pagar */}
            <div className="card-simple p-5 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                  Contas a Pagar (Saídas)
                </span>
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-black font-mono text-red-600 dark:text-red-400 mt-2">
                {formatCurrency(filteredFinanceStats.pendingPayable)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Notas Fiscais e despesas a vencer</p>
            </div>

            {/* Contas Vencidas / Alerta */}
            <div
              className={`card-simple p-5 border shadow-sm ${
                overdueTotal > 0
                  ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  : 'bg-white dark:bg-[#131826] border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Contas Vencidas
                </span>
                <AlertTriangle className={`w-5 h-5 ${overdueTotal > 0 ? 'text-red-500' : 'opacity-40'}`} />
              </div>
              <p className="text-2xl font-black font-mono mt-2">
                {formatCurrency(overdueTotal)}
              </p>
              <p className="text-[11px] mt-1">
                {overduePayables.length > 0
                  ? `${overduePayables.length} conta(s) em atraso exigindo atenção`
                  : 'Nenhuma conta em atraso! 🎉'}
              </p>
            </div>
          </div>

          {/* PAINEL DE FILTROS AVANÇADOS */}
          <div className="card-simple p-5 space-y-4 bg-white/60 dark:bg-[#131826]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-white">
                <Filter className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-black uppercase tracking-wider">Filtros do Fluxo</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const ok = exportFinanceToCSV(filteredTransactions)
                    if (!ok) showToast('Nenhuma transação para exportar.', 'error')
                    else showToast('Lançamentos exportados para Excel (CSV)!', 'success')
                  }}
                  disabled={filteredTransactions.length === 0}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => openPdfExportModal('finance')}
                  disabled={transactions.length === 0}
                  className="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 text-xs font-bold rounded-xl border border-pink-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              {/* Busca Rápida */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Busca (Descrição ou Fornecedor)
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por texto..."
                    value={financeSearchQuery}
                    onChange={(e) => setFinanceSearchQuery(e.target.value)}
                    className="input-simple pl-9 py-2 text-xs w-full font-semibold"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status de Pagamento
                </label>
                <select
                  value={financePaidFilter}
                  onChange={(e) => setFinancePaidFilter(e.target.value)}
                  className="input-simple py-2 text-xs w-full cursor-pointer font-semibold"
                >
                  <option value="all">Todos os Status</option>
                  <option value="paid">Pagas / Recebidas</option>
                  <option value="unpaid">Pendentes</option>
                </select>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <select
                  value={financeCategoryFilter}
                  onChange={(e) => setFinanceCategoryFilter(e.target.value)}
                  className="input-simple py-2 text-xs w-full cursor-pointer font-semibold"
                >
                  <option value="all">Todas as Categorias</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Período */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Período
                </label>
                <select
                  value={financeDateRange}
                  onChange={(e) => setFinanceDateRange(e.target.value)}
                  className="input-simple py-2 text-xs w-full cursor-pointer font-semibold"
                >
                  <option value="all">Qualquer Período</option>
                  <option value="today">Hoje</option>
                  <option value="thisMonth">Este Mês</option>
                  <option value="lastMonth">Mês Passado</option>
                  <option value="last30">Últimos 30 Dias</option>
                  <option value="last90">Últimos 90 Dias</option>
                  <option value="custom">Personalizado...</option>
                </select>
              </div>
            </div>

            {financeDateRange === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={financeStartDate}
                    onChange={(e) => setFinanceStartDate(e.target.value)}
                    className="input-simple py-1.5 text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={financeEndDate}
                    onChange={(e) => setFinanceEndDate(e.target.value)}
                    className="input-simple py-1.5 text-xs w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* TABELA DE LANÇAMENTOS COM ORIGEM INTELIGENTE */}
          <div className="card-simple overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Lançamentos ({filteredTransactions.length})
              </span>
              <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
                <button
                  onClick={() => setFinanceFilter('all')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    financeFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
                  }`}
                >
                  Tudo
                </button>
                <button
                  onClick={() => setFinanceFilter('receivable')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    financeFilter === 'receivable'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-emerald-600'
                  }`}
                >
                  Entradas (+)
                </button>
                <button
                  onClick={() => setFinanceFilter('payable')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    financeFilter === 'payable'
                      ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-slate-500 hover:text-red-600'
                  }`}
                >
                  Saídas (-)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Descrição & Origem</th>
                    <th className="px-6 py-4">Data Vencimento</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions
                    .filter((tx) => financeFilter === 'all' || tx.type === financeFilter)
                    .map((tx) => {
                      const isOverdue = !tx.paid && tx.dueDate < todayStr && tx.type === 'payable'
                      const isFromInvoice = Boolean(tx.invoiceId || tx.category?.includes('(NF)') || tx.description.startsWith('NF #'))
                      const isFromOrder = tx.description.includes('#ENK-') || tx.category?.includes('Encomenda')

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group"
                        >
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleTx(tx.id)}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                tx.paid
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                              }`}
                              title={tx.paid ? 'Clique para marcar como pendente' : 'Clique para marcar como pago/recebido'}
                            >
                              {tx.paid && <Check className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                              {tx.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  tx.type === 'receivable'
                                    ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                                    : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                                }`}
                              >
                                {tx.type === 'receivable' ? 'Entrada' : 'Saída'}
                              </span>

                              {isFromInvoice && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                  <Receipt className="w-2.5 h-2.5" />
                                  Nota Fiscal
                                </span>
                              )}

                              {isFromOrder && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
                                  BoraEnkomenda
                                </span>
                              )}

                              {tx.category && (
                                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                  {tx.category}
                                </span>
                              )}

                              {tx.clientName && (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  • {tx.clientName}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <span>{formatDate(tx.dueDate)}</span>
                            {isOverdue && (
                              <span className="block text-[10px] font-black text-red-500 uppercase mt-0.5">
                                Em atraso
                              </span>
                            )}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-black text-sm font-mono ${
                              tx.type === 'receivable'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {tx.type === 'receivable' ? '+' : '-'} {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteTx(tx.id)}
                              className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>

              {filteredTransactions.filter((tx) => financeFilter === 'all' || tx.type === financeFilter).length === 0 && (
                <div className="text-center py-16 text-xs text-slate-400 font-medium">
                  Nenhum lançamento financeiro encontrado com os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ABA 2: NOTAS FISCAIS (GASTOS DESTRINCHADOS)*/}
      {/* ═══════════════════════════════════════════ */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-5 animate-fade-in">
            {/* Banner Informativo de Conformidade Fiscal SEFAZ */}
            {!hasCompanyCnpj ? (
              <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-blue-900 dark:text-blue-200 flex items-center gap-2">
                      <span>Entrada de Notas e Estoque Liberados</span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                        Livre de CNPJ
                      </span>
                    </h4>
                    <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                      Você pode dar entrada em notas fiscais de fornecedores, importar XML e alimentar seu estoque livremente. Caso queira <strong>emitir notas de venda (SEFAZ)</strong> para clientes, cadastre o CNPJ da sua empresa.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompanyCnpjModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-95 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Configurar CNPJ para Vendas</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-emerald-800 dark:text-emerald-200 font-black">
                      Empresa Habilitada para NF-e:
                    </span>{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {adminInfo?.businessName || 'Empresa'}
                    </span>{' '}
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      (CNPJ: {formatCNPJ(companyCnpjClean)})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCompanyCnpjModal(true)}
                  className="text-[11px] font-bold text-slate-400 hover:text-emerald-500 underline cursor-pointer self-start sm:self-auto"
                >
                  Alterar CNPJ
                </button>
              </div>
            )}

            {/* Header e Ações */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-500" />
                  Notas Fiscais (Entradas & Vendas)
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Módulo fiscal completo: Entrada de mercadorias no estoque e emissão de notas de venda (SEFAZ)
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <button
                  onClick={() => {
                    if (!hasCompanyCnpj) {
                      setShowCompanyCnpjModal(true)
                    } else {
                      setShowEmitSalesModal(true)
                    }
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-pink-500/20 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Emitir NF de Venda</span>
                </button>

                <button
                  onClick={() => setShowImportXmlModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Dar Entrada via XML</span>
                </button>

                <button
                  onClick={() => {
                    setImportedXmlData(null)
                    setShowInvoiceModal(true)
                  }}
                  className="btn-primary-simple text-xs flex items-center gap-1.5 py-2.5 px-4 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Entrada Manual</span>
                </button>
              </div>
            </div>

          {/* Filtro por Direção (Entrada x Saída) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setInvoiceDirectionFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                invoiceDirectionFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Todas as Notas
            </button>
            <button
              onClick={() => setInvoiceDirectionFilter('ENTRADA')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                invoiceDirectionFilter === 'ENTRADA'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 hover:text-emerald-500'
              }`}
            >
              <span>📥 Entrada (Compras & Insumos)</span>
            </button>
            <button
              onClick={() => setInvoiceDirectionFilter('SAIDA')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                invoiceDirectionFilter === 'SAIDA'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 hover:text-pink-500'
              }`}
            >
              <span>📤 Vendas Emitidas (Clientes)</span>
            </button>
          </div>

          {/* Filtros das Notas Fiscais */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Buscar por Número ou Fornecedor
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: 000.124 ou Fornecedor..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="input-simple pl-9 py-2 text-xs w-full font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Status de Pagamento
              </label>
              <select
                value={invoicePaidFilter}
                onChange={(e) => setInvoicePaidFilter(e.target.value as any)}
                className="input-simple py-2 text-xs w-full font-bold cursor-pointer"
              >
                <option value="all">Todas as Notas</option>
                <option value="pending">Apenas Pendentes (A Pagar)</option>
                <option value="paid">Apenas Pagas</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadInvoices}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all w-full cursor-pointer"
              >
                Atualizar Lista
              </button>
            </div>
          </div>

          {/* Lista de Notas Fiscais */}
          {loadingInvoices ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Carregando notas fiscais...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-[#131826] border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Nenhuma Nota Fiscal cadastrada
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Lance as notas fiscais dos seus fornecedores de insumos, embalagens e equipamentos para ter controle detalhado de custos.
              </p>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md cursor-pointer"
              >
                Lançar Primeira Nota Fiscal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          NF #{inv.invoiceNumber}
                        </span>
                        {inv.series && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Série {inv.series}
                          </span>
                        )}
                        {inv.direction === 'SAIDA' ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
                            📤 Venda (Saída)
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            📥 Entrada (Compra)
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                        {inv.direction === 'SAIDA'
                          ? `Cliente: ${inv.clientName || 'Consumidor Final'}`
                          : inv.supplier?.tradeName || inv.supplier?.corporateName || 'Fornecedor avulso'}
                      </p>
                      {(inv.direction === 'SAIDA' ? inv.clientDocument : inv.supplier?.cnpj) && (
                        <p className="text-[11px] text-slate-400 font-mono">
                          Doc: {inv.direction === 'SAIDA' ? inv.clientDocument : formatCNPJ(inv.supplier?.cnpj || '')}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                        {formatCurrency(inv.totalAmount)}
                      </span>
                      <span
                        className={`inline-block text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1 ${
                          inv.status === 'AUTORIZADA'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : inv.paid
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}
                      >
                        {inv.status === 'AUTORIZADA' ? 'AUTORIZADA' : inv.paid ? 'PAGA' : 'A PAGAR'}
                      </span>
                    </div>
                  </div>

                  {/* Resumo dos Itens Destrinchados */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1A2235] border border-slate-200/60 dark:border-slate-800/60 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <span>Gastos Destrinchados</span>
                      <span>{inv.items?.length || 0} item(ns)</span>
                    </div>

                    {inv.items && inv.items.slice(0, 2).map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="truncate max-w-[200px]">{it.description}</span>
                        <span className="font-mono font-bold">{formatCurrency(it.totalPrice)}</span>
                      </div>
                    ))}
                    {inv.items && inv.items.length > 2 && (
                      <p className="text-[10px] text-slate-400 font-semibold italic">
                        + {inv.items.length - 2} outro(s) item(ns)...
                      </p>
                    )}
                  </div>

                  {/* Vencimento e Ações */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400 font-semibold">
                      Vencimento: <strong className="text-slate-700 dark:text-slate-200">{formatDate(inv.dueDate)}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleInvoicePaid(inv.id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-colors cursor-pointer ${
                          inv.paid
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600'
                        }`}
                        title="Alternar status pago"
                      >
                        {inv.paid ? 'Estornar' : 'Pagar'}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedInvoice(inv)
                          setShowInvoiceDetails(true)
                        }}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver Gastos</span>
                      </button>

                      <button
                        onClick={() => handleDeleteInvoice(inv.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Excluir NF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ABA 3: COMPRAS                             */}
      {/* ═══════════════════════════════════════════ */}
      {activeSubTab === 'compras' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                Pedidos de Compras
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Planejamento e acompanhamento de compras com fornecedores cadastrados
              </p>
            </div>

            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Pedido de Compra</span>
            </button>
          </div>

          {/* Filtros */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2">Status:</span>
            {['ALL', 'PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setPurchaseStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  purchaseStatusFilter === st
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL'
                  ? 'Todos'
                  : st === 'PENDING'
                  ? 'Pendente'
                  : st === 'APPROVED'
                  ? 'Aprovado'
                  : st === 'RECEIVED'
                  ? 'Recebido'
                  : 'Cancelado'}
              </button>
            ))}
          </div>

          {loadingPurchases ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Carregando compras...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-[#131826] border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Nenhum pedido de compra encontrado
              </p>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition-all shadow-md cursor-pointer"
              >
                Criar Primeiro Pedido
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchases.map((pur) => (
                <div
                  key={pur.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {pur.purchaseNumber}
                      </span>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                        {pur.supplier?.tradeName || pur.supplier?.corporateName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Data: {formatDate(pur.purchaseDate)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black font-mono text-orange-600 dark:text-orange-400 block">
                        {formatCurrency(pur.totalAmount)}
                      </span>
                      <span
                        className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${
                          pur.status === 'RECEIVED'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : pur.status === 'APPROVED'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : pur.status === 'CANCELLED'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}
                      >
                        {pur.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1A2235] text-xs space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Itens do Pedido ({pur.items?.length || 0})
                    </span>
                    {pur.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                        <span>
                          {it.quantity} {it.unit} • {it.name}
                        </span>
                        <span className="font-mono font-bold">{formatCurrency(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {pur.expectedDeliveryDate ? `Entrega: ${formatDate(pur.expectedDeliveryDate)}` : 'Sem data de entrega'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {pur.status !== 'RECEIVED' && pur.status !== 'CANCELLED' && (
                        <button
                          onClick={() => {
                            const addStock = window.confirm('Deseja atualizar a quantidade desses insumos no Estoque ao receber?')
                            handleUpdatePurchaseStatus(pur.id, 'RECEIVED', addStock)
                          }}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-xl text-[11px] font-black transition-colors cursor-pointer"
                        >
                          Marcar Recebida
                        </button>
                      )}

                      <button
                        onClick={() => handleDeletePurchase(pur.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Excluir pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ABA 4: FORNECEDORES (POR CNPJ)             */}
      {/* ═══════════════════════════════════════════ */}
      {activeSubTab === 'fornecedores' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                Fornecedores Cadastrados por CNPJ
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Parceiros cadastrados com consulta automática de dados públicos da Receita Federal
              </p>
            </div>

            <button
              onClick={() => setShowSupplierModal(true)}
              className="btn-primary-simple text-xs flex items-center gap-1.5 py-2.5 px-4 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Fornecedor (CNPJ)</span>
            </button>
          </div>

          {/* Busca de Fornecedores */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por CNPJ, Razão Social ou Nome Fantasia..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="input-simple pl-10 py-2.5 text-xs w-full font-bold"
              />
            </div>
          </div>

          {loadingSuppliers ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Carregando fornecedores...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-[#131826] border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Nenhum fornecedor cadastrado
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Cadastre seus fornecedores com CNPJ para vincular compras, notas fiscais e contatos de WhatsApp em um só lugar.
              </p>
              <button
                onClick={() => setShowSupplierModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black text-xs transition-all shadow-md cursor-pointer"
              >
                Cadastrar Fornecedor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">
                        {sup.tradeName || sup.corporateName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {formatCNPJ(sup.cnpj)}
                      </p>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {sup.category}
                    </span>
                  </div>

                  {sup.tradeName && sup.corporateName !== sup.tradeName && (
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      Razão: {sup.corporateName}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {sup.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">WhatsApp:</span>
                        <a
                          href={`https://wa.me/55${sup.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {sup.phone}
                        </a>
                      </div>
                    )}

                    {sup.paymentTerms && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Pagamento:</span>
                        <span className="font-bold">{sup.paymentTerms}</span>
                      </div>
                    )}

                    {sup.address && (
                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        📍 {sup.address}
                      </p>
                    )}
                  </div>

                  {/* Resumo de compras/NFs */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1A2235] text-[11px] flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Total em NFs:</span>
                    <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(sup.totalPurchased || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ABA 5: DRE & RENTABILIDADE                 */}
      {/* ═══════════════════════════════════════════ */}
      {activeSubTab === 'dre' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Demonstrativo de Resultado do Exercício (DRE)
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Análise da margem bruta, custos de insumos das NFs e lucro líquido real
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#1A2235] rounded-xl">
              {[
                { id: 'thisMonth', label: 'Este Mês' },
                { id: 'lastMonth', label: 'Mês Passado' },
                { id: 'last90', label: 'Últimos 90 Dias' },
                { id: 'thisYear', label: 'Ano Atual' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDrePeriod(p.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    drePeriod === p.id
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {dreLoading ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Calculando DRE do período...</p>
            </div>
          ) : dreData ? (
            <div className="space-y-6">
              {/* Cards Resumo do DRE */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card-simple p-5 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                    (+) Receita Operacional Bruta
                  </span>
                  <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(dreData.summary.grossRevenue)}
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">Vendas e atendimentos realizados</span>
                </div>

                <div className="card-simple p-5 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-red-500 block mb-1">
                    (-) Custos de Insumos / NFs (CMV)
                  </span>
                  <p className="text-2xl font-black font-mono text-red-500">
                    {formatCurrency(dreData.summary.cogs)}
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">Matéria-prima e embalagens</span>
                </div>

                <div className="card-simple p-5 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 block mb-1">
                    (=) Lucro Bruto
                  </span>
                  <p className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                    {formatCurrency(dreData.summary.grossProfit)}
                  </p>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold mt-1 block">
                    Margem Bruta: {dreData.summary.grossMarginPercent}%
                  </span>
                </div>

                <div className="card-simple p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg">
                  <span className="text-[10px] font-black uppercase text-emerald-400 block mb-1">
                    (=) Lucro Líquido Real
                  </span>
                  <p className="text-2xl font-black font-mono text-white">
                    {formatCurrency(dreData.summary.netIncome)}
                  </p>
                  <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                    Margem Líquida: {dreData.summary.netMarginPercent}%
                  </span>
                </div>
              </div>

              {/* Tabela Estruturada do DRE */}
              <div className="card-simple p-6 bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Estrutura Contábil do Período
                </h4>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  <div className="py-3 flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                    <span>1. (+) RECEITA OPERACIONAL BRUTA</span>
                    <span className="font-mono">{formatCurrency(dreData.summary.grossRevenue)}</span>
                  </div>

                  <div className="py-3 pl-4 flex justify-between text-xs text-slate-500">
                    <span>2. (-) CUSTOS DAS MERCADORIAS / INSUMOS (NFs)</span>
                    <span className="font-mono font-bold text-red-500">
                      - {formatCurrency(dreData.summary.cogs)}
                    </span>
                  </div>

                  <div className="py-3 flex justify-between font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#1A2235] px-3 rounded-xl">
                    <span>3. (=) LUCRO BRUTO</span>
                    <span className="font-mono">{formatCurrency(dreData.summary.grossProfit)}</span>
                  </div>

                  <div className="py-3 pl-4 flex justify-between text-xs text-slate-500">
                    <span>4. (-) DESPESAS OPERACIONAIS & FIXAS</span>
                    <span className="font-mono font-bold text-red-500">
                      - {formatCurrency(dreData.summary.operatingExpenses)}
                    </span>
                  </div>

                  <div className="py-3.5 flex justify-between font-black text-base text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 rounded-xl border border-emerald-500/20">
                    <span>5. (=) LUCRO LÍQUIDO DO EXERCÍCIO</span>
                    <span className="font-mono">{formatCurrency(dreData.summary.netIncome)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Nenhum dado financeiro para o período selecionado.
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ABA 6: FATURAMENTO POR SERVIÇO (ETAPA 3-F) */}
      {/* ═══════════════════════════════════════════ */}
      {activeSubTab === 'servicos' && (
        <div className="space-y-6 animate-fade-in">
          <div className="card-simple p-6 sm:p-8 bg-gradient-to-br from-white to-slate-50 dark:from-[#131826] dark:to-[#0D111E] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-black">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Faturamento por Serviço & Período
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                  Análise detalhada de rentabilidade, ticket médio e participação de receitas
                </p>
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
                  { id: 'custom', label: 'Personalizado' },
                ].map((p) => (
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
                    onChange={(e) => setRevenueStartDate(e.target.value)}
                    className="input-simple text-xs py-1.5 px-3 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-400 font-bold">até</span>
                  <input
                    type="date"
                    value={revenueEndDate}
                    onChange={(e) => setRevenueEndDate(e.target.value)}
                    className="input-simple text-xs py-1.5 px-3 font-mono font-bold"
                  />
                </div>
              )}
            </div>

            {/* Cards de Métricas */}
            {revenueReportData && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                    Faturamento Realizado
                  </span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(revenueReportData.summary.totalRevenue)}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                    Faturamento Pendente
                  </span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {formatCurrency(revenueReportData.summary.pendingRevenue)}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 block mb-1">
                    Atendimentos Concluídos
                  </span>
                  <span className="text-xl font-black text-pink-600 dark:text-pink-400">
                    {revenueReportData.summary.totalCompletedBookings} serviço(s)
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 block mb-1">
                    Ticket Médio Geral
                  </span>
                  <span className="text-xl font-black text-violet-600 dark:text-violet-400 font-mono">
                    {formatCurrency(revenueReportData.summary.averageTicket)}
                  </span>
                </div>
              </div>
            )}

            {/* Tabela por Serviço */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Detalhamento por Serviço
              </h4>
              {revenueLoading ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">Gerando relatório...</p>
                </div>
              ) : !revenueReportData || revenueReportData.byService.length === 0 ? (
                <div className="p-8 text-center text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  Nenhum serviço faturado neste período.
                </div>
              ) : (
                <div className="space-y-3">
                  {revenueReportData.byService.map((s: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2235] border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-pink-500/10 text-pink-500 font-black text-[10px] flex items-center justify-center">
                            #{i + 1}
                          </span>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white text-sm">
                              {s.serviceName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                              {s.completedBookings} de {s.totalBookings} atendimento(s) concluído(s) • Ticket Médio: <span className="font-mono">{formatCurrency(s.avgTicket)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-500 font-mono text-base block">
                            {formatCurrency(s.totalRevenue)}
                          </span>
                          <span className="text-[10px] font-bold text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20 inline-block mt-0.5">
                            {s.percentageOfTotal}% da receita
                          </span>
                        </div>
                      </div>

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
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL: NOVO FORNECEDOR                     */}
      {/* ═══════════════════════════════════════════ */}
      <NewSupplierModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSupplierCreated={(newSup) => {
          setSuppliers((prev) => [newSup, ...prev])
        }}
        showToast={showToast}
      />

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL: NOVA NOTA FISCAL                    */}
      {/* ═══════════════════════════════════════════ */}
      <NewInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false)
          setImportedXmlData(null)
        }}
        onInvoiceCreated={(newInv) => {
          setInvoices((prev) => [newInv, ...prev])
          if (onRefreshData) onRefreshData()
        }}
        showToast={showToast}
        onOpenNewSupplier={() => {
          setShowInvoiceModal(false)
          setShowSupplierModal(true)
        }}
        suppliers={suppliers}
        companyCnpj={adminInfo?.cnpj}
        onRequireCnpjRegistration={() => setShowCompanyCnpjModal(true)}
        initialXmlData={importedXmlData}
      />

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL: IMPORTAR XML DA NF-E                */}
      {/* ═══════════════════════════════════════════ */}
      <ImportXmlModal
        isOpen={showImportXmlModal}
        onClose={() => setShowImportXmlModal(false)}
        companyCnpj={adminInfo?.cnpj}
        onXmlParsed={(data) => {
          setImportedXmlData(data)
          setShowInvoiceModal(true)
        }}
        showToast={showToast}
      />

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL: REGULARIZAÇÃO DE CNPJ DA EMPRESA    */}
      {/* ═══════════════════════════════════════════ */}
      <CompanyCnpjModal
        isOpen={showCompanyCnpjModal}
        onClose={() => setShowCompanyCnpjModal(false)}
        currentCnpj={adminInfo?.cnpj}
        businessName={adminInfo?.businessName}
        onCnpjUpdated={(newCnpj, newBusinessName) => {
          if (onUpdateAdminInfo) {
            onUpdateAdminInfo({
              ...(adminInfo || {}),
              cnpj: newCnpj,
              ...(newBusinessName ? { businessName: newBusinessName } : {}),
            })
          }
        }}
        showToast={showToast}
        onSuccessProceed={() => setShowInvoiceModal(true)}
      />

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL: DETALHES / ESPELHO DA NOTA FISCAL   */}
      {/* ═══════════════════════════════════════════ */}
      <InvoiceDetailsModal
        invoice={selectedInvoice}
        isOpen={showInvoiceDetails}
        onClose={() => {
          setShowInvoiceDetails(false)
          setSelectedInvoice(null)
        }}
        onTogglePaid={handleToggleInvoicePaid}
        onDeleteInvoice={handleDeleteInvoice}
        showToast={showToast}
        user={adminInfo}
      />

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL: NOVO PEDIDO DE COMPRA               */}
      {/* ═══════════════════════════════════════════ */}
      <NewPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchaseCreated={(newPur) => {
          setPurchases((prev) => [newPur, ...prev])
          if (onRefreshData) onRefreshData()
        }}
        showToast={showToast}
        onOpenNewSupplier={() => {
          setShowPurchaseModal(false)
          setShowSupplierModal(true)
        }}
        suppliers={suppliers}
      />

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL: EMITIR NOTA FISCAL DE VENDA        */}
      {/* ═══════════════════════════════════════════ */}
      <EmitSalesInvoiceModal
        isOpen={showEmitSalesModal}
        onClose={() => setShowEmitSalesModal(false)}
        onInvoiceEmitted={(newInv) => {
          setInvoices((prev) => [newInv, ...prev])
          if (onRefreshData) onRefreshData()
        }}
        showToast={showToast}
        companyCnpj={adminInfo?.cnpj}
        onRequireCnpjRegistration={() => setShowCompanyCnpjModal(true)}
      />
    </div>
  )
}
