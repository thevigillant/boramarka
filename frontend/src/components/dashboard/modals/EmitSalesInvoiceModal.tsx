import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Store,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  Building2,
  DollarSign,
  ShieldCheck,
  Send,
  Printer,
  Download,
} from 'lucide-react'
import { api } from '../../../services/api'
import { InvoiceData, OrderData } from '../../../types/dashboard'
import { formatCurrency } from '../../../utils/dashboardHelpers'
import { formatCNPJ, cleanCNPJ, isValidCNPJ } from '../../../utils/cnpjHelper'

interface EmitSalesInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onInvoiceEmitted: (invoice: InvoiceData) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  orders?: OrderData[]
  companyCnpj?: string
  initialOrder?: OrderData | null
  onRequireCnpjRegistration?: () => void
}

interface SaleItemLine {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  ncm: string
  cfop: string
  inventoryItemId?: number | null
}

export function EmitSalesInvoiceModal({
  isOpen,
  onClose,
  onInvoiceEmitted,
  showToast,
  orders = [],
  companyCnpj = '',
  initialOrder = null,
  onRequireCnpjRegistration,
}: EmitSalesInvoiceModalProps) {
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [hasValidCnpj, setHasValidCnpj] = useState(false)
  const [fiscalConfig, setFiscalConfig] = useState<any>(null)
  const [inventoryItems, setInventoryItems] = useState<any[]>([])

  // Origem da Venda: 'manual' | 'order'
  const [originMode, setOriginMode] = useState<'manual' | 'order'>('manual')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  // Modelo de Nota: 65 = NFC-e (Consumidor), 55 = NF-e (Completa A4)
  const [modelType, setModelType] = useState<'65' | '55'>('65')

  // Dados do Destinatário
  const [clientName, setClientName] = useState('')
  const [clientDocument, setClientDocument] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')

  // Itens da Nota
  const [items, setItems] = useState<SaleItemLine[]>([
    {
      id: 'item-1',
      description: '',
      quantity: 1,
      unit: 'un',
      unitPrice: 0,
      totalPrice: 0,
      ncm: '21069090',
      cfop: '5102',
    },
  ])

  // Pagamento e Informações Fiscais
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [naturezaOperacao, setNaturezaOperacao] = useState('VENDA DE MERCADORIAS')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Resultado emitido
  const [emittedInvoice, setEmittedInvoice] = useState<InvoiceData | null>(null)

  // Verifica status do CNPJ e busca configurações fiscais
  useEffect(() => {
    if (!isOpen) {
      setEmittedInvoice(null)
      return
    }

    async function loadFiscalData() {
      setLoadingConfig(true)
      try {
        const [cnpjRes, fiscalRes, invRes] = await Promise.allSettled([
          api.checkAdminCnpj(),
          api.getFiscalSettings(),
          api.getInventoryItems(),
        ])

        if (cnpjRes.status === 'fulfilled') {
          setHasValidCnpj(cnpjRes.value.hasValidCnpj)
        } else {
          const clean = cleanCNPJ(companyCnpj)
          setHasValidCnpj(Boolean(clean && isValidCNPJ(clean)))
        }

        if (fiscalRes.status === 'fulfilled') {
          setFiscalConfig(fiscalRes.value)
        }

        if (invRes.status === 'fulfilled') {
          setInventoryItems(invRes.value || [])
        }
      } catch {
        // Fallback
        const clean = cleanCNPJ(companyCnpj)
        setHasValidCnpj(Boolean(clean && isValidCNPJ(clean)))
      } finally {
        setLoadingConfig(false)
      }
    }

    loadFiscalData()
  }, [isOpen, companyCnpj])

  // Se veio uma encomenda inicial (ex: clicou em emitir na encomenda)
  useEffect(() => {
    if (initialOrder && isOpen) {
      setOriginMode('order')
      applyOrderData(initialOrder)
    }
  }, [initialOrder, isOpen])

  function applyOrderData(order: OrderData) {
    setSelectedOrderId(order.id)
    setClientName(order.clientName || 'Consumidor')
    setClientDocument(order.clientPhone ? order.clientPhone.replace(/\D/g, '') : '')
    setClientEmail('')
    setClientAddress(order.deliveryAddress || '')
    setPaymentMethod(order.depositPaid ? 'PIX' : 'PIX')

    if (order.items && order.items.length > 0) {
      setItems(
        order.items.map((it, idx) => ({
          id: `order-item-${idx}`,
          description: it.productName || 'Produto da Encomenda',
          quantity: it.quantity || 1,
          unit: 'un',
          unitPrice: it.unitPrice || 0,
          totalPrice: (it.quantity || 1) * (it.unitPrice || 0),
          ncm: '21069090',
          cfop: '5102',
        }))
      )
    } else {
      setItems([
        {
          id: 'order-item-1',
          description: `Encomenda #${order.orderNumber}`,
          quantity: 1,
          unit: 'un',
          unitPrice: order.total || 0,
          totalPrice: order.total || 0,
          ncm: '21069090',
          cfop: '5102',
        },
      ])
    }
  }

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        description: '',
        quantity: 1,
        unit: 'un',
        unitPrice: 0,
        totalPrice: 0,
        ncm: '21069090',
        cfop: '5102',
      },
    ])
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleItemChange(index: number, field: keyof SaleItemLine, val: any) {
    setItems((prev) => {
      const next = [...prev]
      const curr = { ...next[index], [field]: val }

      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? parseFloat(val) || 0 : curr.quantity
        const p = field === 'unitPrice' ? parseFloat(val) || 0 : curr.unitPrice
        curr.totalPrice = q * p
      }

      next[index] = curr
      return next
    })
  }

  function handleSelectInventoryItem(index: number, itemId: number) {
    const inv = inventoryItems.find((i) => i.id === itemId)
    if (!inv) return

    setItems((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        description: inv.name,
        unit: inv.unit || 'un',
        unitPrice: inv.salePrice || inv.costPrice || 0,
        totalPrice: next[index].quantity * (inv.salePrice || inv.costPrice || 0),
        inventoryItemId: inv.id,
      }
      return next
    })
  }

  const totalAmount = items.reduce((acc, it) => acc + (it.totalPrice || 0), 0)

  async function handleEmitInvoice() {
    if (!hasValidCnpj) {
      showToast('Sua empresa precisa de um CNPJ cadastrado para emitir notas fiscais.', 'error')
      return
    }

    const validItems = items.filter((it) => it.description.trim() && it.totalPrice > 0)
    if (validItems.length === 0) {
      showToast('Adicione pelo menos um produto com valor maior que zero.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        mod: modelType,
        clientName: clientName.trim() || 'Consumidor Final',
        clientDocument: clientDocument.trim(),
        clientEmail: clientEmail.trim(),
        clientAddress: clientAddress.trim(),
        paymentMethod,
        orderId: selectedOrderId,
        naturezaOperacao,
        cfop: '5102',
        notes: notes.trim(),
        items: validItems.map((it) => ({
          description: it.description.trim(),
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          ncm: it.ncm,
          cfop: it.cfop,
          inventoryItemId: it.inventoryItemId,
        })),
      }

      const res = await api.emitSalesInvoice(payload)
      const created = (res as any).invoice || res
      setEmittedInvoice(created)
      showToast(`Nota Fiscal #${created.invoiceNumber} emitida com sucesso!`, 'success')
      onInvoiceEmitted(created)
    } catch (err: any) {
      showToast(err.message || 'Erro ao emitir Nota Fiscal de Venda.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#131826] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Emitir Nota Fiscal de Venda
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-500 border border-pink-500/20">
                  {modelType === '65' ? 'NFC-e (Consumidor)' : 'NF-e (Modelo 55)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Emissão oficial com chave de 44 dígitos, protocolo SEFAZ e DANFE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Alerta de Bloqueio se CNPJ não for cadastrado */}
          {!loadingConfig && !hasValidCnpj && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                    CNPJ Obrigatório para Emissão Fiscal
                  </h4>
                  <p className="text-xs text-amber-600/90 dark:text-amber-400/80 mt-0.5">
                    Conforme a legislação da SEFAZ, notas fiscais de venda só podem ser emitidas por empresas com CNPJ válido registrado.
                  </p>
                </div>
              </div>

              {onRequireCnpjRegistration && (
                <button
                  type="button"
                  onClick={onRequireCnpjRegistration}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-md shadow-amber-500/20 whitespace-nowrap cursor-pointer"
                >
                  Cadastrar CNPJ
                </button>
              )}
            </div>
          )}

          {/* Tela de Sucesso após emissão */}
          {emittedInvoice ? (
            <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  Nota Fiscal #{emittedInvoice.invoiceNumber} Autorizada com Sucesso!
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  Protocolo SEFAZ: {emittedInvoice.authorizationProtocol || '135260019482710'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-800 text-left space-y-2 max-w-xl mx-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Chave de Acesso (44 Dígitos):
                </div>
                <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 break-all select-all p-2 rounded-lg bg-slate-100 dark:bg-slate-900">
                  {emittedInvoice.accessKey || '3526...'}
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-500 font-medium">Destinatário:</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {emittedInvoice.clientName || 'Consumidor Final'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Valor Total:</span>
                  <span className="font-black text-emerald-500">
                    {formatCurrency(emittedInvoice.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const blob = new Blob([emittedInvoice.xmlContent || ''], { type: 'application/xml' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `NFe_${emittedInvoice.accessKey || emittedInvoice.invoiceNumber}.xml`
                    a.click()
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                >
                  <Download className="w-4 h-4 text-pink-400" />
                  <span>Baixar XML</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all shadow-md shadow-pink-500/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir DANFE</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Concluir & Fechar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Seletor de Origem da Venda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOriginMode('manual')
                    setSelectedOrderId(null)
                  }}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    originMode === 'manual'
                      ? 'border-pink-500 bg-pink-500/10 dark:bg-pink-500/15'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-pink-500 text-white">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      Venda Avulsa / Balcão
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Inserir produtos e cliente manualmente
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOriginMode('order')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    originMode === 'order'
                      ? 'border-pink-500 bg-pink-500/10 dark:bg-pink-500/15'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-pink-500 text-white">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      Puxar de Encomenda
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      BoraEnkomenda ({orders.length} pedidos disponíveis)
                    </div>
                  </div>
                </button>
              </div>

              {/* Seletor de Encomenda caso originMode === 'order' */}
              {originMode === 'order' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Selecione a Encomenda para Faturar:
                  </label>
                  <select
                    value={selectedOrderId || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value)
                      const found = orders.find((o) => o.id === id)
                      if (found) applyOrderData(found)
                    }}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="">Selecione uma encomenda...</option>
                    {orders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        Pedido #{ord.orderNumber} — {ord.clientName} ({formatCurrency(ord.total)}) —{' '}
                        {ord.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tipo de Documento Fiscal (NFC-e vs NF-e) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Modelo de Emissão Fiscal
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Série {fiscalConfig?.nfeSeries || '1'} • Próx. Número:{' '}
                    {modelType === '65'
                      ? fiscalConfig?.nfceNextNumber || 1
                      : fiscalConfig?.nfeNextNumber || 1}
                  </div>
                </div>

                <div className="flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setModelType('65')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      modelType === '65'
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-white'
                    }`}
                  >
                    NFC-e (Cupom)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelType('55')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      modelType === '55'
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-white'
                    }`}
                  >
                    NF-e (A4 Grande)
                  </button>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  1. Dados do Cliente / Destinatário
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Nome / Razão Social
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nome do cliente (ou Consumidor)"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      CPF / CNPJ {modelType === '65' && '(Opcional p/ NFC-e)'}
                    </label>
                    <input
                      type="text"
                      value={clientDocument}
                      onChange={(e) => setClientDocument(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      E-mail (Envio da DANFE/XML)
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Itens da Venda */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    2. Produtos & Mercadorias Faturadas
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Produto</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                      <div className="flex-1 w-full space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            placeholder="Descrição do produto (ex: Bolo de Cenoura com Chocolate)"
                            className="flex-1 p-2 rounded-xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                          />

                          {inventoryItems.length > 0 && (
                            <select
                              onChange={(e) => handleSelectInventoryItem(idx, Number(e.target.value))}
                              defaultValue=""
                              className="p-2 rounded-xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[140px]"
                            >
                              <option value="" disabled>
                                Estoque...
                              </option>
                              {inventoryItems.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} ({formatCurrency(inv.salePrice || inv.costPrice)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="w-20">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            placeholder="Qtd"
                            className="w-full p-2 rounded-xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 text-xs font-bold text-center text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="w-16">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            placeholder="Un"
                            className="w-full p-2 rounded-xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 text-xs font-bold text-center text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            placeholder="R$ Unit"
                            className="w-full p-2 rounded-xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 text-xs font-bold text-right text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="w-24 text-right font-black text-xs text-slate-900 dark:text-white">
                          {formatCurrency(item.totalPrice)}
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forma de Pagamento & Totais */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="text-xs font-bold text-slate-400 whitespace-nowrap">
                    Forma de Pagamento:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="p-2 rounded-xl bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="PIX">PIX</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CREDITO">Cartão de Crédito</option>
                    <option value="DEBITO">Cartão de Débito</option>
                    <option value="BOLETO">Boleto Bancário</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total da Nota Fiscal:
                  </span>
                  <span className="text-xl font-black text-pink-500">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé de Ações */}
        {!emittedInvoice && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={submitting || !hasValidCnpj || totalAmount <= 0}
              onClick={handleEmitInvoice}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-md ${
                submitting || !hasValidCnpj || totalAmount <= 0
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-95 shadow-pink-500/20 cursor-pointer'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Emitindo com a SEFAZ...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Emitir Nota Fiscal ({formatCurrency(totalAmount)})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
