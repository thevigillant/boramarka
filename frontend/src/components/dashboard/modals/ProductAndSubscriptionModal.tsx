import React, { useState } from 'react'
import { 
  X, Calendar, ShoppingBag, CheckCircle2, Crown, Zap, Sparkles, 
  ArrowRight, ShieldCheck, Loader2, RefreshCw
} from 'lucide-react'
import { api } from '../../../services/api'

interface ProductAndSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  adminInfo: any
  subscription: any
  isSuperAdmin: boolean
  onUpdateSuccess: () => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  onOpenPaywall: () => void
}

export function ProductAndSubscriptionModal({
  isOpen,
  onClose,
  adminInfo,
  subscription,
  isSuperAdmin,
  onUpdateSuccess,
  showToast,
  onOpenPaywall,
}: ProductAndSubscriptionModalProps) {
  if (!isOpen) return null

  const currentType: 'SERVICES' | 'PRODUCTS' = adminInfo?.businessType === 'PRODUCTS' ? 'PRODUCTS' : 'SERVICES'
  const [selectedType, setSelectedType] = useState<'SERVICES' | 'PRODUCTS'>(currentType)
  const [switchingType, setSwitchingType] = useState(false)

  // SuperAdmin override controls
  const [saPlan, setSaPlan] = useState(subscription?.plan || (currentType === 'PRODUCTS' ? 'confeitaria_pro' : 'pro'))
  const [saStatus, setSaStatus] = useState(subscription?.status || 'active')
  const [saSaving, setSaSaving] = useState(false)

  const handleSwitchBusinessType = async (type: 'SERVICES' | 'PRODUCTS') => {
    if (type === currentType) return
    setSwitchingType(true)
    try {
      await api.updateProfile({ businessType: type })
      showToast(
        type === 'PRODUCTS'
          ? '🧁 Modo BoraEnkomenda (Produção & Encomendas) ativado com sucesso!'
          : '📅 Modo BoraMarka (Serviços & Agendamentos) ativado com sucesso!',
        'success'
      )
      onUpdateSuccess()
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Erro ao alternar modelo de negócio', 'error')
    } finally {
      setSwitchingType(false)
    }
  }

  const handleSuperAdminSave = async () => {
    if (!adminInfo?.id) return
    setSaSaving(true)
    try {
      await api.updateUserSubscription(adminInfo.id, {
        plan: saPlan,
        status: saStatus,
        businessType: selectedType,
      })
      showToast('Assinatura e Vertical atualizadas com sucesso pelo SuperAdmin!', 'success')
      onUpdateSuccess()
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar dados pelo SuperAdmin', 'error')
    } finally {
      setSaSaving(false)
    }
  }

  const getPlanFriendlyName = (p?: string) => {
    switch (p) {
      case 'essencial': return 'BoraMarka Essencial (Solo)'
      case 'pro': return 'BoraMarka Pro (Mais Escolhido)'
      case 'vip': return 'BoraMarka Studio VIP'
      case 'atelie': return 'BoraEnkomenda Ateliê (Solo)'
      case 'confeitaria_pro': return 'BoraEnkomenda Confeitaria Pro'
      case 'gourmet_vip': return 'BoraEnkomenda Gourmet VIP'
      case 'anual': return 'Plano Anual'
      case 'premium': return 'Acesso Total VIP (Vitalício)'
      case 'mensal': return 'Plano Mensal'
      default: return p || 'Padrão'
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl animate-scale-in max-h-[92vh] overflow-y-auto custom-scrollbar p-5 sm:p-8 space-y-6 text-left">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Gerenciar Produto & Assinatura
              </h3>
              {isSuperAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  SuperAdmin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {adminInfo?.businessName || adminInfo?.username} (@{adminInfo?.username})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: BUSINESS TYPE SELECTOR */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Modelo de Negócio (Vertical)
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Alterne a qualquer momento
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* BoraMarka Card */}
            <div 
              onClick={() => setSelectedType('SERVICES')}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer relative ${
                selectedType === 'SERVICES'
                  ? 'bg-violet-500/10 border-violet-500 shadow-md ring-2 ring-violet-500/20'
                  : 'bg-slate-50/70 dark:bg-[#1A2235]/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-80'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black">
                  <Calendar className="w-5 h-5" />
                </div>
                {currentType === 'SERVICES' ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-500 text-white shadow-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ativo
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Disponível</span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">BoraMarka</h4>
                  <span className="text-[9px] font-black uppercase text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded">
                    Serviços
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug">
                  Para barbearias, salões, clínicas e autônomos. Agenda online, horários e sinal Pix.
                </p>
              </div>

              {currentType !== 'SERVICES' && !isSuperAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSwitchBusinessType('SERVICES')
                  }}
                  disabled={switchingType}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {switchingType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Mudar para BoraMarka</span>
                </button>
              )}
            </div>

            {/* BoraEnkomenda Card */}
            <div 
              onClick={() => setSelectedType('PRODUCTS')}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer relative ${
                selectedType === 'PRODUCTS'
                  ? 'bg-pink-500/10 border-pink-500 shadow-md ring-2 ring-pink-500/20'
                  : 'bg-slate-50/70 dark:bg-[#1A2235]/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-80'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center font-black">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                {currentType === 'PRODUCTS' ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-pink-600 text-white shadow-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ativo
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Disponível</span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">BoraEnkomenda</h4>
                  <span className="text-[9px] font-black uppercase text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded">
                    Produção
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug">
                  Para confeitarias, bolos, ateliês e buffets. Cardápio na bio, sinal 50% Pix e Kanban.
                </p>
              </div>

              {currentType !== 'PRODUCTS' && !isSuperAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSwitchBusinessType('PRODUCTS')
                  }}
                  disabled={switchingType}
                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {switchingType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Mudar para BoraEnkomenda</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: SUBSCRIPTION PLAN & STATUS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#1A2235]/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Plano Atual da Conta
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {getPlanFriendlyName(subscription?.plan)}
                </span>
                {subscription?.status === 'active' && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Ativo
                  </span>
                )}
                {subscription?.status === 'trialing' && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Teste Grátis
                  </span>
                )}
              </div>
            </div>

            {!isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenPaywall()
                }}
                className="px-3 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ver Planos & Upgrade</span>
              </button>
            )}
          </div>

          {/* SUPERADMIN CONTROLS (IF USER IS SUPERADMIN / IMPERSONATING) */}
          {isSuperAdmin && (
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" /> Controle Direto SuperAdmin
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Modificação Imediata</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Alterar Plano</label>
                  <select
                    value={saPlan}
                    onChange={e => setSaPlan(e.target.value)}
                    className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  >
                    <optgroup label="Planos BoraMarka (Serviços)">
                      <option value="essencial">BoraMarka Essencial (R$ 39,90)</option>
                      <option value="pro">BoraMarka Pro (R$ 59,90)</option>
                      <option value="vip">BoraMarka Studio VIP (R$ 89,90)</option>
                    </optgroup>
                    <optgroup label="Planos BoraEnkomenda (Produção)">
                      <option value="atelie">BoraEnkomenda Ateliê (R$ 39,90)</option>
                      <option value="confeitaria_pro">BoraEnkomenda Confeitaria Pro (R$ 69,90)</option>
                      <option value="gourmet_vip">BoraEnkomenda Gourmet VIP (R$ 99,90)</option>
                    </optgroup>
                    <optgroup label="Especiais">
                      <option value="anual">Plano Anual</option>
                      <option value="premium">Acesso Total Grátis VIP (Vitalício)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={saStatus}
                    onChange={e => setSaStatus(e.target.value)}
                    className="input-simple w-full text-xs font-bold bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white border-slate-200 dark:border-slate-800"
                  >
                    <option value="active">Ativo</option>
                    <option value="trialing">Trial (Período de Teste)</option>
                    <option value="pending">Pendente</option>
                    <option value="canceled">Cancelado / Inativo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSuperAdminSave}
                  disabled={saSaving}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Aplicar no Banco Agora</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  )
}
