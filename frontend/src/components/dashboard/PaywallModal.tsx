import { Store, CreditCard, Sparkles, X, ShoppingBag, Calendar, Check } from 'lucide-react'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  onCheckout: (plan: 'mensal' | 'anual' | 'premium') => void
  businessType?: 'SERVICES' | 'PRODUCTS'
}

export function PaywallModal({ isOpen, onClose, onCheckout, businessType = 'SERVICES' }: PaywallModalProps) {
  if (!isOpen) return null

  const isEncomenda = businessType === 'PRODUCTS'

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-3 sm:p-6 text-center animate-fade-in">
      <div className="bg-[#131826] border border-slate-800 p-5 sm:p-8 max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl relative animate-scale-up text-left">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border border-slate-700"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`w-12 h-12 sm:w-14 sm:h-14 ${isEncomenda ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' : 'bg-violet-500/10 border-violet-500/20 text-violet-400'} border rounded-2xl flex items-center justify-center mb-4`}>
          {isEncomenda ? <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" /> : <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isEncomenda ? 'bg-pink-500/20 text-pink-300' : 'bg-violet-500/20 text-violet-300'}`}>
            {isEncomenda ? 'BoraEnkomenda' : 'BoraMarka'}
          </span>
          <span className="text-[10px] font-bold text-slate-400">Planos Oficiais</span>
        </div>

        <h2 className="text-lg sm:text-2xl font-black text-white mb-1.5 leading-tight">
          {isEncomenda ? 'Ative sua Produção & Encomendas' : 'Ative sua Agenda Online'}
        </h2>
        <p className="text-slate-400 mb-5 sm:mb-6 text-xs sm:text-sm font-medium leading-relaxed">
          {isEncomenda
            ? 'Escolha o plano ideal para gerenciar suas encomendas, cardápio digital, listas de compras e produção artesanal:'
            : 'Escolha o plano ideal para gerenciar seus agendamentos, clientes, lembretes de WhatsApp e equipe:'}
        </p>

        <div className="space-y-3">
          {/* PLANO 1 — SOLO / ESSENCIAL */}
          <button
            onClick={() => onCheckout('mensal')}
            className="w-full p-3.5 sm:p-4 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-between border border-slate-700 cursor-pointer text-left group"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase text-slate-400 block">
                  {isEncomenda ? 'Ateliê (Solo)' : 'Essencial (Solo)'}
                </span>
              </div>
              <span className="text-sm font-black text-white">R$ 39,90 <span className="text-xs font-normal text-slate-400">/ mês</span></span>
              <p className="text-[10px] text-slate-400 mt-1">
                {isEncomenda ? 'Cardápio digital, até 60 encomendas/mês e Pix' : '1 profissional, agendamentos 24/7 e lembretes'}
              </p>
            </div>
            <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>

          {/* PLANO 2 — MAIS ESCOLHIDO */}
          <button
            onClick={() => onCheckout('anual')}
            className={`w-full p-3.5 sm:p-4 ${isEncomenda ? 'bg-gradient-to-r from-pink-600 to-rose-600 shadow-pink-500/20' : 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/20'} text-white rounded-xl sm:rounded-2xl font-bold transition-all shadow-lg flex items-center justify-between cursor-pointer text-left relative overflow-hidden`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white">
                  Mais Escolhido
                </span>
                <span className="text-[11px] font-black uppercase text-white/90">
                  {isEncomenda ? 'Confeitaria Pro' : 'BoraMarka Pro'}
                </span>
              </div>
              <span className="text-base font-black text-white mt-1 block">
                {isEncomenda ? 'R$ 69,90' : 'R$ 59,90'} <span className="text-xs font-normal text-white/75">/ mês</span>
              </span>
              <p className="text-[10px] text-white/90 mt-1">
                {isEncomenda
                  ? 'Kanban de produção, Listas de Compras, Estoque, NF SEFAZ & 5 ajudantes'
                  : 'Até 5 profissionais, comissões, fila de espera, controle fiscal SEFAZ'}
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-amber-200 shrink-0" />
          </button>

          {/* PLANO 3 — VIP / ILIMITADO */}
          <button
            onClick={() => onCheckout('premium')}
            className="w-full p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-850 hover:to-slate-750 text-white rounded-xl sm:rounded-2xl font-bold transition-all border border-amber-500/30 flex items-center justify-between cursor-pointer text-left group"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase text-amber-400 block">
                  {isEncomenda ? 'Gourmet VIP (Multi-Cozinha)' : 'Studio VIP (Clínicas & Franquias)'}
                </span>
              </div>
              <span className="text-sm font-black text-white">
                {isEncomenda ? 'R$ 99,90' : 'R$ 89,90'} <span className="text-xs font-normal text-slate-400">/ mês</span>
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                {isEncomenda
                  ? 'Multi-cozinhas, fichas técnicas completas, domínio próprio & BoraIA'
                  : 'Profissionais ilimitados, múltiplos pontos, domínio próprio & BoraIA'}
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}
