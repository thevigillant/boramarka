import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, UploadCloud, FileCode, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, DollarSign, Package } from 'lucide-react'
import { parseNfeXml, ParsedNfeData } from '../../../utils/nfeXmlParser'
import { formatCurrency } from '../../../utils/dashboardHelpers'
import { formatCNPJ, cleanCNPJ } from '../../../utils/cnpjHelper'

interface ImportXmlModalProps {
  isOpen: boolean
  onClose: () => void
  companyCnpj?: string
  onXmlParsed: (data: ParsedNfeData) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

export function ImportXmlModal({
  isOpen,
  onClose,
  companyCnpj = '',
  onXmlParsed,
  showToast,
}: ImportXmlModalProps) {
  const [dragOver, setDragOver] = useState(false)
  const [xmlContent, setXmlContent] = useState('')
  const [parsedData, setParsedData] = useState<ParsedNfeData | null>(null)
  const [parseError, setParseError] = useState('')
  const [showPasteArea, setShowPasteArea] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const cleanCompany = cleanCNPJ(companyCnpj)

  const processXmlString = (content: string) => {
    setParseError('')
    const result = parseNfeXml(content)
    if (!result.success || result.error) {
      setParseError(result.error || 'Não foi possível interpretar o arquivo XML.')
      setParsedData(null)
      return
    }
    setParsedData(result)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.xml')) {
      showToast('Por favor, selecione um arquivo com extensão .xml', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      processXmlString(text)
    }
    reader.onerror = () => {
      showToast('Erro ao ler o arquivo selecionado.', 'error')
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.xml')) {
      showToast('Por favor, solte um arquivo .xml da NF-e', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      processXmlString(text)
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = () => {
    if (!parsedData) return
    onXmlParsed(parsedData)
    onClose()
  }

  const cleanRecipient = cleanCNPJ(parsedData?.recipient?.cnpj || '')
  const isRecipientMatch = !cleanCompany || (cleanRecipient && cleanRecipient === cleanCompany)

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-[#131826] w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in text-slate-900 dark:text-slate-100 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Importador de XML da NF-e (Padrão SEFAZ)
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Leitura automática da SEFAZ: emitente, itens, totais, impostos e faturas
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

        {/* Corpo Scrollável */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {!parsedData ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#182032] hover:border-emerald-500/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileCode className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">
                    Arraste o arquivo .XML da NF-e aqui
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    ou clique para navegar no seu computador
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Modelo SEFAZ 55 (NF-e) ou 65 (NFC-e)
                </span>
              </div>

              {parseError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Opção Colar Conteúdo XML */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {showPasteArea ? 'Ocultar área de texto XML' : 'Prefere colar o código XML diretamente? Clique aqui'}
                </button>
              </div>

              {showPasteArea && (
                <div className="space-y-2 animate-fade-in">
                  <textarea
                    rows={6}
                    value={xmlContent}
                    onChange={(e) => setXmlContent(e.target.value)}
                    placeholder="Cole o conteúdo XML aqui: <nfeProc ...> ..."
                    className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => processXmlString(xmlContent)}
                    disabled={!xmlContent.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-40"
                  >
                    Processar Texto XML
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Prévia dos Dados Extraídos com Sucesso */
            <div className="space-y-4 animate-fade-in">
              {/* Alerta de Conformidade do Destinatário */}
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
                  isRecipientMatch
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200'
                }`}
              >
                {isRecipientMatch ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-black">
                    {isRecipientMatch ? 'Destinatário Verificado com Sucesso' : 'Aviso de Destinatário Divergente'}
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Destinatário na NF: <strong>{parsedData.recipient.corporateName || 'Não especificado'}</strong> (CNPJ: {formatCNPJ(parsedData.recipient.cnpj)})
                    {!isRecipientMatch && companyCnpj && (
                      <span className="block text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                        O CNPJ da sua empresa cadastrada é {formatCNPJ(companyCnpj)}.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Informações da Nota */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Nota Fiscal Identificada
                    </span>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      NF #{parsedData.invoiceNumber} {parsedData.series ? `• Série ${parsedData.series}` : ''}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                      {parsedData.emitter.tradeName || parsedData.emitter.corporateName} (CNPJ: {formatCNPJ(parsedData.emitter.cnpj)})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Valor Total da NF
                    </span>
                    <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(parsedData.totals.totalAmount)}
                    </span>
                  </div>
                </div>

                {parsedData.accessKey && (
                  <div className="p-2 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400 break-all">
                    Chave: {parsedData.accessKey}
                  </div>
                )}

                {/* Métricas Extraídas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Produtos</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatCurrency(parsedData.totals.productsAmount)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Frete</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatCurrency(parsedData.totals.freightAmount)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Itens Extraídos</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {parsedData.items.length} item(ns)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Faturas / Duplicatas</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {parsedData.installments.length ? `${parsedData.installments.length} parcela(s)` : 'À vista'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista Rápida de Itens */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <h5 className="font-black uppercase tracking-wider text-slate-400 text-[10px]">
                    Itens Identificados no XML ({parsedData.items.length})
                  </h5>
                  <span className="text-[11px] text-emerald-500 font-bold">100% Mapeados</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {parsedData.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 dark:bg-[#182032] rounded-xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center text-xs"
                    >
                      <div className="truncate max-w-[280px] sm:max-w-md">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {idx + 1}. {item.description}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)} • {item.expenseCategory}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null)
                    setXmlContent('')
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  ← Escolher Outro XML
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Carregar no Lançamento da NF</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
