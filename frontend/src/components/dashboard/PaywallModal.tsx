import { Store, CreditCard, Sparkles } from 'lucide-react'

export function PaywallModal({ isOpen, onClose, onCheckout }: { isOpen: boolean; onClose: () => void; onCheckout: (plan: 'mensal' | 'anual' | 'premium') => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6 text-center animate-fade-in" style={{ position: 'fixed' }}>
      <div className="bg-[#131826] border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative animate-scale-up">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold bg-slate-800/50 hover:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition-all"
        >
          &times;
        </button>
        
        <div className="w-16 h-16 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-2">Assinatura Necessária</h2>
        <p className="text-slate-400 mb-8 text-sm font-medium leading-relaxed">
          Sua conta está no modo de visualização. Para reativar sua agenda online, gerenciar seus horários e continuar recebendo agendamentos automáticos, escolha um de nossos planos.
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={() => onCheckout('mensal')}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 border border-slate-750 hover:scale-[1.02]"
          >
            <CreditCard className="w-5 h-5" />
            Plano Mensal — R$ 29,90/mês
          </button>
          
          <button 
            onClick={() => onCheckout('anual')}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Plano Anual — R$ 260/ano <span className="text-xs opacity-80 ml-1">(economize R$ 100)</span>
          </button>

          <button 
            onClick={() => onCheckout('premium')}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-yellow-300" />
            Plano Premium — R$ 79,90/mês
          </button>
        </div>
      </div>
    </div>
  )
}
