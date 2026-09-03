import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  FileText,
  Building2,
  Calendar,
  Trash2,
  Printer,
  Check,
  Phone,
  Copy,
  Receipt,
  FileCode,
  DollarSign,
  Package,
  Download,
} from 'lucide-react'
import { InvoiceData } from '../../../types/dashboard'
import { formatCurrency, formatDate } from '../../../utils/dashboardHelpers'
import { formatCNPJ } from '../../../utils/cnpjHelper'

interface InvoiceDetailsModalProps {
  invoice: InvoiceData | null
  isOpen: boolean
  onClose: () => void
  onTogglePaid: (id: number) => void
  onDeleteInvoice: (id: number) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  user?: any
}

export function InvoiceDetailsModal({
  invoice,
  isOpen,
  onClose,
  onTogglePaid,
  onDeleteInvoice,
  showToast,
  user,
}: InvoiceDetailsModalProps) {
  const [toggling, setToggling] = useState(false)
  const [viewMode, setViewMode] = useState<'summary' | 'danfe'>('summary')
  const [copiedKey, setCopiedKey] = useState(false)

  if (!isOpen || !invoice) return null

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onTogglePaid(invoice.id)
    } finally {
      setToggling(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyKey = () => {
    if (!invoice.accessKey) return
    navigator.clipboard.writeText(invoice.accessKey)
    setCopiedKey(true)
    if (showToast) showToast('Chave de acesso copiada para a área de transferência!', 'success')
    setTimeout(() => setCopiedKey(false), 2000)
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md print:p-0 print:bg-white">
      <div className="bg-white dark:bg-[#131826] w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in text-slate-900 dark:text-slate-100 overflow-hidden my-auto print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">

        {/* ── Fixed Header ── */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Nota Fiscal #{invoice.invoiceNumber}
                </h3>
                {invoice.series && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    Série {invoice.series}
                  </span>
                )}
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    invoice.paid
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}
                >
                  {invoice.paid ? 'PAGA' : 'A PAGAR'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Espelho fiscal oficial e destrinchamento item a item
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Alternância de Modo */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'summary'
                    ? 'bg-white dark:bg-[#131826] text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Resumo
              </button>
              <button
                type="button"
                onClick={() => setViewMode('danfe')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'danfe'
                    ? 'bg-white dark:bg-[#131826] text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                DANFE Oficial
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar print:p-0">
          
          {/* MODO 1: RESUMO OPERACIONAL */}
          {viewMode === 'summary' && (
            <div className="space-y-4 animate-fade-in print:hidden">
              {/* Card Chave de Acesso */}
              {invoice.accessKey && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Chave de Acesso da NF-e (44 Dígitos)
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 break-all">
                      {invoice.accessKey}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-2 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-slate-500 dark:text-slate-300 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Copiar chave"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copiedKey ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              )}

              {/* Card Fornecedor & Resumo Financeiro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fornecedor */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span>Fornecedor (Emitente)</span>
                  </div>
                  {invoice.supplier ? (
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-sm">
                        {invoice.supplier.tradeName || invoice.supplier.corporateName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        CNPJ: {formatCNPJ(invoice.supplier.cnpj)}
                      </p>
                      {invoice.supplier.phone && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          {invoice.supplier.phone}
                        </p>
                      )}
                      {invoice.supplier.address && (
                        <p className="text-[11px] text-slate-400 mt-1 truncate">
                          📍 {invoice.supplier.address}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Fornecedor avulso.</p>
                  )}
                </div>

                {/* Pagamento e Vencimento */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <span>Condições Financeiras</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Emissão</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(invoice.issueDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Vencimento</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(invoice.dueDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Forma</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Natureza</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {invoice.naturezaOperacao || 'COMPRA'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Total da Nota:</span>
                    <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabela de Gastos Destrinchados */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Itens e Insumos Destrinchados ({invoice.items?.length || 0})
                  </h4>
                  <span className="text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400">
                    Soma: {formatCurrency(invoice.items?.reduce((acc, it) => acc + it.totalPrice, 0) || 0)}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#182032] border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Descrição</th>
                        <th className="px-3 py-2.5">Categoria</th>
                        <th className="px-3 py-2.5 text-center">Qtd</th>
                        <th className="px-3 py-2.5 text-right">Unitário</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#131826]">
                      {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-2.5">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {item.description}
                              </p>
                              {item.inventoryItem && (
                                <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
                                  <span>📦 Vinculado ao estoque:</span>
                                  <strong>{item.inventoryItem.name}</strong>
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {item.expenseCategory}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-700 dark:text-slate-300">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                            Nenhum item destrinchado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Duplicatas vinculadas se houver */}
              {invoice.transactions && invoice.transactions.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Duplicatas no Contas a Pagar ({invoice.transactions.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {invoice.transactions.map((tx: any, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 bg-white dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="text-[10px] text-slate-400 block">Vencimento</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {formatDate(tx.dueDate)}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {invoice.notes && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Observações Fiscais / Internas
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MODO 2: ESPELHO FISCAL DANFE OFICIAL */}
          {viewMode === 'danfe' && (
            <div className="space-y-3 font-sans text-black dark:text-slate-900 bg-white p-4 sm:p-6 rounded-2xl border-2 border-black/80 shadow-md animate-fade-in print:border-none print:p-0">
              
              {/* Canhoto de Entrega */}
              <div className="border border-black p-2 text-[10px] space-y-1">
                <div className="flex justify-between items-center border-b border-black pb-1">
                  <span>
                    RECEBEMOS DE{' '}
                    <strong>
                      {invoice.direction === 'SAIDA'
                        ? user?.businessName || 'EMPRESA EMISSORA'
                        : invoice.supplier?.tradeName || invoice.supplier?.corporateName || 'FORNECEDOR'}
                    </strong>{' '}
                    OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO
                  </span>
                  <span className="font-bold font-mono">NF-e Nº {invoice.invoiceNumber}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="border-r border-black pr-2">DATA DE RECEBIMENTO: ____/____/________</div>
                  <div className="col-span-2">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR: ________________________________________________</div>
                </div>
              </div>

              {/* Cabeçalho DANFE */}
              <div className="border border-black grid grid-cols-12 text-xs">
                <div className="col-span-4 p-3 border-r border-black space-y-1">
                  <p className="font-black text-sm uppercase">
                    {invoice.direction === 'SAIDA'
                      ? user?.businessName || 'EMPRESA EMISSORA'
                      : invoice.supplier?.tradeName || invoice.supplier?.corporateName || 'EMITENTE'}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {invoice.direction === 'SAIDA'
                      ? user?.address || 'Endereço Comercial'
                      : invoice.supplier?.address || 'Endereço Comercial'}
                  </p>
                  <p className="text-[10px] font-bold font-mono">
                    CNPJ:{' '}
                    {formatCNPJ(
                      (invoice.direction === 'SAIDA' ? user?.cnpj : invoice.supplier?.cnpj) || ''
                    )}
                  </p>
                  <p className="text-[10px] font-bold">
                    IE: {invoice.direction === 'SAIDA' ? user?.ie || 'ISENTO' : invoice.supplier?.stateRegistration || 'ISENTO'}
                  </p>
                </div>

                <div className="col-span-4 p-3 border-r border-black text-center space-y-1">
                  <span className="text-base font-black tracking-widest block">DANFE</span>
                  <span className="text-[9px] uppercase block font-bold">Documento Auxiliar da Nota Fiscal Eletrônica</span>
                  <div className="flex justify-center gap-4 text-[10px] font-bold py-1">
                    <span>0 - ENTRADA [{invoice.direction === 'SAIDA' ? ' ' : 'X'}]</span>
                    <span>1 - SAÍDA [{invoice.direction === 'SAIDA' ? 'X' : ' '}]</span>
                  </div>
                  <p className="text-xs font-black font-mono">Nº {invoice.invoiceNumber}</p>
                  <p className="text-[10px]">SÉRIE: {invoice.series || '1'}</p>
                </div>

                <div className="col-span-4 p-3 space-y-1.5 text-[10px]">
                  <span className="font-bold block uppercase">CHAVE DE ACESSO:</span>
                  <p className="font-mono font-bold text-[10px] break-all border border-black p-1 bg-slate-50">
                    {invoice.accessKey || 'CHAVE NÃO INFORMADA'}
                  </p>
                  <p className="text-[9px] text-slate-600">
                    Protocolo: {invoice.authorizationProtocol || '135260019482710'}
                  </p>
                </div>
              </div>

              {/* Destinatário */}
              <div className="border border-black p-2 text-[10px] space-y-1">
                <div className="font-bold uppercase text-[8px] text-slate-500">DESTINATÁRIO / REMETENTE</div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <span className="text-[8px] text-slate-500 block">NOME / RAZÃO SOCIAL</span>
                    <span className="font-bold">
                      {invoice.direction === 'SAIDA'
                        ? invoice.clientName || 'CONSUMIDOR FINAL NÃO IDENTIFICADO'
                        : user?.businessName || 'SUA EMPRESA'}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-[8px] text-slate-500 block">CNPJ / CPF</span>
                    <span className="font-bold font-mono">
                      {invoice.direction === 'SAIDA'
                        ? invoice.clientDocument || 'NÃO INFORMADO'
                        : formatCNPJ(user?.cnpj || '')}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-[8px] text-slate-500 block">DATA EMISSÃO</span>
                    <span className="font-bold">{formatDate(invoice.issueDate)}</span>
                  </div>
                </div>
              </div>

              {/* Natureza da Operação */}
              <div className="border border-black grid grid-cols-12 text-[10px] p-1.5">
                <div className="col-span-8">
                  <span className="font-bold uppercase block text-[8px] text-slate-500">NATUREZA DA OPERAÇÃO</span>
                  <span className="font-bold">
                    {invoice.naturezaOperacao || (invoice.direction === 'SAIDA' ? 'VENDA DE MERCADORIAS AO CONSUMIDOR' : 'COMPRA DE MERCADORIAS')}
                  </span>
                </div>
                <div className="col-span-4">
                  <span className="font-bold uppercase block text-[8px] text-slate-500">CFOP</span>
                  <span className="font-bold font-mono">{invoice.cfop || (invoice.direction === 'SAIDA' ? '5.102' : '1.102')}</span>
                </div>
              </div>

              {/* Cálculo do Imposto */}
              <div className="border border-black">
                <div className="bg-slate-100 p-1 font-bold text-[9px] uppercase border-b border-black">
                  CÁLCULO DO IMPOSTO
                </div>
                <div className="grid grid-cols-5 text-[10px] divide-x divide-black p-1">
                  <div className="p-1">
                    <span className="text-[8px] block uppercase text-slate-500">VALOR DO FRETE</span>
                    <span className="font-bold font-mono">{formatCurrency(invoice.freightAmount || 0)}</span>
                  </div>
                  <div className="p-1">
                    <span className="text-[8px] block uppercase text-slate-500">VALOR DO DESCONTO</span>
                    <span className="font-bold font-mono">{formatCurrency(invoice.discountAmount || 0)}</span>
                  </div>
                  <div className="p-1">
                    <span className="text-[8px] block uppercase text-slate-500">OUTRAS DESPESAS</span>
                    <span className="font-bold font-mono">{formatCurrency(invoice.otherExpenses || 0)}</span>
                  </div>
                  <div className="p-1">
                    <span className="text-[8px] block uppercase text-slate-500">TOTAL DOS PRODUTOS</span>
                    <span className="font-bold font-mono">
                      {formatCurrency(invoice.productsAmount || invoice.items?.reduce((acc, it) => acc + it.totalPrice, 0) || invoice.totalAmount)}
                    </span>
                  </div>
                  <div className="p-1 bg-slate-50">
                    <span className="text-[8px] block uppercase text-slate-500 font-black">VALOR TOTAL DA NOTA</span>
                    <span className="font-black font-mono text-sm">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Tabela de Produtos */}
              <div className="border border-black">
                <div className="bg-slate-100 p-1 font-bold text-[9px] uppercase border-b border-black">
                  DADOS DOS PRODUTOS / SERVIÇOS
                </div>
                <table className="w-full text-left text-[10px]">
                  <thead className="border-b border-black text-[8px] font-black uppercase bg-slate-50">
                    <tr>
                      <th className="p-1 border-r border-black">CÓDIGO</th>
                      <th className="p-1 border-r border-black">DESCRIÇÃO DOS PRODUTOS/SERVIÇOS</th>
                      <th className="p-1 border-r border-black">NCM</th>
                      <th className="p-1 border-r border-black">CFOP</th>
                      <th className="p-1 border-r border-black text-center">UN</th>
                      <th className="p-1 border-r border-black text-center">QTD</th>
                      <th className="p-1 border-r border-black text-right">VLR UNIT</th>
                      <th className="p-1 text-right">VLR TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/50">
                    {invoice.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-1 border-r border-black font-mono">{it.itemCode || `ITM-${idx + 1}`}</td>
                        <td className="p-1 border-r border-black font-bold">{it.description}</td>
                        <td className="p-1 border-r border-black font-mono">{it.ncm || '-'}</td>
                        <td className="p-1 border-r border-black font-mono">{it.cfop || invoice.cfop || '1102'}</td>
                        <td className="p-1 border-r border-black text-center uppercase">{it.unit}</td>
                        <td className="p-1 border-r border-black text-center font-mono">{it.quantity}</td>
                        <td className="p-1 border-r border-black text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                        <td className="p-1 text-right font-mono font-bold">{formatCurrency(it.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dados Adicionais */}
              <div className="border border-black p-2 text-[9px] space-y-1">
                <span className="font-bold uppercase text-[8px] text-slate-500 block">DADOS ADICIONAIS / INFORMAÇÕES COMPLEMENTARES</span>
                <p className="text-slate-700">{invoice.notes || 'Documento emitido conforme padrões fiscais SEFAZ.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Fixed Sticky Footer ── */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E131F] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            {invoice.xmlContent && (
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([invoice.xmlContent || ''], { type: 'application/xml' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `NFe_${invoice.accessKey || invoice.invoiceNumber}.xml`
                  a.click()
                  showToast('XML baixado com sucesso!', 'success')
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Baixar arquivo XML SEFAZ"
              >
                <Download className="w-4 h-4 text-pink-400" />
                <span>Baixar XML</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white dark:bg-[#182032] border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar DANFE</span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteInvoice(invoice.id)}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Excluir esta Nota Fiscal e seus lançamentos"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir NF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggling}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                invoice.paid
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white shadow-md shadow-emerald-600/25'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{invoice.paid ? 'Estornar Pagamento' : 'Marcar como Paga'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
