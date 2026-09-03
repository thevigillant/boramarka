import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Building2, Search, CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react'
import { api } from '../../../services/api'
import { cleanCNPJ, formatCNPJ, isValidCNPJ, lookupCNPJ } from '../../../utils/cnpjHelper'

interface CompanyLookupData {
  corporateName: string
  tradeName: string
  phone: string
  email: string
  address: string
}

interface CompanyCnpjModalProps {
  isOpen: boolean
  onClose: () => void
  currentCnpj?: string
  businessName?: string
  onCnpjUpdated: (newCnpj: string, businessName?: string) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  onSuccessProceed?: () => void
}

export function CompanyCnpjModal({
  isOpen,
  onClose,
  currentCnpj = '',
  businessName = '',
  onCnpjUpdated,
  showToast,
  onSuccessProceed,
}: CompanyCnpjModalProps) {
  const [cnpjInput, setCnpjInput] = useState(formatCNPJ(currentCnpj))
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cnpjData, setCnpjData] = useState<CompanyLookupData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const clean = cleanCNPJ(cnpjInput)
  const isValid = isValidCNPJ(clean)

  const handleCnpjChange = (val: string) => {
    setErrorMsg('')
    setCnpjInput(formatCNPJ(val))
  }

  const handleLookup = async () => {
    if (!clean || clean.length !== 14) {
      setErrorMsg('Informe um CNPJ válido com 14 dígitos.')
      return
    }
    if (!isValid) {
      setErrorMsg('Dígito verificador do CNPJ inválido. Verifique os números.')
      return
    }

    setSearching(true)
    setErrorMsg('')
    try {
      const res = await lookupCNPJ(clean)
      if (res.success && res.data) {
        setCnpjData(res.data)
        showToast('Dados da empresa localizados na Receita Federal!', 'success')
      } else {
        setErrorMsg(res.error || 'Não foi possível consultar o CNPJ.')
      }
    } catch {
      setErrorMsg('Falha ao conectar com o serviço da Receita Federal.')
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clean || clean.length !== 14) {
      setErrorMsg('Informe um CNPJ válido.')
      return
    }
    if (!isValid) {
      setErrorMsg('O CNPJ informado possui dígitos verificadores inválidos.')
      return
    }

    setSaving(true)
    try {
      const finalBusinessName = cnpjData?.tradeName || cnpjData?.corporateName || businessName
      await api.updateProfile({
        cnpj: clean,
        ...(finalBusinessName ? { businessName: finalBusinessName } : {}),
      })

      showToast('CNPJ da empresa registrado com sucesso! Módulo fiscal liberado.', 'success')
      onCnpjUpdated(clean, finalBusinessName)
      onClose()

      if (onSuccessProceed) {
        onSuccessProceed()
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar CNPJ da empresa.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-white dark:bg-[#131826] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in text-slate-900 dark:text-slate-100 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Cadastro de CNPJ da Empresa
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
                  Para Emissão
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Exigência SEFAZ para Emissão de Notas Fiscais de Venda (NF-e / NFC-e)
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

        {/* Informação Legal / SEFAZ Compliance */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <p className="font-bold">Regulamentação SEFAZ (Receita Federal):</p>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                Para emitir Notas Fiscais Eletrônicas para seus clientes (vendas no balcão ou encomendas), sua empresa precisa ter um CNPJ ativo cadastrado. <em>(A entrada de notas de compras e alimentação de estoque não requer CNPJ)</em>.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                CNPJ da Sua Empresa *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={cnpjInput}
                    onChange={(e) => handleCnpjChange(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  {isValid && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={searching || !isValid}
                  className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0"
                  title="Consultar dados oficiais na Receita Federal"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Buscar Receita</span>
                    </>
                  )}
                </button>
              </div>

              {errorMsg && (
                <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1">
                  <span>•</span> {errorMsg}
                </p>
              )}
            </div>

            {/* Prévia dos Dados Consultados na Receita Federal */}
            {cnpjData && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-2 animate-fade-in text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-[11px] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dados Cadastrais Receita Federal</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Razão Social</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{cnpjData.corporateName}</p>
                </div>
                {cnpjData.tradeName && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nome Fantasia</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{cnpjData.tradeName}</p>
                  </div>
                )}
                {(cnpjData.phone || cnpjData.email) && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    {cnpjData.phone && (
                      <div>
                        <span className="text-slate-400">Fone:</span> <strong>{cnpjData.phone}</strong>
                      </div>
                    )}
                    {cnpjData.email && (
                      <div className="truncate">
                        <span className="text-slate-400">E-mail:</span> <strong>{cnpjData.email}</strong>
                      </div>
                    )}
                  </div>
                )}
                {cnpjData.address && (
                  <div className="text-[11px] pt-0.5">
                    <span className="text-slate-400">Endereço:</span> <strong>{cnpjData.address}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Rodapé de Ação */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !isValid}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar & Liberar Lançamento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}
