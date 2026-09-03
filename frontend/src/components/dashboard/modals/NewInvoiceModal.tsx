import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  Sparkles,
  KeyRound,
  ShieldCheck,
  CreditCard,
  PackagePlus,
  AlertTriangle,
  UploadCloud,
  QrCode,
  ClipboardList,
} from 'lucide-react'
import { api } from '../../../services/api'
import { SupplierData, InvoiceData } from '../../../types/dashboard'
import { formatCurrency } from '../../../utils/dashboardHelpers'
import { formatCNPJ, cleanCNPJ, isValidCNPJ } from '../../../utils/cnpjHelper'
import { ParsedNfeData, decodeAccessKey, parseNfeXml } from '../../../utils/nfeXmlParser'
import { parseNfcePageText } from '../../../utils/nfcePageParser'

interface NewInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onInvoiceCreated: (invoice: InvoiceData) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  onOpenNewSupplier: () => void
  suppliers: SupplierData[]
  companyCnpj?: string
  onRequireCnpjRegistration?: () => void
  initialXmlData?: ParsedNfeData | null
}

interface ExpenseLineItem {
  id: string
  itemCode?: string
  description: string
  ncm?: string
  cfop?: string
  expenseCategory: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  discount?: number
  inventoryItemId?: number | string | null
}

interface InstallmentItem {
  number: number
  dueDate: string
  amount: number
}

type TabKey = 'header' | 'items' | 'totals' | 'billing' | 'stock'

