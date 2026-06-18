import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Moon, Sun, Check, Sparkles, Clock, Shield, Zap } from 'lucide-react'

export default function Landing() {
  const [isDark, setIsDark] = useState(true) // Default to dark mode as per screenshot
  const navigate = useNavigate()

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const features = [
    'Agendamentos Ilimitados',
    'Links de agendamento próprios',
    'Mensagens rápidas de WhatsApp',
    'Fluxo de Caixa integrado'
  ]

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
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
          
          {/* Card 1: BoraTestar (Trial) */}
          <div className={`p-8 rounded-3xl border text-center flex flex-col justify-between ${isDark ? 'bg-[#131826] border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest mb-6 block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                7 Dias Grátis
              </span>
              <h3 className="text-xl font-black mb-4 flex items-center justify-center gap-1.5">
                <Sparkles className="w-5 h-5 text-emerald-400" /> BoraTestar
              </h3>
              
              <div className="flex items-start justify-center gap-1 mb-4">
                <span className={`text-sm font-bold mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>R$</span>
                <span className="text-5xl font-black">0,00</span>
              </div>
              
              <p className={`text-xs font-medium mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Experimente com todos os recursos liberados. Sem cartão de crédito.
              </p>

              <ul className="space-y-3 mb-8 text-left border-t pt-6 border-slate-800/50 dark:border-slate-800">
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
            
            <button 
              onClick={() => navigate('/register')}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Começar Teste Grátis
            </button>
          </div>

          {/* Card 2: Mensal */}
          <div className={`p-8 rounded-3xl border text-center flex flex-col justify-between ${isDark ? 'bg-[#131826] border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest mb-6 block ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                Acesso Mensal
              </span>
              <h3 className="text-xl font-black mb-4 flex items-center justify-center gap-1.5">
                <Clock className="w-5 h-5 text-blue-400" /> BoraMensal
              </h3>
              
              <div className="flex items-start justify-center gap-1 mb-4">
                <span className={`text-sm font-bold mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>R$</span>
                <span className="text-5xl font-black">30,00</span>
                <span className={`text-sm font-bold mt-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/mês</span>
              </div>
              
              <p className={`text-xs font-medium mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Excelente para começar a colher os resultados com fidelidade.
              </p>

              <ul className="space-y-3 mb-8 text-left border-t pt-6 border-slate-800/50 dark:border-slate-800">
                {features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-bold">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
              onClick={() => navigate('/register')}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25"
            >
              Assinar BoraMensal
            </button>
          </div>

          {/* Card 3: Anual */}
          <div className={`relative p-8 rounded-3xl border-2 text-center flex flex-col justify-between ${isDark ? 'bg-[#131826] border-orange-500 shadow-2xl shadow-orange-500/10' : 'bg-white border-orange-500 shadow-2xl shadow-orange-500/20'}`}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full">
              Melhor Valor
            </div>

            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest mb-6 mt-2 block ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>
                Acesso Anual
              </span>
              <h3 className="text-xl font-black mb-4 flex items-center justify-center gap-1.5">
                <Zap className="w-5 h-5 text-orange-400" /> BoraAnual
              </h3>
              
              <div className="flex items-start justify-center gap-1 mb-2">
                <span className={`text-sm font-bold mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>R$</span>
                <span className="text-5xl font-black">260,00</span>
                <span className={`text-sm font-bold mt-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ano</span>
              </div>
              
              <p className="text-emerald-500 text-xs font-black bg-emerald-500/10 py-1 px-3 rounded-full inline-block mx-auto mb-4">
                Economize R$ 100,00 por ano
              </p>
              
              <p className={`text-xs font-medium mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Para profissionais prontos para levar o faturamento a sério.
              </p>

              <ul className="space-y-3 mb-8 text-left border-t pt-6 border-slate-800/50 dark:border-slate-800">
                {features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-bold">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
              onClick={() => navigate('/register')}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25"
            >
              Assinar BoraAnual
            </button>
          </div>

        </div>

        <Link to="/login" className={`block text-center text-sm font-bold mt-12 ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}>
          Já possui conta? Acessar
        </Link>
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
