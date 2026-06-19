import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Moon, Sun, Check, Sparkles, Clock, Shield, Zap, 
  ArrowRight, Smartphone, Calendar, DollarSign, Users, 
  RotateCcw, CheckCircle2, Wifi, Battery, Signal, 
  ChevronRight, Scissors, Droplet, Star, User, Phone, AlertCircle
} from 'lucide-react'

export default function Landing() {
  const [isDark, setIsDark] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // --- 1. SIMULADOR DE AGENDAMENTO ---
  const [simStep, setSimStep] = useState(1) // 1: serviço, 2: horário, 3: dados, 4: sucesso
  const [simService, setSimService] = useState<{ name: string; price: number; duration: number; icon: any } | null>(null)
  const [selectedDay, setSelectedDay] = useState('Qui, 18')
  const [simTime, setSimTime] = useState('')
  const [simName, setSimName] = useState('')
  const [simPhone, setSimPhone] = useState('')

  const mockServices = [
    { name: 'Corte Degradê Moderno', price: 45, duration: 30, icon: Scissors },
    { name: 'Barba Premium + Toalha Quente', price: 35, duration: 30, icon: Droplet },
    { name: 'Combo BoraCabelo & Barba', price: 70, duration: 60, icon: Star }
  ]

  const mockDays = [
    { label: 'Qui, 18', status: 'Disponível' },
    { label: 'Sex, 19', status: 'Disponível' },
    { label: 'Sáb, 20', status: 'Últimas vagas' },
    { label: 'Seg, 22', status: 'Disponível' }
  ]

  const mockTimes = ['09:00', '10:30', '14:00', '15:30', '17:00']

  // --- 2. SIMULADOR DE WHATSAPP ---
  const [waMessages, setWaMessages] = useState<Array<{ text: string; isUser: boolean; time: string }>>([
    { text: 'Olá! Gostaria de agendar um horário para esta semana.', isUser: true, time: '09:40' }
  ])

  // Triga nova mensagem de WhatsApp ao agendar ou cancelar
  useEffect(() => {
    if (simStep === 4) {
      // Mensagem de confirmação imediata
      const timer1 = setTimeout(() => {
        setWaMessages(prev => [
          ...prev,
          { 
            text: `✅ *BoraMarka Barber:* Olá ${simName || 'Cliente'}, seu agendamento para *${simService?.name}* está CONFIRMADO para ${selectedDay} às *${simTime}*. 🗓️`, 
            isUser: false, 
            time: '09:41' 
          }
        ])
      }, 800)

      // Mensagem de lembrete 2 horas antes
      const timer2 = setTimeout(() => {
        setWaMessages(prev => [
          ...prev,
          { 
            text: `🔔 *Lembrete automático:* Seu horário para *${simService?.name}* é hoje às *${simTime}*. Chegue com 5 minutos de antecedência. Precisando reagendar ou cancelar, use o link: bmarka.cc/barber-reagendar`, 
            isUser: false, 
            time: '13:30' 
          }
        ])
      }, 2500)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }

    if (simStep === 6) {
      // Mensagem de cancelamento imediata
      const timerCancel = setTimeout(() => {
        setWaMessages(prev => [
          ...prev,
          { 
            text: `❌ *Cancelamento automático:* Olá ${simName || 'Cliente'}, seu agendamento para *${simService?.name}* no dia ${selectedDay} às *${simTime}* foi CANCELADO com sucesso e a vaga foi liberada.`, 
            isUser: false, 
            time: '13:32' 
          }
        ])
      }, 800)

      return () => {
        clearTimeout(timerCancel)
      }
    }
  }, [simStep, simName, simService, selectedDay, simTime])

  const resetSimulator = () => {
    setSimStep(1)
    setSimService(null)
    setSimTime('')
    setSimName('')
    setSimPhone('')
    setWaMessages([
      { text: 'Olá! Gostaria de agendar um horário para esta semana.', isUser: true, time: '09:40' }
    ])
  }

  // --- 3. CALCULADORA DE ECONOMIA (ROI) ---
  const [weeklyAppts, setWeeklyAppts] = useState(30)
  const [avgTicket, setAvgTicket] = useState(50)

  // Cada agendamento manual leva em média 6 minutos no WhatsApp
  const timeSavedMinutes = weeklyAppts * 6 * 4 // mensal
  const timeSavedHours = Math.round(timeSavedMinutes / 60)
  // Redução de no-show em média de 25% para 3% (recupera 22% dos agendamentos perdidos)
  const recoveredRevenue = Math.round(weeklyAppts * 4 * 0.22 * avgTicket)

  const features = [
    'Agendamentos Ilimitados',
    'Links de agendamento próprios',
    'Mensagens rápidas de WhatsApp',
    'Fluxo de Caixa integrado'
  ]

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#080C14] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Glow Effects no fundo */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className={`px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b relative z-10 ${isDark ? 'border-slate-900 bg-[#080C14]/80 backdrop-blur-md' : 'border-slate-200 bg-white/80 backdrop-blur-md'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/20">
            B
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight tracking-tight">BoraMarka</h1>
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
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          
          {/* Coluna Esquerda: Texto Hero */}
          <div className="lg:col-span-6 text-left flex flex-col items-start">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border ${isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
              🚀 Automatize 100% de sua Agenda
            </span>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
              Sua agenda trabalhando no{' '}
              <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">automático</span>
            </h2>

            <p className={`text-base md:text-lg mb-8 font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Chega de perder horas respondendo clientes no WhatsApp. Seus clientes escolhem o serviço e agendam sozinhos em menos de 1 minuto. Simule no celular ao lado!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a 
                href="#pricing"
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-center shadow-lg shadow-pink-500/20 hover:scale-[1.03] transition-all flex items-center justify-center gap-2"
              >
                Experimentar 7 Dias Grátis
                <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="#how-it-works"
                className={`px-8 py-4 rounded-2xl font-black text-center transition-all flex items-center justify-center gap-2 border ${
                  isDark 
                    ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm'
                }`}
              >
                Ver como funciona
              </a>
            </div>

            <div className="flex items-center gap-6 mt-12 pt-8 border-t border-slate-800/30 dark:border-slate-800/80 w-full">
              <div className="flex -space-x-3">
                <div className="w-9 h-9 rounded-full bg-orange-500 border-2 border-[#080C14] flex items-center justify-center font-bold text-xs text-white">M</div>
                <div className="w-9 h-9 rounded-full bg-pink-500 border-2 border-[#080C14] flex items-center justify-center font-bold text-xs text-white">A</div>
                <div className="w-9 h-9 rounded-full bg-purple-500 border-2 border-[#080C14] flex items-center justify-center font-bold text-xs text-white">R</div>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Mais de <span className="text-pink-500 font-bold">1.200+ profissionais</span> já otimizaram seus agendamentos esta semana.
              </p>
            </div>
          </div>

          {/* Coluna Direita: SIMULADOR DE CELULAR PREMIUM */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            
            {/* Cabeçalho do Simulador para destacar o que é */}
            <div className="text-center mb-8 max-w-sm relative z-20 px-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 animate-pulse border ${
                isDark 
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                  : 'bg-orange-50 text-orange-600 border-orange-200'
              }`}>
                📲 Link de Agendamento do Profissional
              </span>
              <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Experimente a visão do seu cliente
              </h3>
              <p className={`text-xs mt-1.5 font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Toque nos botões do celular abaixo para simular um agendamento em tempo real. Veja como é rápido e prático!
              </p>
            </div>

            {/* Efeito Glow atrás do celular */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-orange-500/30 rounded-[3.5rem] blur-3xl -z-10 pointer-events-none" />

            {/* Balão Explicativo Esquerdo (Telas Grandes) */}
            <div className={`hidden xl:flex absolute left-[-60px] top-[35%] w-52 p-4 rounded-2xl backdrop-blur-md border shadow-2xl flex-col gap-2 text-left transform -translate-x-12 hover:-translate-x-10 transition-all duration-300 z-20 ${
              isDark 
                ? 'bg-[#0E1321]/95 border-slate-800/80 shadow-black/80' 
                : 'bg-white/95 border-slate-200/80 shadow-slate-200/50'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                <Smartphone className="w-4.5 h-4.5" />
              </div>
              <h5 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Sem Complicação</h5>
              <p className={`text-[10px] leading-relaxed font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Seu cliente abre o link direto no navegador (Instagram, WhatsApp). Sem baixar apps ou criar senhas.
              </p>
            </div>

            {/* Balão Explicativo Direito (Telas Grandes) */}
            <div className={`hidden xl:flex absolute right-[-60px] top-[50%] w-52 p-4 rounded-2xl backdrop-blur-md border shadow-2xl flex-col gap-2 text-left transform translate-x-12 hover:translate-x-10 transition-all duration-300 z-20 ${
              isDark 
                ? 'bg-[#0E1321]/95 border-slate-800/80 shadow-black/80' 
                : 'bg-white/95 border-slate-200/80 shadow-slate-200/50'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/20">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <h5 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Piloto Automático</h5>
              <p className={`text-[10px] leading-relaxed font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                O cliente escolhe o serviço, dia e hora em segundos. Notificação automática via WhatsApp.
              </p>
            </div>
            
            {/* Celular Realista */}
            <div className="relative w-full max-w-[340px] aspect-[9/18.8] bg-[#1C1F2E] rounded-[3.2rem] p-3.5 shadow-2xl border-4 border-[#2D3142] ring-1 ring-white/15 overflow-hidden flex flex-col">
              
              {/* Botões Laterais Simulados */}
              <div className="absolute top-24 -left-1 w-[3px] h-12 bg-[#2D3142] rounded-r-md" />
              <div className="absolute top-40 -left-1 w-[3px] h-12 bg-[#2D3142] rounded-r-md" />
              <div className="absolute top-32 -right-1 w-[3px] h-16 bg-[#2D3142] rounded-l-md" />

              {/* Dynamic Island Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-3">
                <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800" />
                <div className="w-8 h-1 bg-slate-900 rounded-full" />
              </div>

              {/* Reflexo Vidro Diagonal */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent z-30" />

              {/* Tela do Aparelho */}
              <div className="w-full h-full bg-[#080C14] rounded-[2.6rem] overflow-hidden flex flex-col justify-between border border-slate-900 relative z-10 select-none">
                
                {/* Barra de Status */}
                <div className="flex justify-between items-center text-[9px] font-black text-slate-400 px-6 pt-2 pb-1 bg-[#080C14] z-20">
                  <span>09:41</span>
                  <div className="flex items-center gap-1.5">
                    <Signal className="w-3 h-3 text-slate-400" />
                    <Wifi className="w-3 h-3 text-slate-400" />
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Header Mockup */}
                <div className="flex items-center justify-between border-b border-slate-900 px-5 py-3 mb-2.5 bg-[#080C14]/90 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-md shadow-pink-500/10">
                      B
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white leading-none">BoraMarka Barber</h4>
                      <span className="text-[8px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Online
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  </div>
                </div>

                {/* Conteúdo dos Passos */}
                <div className="flex-1 flex flex-col px-5 overflow-y-auto no-scrollbar pb-6">
                  {simStep === 1 && (
                    <div className="animate-scale-in flex flex-col flex-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">
                        Passo 1: Escolha o Serviço
                      </p>
                      <div className="space-y-2.5 flex-1">
                        {mockServices.map((service, idx) => {
                          const IconComp = service.icon
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setSimService(service)
                                setSimStep(2)
                              }}
                              className="w-full p-3.5 rounded-2xl bg-[#0E1321] hover:bg-[#151D33] border border-slate-800/80 hover:border-pink-500/50 text-left transition-all flex justify-between items-center group active:scale-[0.98] shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/10 flex items-center justify-center text-orange-400 group-hover:text-pink-400 transition-colors">
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white group-hover:text-pink-400 transition-colors">{service.name}</p>
                                  <p className="text-[10px] text-slate-500 font-semibold">{service.duration} min</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-black text-slate-200">R$ {service.price}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-pink-500 transition-colors" />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {simStep === 2 && (
                    <div className="animate-scale-in flex flex-col flex-1">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Passo 2: Horário</span>
                        <button onClick={() => setSimStep(1)} className="text-[10px] font-bold text-pink-500 hover:underline">Voltar</button>
                      </div>
                      
                      <div className="p-3 rounded-2xl bg-[#0E1321] border border-slate-800 text-[10px] font-bold text-slate-300 mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5 text-orange-400" /> {simService?.name}</span>
                        <span className="text-pink-500 font-black">R$ {simService?.price}</span>
                      </div>

                      {/* Seletor de Dia */}
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Selecione o Dia</p>
                      <div className="grid grid-cols-4 gap-1.5 mb-4">
                        {mockDays.map((day, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedDay(day.label)}
                            className={`p-2 rounded-xl text-center border transition-all ${
                              selectedDay === day.label 
                                ? 'bg-gradient-to-br from-orange-500 to-pink-500 border-transparent text-white font-black scale-105' 
                                : 'bg-[#0E1321] border-slate-800 text-slate-400 font-bold hover:border-slate-700'
                            }`}
                          >
                            <p className="text-[10px] uppercase leading-none">{day.label.split(',')[0]}</p>
                            <p className="text-xs font-black mt-1">{day.label.split(',')[1]}</p>
                          </button>
                        ))}
                      </div>

                      {/* Seletor de Hora */}
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Horários Disponíveis</p>
                      <div className="grid grid-cols-3 gap-2">
                        {mockTimes.map((time, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSimTime(time)
                              setSimStep(3)
                            }}
                            className="p-2.5 rounded-xl bg-[#0E1321] hover:bg-[#151D33] border border-slate-800 hover:border-orange-500 text-center font-black text-xs text-white transition-all active:scale-[0.98] hover:scale-102"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {simStep === 3 && (
                    <div className="animate-scale-in flex flex-col flex-1">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Passo 3: Seus Dados</span>
                        <button onClick={() => setSimStep(2)} className="text-[10px] font-bold text-pink-500 hover:underline">Voltar</button>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#0E1321] border border-slate-800 text-[10px] font-bold text-slate-300 mb-4 flex flex-col gap-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Serviço:</span>
                          <span className="text-white font-black">{simService?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Data/Hora:</span>
                          <span className="text-orange-400 font-black">{selectedDay} às {simTime}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider block mb-1">Seu Nome</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                              type="text" 
                              placeholder="Ex: João Silva" 
                              value={simName}
                              onChange={(e) => setSimName(e.target.value)}
                              className="w-full bg-[#0E1321] border border-slate-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none text-white transition-all font-semibold"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider block mb-1">Seu Celular (WhatsApp)</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                              type="text" 
                              placeholder="Ex: (11) 99999-9999" 
                              value={simPhone}
                              onChange={(e) => setSimPhone(e.target.value)}
                              className="w-full bg-[#0E1321] border border-slate-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none text-white transition-all font-semibold"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => setSimStep(4)}
                          disabled={!simName || !simPhone}
                          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:opacity-55 disabled:cursor-not-allowed rounded-2xl text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 active:scale-[0.98] mt-2"
                        >
                          Confirmar Agendamento <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 4 && (
                    <div className="animate-scale-in flex flex-col items-center justify-center text-center flex-1 py-2">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      
                      <h4 className="text-sm font-black text-white mb-2">Horário Confirmado!</h4>
                      
                      {/* Recibo Simulado */}
                      <div className="w-full bg-[#0E1321] rounded-2xl p-4 border border-slate-800 text-left text-[10px] space-y-2 mb-6">
                        <div className="flex justify-between border-b border-slate-800/50 pb-2">
                          <span className="text-slate-500">Cliente:</span>
                          <span className="text-white font-bold">{simName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/50 pb-2">
                          <span className="text-slate-500">Serviço:</span>
                          <span className="text-white font-bold">{simService?.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/50 pb-2">
                          <span className="text-slate-500">Horário:</span>
                          <span className="text-orange-400 font-bold">{selectedDay} às {simTime}</span>
                        </div>
                        <div className="flex justify-between font-black">
                          <span className="text-slate-400">Total:</span>
                          <span className="text-emerald-400 text-xs">R$ {simService?.price}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full mt-2">
                        <button
                          onClick={resetSimulator}
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-xl text-xs font-black text-white transition-all active:scale-[0.98] shadow-lg shadow-pink-500/20"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Agendar Outro
                        </button>
                        
                        <button
                          onClick={() => {
                            const isCloseToBooking = selectedDay === 'Qui, 18' && (simTime === '09:00' || simTime === '10:30');
                            if (isCloseToBooking) {
                              setSimStep(7);
                            } else {
                              setSimStep(5);
                            }
                          }}
                          className="flex items-center justify-center gap-1.5 w-full py-2 border border-red-500/30 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-[10px] font-black text-red-400 transition-all active:scale-[0.98]"
                        >
                          Cancelar Agendamento
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 5 && (
                    <div className="animate-scale-in flex flex-col items-center justify-center text-center flex-1 py-2">
                      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 animate-pulse">
                        <Shield className="w-6 h-6" />
                      </div>
                      
                      <h4 className="text-xs font-black text-white mb-2">Cancelar Agendamento?</h4>
                      <p className="text-[10px] text-slate-400 mb-4 font-semibold max-w-[240px]">
                        Deseja mesmo cancelar o horário de <span className="text-white font-bold">{simService?.name}</span> para <span className="text-orange-400 font-bold">{selectedDay} às {simTime}</span>?
                      </p>
                      
                      <div className="flex flex-col gap-1.5 w-full">
                        <button
                          onClick={() => setSimStep(6)}
                          className="w-full py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-white font-black text-xs transition-all active:scale-[0.98] shadow-lg shadow-red-500/20"
                        >
                          Sim, Cancelar Horário
                        </button>
                        
                        <button
                          onClick={() => setSimStep(4)}
                          className="w-full py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 rounded-xl text-[10px] font-black text-slate-300 transition-all active:scale-[0.98]"
                        >
                          Não, Voltar
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 6 && (
                    <div className="animate-scale-in flex flex-col items-center justify-center text-center flex-1 py-2">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-4">
                        <Check className="w-6 h-6" />
                      </div>
                      
                      <h4 className="text-xs font-black text-white mb-2">Agendamento Cancelado</h4>
                      <p className="text-[10px] text-slate-400 mb-5 font-semibold max-w-[240px]">
                        A vaga foi liberada na agenda do profissional. O aviso de cancelamento foi enviado via WhatsApp.
                      </p>
                      
                      <button
                        onClick={resetSimulator}
                        className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-xl text-xs font-black text-white transition-all active:scale-[0.98] shadow-lg shadow-pink-500/20"
                      >
                        Novo Agendamento
                      </button>
                    </div>
                  )}

                  {simStep === 7 && (
                    <div className="animate-scale-in flex flex-col items-center justify-center text-center flex-1 py-2">
                      <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 mb-4 animate-bounce">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      
                      <h4 className="text-xs font-black text-white mb-2">Prazo Expirado!</h4>
                      <p className="text-[10px] text-slate-400 mb-4 font-semibold max-w-[240px] leading-relaxed">
                        Cancelamentos online só são permitidos com até <span className="text-white font-bold">2 horas</span> de antecedência.
                        <br /><br />
                        Para cancelar seu horário de hoje às <span className="text-orange-400 font-bold">{simTime}</span>, fale direto com o profissional.
                      </p>
                      
                      <div className="flex flex-col gap-1.5 w-full">
                        <a
                          href={`https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20cancelar%20meu%20horário%20de%20hoje%20às%20${simTime}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-black text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                        >
                          <Phone className="w-3.5 h-3.5" /> Falar no WhatsApp
                        </a>
                        
                        <button
                          onClick={() => setSimStep(4)}
                          className="w-full py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 rounded-xl text-[10px] font-black text-slate-300 transition-all active:scale-[0.98]"
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Home Indicator Bar */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-800 rounded-full z-30" />

              </div>
            </div>
          </div>

        </div>

        {/* ═══ SEÇÃO: COMO FUNCIONA E WHATSAPP SIMULATOR ═══ */}
        <section id="how-it-works" className="py-16 border-t border-slate-900/30 dark:border-slate-800/40">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-pink-500 uppercase tracking-widest">Sem Ligação, Sem Complicação</span>
            <h3 className="text-3xl font-black mt-2">Como o BoraMarka resolve sua vida</h3>
            <p className={`text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Em apenas 3 etapas rápidas você coloca sua agenda inteira no piloto automático.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className={`p-6 rounded-2xl border text-left flex flex-col items-start hover:scale-[1.02] transition-all duration-300 ${isDark ? 'bg-[#0E1321]/50 border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-200 shadow-md'}`}>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4 font-black flex-shrink-0">1</div>
              <h4 className="text-base font-black mb-2">Cadastre seu Perfil</h4>
              <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Adicione suas fotos, defina seus horários de atendimento e cadastre seus serviços com preços e durações.
              </p>
            </div>
            <div className={`p-6 rounded-2xl border text-left flex flex-col items-start hover:scale-[1.02] transition-all duration-300 ${isDark ? 'bg-[#0E1321]/50 border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-200 shadow-md'}`}>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 mb-4 font-black flex-shrink-0">2</div>
              <h4 className="text-base font-black mb-2">Compartilhe o Link</h4>
              <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Coloque o link da sua agenda personalizada na bio do seu Instagram, no botão do WhatsApp ou envie direto para clientes.
              </p>
            </div>
            <div className={`p-6 rounded-2xl border text-left flex flex-col items-start hover:scale-[1.02] transition-all duration-300 ${isDark ? 'bg-[#0E1321]/50 border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-200 shadow-md'}`}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4 font-black flex-shrink-0">3</div>
              <h4 className="text-base font-black mb-2">Deixe no Piloto Automático</h4>
              <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Os clientes agendam sozinhos 24h por dia. A plataforma envia lembretes automáticos e você só acompanha no seu painel.
              </p>
            </div>
          </div>

          {/* SIMULADOR DE WHATSAPP MOCK */}
          <div className="max-w-xl mx-auto rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* WhatsApp Header */}
            <div className="bg-[#075E54] dark:bg-[#128C7E] p-4 flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-white font-black text-sm relative flex-shrink-0">
                BM
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#128C7E] absolute bottom-0 right-0" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black">BoraMarka Lembretes</h4>
                <p className="text-[10px] text-white/80 font-medium">Conta Comercial Oficial</p>
              </div>
            </div>
            
            {/* WhatsApp Chat Area */}
            <div className={`p-5 min-h-[220px] flex flex-col gap-3.5 text-left text-xs ${isDark ? 'bg-[#0B0F19]' : 'bg-[#E5DDD5]'}`}>
              {waMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-slate-900 ${
                    msg.isUser 
                      ? 'bg-[#DCF8C6] self-end rounded-tr-none' 
                      : 'bg-white self-start rounded-tl-none'
                  }`}
                  style={{ animation: 'scaleIn 0.3s ease-out forwards' }}
                >
                  <p className="leading-relaxed whitespace-pre-line font-medium text-slate-800">{msg.text}</p>
                  <span className="text-[9px] text-slate-500 block text-right mt-1 font-bold">{msg.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SEÇÃO: CALCULADORA ROI ═══ */}
        <section className={`py-16 px-8 rounded-3xl border mb-24 relative overflow-hidden text-left ${isDark ? 'bg-gradient-to-br from-[#0E1321] to-[#080C14] border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6">
              <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Calculadora de Produtividade</span>
              <h3 className="text-3xl font-black mt-2 mb-4">Veja quanto tempo e dinheiro você está deixando na mesa</h3>
              <p className={`text-sm mb-8 font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Responda no WhatsApp, marque no caderno, reagende no bate-papo... Isso gasta seu tempo de atendimento e custa caro! Ajuste os valores abaixo para calcular.
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2 font-bold text-xs">
                    <span>Agendamentos por semana:</span>
                    <span className="text-orange-500 font-black text-sm">{weeklyAppts}</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="150" 
                    value={weeklyAppts}
                    onChange={(e) => setWeeklyAppts(Number(e.target.value))}
                    className="w-full accent-orange-500 bg-slate-800 rounded-lg h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 font-bold text-xs">
                    <span>Ticket Médio por atendimento:</span>
                    <span className="text-pink-500 font-black text-sm">R$ {avgTicket}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="300" 
                    value={avgTicket}
                    onChange={(e) => setAvgTicket(Number(e.target.value))}
                    className="w-full accent-pink-500 bg-slate-800 rounded-lg h-2"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex flex-col justify-between min-h-[160px]">
                <div>
                  <Clock className="w-8 h-8 text-orange-500 mb-2" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tempo livre ganho</h4>
                </div>
                <div>
                  <p className="text-3xl font-black text-orange-400 mt-4">{timeSavedHours}h</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">por mês economizados de digitação</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-between min-h-[160px]">
                <div>
                  <DollarSign className="w-8 h-8 text-emerald-500 mb-2" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Faturamento Recuperado</h4>
                </div>
                <div>
                  <p className="text-3xl font-black text-emerald-400 mt-4">R$ {recoveredRevenue}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">recuperado por mês reduzindo esquecimentos</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ═══ SEÇÃO: BENEFÍCIOS ADICIONAIS ═══ */}
        <section className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-purple-500 uppercase tracking-widest">Tudo o que você precisa</span>
            <h3 className="text-3xl font-black mt-2">Um ecossistema completo para prosperar</h3>
            <p className={`text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Esqueça planilhas, anotações perdidas e controles paralelos. Unifique sua gestão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className={`p-8 rounded-3xl border text-left transition-all duration-300 hover:-translate-y-1 ${
              isDark ? 'bg-[#0E1321] border-slate-800/80' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-black mb-3">Link de Agendamento</h4>
              <p className={`text-xs leading-relaxed font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Seu cliente escolhe o serviço, profissional, dia e horário. Tudo atualizado em tempo real na sua agenda.
              </p>
            </div>

            {/* Card 2 */}
            <div className={`p-8 rounded-3xl border text-left transition-all duration-300 hover:-translate-y-1 ${
              isDark ? 'bg-[#0E1321] border-slate-800/80' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 mb-6">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-black mb-3">Fluxo de Caixa Rápido</h4>
              <p className={`text-xs leading-relaxed font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Controle financeiro simples integrado. Lançamento automático dos valores dos agendamentos efetuados.
              </p>
            </div>

            {/* Card 3 */}
            <div className={`p-8 rounded-3xl border text-left transition-all duration-300 hover:-translate-y-1 ${
              isDark ? 'bg-[#0E1321] border-slate-800/80' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-black mb-3">Histórico de Clientes</h4>
              <p className={`text-xs leading-relaxed font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Veja quantas vezes cada cliente agendou, os serviços preferidos dele e faturamento gerado.
              </p>
            </div>

          </div>
        </section>

        {/* ═══ SEÇÃO: TABELA DE PREÇOS ═══ */}
        <section id="pricing" className="py-16">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Escolha a Melhor Opção</span>
            <h3 className="text-3xl font-black mt-2">Planos simples e transparentes</h3>
            <p className={`text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Todos os planos contam com suporte dedicado e acesso a todos os recursos.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
            
            {/* Card 1: BoraTestar (Trial) */}
            <div className={`p-8 rounded-[2rem] border text-center flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${isDark ? 'bg-[#0E1321] border-slate-800/80' : 'bg-white border-slate-200 shadow-xl'}`}>
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
                
                <p className={`text-xs font-medium mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Experimente com todos os recursos liberados. Sem cartão de crédito.
                </p>

                <ul className="space-y-3 mb-8 text-left border-t pt-6 border-slate-850 dark:border-slate-800/60">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs font-bold">
                      <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                onClick={() => navigate('/register')}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20"
              >
                Começar Teste Grátis
              </button>
            </div>

            {/* Card 2: Mensal */}
            <div className={`p-8 rounded-[2rem] border text-center flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${isDark ? 'bg-[#0E1321] border-slate-800/80' : 'bg-white border-slate-200 shadow-xl'}`}>
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
                
                <p className={`text-xs font-medium mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Excelente para começar a colher os resultados com fidelidade.
                </p>

                <ul className="space-y-3 mb-8 text-left border-t pt-6 border-slate-850 dark:border-slate-800/60">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs font-bold">
                      <div className="w-4.5 h-4.5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                onClick={() => navigate('/register')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/20"
              >
                Assinar BoraMensal
              </button>
            </div>

            {/* Card 3: Anual */}
            <div className={`relative p-8 rounded-[2rem] border-2 text-center flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${isDark ? 'bg-[#0E1321] border-orange-500 shadow-2xl shadow-orange-500/10' : 'bg-white border-orange-500 shadow-2xl shadow-orange-500/10'}`}>
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
                
                <p className={`text-xs font-medium mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Para profissionais prontos para levar o faturamento a sério.
                </p>

                <ul className="space-y-3 mb-8 text-left border-t pt-6 border-slate-850 dark:border-slate-800/60">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs font-bold">
                      <div className="w-4.5 h-4.5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                onClick={() => navigate('/register')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/20"
              >
                Assinar BoraAnual
              </button>
            </div>

          </div>

          <Link to="/login" className={`block text-center text-sm font-bold mt-12 ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}>
            Já possui conta? Acessar
          </Link>
        </section>

      </main>

      {/* Footer */}
      <footer className={`py-10 border-t text-center ${isDark ? 'border-slate-955 bg-[#06080E]' : 'border-slate-200 bg-slate-100'}`}>
        <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          BoraMarka S.A. &copy; 2026. Todos os direitos reservados. Sua agenda na velocidade do seu negócio.
        </p>
      </footer>
    </div>
  )
}
