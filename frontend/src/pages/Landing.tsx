import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Check, Sparkles, Clock, Zap, 
  ArrowRight, Calendar, DollarSign, Users, 
  RotateCcw, CheckCircle2, Wifi, Battery, Signal, 
  ChevronRight, Scissors, Droplet, Star, User, Phone, AlertCircle, Shield
} from 'lucide-react'

// ─── Scroll Reveal Hook ──────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el) } },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

// ─── Reveal wrapper component ────────────────────────────
function Reveal({ children, className = '', stagger = false }: { children: React.ReactNode; className?: string; stagger?: boolean }) {
  const ref = useReveal()
  return <div ref={ref} className={`reveal ${stagger ? 'reveal-stagger' : ''} ${className}`}>{children}</div>
}

export default function Landing() {
  const navigate = useNavigate()

  // ─── Simulator State ───────────────────────────────────
  const [simStep, setSimStep] = useState(1)
  const [simService, setSimService] = useState<{ name: string; price: number; duration: number; icon: any } | null>(null)
  const [selectedDay, setSelectedDay] = useState('Qui, 18')
  const [simTime, setSimTime] = useState('')
  const [simName, setSimName] = useState('')
  const [simPhone, setSimPhone] = useState('')

  const mockServices = [
    { name: 'Corte Degradê Moderno', price: 45, duration: 30, icon: Scissors },
    { name: 'Barba Premium + Toalha', price: 35, duration: 30, icon: Droplet },
    { name: 'Combo Cabelo & Barba', price: 70, duration: 60, icon: Star }
  ]

  const mockDays = [
    { label: 'Qui, 18' }, { label: 'Sex, 19' },
    { label: 'Sáb, 20' }, { label: 'Seg, 22' }
  ]

  const mockTimes = ['09:00', '10:30', '14:00', '15:30', '17:00']

  // WhatsApp messages
  const [waMessages, setWaMessages] = useState<Array<{ text: string; isUser: boolean; time: string }>>([
    { text: 'Olá! Gostaria de agendar um horário para esta semana.', isUser: true, time: '09:40' }
  ])

  useEffect(() => {
    if (simStep === 5) {
      const t1 = setTimeout(() => {
        setWaMessages(prev => [...prev, {
          text: `✅ *BoraMarka Barber:* Olá ${simName || 'Cliente'}, seu agendamento para *${simService?.name}* está CONFIRMADO para ${selectedDay} às *${simTime}*. 🗓️`,
          isUser: false, time: '09:41'
        }])
      }, 800)
      const t2 = setTimeout(() => {
        setWaMessages(prev => [...prev, {
          text: `🔔 *Lembrete automático:* Seu horário para *${simService?.name}* é hoje às *${simTime}*. Chegue com 5 min de antecedência.`,
          isUser: false, time: '13:30'
        }])
      }, 2500)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
    if (simStep === 7) {
      const t = setTimeout(() => {
        setWaMessages(prev => [...prev, {
          text: `❌ *Cancelamento:* Olá ${simName || 'Cliente'}, seu agendamento para *${simService?.name}* no dia ${selectedDay} às *${simTime}* foi CANCELADO com sucesso.`,
          isUser: false, time: '13:32'
        }])
      }, 800)
      return () => clearTimeout(t)
    }
  }, [simStep, simName, simService, selectedDay, simTime])

  const resetSimulator = useCallback(() => {
    setSimStep(1); setSimService(null); setSimTime(''); setSimName(''); setSimPhone('')
    setWaMessages([{ text: 'Olá! Gostaria de agendar um horário para esta semana.', isUser: true, time: '09:40' }])
  }, [])

  // ROI Calculator
  const [weeklyAppts, setWeeklyAppts] = useState(30)
  const [avgTicket, setAvgTicket] = useState(50)
  const timeSavedHours = Math.round((weeklyAppts * 6 * 4) / 60)
  const recoveredRevenue = Math.round(weeklyAppts * 4 * 0.22 * avgTicket)

  const baseFeatures = [
    'Agendamentos Ilimitados',
    'Links de agendamento próprios',
    'Notificações automáticas WhatsApp',
    'Fluxo de Caixa integrado'
  ]

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="relative min-h-screen bg-[#050507] text-white overflow-hidden grain">
      
      {/* ── Mesh Gradient Orbs ── */}
      <div className="orb w-[700px] h-[700px] bg-violet-600/[0.07] top-[-200px] left-[-100px] blur-[160px]" />
      <div className="orb w-[500px] h-[500px] bg-pink-600/[0.05] top-[30%] right-[-120px] blur-[140px]" style={{ animationDelay: '-7s' }} />
      <div className="orb w-[600px] h-[600px] bg-orange-600/[0.04] bottom-[10%] left-[20%] blur-[160px]" style={{ animationDelay: '-14s' }} />

      {/* ═══════════════════════════════════════════════════
          NAVBAR — Fluid Floating Glass Island
          ═══════════════════════════════════════════════════ */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-4xl">
        <nav className="glass-nav rounded-full px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-violet-500/20">
              B
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white/90">BoraMarka</span>
          </Link>

          <div className="flex items-center gap-3">
            <a href="#pricing" className="hidden sm:block text-[13px] font-medium text-white/50 hover:text-white/80 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
              Planos
            </a>
            <Link
              to="/login"
              className="mag-btn group flex items-center gap-2 rounded-full bg-white/[0.07] border border-white/[0.08] px-4 py-2 text-[13px] font-semibold text-white/80 hover:text-white hover:bg-white/[0.12] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              Entrar
              <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <ArrowRight className="w-3 h-3 text-white/60" />
              </span>
            </Link>
          </div>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════
          HERO — Editorial Split
          ═══════════════════════════════════════════════════ */}
      <main className="relative z-10">
        <section className="min-h-[100dvh] flex items-center px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto w-full pt-32 pb-24 md:pt-40 md:pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center">

              {/* Left — Copy */}
              <div className="lg:col-span-5 flex flex-col items-start text-left">
                <Reveal>
                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.06] px-4 py-1.5 text-[11px] font-semibold tracking-[0.15em] uppercase text-violet-400 mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    Automação Inteligente
                  </div>
                </Reveal>

                <Reveal>
                  <h1 className="text-[clamp(2.4rem,5.5vw,4.2rem)] font-extrabold tracking-[-0.035em] leading-[1.05] mb-7 text-white/95">
                    Pare de perder clientes
                    <br />
                    <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                      no WhatsApp.
                    </span>
                  </h1>
                </Reveal>

                <Reveal>
                  <p className="text-[17px] leading-[1.7] text-white/40 font-medium max-w-md mb-10">
                    Cada mensagem manual é um cliente que pode desistir. Automatize seus agendamentos e receba pagamentos antecipados — enquanto você foca no seu trabalho.
                  </p>
                </Reveal>

                <Reveal>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <a
                      href="#pricing"
                      className="mag-btn group inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-7 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-violet-600/20"
                    >
                      Começar 7 dias grátis
                      <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </a>
                    <a
                      href="#how-it-works"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-7 py-3.5 text-[14px] font-semibold text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    >
                      Como funciona
                    </a>
                  </div>
                </Reveal>

                <Reveal>
                  <p className="mt-5 text-[12px] text-white/25 font-medium">
                    Sem cartão de crédito · Cancele quando quiser
                  </p>
                </Reveal>
              </div>

              {/* Right — Phone Simulator */}
              <div className="lg:col-span-7 flex justify-center relative">
                <Reveal>
                  {/* Glow behind phone */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 via-pink-500/10 to-transparent rounded-[3rem] blur-3xl pointer-events-none" />

                  {/* Double-Bezel Phone Frame */}
                  <div className="doppelrand max-w-[340px] w-full">
                    <div className="doppelrand-inner overflow-hidden flex flex-col" style={{ aspectRatio: '9/18.5' }}>
                      
                      {/* Dynamic Island */}
                      <div className="flex justify-center pt-3 pb-2 bg-[#080a16]">
                        <div className="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2.5">
                          <div className="w-2 h-2 bg-[#111] rounded-full" />
                          <div className="w-7 h-0.5 bg-[#111] rounded-full" />
                        </div>
                      </div>

                      {/* Status Bar */}
                      <div className="flex justify-between items-center text-[9px] font-bold text-white/30 px-5 pb-1 bg-[#080a16]">
                        <span>09:41</span>
                        <div className="flex items-center gap-1">
                          <Signal className="w-2.5 h-2.5" />
                          <Wifi className="w-2.5 h-2.5" />
                          <Battery className="w-3 h-3" />
                        </div>
                      </div>

                      {/* App Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-[#080a16]/90">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-extrabold">B</div>
                          <div>
                            <p className="text-[11px] font-bold text-white/90 leading-none">BoraMarka Barber</p>
                            <span className="text-[8px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Online
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Steps Content */}
                      <div className="flex-1 flex flex-col px-4 py-3 overflow-y-auto no-scrollbar bg-[#080a16]">

                        {/* Step 1: Serviço */}
                        {simStep === 1 && (
                          <div className="animate-scale-in flex flex-col gap-2">
                            <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] text-center mb-1">Escolha o Serviço</p>
                            {mockServices.map((svc, i) => {
                              const Icon = svc.icon
                              return (
                                <button key={i} onClick={() => { setSimService(svc); setSimStep(2) }}
                                  className="w-full p-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] hover:border-violet-500/30 text-left flex items-center justify-between group transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-violet-500/[0.08] border border-violet-500/10 flex items-center justify-center text-violet-400 group-hover:text-pink-400 transition-colors duration-500">
                                      <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-semibold text-white/80 group-hover:text-white transition-colors duration-500">{svc.name}</p>
                                      <p className="text-[9px] text-white/25 font-medium">{svc.duration} min</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-bold text-white/60">R$ {svc.price}</span>
                                    <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-violet-400 transition-colors duration-500" />
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Step 2: Horário */}
                        {simStep === 2 && (
                          <div className="animate-scale-in flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em]">Data & Horário</p>
                              <button onClick={() => setSimStep(1)} className="text-[9px] font-semibold text-violet-400">Voltar</button>
                            </div>

                            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-[10px] font-medium text-white/50 flex justify-between items-center">
                              <span className="flex items-center gap-1.5"><Scissors className="w-3 h-3 text-violet-400" /> {simService?.name}</span>
                              <span className="text-violet-400 font-bold">R$ {simService?.price}</span>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5">
                              {mockDays.map((d, i) => (
                                <button key={i} onClick={() => setSelectedDay(d.label)}
                                  className={`p-2 rounded-xl text-center border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${selectedDay === d.label
                                    ? 'bg-gradient-to-br from-violet-600 to-pink-600 border-transparent text-white font-bold'
                                    : 'bg-white/[0.02] border-white/[0.04] text-white/40 font-medium hover:border-white/10'
                                  }`}>
                                  <p className="text-[9px] uppercase leading-none">{d.label.split(',')[0]}</p>
                                  <p className="text-[11px] font-bold mt-0.5">{d.label.split(',')[1]}</p>
                                </button>
                              ))}
                            </div>

                            <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em]">Horários</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {mockTimes.map((t, i) => (
                                <button key={i} onClick={() => { setSimTime(t); setSimStep(3) }}
                                  className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-violet-500/40 text-center font-bold text-[11px] text-white/60 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 3: Dados */}
                        {simStep === 3 && (
                          <div className="animate-scale-in flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em]">Seus Dados</p>
                              <button onClick={() => setSimStep(2)} className="text-[9px] font-semibold text-violet-400">Voltar</button>
                            </div>

                            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-[10px] font-medium text-white/50 space-y-1">
                              <div className="flex justify-between"><span className="text-white/30">Serviço:</span><span className="text-white/70 font-bold">{simService?.name}</span></div>
                              <div className="flex justify-between"><span className="text-white/30">Horário:</span><span className="text-violet-400 font-bold">{selectedDay} às {simTime}</span></div>
                            </div>

                            <div className="space-y-2.5">
                              <div>
                                <label className="text-[8px] font-bold uppercase text-white/20 tracking-[0.15em] block mb-1">Nome</label>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                  <input type="text" placeholder="João Silva" value={simName} onChange={e => setSimName(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl pl-9 pr-3 py-2.5 text-[11px] text-white/80 font-medium focus:outline-none transition-colors placeholder:text-white/15" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[8px] font-bold uppercase text-white/20 tracking-[0.15em] block mb-1">WhatsApp</label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                  <input type="text" placeholder="(11) 99999-9999" value={simPhone} onChange={e => setSimPhone(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl pl-9 pr-3 py-2.5 text-[11px] text-white/80 font-medium focus:outline-none transition-colors placeholder:text-white/15" />
                                </div>
                              </div>

                              <button onClick={() => setSimStep(4)} disabled={!simName || !simPhone}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 disabled:opacity-40 rounded-xl text-white font-bold text-[11px] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 mt-1">
                                Confirmar <Check className="w-3 h-3" />
                              </button>
                              <p className="text-[8px] text-white/15 font-medium text-center">Sinal de R$ 10,00 via Mercado Pago</p>
                            </div>
                          </div>
                        )}

                        {/* Step 4: Pagamento */}
                        {simStep === 4 && (
                          <div className="animate-scale-in flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em]">Pagamento</p>
                              <button onClick={() => setSimStep(3)} className="text-[9px] font-semibold text-violet-400">Voltar</button>
                            </div>

                            <div className="text-center py-2">
                              <span className="text-xl">💳</span>
                              <h4 className="text-[11px] font-bold text-white/80 mt-1">Sinal de Reserva</h4>
                              <p className="text-[9px] text-white/30 font-medium mt-1 max-w-[200px] mx-auto leading-relaxed">
                                Pague o sinal diretamente ao profissional. O restante é pago no atendimento.
                              </p>
                            </div>

                            <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-[10px] space-y-1.5">
                              <div className="flex justify-between border-b border-white/[0.03] pb-1.5"><span className="text-white/25">Serviço</span><span className="text-white/60 font-medium">{simService?.name}</span></div>
                              <div className="flex justify-between border-b border-white/[0.03] pb-1.5"><span className="text-white/25">Horário</span><span className="text-violet-400 font-medium">{selectedDay} · {simTime}</span></div>
                              <div className="flex justify-between border-b border-white/[0.03] pb-1.5"><span className="text-white/25">Total</span><span className="text-white/60 font-medium">R$ {simService?.price}</span></div>
                              <div className="flex justify-between pt-0.5"><span className="text-white/50 font-bold">Sinal agora</span><span className="text-emerald-400 font-bold">R$ 10,00</span></div>
                            </div>

                            <button onClick={() => setSimStep(5)}
                              className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl text-white font-bold text-[11px] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                              Pagar com Mercado Pago
                            </button>

                            <p className="text-[7px] text-white/15 font-medium text-center leading-relaxed">
                              Pagamento processado direto pelo Mercado Pago do profissional.
                            </p>
                          </div>
                        )}

                        {/* Step 5: Sucesso */}
                        {simStep === 5 && (
                          <div className="animate-scale-in flex flex-col items-center justify-center text-center flex-1 py-2">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h4 className="text-[12px] font-bold text-white/90 mb-0.5">Confirmado!</h4>
                            <p className="text-[9px] text-emerald-400 font-semibold mb-3">Sinal recebido pelo profissional</p>

                            <div className="w-full rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-[10px] space-y-1.5 text-left mb-4">
                              <div className="flex justify-between border-b border-white/[0.03] pb-1"><span className="text-white/20">Cliente</span><span className="text-white/60 font-medium">{simName}</span></div>
                              <div className="flex justify-between border-b border-white/[0.03] pb-1"><span className="text-white/20">Serviço</span><span className="text-white/60 font-medium">{simService?.name}</span></div>
                              <div className="flex justify-between border-b border-white/[0.03] pb-1"><span className="text-white/20">Quando</span><span className="text-violet-400 font-medium">{selectedDay} · {simTime}</span></div>
                              <div className="flex justify-between pt-0.5"><span className="text-white/30 font-bold">Restante</span><span className="text-white/70 font-bold">R$ {(simService?.price || 0) - 10}</span></div>
                            </div>

                            <div className="flex flex-col gap-1.5 w-full">
                              <button onClick={resetSimulator} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl text-[10px] font-bold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                                <RotateCcw className="w-3 h-3" /> Agendar Outro
                              </button>
                              <button onClick={() => { const close = selectedDay === 'Qui, 18' && (simTime === '09:00' || simTime === '10:30'); setSimStep(close ? 8 : 6) }}
                                className="w-full py-2 border border-red-500/20 bg-red-500/[0.03] rounded-xl text-[9px] font-bold text-red-400/80 active:scale-[0.98] transition-all">
                                Cancelar Agendamento
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 6: Confirma cancelamento */}
                        {simStep === 6 && (
                          <div className="animate-scale-in flex flex-col items-center justify-center text-center flex-1 py-2">
                            <div className="w-10 h-10 rounded-full bg-red-500/[0.08] border border-red-500/20 flex items-center justify-center text-red-400 mb-3 animate-pulse">
                              <Shield className="w-5 h-5" />
                            </div>
                            <h4 className="text-[11px] font-bold text-white/80 mb-1.5">Cancelar agendamento?</h4>
                            <p className="text-[9px] text-white/30 font-medium mb-4 max-w-[200px] leading-relaxed">
                              <span className="text-white/50 font-bold">{simService?.name}</span> em <span className="text-violet-400 font-bold">{selectedDay} às {simTime}</span>
                            </p>
                            <div className="flex flex-col gap-1.5 w-full">
                              <button onClick={() => setSimStep(7)} className="w-full py-2.5 bg-red-500 rounded-xl text-white font-bold text-[10px] active:scale-[0.98] transition-all">Sim, cancelar</button>
                              <button onClick={() => setSimStep(5)} className="w-full py-2 border border-white/[0.06] rounded-xl text-[10px] font-bold text-white/40 active:scale-[0.98] transition-all">Não, voltar</button>
                            </div>
                          </div>
                        )}

                        {/* Step 7: Cancelado */}
                        {simStep === 7 && (
                          <div className="animate-scale-in flex flex-col items-center justify-center text-center flex-1 py-2">
                            <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 mb-3"><Check className="w-5 h-5" /></div>
                            <h4 className="text-[11px] font-bold text-white/80 mb-1.5">Cancelado</h4>
                            <p className="text-[9px] text-white/30 font-medium mb-4 max-w-[200px] leading-relaxed">A vaga foi liberada e o profissional foi notificado.</p>
                            <button onClick={resetSimulator} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl text-[10px] font-bold text-white active:scale-[0.98] transition-all">Novo Agendamento</button>
                          </div>
                        )}

                        {/* Step 8: Prazo expirado */}
                        {simStep === 8 && (
                          <div className="animate-scale-in flex flex-col items-center justify-center text-center flex-1 py-2">
                            <div className="w-10 h-10 rounded-full bg-orange-500/[0.08] border border-orange-500/20 flex items-center justify-center text-orange-400 mb-3 animate-bounce"><AlertCircle className="w-5 h-5" /></div>
                            <h4 className="text-[11px] font-bold text-white/80 mb-1.5">Prazo Expirado</h4>
                            <p className="text-[9px] text-white/30 font-medium mb-4 max-w-[200px] leading-relaxed">
                              Cancelamento online permitido apenas com <span className="text-white/60 font-bold">2h</span> de antecedência. Fale com o profissional.
                            </p>
                            <div className="flex flex-col gap-1.5 w-full">
                              <a href={`https://wa.me/5511999999999`} target="_blank" rel="noopener noreferrer"
                                className="w-full py-2.5 bg-emerald-500 rounded-xl text-white font-bold text-[10px] flex items-center justify-center gap-1.5">
                                <Phone className="w-3 h-3" /> WhatsApp
                              </a>
                              <button onClick={() => setSimStep(5)} className="w-full py-2 border border-white/[0.06] rounded-xl text-[10px] font-bold text-white/40 active:scale-[0.98]">Voltar</button>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Home indicator */}
                      <div className="flex justify-center py-2 bg-[#080a16]">
                        <div className="w-24 h-1 bg-white/10 rounded-full" />
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            HOW IT WORKS — 3-Step Bento
            ═══════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-32 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-20">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-violet-400 mb-4">Como funciona</p>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90">
                  Três passos para nunca mais<br />digitar "que horário serve?"
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal-stagger">
              {[
                { step: '01', title: 'Monte seu catálogo', desc: 'Configure serviços, preços, horários e fotos. Seu perfil fica pronto em 3 minutos.', color: 'violet' },
                { step: '02', title: 'Compartilhe o link', desc: 'Cole na bio do Instagram, no status do WhatsApp ou mande direto para o cliente.', color: 'pink' },
                { step: '03', title: 'Receba no automático', desc: 'Agendamentos 24h com sinal antecipado. Lembretes automáticos eliminam faltas.', color: 'orange' }
              ].map((item, i) => (
                <Reveal key={i}>
                  <div className="doppelrand h-full">
                    <div className="doppelrand-inner p-8 h-full flex flex-col items-start text-left">
                      <span className={`text-[11px] font-bold tracking-[0.2em] uppercase mb-6 ${
                        item.color === 'violet' ? 'text-violet-400' : item.color === 'pink' ? 'text-pink-400' : 'text-orange-400'
                      }`}>{item.step}</span>
                      <h3 className="text-[18px] font-bold text-white/90 mb-3 tracking-tight">{item.title}</h3>
                      <p className="text-[14px] text-white/35 font-medium leading-[1.65]">{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            WHATSAPP PREVIEW
            ═══════════════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6">
          <div className="max-w-xl mx-auto">
            <Reveal>
              <div className="doppelrand">
                <div className="doppelrand-inner overflow-hidden">
                  {/* WA Header */}
                  <div className="bg-[#128C7E] p-4 flex items-center gap-3 text-white">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-extrabold relative">
                      BM
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#128C7E] absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold">BoraMarka Lembretes</p>
                      <p className="text-[10px] text-white/70 font-medium">Conta comercial</p>
                    </div>
                  </div>
                  {/* Messages */}
                  <div className="p-5 min-h-[200px] flex flex-col gap-3 bg-[#080a16]">
                    {waMessages.map((msg, i) => (
                      <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-[11px] font-medium leading-relaxed ${
                        msg.isUser
                          ? 'bg-emerald-600/20 text-emerald-300 self-end rounded-tr-none border border-emerald-500/10'
                          : 'bg-white/[0.04] text-white/60 self-start rounded-tl-none border border-white/[0.04]'
                      }`} style={{ animation: 'scaleIn 0.3s ease-out forwards' }}>
                        <p className="whitespace-pre-line">{msg.text}</p>
                        <span className="text-[8px] text-white/20 block text-right mt-1 font-bold">{msg.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            ROI CALCULATOR
            ═══════════════════════════════════════════════════ */}
        <section className="py-32 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            <Reveal>
              <div className="doppelrand">
                <div className="doppelrand-inner p-8 md:p-14">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

                    <div className="text-left">
                      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-orange-400 mb-4">Calculadora</p>
                      <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90 mb-4">
                        Quanto tempo e dinheiro você está perdendo?
                      </h2>
                      <p className="text-[14px] text-white/30 font-medium leading-[1.7] mb-10">
                        Cada agendamento manual consome ~6 minutos no WhatsApp. Ajuste os valores e veja o impacto.
                      </p>

                      <div className="space-y-8">
                        <div>
                          <div className="flex justify-between items-center mb-3 text-[12px] font-semibold">
                            <span className="text-white/40">Agendamentos / semana</span>
                            <span className="text-orange-400 font-bold text-[14px]">{weeklyAppts}</span>
                          </div>
                          <input type="range" min="5" max="150" value={weeklyAppts} onChange={e => setWeeklyAppts(Number(e.target.value))}
                            className="w-full accent-orange-500 h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-3 text-[12px] font-semibold">
                            <span className="text-white/40">Ticket médio</span>
                            <span className="text-pink-400 font-bold text-[14px]">R$ {avgTicket}</span>
                          </div>
                          <input type="range" min="10" max="300" value={avgTicket} onChange={e => setAvgTicket(Number(e.target.value))}
                            className="w-full accent-pink-500 h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="doppelrand">
                        <div className="doppelrand-inner p-7 flex flex-col justify-between min-h-[180px]">
                          <div>
                            <Clock className="w-7 h-7 text-orange-400 mb-2" />
                            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">Tempo livre / mês</p>
                          </div>
                          <div>
                            <p className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-orange-400 tracking-tight">{timeSavedHours}h</p>
                            <p className="text-[10px] text-white/20 font-medium mt-1">economizadas de digitação</p>
                          </div>
                        </div>
                      </div>
                      <div className="doppelrand">
                        <div className="doppelrand-inner p-7 flex flex-col justify-between min-h-[180px]">
                          <div>
                            <DollarSign className="w-7 h-7 text-emerald-400 mb-2" />
                            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">Receita recuperada</p>
                          </div>
                          <div>
                            <p className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-emerald-400 tracking-tight">R$ {recoveredRevenue}</p>
                            <p className="text-[10px] text-white/20 font-medium mt-1">reduzindo faltas e no-shows</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            FEATURES — Bento Grid
            ═══════════════════════════════════════════════════ */}
        <section className="py-32 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-20">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-pink-400 mb-4">Recursos</p>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90">
                  Tudo que você precisa.<br />Nada que não precisa.
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal-stagger">
              {[
                { icon: Calendar, title: 'Agenda inteligente', desc: 'Horários se atualizam em tempo real. Sem conflitos, sem agenda dupla, sem planilha.' },
                { icon: DollarSign, title: 'Fluxo de caixa', desc: 'Controle financeiro automático alimentado por cada agendamento confirmado e pago.' },
                { icon: Users, title: 'Painel de clientes', desc: 'Histórico completo, frequência de visitas, serviços preferidos e faturamento por cliente.' }
              ].map((feat, i) => (
                <Reveal key={i}>
                  <div className="doppelrand h-full">
                    <div className="doppelrand-inner p-8 h-full flex flex-col items-start text-left">
                      <div className="w-10 h-10 rounded-[14px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-violet-400 mb-6">
                        <feat.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-[18px] font-bold text-white/90 mb-3 tracking-tight">{feat.title}</h3>
                      <p className="text-[14px] text-white/35 font-medium leading-[1.65]">{feat.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            PRICING — Premium Cards
            ═══════════════════════════════════════════════════ */}
        <section id="pricing" className="py-32 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-20">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-orange-400 mb-4">Planos</p>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90 mb-4">
                  Simples, transparente, sem surpresas.
                </h2>
                <p className="text-[15px] text-white/30 font-medium">Cancele quando quiser. Sem taxa de adesão. Sem fidelidade.</p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch reveal-stagger">

              {/* BoraTestar */}
              <Reveal>
                <div className="doppelrand h-full">
                  <div className="doppelrand-inner p-7 h-full flex flex-col justify-between text-left">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-400 mb-5">7 Dias Grátis</p>
                      <h3 className="text-[17px] font-bold text-white/90 mb-1 tracking-tight">BoraTestar</h3>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-[11px] text-white/25 font-medium">R$</span>
                        <span className="text-[36px] font-extrabold text-white/90 tracking-tight leading-none">0</span>
                      </div>
                      <p className="text-[12px] text-white/25 font-medium mb-6 leading-relaxed">Todos os recursos. Sem cartão.</p>
                      <ul className="space-y-3 mb-8">
                        {baseFeatures.map((f, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-[12px] font-medium text-white/50">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-emerald-400" /></div>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => navigate('/register')} className="mag-btn w-full py-3.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[12px] font-bold text-white/70 hover:text-white hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      Começar Teste
                    </button>
                  </div>
                </div>
              </Reveal>

              {/* BoraMensal */}
              <Reveal>
                <div className="doppelrand h-full">
                  <div className="doppelrand-inner p-7 h-full flex flex-col justify-between text-left">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-blue-400 mb-5">Mensal</p>
                      <h3 className="text-[17px] font-bold text-white/90 mb-1 tracking-tight">BoraMensal</h3>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-[11px] text-white/25 font-medium">R$</span>
                        <span className="text-[36px] font-extrabold text-white/90 tracking-tight leading-none">30</span>
                        <span className="text-[11px] text-white/25 font-medium">/mês</span>
                      </div>
                      <p className="text-[12px] text-white/25 font-medium mb-6 leading-relaxed">Ideal para começar e crescer.</p>
                      <ul className="space-y-3 mb-8">
                        {baseFeatures.map((f, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-[12px] font-medium text-white/50">
                            <div className="w-4 h-4 rounded-full bg-blue-500/[0.08] border border-blue-500/15 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-blue-400" /></div>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => navigate('/register')} className="mag-btn w-full py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-[12px] font-bold text-white shadow-lg shadow-violet-600/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      Assinar Mensal
                    </button>
                  </div>
                </div>
              </Reveal>

              {/* BoraAnual */}
              <Reveal>
                <div className="doppelrand h-full">
                  <div className="doppelrand-inner p-7 h-full flex flex-col justify-between text-left">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-orange-400 mb-5">Anual</p>
                      <h3 className="text-[17px] font-bold text-white/90 mb-1 tracking-tight">BoraAnual</h3>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-[11px] text-white/25 font-medium">R$</span>
                        <span className="text-[36px] font-extrabold text-white/90 tracking-tight leading-none">260</span>
                        <span className="text-[11px] text-white/25 font-medium">/ano</span>
                      </div>
                      <p className="text-emerald-400 text-[9px] font-bold bg-emerald-500/[0.06] px-2.5 py-1 rounded-full inline-block mb-3 tracking-wider uppercase">Economize R$ 100/ano</p>
                      <p className="text-[12px] text-white/25 font-medium mb-6 leading-relaxed">Melhor custo-benefício.</p>
                      <ul className="space-y-3 mb-8">
                        {baseFeatures.map((f, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-[12px] font-medium text-white/50">
                            <div className="w-4 h-4 rounded-full bg-orange-500/[0.08] border border-orange-500/15 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-orange-400" /></div>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => navigate('/register')} className="mag-btn w-full py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-[12px] font-bold text-white shadow-lg shadow-violet-600/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      Assinar Anual
                    </button>
                  </div>
                </div>
              </Reveal>

              {/* BoraPremium — Glow Ring */}
              <Reveal>
                <div className="glow-ring rounded-[2rem] h-full">
                  <div className="bg-[#080a16] rounded-[calc(2rem-2px)] p-7 h-full flex flex-col justify-between text-left relative">
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-[7px] font-extrabold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full text-white">
                      Completo
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-violet-400 mb-5 mt-1">Premium</p>
                      <h3 className="text-[17px] font-bold text-white/90 mb-1 tracking-tight">BoraPremium</h3>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-[11px] text-white/25 font-medium">R$</span>
                        <span className="text-[36px] font-extrabold text-white/90 tracking-tight leading-none">49<span className="text-[22px]">,99</span></span>
                        <span className="text-[11px] text-white/25 font-medium">/mês</span>
                      </div>
                      <p className="text-violet-400 text-[9px] font-bold bg-violet-500/[0.06] px-2.5 py-1 rounded-full inline-block mb-3 tracking-wider uppercase">Domínio Próprio</p>
                      <p className="text-[12px] text-white/25 font-medium mb-6 leading-relaxed">Sua marca, seu domínio, seu controle.</p>
                      <ul className="space-y-3 mb-8">
                        {['Tudo dos outros planos', 'Subdomínio profissional grátis', 'Domínio próprio personalizado', 'Remoção total da marca BoraMarka', 'Suporte VIP prioritário'].map((f, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-[12px] font-medium text-white/50">
                            <div className="w-4 h-4 rounded-full bg-violet-500/[0.08] border border-violet-500/15 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-violet-400" /></div>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => navigate('/register')} className="mag-btn w-full py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-[12px] font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      Assinar Premium
                    </button>
                  </div>
                </div>
              </Reveal>

            </div>

            <Reveal>
              <Link to="/login" className="block text-center text-[13px] font-medium text-white/25 hover:text-white/60 mt-12 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                Já possui conta? Acessar →
              </Link>
            </Reveal>
          </div>
        </section>

      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-white/[0.04] py-12 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-extrabold">B</div>
            <span className="text-[12px] font-semibold text-white/25">BoraMarka</span>
          </div>
          <p className="text-[11px] font-medium text-white/15">
            © 2026 BoraMarka. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  )
}