export function NewInvoiceModal({
  isOpen,
  onClose,
  onInvoiceCreated,
  showToast,
  onOpenNewSupplier,
  suppliers,
  companyCnpj = '',
  onRequireCnpjRegistration,
  initialXmlData = null,
}: NewInvoiceModalProps) {
  // Verificação de CNPJ da empresa
  const cleanCompany = cleanCNPJ(companyCnpj)
  const hasValidCompanyCnpj = isValidCNPJ(cleanCompany)

  const [activeTab, setActiveTab] = useState<TabKey>('header')

  // Cabeçalho
  const [accessKey, setAccessKey] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [series, setSeries] = useState('')
  const [supplierId, setSupplierId] = useState<string>('')
  const [operationNature, setOperationNature] = useState('COMPRA DE MERCADORIAS')
  const [cfop, setCfop] = useState('1102')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')

  // Totais e Tributos
  const [productsAmount, setProductsAmount] = useState('0,00')
  const [freightAmount, setFreightAmount] = useState('0,00')
  const [discountAmount, setDiscountAmount] = useState('0,00')
  const [otherExpenses, setOtherExpenses] = useState('0,00')
  const [totalAmount, setTotalAmount] = useState('')

  // Faturamento e Cobrança
  const [paymentMethod, setPaymentMethod] = useState('BOLETO')
  const [paid, setPaid] = useState(false)
  const [installments, setInstallments] = useState<InstallmentItem[]>([])
  const [isInstallmentMode, setIsInstallmentMode] = useState(false)

  // Estoque e Observações
  const [updateStock, setUpdateStock] = useState(true)
  const [notes, setNotes] = useState('')
  const [xmlContent, setXmlContent] = useState('')

  // Lista de itens do estoque
  const [inventoryList, setInventoryList] = useState<any[]>([])

  // Lista de Itens destrinchados
  const [items, setItems] = useState<ExpenseLineItem[]>([
    {
      id: '1',
      description: '',
      expenseCategory: 'INSUMOS',
      quantity: 1,
      unit: 'un',
      unitPrice: 0,
      totalPrice: 0,
      cfop: '1102',
    },
  ])

  const [saving, setSaving] = useState(false)
  const [consultingKey, setConsultingKey] = useState(false)
  const [qrUrlInput, setQrUrlInput] = useState('')
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Carrega itens do estoque ao abrir
  useEffect(() => {
    if (isOpen) {
      api.getInventoryItems().then(setInventoryList).catch(() => {})
      if (suppliers.length > 0 && !supplierId) {
        setSupplierId(String(suppliers[0].id))
      }
    }
  }, [isOpen, suppliers])

  // Se receber dados de XML importado, popula imediatamente
  useEffect(() => {
    if (isOpen && initialXmlData && initialXmlData.success) {
      setAccessKey(initialXmlData.accessKey || '')
      setInvoiceNumber(initialXmlData.invoiceNumber || '')
      setSeries(initialXmlData.series || '1')
      setIssueDate(initialXmlData.issueDate || new Date().toISOString().split('T')[0])
      setOperationNature(initialXmlData.operationNature || 'COMPRA DE MERCADORIAS')
      setXmlContent(initialXmlData.rawXml || '')

      const total = initialXmlData.totals.totalAmount || 0
      setTotalAmount(total.toFixed(2).replace('.', ','))
      setProductsAmount(initialXmlData.totals.productsAmount.toFixed(2).replace('.', ','))
      setFreightAmount(initialXmlData.totals.freightAmount.toFixed(2).replace('.', ','))
      setDiscountAmount(initialXmlData.totals.discountAmount.toFixed(2).replace('.', ','))
      setOtherExpenses(initialXmlData.totals.otherExpenses.toFixed(2).replace('.', ','))

      // Vencimento a partir das duplicatas ou 30 dias
      if (initialXmlData.installments.length > 0) {
        setDueDate(initialXmlData.installments[0].dueDate)
        setIsInstallmentMode(initialXmlData.installments.length > 1)
        setInstallments(
          initialXmlData.installments.map((inst) => ({
            number: inst.number,
            dueDate: inst.dueDate,
            amount: inst.amount,
          }))
        )
      } else {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        setDueDate(d.toISOString().split('T')[0])
      }

      // Procura fornecedor existente pelo CNPJ do emitente
      const emitCnpj = cleanCNPJ(initialXmlData.emitter.cnpj)
      const foundSupplier = suppliers.find((s) => cleanCNPJ(s.cnpj) === emitCnpj)
      if (foundSupplier) {
        setSupplierId(String(foundSupplier.id))
      }

      // Popula itens com pré-vínculo inteligente ao estoque
      if (initialXmlData.items.length > 0) {
        setItems(
          initialXmlData.items.map((it) => {
            const match = inventoryList.find(
              (inv) => inv.name?.trim().toLowerCase() === it.description?.trim().toLowerCase()
            )
            return {
              id: it.id,
              itemCode: it.itemCode,
              description: it.description,
              ncm: it.ncm,
              cfop: it.cfop,
              expenseCategory: it.expenseCategory,
              quantity: it.quantity,
              unit: it.unit,
              unitPrice: it.unitPrice,
              totalPrice: it.totalPrice,
              discount: it.discount,
              inventoryItemId: match ? match.id : null,
            }
          })
        )
      }

      setUpdateStock(true)
      showToast('Dados do XML da NF-e carregados com sucesso!', 'success')
      setActiveTab('items')
    }
  }, [isOpen, initialXmlData, suppliers, inventoryList])

  if (!isOpen) return null

  // Carrega e preenche dados a partir de string XML
  const handleLoadXmlContent = (content: string) => {
    try {
      const parsed = parseNfeXml(content)
      if (!parsed.success || !parsed.items) {
        showToast(parsed.error || 'Não foi possível ler o arquivo XML.', 'error')
        return
      }

      setAccessKey(parsed.accessKey || '')
      setInvoiceNumber(parsed.invoiceNumber || '')
      setSeries(parsed.series || '1')
      setIssueDate(parsed.issueDate || new Date().toISOString().split('T')[0])
      setOperationNature(parsed.operationNature || 'COMPRA DE MERCADORIAS')
      setXmlContent(parsed.rawXml || content)

      const total = parsed.totals.totalAmount || 0
      setTotalAmount(total.toFixed(2).replace('.', ','))
      setProductsAmount(parsed.totals.productsAmount.toFixed(2).replace('.', ','))
      setFreightAmount(parsed.totals.freightAmount.toFixed(2).replace('.', ','))
      setDiscountAmount(parsed.totals.discountAmount.toFixed(2).replace('.', ','))
      setOtherExpenses(parsed.totals.otherExpenses.toFixed(2).replace('.', ','))

      if (parsed.installments && parsed.installments.length > 0) {
        setDueDate(parsed.installments[0].dueDate)
        setIsInstallmentMode(parsed.installments.length > 1)
        setInstallments(
          parsed.installments.map((inst) => ({
            number: inst.number,
            dueDate: inst.dueDate,
            amount: inst.amount,
          }))
        )
      } else {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        setDueDate(d.toISOString().split('T')[0])
      }

      const emitCnpj = cleanCNPJ(parsed.emitter.cnpj)
      const foundSupplier = suppliers.find((s) => cleanCNPJ(s.cnpj) === emitCnpj)
      if (foundSupplier) {
        setSupplierId(String(foundSupplier.id))
      }

      if (parsed.items && parsed.items.length > 0) {
        setItems(
          parsed.items.map((it) => {
            const match = inventoryList.find(
              (inv) => inv.name?.trim().toLowerCase() === it.description?.trim().toLowerCase()
            )
            return {
              id: it.id || String(it.itemNumber),
              itemCode: it.itemCode,
              description: it.description,
              ncm: it.ncm,
              cfop: it.cfop,
              expenseCategory: it.expenseCategory || 'INSUMOS',
              quantity: it.quantity,
              unit: it.unit || 'UN',
              unitPrice: it.unitPrice,
              totalPrice: it.totalPrice,
              discount: it.discount,
              inventoryItemId: match ? match.id : null,
            }
          })
        )
      }

      setUpdateStock(true)
      showToast(
        `XML da NF-e carregado! ${parsed.items.length} itens e total de ${formatCurrency(total)} preenchidos.`,
        'success'
      )
      setActiveTab('items')
    } catch (err: any) {
      showToast(err.message || 'Erro ao processar o arquivo XML.', 'error')
    }
  }

  // Upload direto de arquivo XML
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      handleLoadXmlContent(text)
    }
    reader.readAsText(file)
  }

  // Consulta da Chave na SEFAZ (busca itens, fornecedor e totais)
  const handleConsultSefaz = async (keyOverride?: string, customQrUrl?: string) => {
    const key = (keyOverride || accessKey).replace(/\D/g, '')
    if (key.length !== 44 && !customQrUrl) {
      showToast('Informe a chave de acesso completa com 44 dígitos ou a URL do QR Code.', 'error')
      return
    }

    setConsultingKey(true)
    try {
      const res = await api.consultInvoiceKey(key, customQrUrl || qrUrlInput)
      if (res && res.success) {
        setAccessKey(res.accessKey || key)
        if (res.invoiceNumber) setInvoiceNumber(res.invoiceNumber)
        if (res.series) setSeries(res.series)
        if (res.issueDate) setIssueDate(res.issueDate)
        if (res.operationNature) setOperationNature(res.operationNature)

        if (res.supplier?.id) {
          setSupplierId(String(res.supplier.id))
        }

        if (res.totals?.totalAmount && res.totals.totalAmount > 0) {
          setTotalAmount(res.totals.totalAmount.toFixed(2).replace('.', ','))
          setProductsAmount(res.totals.productsAmount.toFixed(2).replace('.', ','))
        }

        if (res.paymentMethod) {
          setPaymentMethod(res.paymentMethod)
          if (
            res.paymentMethod === 'CARTAO_CREDITO' ||
            res.paymentMethod === 'CARTAO_DEBITO' ||
            res.paymentMethod === 'DINHEIRO' ||
            res.paymentMethod === 'PIX'
          ) {
            setPaid(true)
          }
        }

        if (res.items && res.items.length > 0) {
          setItems(res.items)
          showToast(
            `Nota Fiscal localizada! ${res.items.length} itens e total de ${formatCurrency(
              res.totals?.totalAmount || 0
            )} carregados.`,
            'success'
          )
          setActiveTab('items')
        } else {
          showToast(
            `Nota identificada: NF nº ${res.invoiceNumber} (${res.supplier?.tradeName || 'Fornecedor'}). Carregue o arquivo XML ou informe os itens do cupom.`,
            'success'
          )
        }

        if (res.installments && res.installments.length > 0) {
          setDueDate(res.installments[0].dueDate)
          setInstallments(res.installments)
        }
      } else {
        showToast(res?.error || 'Não foi possível consultar os dados da nota.', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao consultar nota na SEFAZ.', 'error')
    } finally {
      setConsultingKey(false)
    }
  }

  // Extrair a partir de URL do QR Code
  const handleConsultQrUrl = () => {
    if (!qrUrlInput.trim()) return
    let key = ''
    if (qrUrlInput.includes('p=')) {
      const pParam = qrUrlInput.split('p=')[1]?.split('&')[0]
      if (pParam) {
        const firstPart = decodeURIComponent(pParam).split('|')[0]
        const clean = firstPart.replace(/\D/g, '')
        if (clean.length === 44) key = clean
      }
    }
    if (!key) {
      const match = qrUrlInput.match(/\d{44}/)
      if (match) key = match[0]
    }
    if (key) {
      setAccessKey(key)
    }
    handleConsultSefaz(key || accessKey, qrUrlInput)
  }

  // Processar texto copiado da página do cupom da SEFAZ
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      showToast('Cole o texto da página da SEFAZ antes de processar.', 'error')
      return
    }

    const res = parseNfcePageText(pastedText)
    if (!res.success || res.items.length === 0) {
      showToast('Não foi possível identificar itens no texto colado. Verifique a seleção.', 'error')
      return
    }

    setItems(res.items)

    if (res.totalAmount > 0) {
      setTotalAmount(res.totalAmount.toFixed(2).replace('.', ','))
      setProductsAmount(res.totalAmount.toFixed(2).replace('.', ','))
    }

    if (res.paymentMethod) {
      setPaymentMethod(res.paymentMethod)
      if (
        res.paymentMethod === 'CARTAO_CREDITO' ||
        res.paymentMethod === 'CARTAO_DEBITO' ||
        res.paymentMethod === 'DINHEIRO' ||
        res.paymentMethod === 'PIX'
      ) {
        setPaid(true)
      }
    }

    if (res.cnpj) {
      const clean = cleanCNPJ(res.cnpj)
      const found = suppliers.find((s) => cleanCNPJ(s.cnpj) === clean)
      if (found) setSupplierId(String(found.id))
    }

    if (res.accessKey) {
      setAccessKey(res.accessKey)
      const decoded = decodeAccessKey(res.accessKey)
      if (decoded.isValid) {
        if (decoded.invoiceNumber) setInvoiceNumber(decoded.invoiceNumber)
        if (decoded.series) setSeries(decoded.series)
      }
    }

    setShowPasteModal(false)
    setPastedText('')
    showToast(
      `Cupom da SEFAZ importado com sucesso! ${res.items.length} itens e total de ${formatCurrency(
        res.totalAmount
      )} preenchidos.`,
      'success'
    )
    setActiveTab('items')
  }

  // Manipulação da chave de 44 dígitos
  const handleAccessKeyChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 44)
    setAccessKey(clean)
    if (clean.length === 44) {
      const decoded = decodeAccessKey(clean)
      if (decoded.isValid) {
        if (!invoiceNumber && decoded.invoiceNumber) {
          setInvoiceNumber(decoded.invoiceNumber)
        }
        if (!series && decoded.series) {
          setSeries(decoded.series)
        }
        const found = suppliers.find((s) => cleanCNPJ(s.cnpj) === decoded.emitterCnpj)
        if (found) {
          setSupplierId(String(found.id))
        }
      }
      handleConsultSefaz(clean)
    }
  }

  // Atualização de item destrinchado
  const updateItem = (id: string, field: keyof ExpenseLineItem, val: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: val }

        if (field === 'quantity' || field === 'unitPrice') {
          const q = field === 'quantity' ? Number(val) || 0 : item.quantity
          const p = field === 'unitPrice' ? Number(val) || 0 : item.unitPrice
          updated.totalPrice = Number((q * p).toFixed(2))
        }

        if (field === 'inventoryItemId' && val) {
          const inv = inventoryList.find((i) => i.id === Number(val))
          if (inv) {
            if (!updated.description) updated.description = inv.name
            if (inv.unit) updated.unit = inv.unit
            if (inv.costPrice && !updated.unitPrice) {
              updated.unitPrice = inv.costPrice
              updated.totalPrice = Number((updated.quantity * inv.costPrice).toFixed(2))
            }
          }
        }

        return updated
      })
    )
  }

  const addItem = () => {
    const newItem: ExpenseLineItem = {
      id: Date.now().toString(),
      description: '',
      expenseCategory: 'INSUMOS',
      quantity: 1,
      unit: 'un',
      unitPrice: 0,
      totalPrice: 0,
      cfop: '1102',
    }
    setItems((prev) => [...prev, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      showToast('A nota fiscal deve ter pelo menos 1 item destrinchado.', 'error')
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  // Cálculos e conciliação
  const parseAmount = (val: string) => Number(val.replace(/\./g, '').replace(',', '.')) || 0
  const parsedTotal = parseAmount(totalAmount)
  const sumItems = items.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0)
  const difference = Number((parsedTotal - sumItems).toFixed(2))
  const isPerfectMatch = parsedTotal > 0 && Math.abs(difference) < 0.01

  const handleAddDifferenceAsExpense = () => {
    if (difference <= 0) return
    const diffItem: ExpenseLineItem = {
      id: Date.now().toString(),
      description: 'Frete / Taxas Adicionais da NF',
      expenseCategory: 'FRETE',
      quantity: 1,
      unit: 'un',
      unitPrice: difference,
      totalPrice: difference,
      cfop: '1352',
    }
    setItems((prev) => [...prev, diffItem])
    showToast('Diferença adicionada como item de Frete/Despesa.', 'success')
  }

  // Geração rápida de parcelas
  const handleGenerateInstallments = (count: number) => {
    if (parsedTotal <= 0 || !dueDate) {
      showToast('Informe o valor total e a primeira data de vencimento.', 'error')
      return
    }
    const partAmount = Number((parsedTotal / count).toFixed(2))
    const list: InstallmentItem[] = []
    const baseDate = new Date(dueDate)

    for (let i = 1; i <= count; i++) {
      const d = new Date(baseDate)
      d.setMonth(d.getMonth() + (i - 1))
      list.push({
        number: i,
        dueDate: d.toISOString().split('T')[0],
        amount: i === count ? Number((parsedTotal - partAmount * (count - 1)).toFixed(2)) : partAmount,
      })
    }
    setInstallments(list)
    setIsInstallmentMode(true)
  }

  // Envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!invoiceNumber.trim()) {
      setActiveTab('header')
      showToast('Informe o número da Nota Fiscal.', 'error')
      return
    }
    if (!supplierId) {
      setActiveTab('header')
      showToast('Selecione ou cadastre um Fornecedor.', 'error')
      return
    }
    if (parsedTotal <= 0) {
      setActiveTab('totals')
      showToast('Informe o valor total da Nota Fiscal.', 'error')
      return
    }
    if (!dueDate) {
      setActiveTab('header')
      showToast('Informe a data de vencimento da Nota Fiscal.', 'error')
      return
    }

    const validItems = items.filter((it) => it.description.trim() || it.totalPrice > 0)
    if (validItems.length === 0) {
      setActiveTab('items')
      showToast('Destrinche pelo menos um gasto para esta Nota Fiscal.', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        invoiceNumber: invoiceNumber.trim(),
        series: series.trim(),
        accessKey: accessKey.trim(),
        supplierId: Number(supplierId),
        issueDate,
        dueDate,
        totalAmount: parsedTotal,
        paymentMethod,
        paid,
        notes: notes.trim(),
        updateStock,
        cfop,
        naturezaOperacao: operationNature,
        productsAmount: parseAmount(productsAmount),
        freightAmount: parseAmount(freightAmount),
        discountAmount: parseAmount(discountAmount),
        otherExpenses: parseAmount(otherExpenses),
        xmlContent,
        installments: isInstallmentMode && installments.length > 0 ? installments : [],
        items: validItems.map((it) => ({
          description: it.description.trim() || 'Item da NF',
          expenseCategory: it.expenseCategory,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          itemCode: it.itemCode || '',
          ncm: it.ncm || '',
          cfop: it.cfop || cfop,
          discount: it.discount || 0,
          inventoryItemId: it.inventoryItemId === 'SKIP' ? null : (it.inventoryItemId ? Number(it.inventoryItemId) : null),
          skipStock: it.inventoryItemId === 'SKIP',
          createInventoryItem: it.inventoryItemId !== 'SKIP',
        })),
      }

      const res = await api.inboundInvoice(payload)
      const created = (res as any).invoice || res
      showToast(`Nota Fiscal #${created.invoiceNumber} lançada com sucesso no ERP!`, 'success')
      onInvoiceCreated(created)
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Erro ao lançar Nota Fiscal.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-[#131826] w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in text-slate-900 dark:text-slate-100 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Dar Entrada em Nota Fiscal (Compras & Insumos)
                </h3>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Estoque & Contas a Pagar
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Importe XML ou digite dados da NF para alimentar o estoque e gerar as despesas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação Estilo ERP */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111726]/50 overflow-x-auto custom-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`px-3.5 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'header'
                ? 'bg-white dark:bg-[#131826] text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>1. Cabeçalho & Fornecedor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`px-3.5 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'items'
                ? 'bg-white dark:bg-[#131826] text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Itens & Insumos ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('totals')}
            className={`px-3.5 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'totals'
                ? 'bg-white dark:bg-[#131826] text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Totais & Conciliação</span>
            {isPerfectMatch && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`px-3.5 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-white dark:bg-[#131826] text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>4. Faturamento & Duplicatas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-white dark:bg-[#131826] text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>5. Estoque & Observações</span>
          </button>
        </div>

        {/* Corpo Scrollável do Formulário */}
        <form
          id="new-invoice-form"
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar"
        >
          {/* ════ ABA 1: CABEÇALHO & FORNECEDOR ════ */}
          {activeTab === 'header' && (
            <div className="space-y-4 animate-fade-in">
              {/* Painel Rápido de Importação / SEFAZ */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      Possui o Arquivo XML da Nota?
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Carregue o arquivo XML para importar todos os itens, valores e fornecedor automaticamente.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Carregar Arquivo XML</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasteModal(true)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    <ClipboardList className="w-4 h-4 text-emerald-400" />
                    <span>Colar Texto da SEFAZ (NFC-e)</span>
                  </button>
                </div>
              </div>

              {/* Chave de 44 dígitos com busca automática SEFAZ */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Chave de Acesso da NF-e / NFC-e (44 dígitos)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {accessKey.length === 44 && (
                      <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Chave Válida
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={accessKey}
                    onChange={(e) => handleAccessKeyChange(e.target.value)}
                    placeholder="Cole os 44 dígitos da nota aqui..."
                    maxLength={44}
                    className="flex-1 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleConsultSefaz()}
                    disabled={consultingKey || accessKey.replace(/\D/g, '').length !== 44}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap"
                  >
                    {consultingKey ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Puxando Itens...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Puxar Itens & Valor</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Extração via link do QR Code impresso no cupom */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Ou cole o link do QR Code do cupom fiscal impresso:
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrUrlInput}
                      onChange={(e) => setQrUrlInput(e.target.value)}
                      placeholder="Ex: https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=..."
                      className="flex-1 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleConsultQrUrl}
                      disabled={!qrUrlInput.trim() || consultingKey}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      Extrair
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>💡</span>
                  <span>
                    A chave de 44 dígitos identifica o fornecedor e o número oficial da nota. Para importar todos os itens e valores reais automaticamente, selecione o arquivo XML ou informe a URL do QR Code.
                  </span>
                </p>
              </div>

              {/* Dados Gerais da Nota */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Número da NF *
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Ex: 104829"
                    className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Série
                  </label>
                  <input
                    type="text"
                    value={series}
                    onChange={(e) => setSeries(e.target.value)}
                    placeholder="Ex: 1"
                    className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Fornecedor (CNPJ) *
                    </label>
                    <button
                      type="button"
                      onClick={onOpenNewSupplier}
                      className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Novo Fornecedor
                    </button>
                  </div>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    required
                  >
                    <option value="">Selecione o Fornecedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tradeName || s.corporateName} ({formatCNPJ(s.cnpj)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Natureza e Datas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Natureza da Operação
                  </label>
                  <input
                    type="text"
                    value={operationNature}
                    onChange={(e) => setOperationNature(e.target.value)}
                    placeholder="Ex: COMPRA DE MERCADORIAS"
                    className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Data de Emissão *
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Data de Vencimento Principal *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════ ABA 2: ITENS & INSUMOS DESTRINCHADOS ════ */}
          {activeTab === 'items' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Grade de Itens da Nota ({items.length} itens)
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Destrinche os insumos, materiais e produtos com vínculo opcional ao estoque
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Adicionar Item</span>
                </button>
              </div>

              {/* Lista de Itens */}
              <div className="space-y-2.5">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 dark:bg-[#182032] rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px] flex items-center justify-center">
                          #{index + 1}
                        </span>
                        {item.itemCode && (
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            Cód: {item.itemCode}
                          </span>
                        )}
                        {item.ncm && (
                          <span className="text-[10px] font-mono text-slate-400">
                            NCM: {item.ncm}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                          Descrição do Insumo / Despesa *
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Ex: Farinha de Trigo 25kg"
                          className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                          required
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                          Categoria de Custo
                        </label>
                        <select
                          value={item.expenseCategory}
                          onChange={(e) => updateItem(item.id, 'expenseCategory', e.target.value)}
                          className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          <option value="INSUMOS">Insumo / Matéria-Prima</option>
                          <option value="EMBALAGENS">Embalagem</option>
                          <option value="FRETE">Frete / Transporte</option>
                          <option value="EQUIPAMENTOS">Equipamento</option>
                          <option value="MANUTENCAO">Manutenção</option>
                          <option value="CONSUMO">Uso e Consumo</option>
                          <option value="OUTROS">Outras Despesas</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-3 sm:col-span-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                            Qtd
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                            Unidade
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            placeholder="un"
                            className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-1.5 py-1.5 text-xs font-bold text-center text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                            Vlr Unit
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                            className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2 text-right">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                          Subtotal
                        </label>
                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white block py-1">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Vínculo Estoque */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-2 text-[11px]">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400 font-bold">Destino no Estoque:</span>
                      <select
                        value={item.inventoryItemId || ''}
                        onChange={(e) => updateItem(item.id, 'inventoryItemId', e.target.value || null)}
                        className="bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-full"
                      >
                        <option value="">✨ Criar no estoque automaticamente (ou somar se já existir)</option>
                        {inventoryList.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            📦 Somar no estoque de: {inv.name} (Atual: {inv.quantity} {inv.unit})
                          </option>
                        ))}
                        <option value="SKIP">❌ Não lançar no estoque (Apenas despesa financeira)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ ABA 3: TOTAIS & CONCILIAÇÃO ════ */}
          {activeTab === 'totals' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Total dos Produtos (R$)
                  </label>
                  <input
                    type="text"
                    value={productsAmount}
                    onChange={(e) => setProductsAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Valor do Frete (R$)
                  </label>
                  <input
                    type="text"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Desconto / Abatimento (R$)
                  </label>
                  <input
                    type="text"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Valor Total Consolidado da NF (R$) *
                </label>
                <input
                  type="text"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-white dark:bg-[#111726] border-2 border-emerald-500/50 rounded-xl px-4 py-3 text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Painel de Conciliação em Tempo Real */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black uppercase tracking-wider text-slate-400 text-[10px]">
                    Auditoria de Conciliação Fiscal
                  </span>
                  {isPerfectMatch ? (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      100% Conciliado
                    </span>
                  ) : difference > 0 ? (
                    <button
                      type="button"
                      onClick={handleAddDifferenceAsExpense}
                      className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      + Inserir Diferença ({formatCurrency(difference)}) como Frete
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Itens excedem em {formatCurrency(Math.abs(difference))}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total da NF</span>
                    <span className="text-sm sm:text-base font-black font-mono text-slate-800 dark:text-white">
                      {formatCurrency(parsedTotal)}
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Gastos Destrinchados</span>
                    <span className="text-sm sm:text-base font-black font-mono text-emerald-500">
                      {formatCurrency(sumItems)}
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Diferença</span>
                    <span
                      className={`text-sm sm:text-base font-black font-mono ${
                        isPerfectMatch ? 'text-emerald-500' : difference > 0 ? 'text-amber-500' : 'text-rose-500'
                      }`}
                    >
                      {formatCurrency(difference)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ ABA 4: FATURAMENTO & DUPLICATAS ════ */}
          {activeTab === 'billing' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO">Cartão de Crédito</option>
                    <option value="TRANSFERENCIA">Transferência / TED</option>
                    <option value="DINHEIRO">Dinheiro</option>
                  </select>
                </div>

                <div
                  onClick={() => setPaid(!paid)}
                  className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-[#182032] rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer select-none hover:border-emerald-500 transition-colors h-[42px] mt-auto"
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                      paid ? 'bg-emerald-500 text-white' : 'border border-slate-400 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Marcar Nota Fiscal como Já Paga
                  </span>
                </div>
              </div>

              {/* Duplicatas / Parcelas */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Duplicatas / Parcelas no Contas a Pagar
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Gere parcelas individuais no contas a pagar conforme as duplicatas da NF
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleGenerateInstallments(2)}
                      className="px-2.5 py-1 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                    >
                      2x (30/60)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateInstallments(3)}
                      className="px-2.5 py-1 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                    >
                      3x (30/60/90)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInstallments([])
                        setIsInstallmentMode(false)
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      À vista
                    </button>
                  </div>
                </div>

                {isInstallmentMode && installments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {installments.map((inst, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 p-2.5 bg-white dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-slate-700 items-center text-xs"
                      >
                        <div className="col-span-3 font-bold text-slate-600 dark:text-slate-300">
                          Parcela #{inst.number}
                        </div>
                        <div className="col-span-5">
                          <input
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) => {
                              const list = [...installments]
                              list[idx].dueDate = e.target.value
                              setInstallments(list)
                            }}
                            className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            step="0.01"
                            value={inst.amount}
                            onChange={(e) => {
                              const list = [...installments]
                              list[idx].amount = Number(e.target.value) || 0
                              setInstallments(list)
                            }}
                            className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ ABA 5: ESTOQUE & OBSERVAÇÕES ════ */}
          {activeTab === 'stock' && (
            <div className="space-y-4 animate-fade-in">
              <div
                onClick={() => setUpdateStock(!updateStock)}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 cursor-pointer select-none"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all mt-0.5 ${
                    updateStock ? 'bg-emerald-500 text-white' : 'border border-slate-400 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    Dar Entrada Automática no Estoque dos Insumos Vinculados
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ao confirmar a nota fiscal, a quantidade dos produtos vinculados será somada no estoque e uma movimentação com o número da NF será registrada.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Observações Internas / Fiscais
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Nota lançada referente à compra mensal de embalagens e trigo."
                  className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          )}
        </form>

        {/* Rodapé Fixo */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E131F] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-slate-400 font-bold">Total a Lançar:</span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(parsedTotal > 0 ? parsedTotal : sumItems)}
            </span>
            {isPerfectMatch && (
              <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Conciliado
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="new-invoice-form"
              disabled={saving}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Escriturando NF...</span>
                </>
              ) : (
                <span>Confirmar & Escriturar NF</span>
              )}
            </button>
          </div>
        </div>

        {/* Modal para Colar Texto da Página da SEFAZ (NFC-e sem XML) */}
        {showPasteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Importar Texto da Página da SEFAZ (NFC-e)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Para notas de consumidor que só imprimem PDF ou tela
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Instruções: Na aba da SEFAZ que está aberta no seu navegador, selecione o texto (Ctrl+A) ou a tabela dos itens e cole abaixo:
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Cole aqui o texto da página da SEFAZ..."
                  rows={8}
                  className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 custom-scrollbar"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Processar & Extrair Itens</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
