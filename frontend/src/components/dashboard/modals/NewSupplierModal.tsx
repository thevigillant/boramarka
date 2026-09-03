import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Building2, Search, Loader2, Phone, Mail, MapPin, CreditCard, FileText } from 'lucide-react'
import { formatCNPJ, cleanCNPJ, isValidCNPJ, lookupCNPJ } from '../../../utils/cnpjHelper'
import { api } from '../../../services/api'
import { SupplierData } from '../../../types/dashboard'

interface NewSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSupplierCreated: (supplier: SupplierData) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

export function NewSupplierModal({
  isOpen,
  onClose,
  onSupplierCreated,
  showToast,
}: NewSupplierModalProps) {
  const [cnpj, setCnpj] = useState('')
  const [corporateName, setCorporateName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [stateRegistration, setStateRegistration] = useState('')
  const [category, setCategory] = useState('INSUMOS')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Boleto 30 dias')
  const [pixKey, setPixKey] = useState('')
  const [notes, setNotes] = useState('')

  const [loadingLookup, setLoadingLookup] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleCnpjChange = (val: string) => {
    setCnpj(formatCNPJ(val))
  }

  const handleLookup = async () => {
    const raw = cleanCNPJ(cnpj)
    if (raw.length !== 14) {
      showToast('Digite os 14 dígitos do CNPJ para pesquisar.', 'error')
      return
    }

    setLoadingLookup(true)
    try {
      const res = await lookupCNPJ(raw)
      if (res.success && res.data) {
        setCorporateName(res.data.corporateName)
        setTradeName(res.data.tradeName)
        if (res.data.phone && !phone) setPhone(res.data.phone)
        if (res.data.email && !email) setEmail(res.data.email)
        if (res.data.address && !address) setAddress(res.data.address)
        showToast('Dados do CNPJ preenchidos automaticamente!', 'success')
      } else {
        showToast(res.error || 'Não foi possível obter os dados do CNPJ.', 'error')
      }
    } catch {
      showToast('Falha ao consultar CNPJ.', 'error')
    } finally {
      setLoadingLookup(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const rawCnpj = cleanCNPJ(cnpj)
    if (!rawCnpj) {
      showToast('CNPJ é obrigatório.', 'error')
      return
    }
    if (!isValidCNPJ(rawCnpj)) {
      showToast('CNPJ inválido. Verifique os números digitados.', 'error')
      return
    }
    if (!corporateName.trim()) {
      showToast('Razão Social é obrigatória.', 'error')
      return
    }

    setSaving(true)
    try {
      const created = await api.createSupplier({
        cnpj: rawCnpj,
        corporateName: corporateName.trim(),
        tradeName: tradeName.trim() || corporateName.trim(),
        stateRegistration: stateRegistration.trim(),
        category,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        paymentTerms: paymentTerms.trim(),
        pixKey: pixKey.trim(),
        notes: notes.trim(),
      })

      showToast(`Fornecedor ${created.tradeName || created.corporateName} cadastrado!`, 'success')
      onSupplierCreated(created)
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar fornecedor.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-[#131826] w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in text-slate-900 dark:text-slate-100 overflow-hidden my-auto">
        
        {/* ── Fixed Header ── */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Novo Fornecedor
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Cadastro por CNPJ com consulta pública automática na Receita
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

        {/* ── Scrollable Body ── */}
        <form id="new-supplier-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* CNPJ Input with Auto-Lookup */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-800 space-y-2">
            <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              CNPJ do Fornecedor *
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                required
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={loadingLookup || cleanCNPJ(cnpj).length !== 14}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 hover:opacity-95 transition-all shadow-md shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                {loadingLookup ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Buscar na Receita</span>
                  </>
                )}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Digite os 14 dígitos e clique em &quot;Buscar na Receita&quot; para preencher nome e endereço automaticamente.
            </span>
          </div>

          {/* Razão Social & Nome Fantasia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Razão Social *
              </label>
              <input
                type="text"
                value={corporateName}
                onChange={(e) => setCorporateName(e.target.value)}
                placeholder="Ex: Distribuidora Silva Ltda"
                className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Ex: Silva Insumos"
                className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Categoria & Inscrição Estadual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Categoria de Fornecimento
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="INSUMOS">Matéria-Prima / Insumos</option>
                <option value="EMBALAGENS">Embalagens & Descartáveis</option>
                <option value="EQUIPAMENTOS">Equipamentos & Utensílios</option>
                <option value="SERVICOS">Serviços & Manutenção</option>
                <option value="OUTROS">Outros Fornecimentos</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Inscrição Estadual (Opcional)
              </label>
              <input
                type="text"
                value={stateRegistration}
                onChange={(e) => setStateRegistration(e.target.value)}
                placeholder="Isento ou nº da I.E."
                className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-500" />
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-pink-500" />
                E-mail para Pedidos / NFs
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pedidos@fornecedor.com.br"
                className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-500" />
              Endereço Completo
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro, Cidade - UF"
              className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Pagamento e PIX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-violet-500" />
                Condição de Pagamento
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Ex: Boleto 28D, Pix à vista"
                className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Chave PIX (Opcional)
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CNPJ, e-mail ou telefone"
                className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              Observações / Pedido Mínimo
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Entrega toda terça-feira. Pedido mínimo de R$ 300."
              className="w-full bg-slate-50 dark:bg-[#182032] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none resize-none"
            />
          </div>
        </form>

        {/* ── Fixed Sticky Footer ── */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E131F] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="new-supplier-form"
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md shadow-pink-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>Cadastrar Fornecedor</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
