import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Moon, Sun, Check, ArrowRight, Sparkles, Clock, Shield, Zap, X } from 'lucide-react'

export default function Landing() {
  const [isDark, setIsDark] = useState(true) // Default to dark mode as per screenshot
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'anual'>('mensal')
  const navigate = useNavigate()

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const handleSubscribeClick = (plan: 'mensal' | 'anual') => {
    setSelectedPlan(plan)
    setShowTrialModal(true)
  }

  const features = [
    'Agendamentos Ilimitados',
    'Links de agendamento próprios',
    'Mensagens rápidas de WhatsApp',
    'Fluxo de Caixa integrado'
  ]

  const trialPerks = [
    { icon: Zap, text: 'Acesso completo a todas as funcionalidades' },
    { icon: Clock, text: '7 dias grátis sem compromisso' },
    { icon: Shield, text: 'Sem cartão de crédito para começar' },
    { icon: Sparkles, text: 'Cancele quando quiser, sem burocracia' },
  ]

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ═══ Trial Modal ═══ */}
      {showTrialModal && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTrialModal(false) }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" style={{ animation: 'fadeIn 0.2s ease-out' }} />
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl"
            style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Gradient Top Banner */}
            <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 px-8 pt-10 pb-16 text-center relative overflow-hidden">
              {/* Decorative Circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              
              <button 
                onClick={() => setShowTrialModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-widest mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Oferta Especial
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
                  Comece com <span className="underline decoration-wavy decoration-yellow-300 underline-offset-4">7 dias grátis</span>
                </h2>
                
                <p className="text-white/80 text-sm font-medium max-w-xs mx-auto">
                  Teste tudo sem pagar nada. Sua assinatura só começa depois do período de teste.
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="bg-[#131826] px-8 pt-0 pb-8 -mt-8 rounded-t-[2rem] relative z-10">
              
              {/* Perks List */}
              <div className="space-y-4 mb-8 pt-8">
                {trialPerks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center shrink-0 border border-orange-500/10">
                      <perk.icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-200">{perk.text}</span>
                  </div>
                ))}
              </div>

              {/* Selected Plan Summary */}
              <div className="bg-[#1A2235] rounded-2xl p-4 mb-6 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Plano escolhido</p>
                  <p className="text-white font-black text-lg">
                    {selectedPlan === 'anual' ? 'BoraAnual' : 'BoraMensal'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs font-bold line-through">
                    {selectedPlan === 'anual' ? 'R$ 260/ano' : 'R$ 30/mês'}
                  </p>
                  <p className="text-emerald-400 font-black text-lg">R$ 0,00</p>
                  <p className="text-emerald-400/70 text-[10px] font-bold">por 7 dias</p>
                </div>
              </div>

              {/* CTA Button */}
              <button 
                onClick={() => navigate('/register')}
                className="w-full py-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-lg transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-500/30 flex items-center justify-center gap-3 group"
              >
                Começar 7 Dias Grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-center text-slate-600 text-[11px] font-medium mt-4">
                Sem cartão de crédito • Cancele a qualquer momento
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/20">
            B
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight">BoraMarka</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-pink-500">Sua Agenda Inteligente</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            Alternar Aparência
          </button>
          
          <Link 
            to="/login"
            className="flex items-center gap-2 px-6 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-full text-xs font-black transition-all hover:scale-105 shadow-xl shadow-slate-900/10"
          >
            Já sou Assinante
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center animate-slide-up">
        
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border ${isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
          Acesso Ilimitado ao BoraMarka
        </span>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl mb-6">
          Tenha sua agenda profissional funcionando no{' '}
          <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">automático</span>
        </h2>

        <p className={`text-base md:text-lg max-w-2xl mb-16 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Organize seus clientes, gerencie serviços, envie lembretes automáticos pelo WhatsApp e controle seu fluxo de caixa de forma simples e descomplicada.
        </p>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          
          {/* Card 1: Features */}
          <div className={`p-8 rounded-3xl border text-left flex flex-col justify-between ${isDark ? 'bg-[#131826] border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
            <div>
              <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                <span className="text-orange-500">✨</span> Plano BoraTudo
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Recursos ilimitados sem pegadinhas ou cobranças adicionais por agendamento.
              </p>
              
              <ul className="space-y-4 mb-8">
                {features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-bold">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            
            <Link to="/login" className={`block text-center text-sm font-bold mt-auto ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}>
              Já possui conta? Acessar
            </Link>
          </div>

          {/* Card 2: Mensal */}
          <div className={`p-8 rounded-3xl border text-center flex flex-col ${isDark ? 'bg-[#131826] border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest mb-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Acesso Mensal</span>
            <h3 className="text-xl font-black mb-4">BoraMensal</h3>
            
            <div className="flex items-start justify-center gap-1 mb-4">
              <span className={`text-sm font-bold mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>R$</span>
              <span className="text-5xl font-black">30,00</span>
              <span className={`text-sm font-bold mt-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/mês</span>
            </div>
            
            <p className={`text-xs font-medium mb-8 flex-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Excelente para testar e começar a colher os resultados com fidelidade.
            </p>
            
            <button 
              onClick={() => handleSubscribeClick('mensal')}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25"
            >
              Assinar BoraMensal
            </button>
          </div>

          {/* Card 3: Anual */}
          <div className={`relative p-8 rounded-3xl border-2 text-center flex flex-col ${isDark ? 'bg-[#131826] border-orange-500 shadow-2xl shadow-orange-500/10' : 'bg-white border-orange-500 shadow-2xl shadow-orange-500/20'}`}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full">
              Melhor Valor
            </div>

            <span className={`text-[10px] font-black uppercase tracking-widest mb-6 mt-2 ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>Acesso Anual</span>
            <h3 className="text-xl font-black mb-4">BoraAnual</h3>
            
            <div className="flex items-start justify-center gap-1 mb-2">
              <span className={`text-sm font-bold mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>R$</span>
              <span className="text-5xl font-black">260,00</span>
              <span className={`text-sm font-bold mt-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ano</span>
            </div>
            
            <p className="text-emerald-500 text-xs font-black bg-emerald-500/10 py-1 px-3 rounded-full inline-block mx-auto mb-4">
              Economize R$ 100,00 por ano
            </p>
            
            <p className={`text-xs font-medium mb-8 flex-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Para profissionais que estão prontos para levar o faturamento a sério.
            </p>
            
            <button 
              onClick={() => handleSubscribeClick('anual')}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25"
            >
              Assinar BoraAnual
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className={`py-10 border-t text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          BoraMarka S.A. &copy; 2026. Todos os direitos reservados. Sua agenda na velocidade do seu negócio.
        </p>
      </footer>
    </div>
  )
}
