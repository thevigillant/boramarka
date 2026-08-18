import { Store, CreditCard, Sparkles, X } from 'lucide-react'

export function PaywallModal({ isOpen, onClose, onCheckout }: { isOpen: boolean; onClose: () => void; onCheckout: (plan: 'mensal' | 'anual' | 'premium') => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-3 sm:p-6 text-center animate-fade-in">
      <div className="bg-[#131826] border border-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl relative animate-scale-up text-left">
        <button 
          onClick={onClose} 
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border border-slate-700"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mb-4">
          <Store className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        
        <h2 className="text-lg sm:text-2xl font-black text-white mb-1.5 leading-tight">Assinatura Necessária</h2>
        <p className="text-slate-400 mb-5 sm:mb-6 text-xs sm:text-sm font-medium leading-relaxed">
          Sua conta está no modo de demonstração. Para ativar sua agenda online e pedidos sob encomenda, escolha um dos planos:
        </p>
        
        <div className="space-y-2.5">
          <button 
            onClick={() => onCheckout('mensal')}
            className="w-full p-3 sm:p-4 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-between border border-slate-700 cursor-pointer"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Essencial (Solo)</span>
              <span className="text-xs sm:text-sm font-black text-white">R$ 29,90 / mês</span>
            </div>
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </button>
          
          <button 
            onClick={() => onCheckout('anual')}
            className="w-full p-3 sm:p-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl sm:rounded-2xl font-bold transition-all shadow-lg shadow-pink-500/20 flex items-center justify-between cursor-pointer"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-pink-200 block">Profissional (Mais Escolhido)</span>
              <span className="text-xs sm:text-sm font-black text-white">R$ 49,90 / mês</span>
            </div>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
          </button>

          <button 
            onClick={() => onCheckout('premium')}
            className="w-full p-3 sm:p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-between cursor-pointer"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-violet-200 block">Studio VIP (Ilimitado & RH)</span>
              <span className="text-xs sm:text-sm font-black text-white">R$ 79,90 / mês</span>
            </div>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
          </button>
        </div>
      </div>
    </div>
  )
}
