import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Check, Sparkles, Clock, Zap, 
  ArrowRight, Calendar, DollarSign, Users, 
  RotateCcw, CheckCircle2, Wifi, Battery, Signal, 
  ChevronRight, Scissors, Droplet, Star, User, Phone, AlertCircle, Shield,
  ChevronDown, Menu, X, MessageSquare, BellOff, Timer, TrendingUp,
  Heart, Award, Palette, Dumbbell, Stethoscope, PenTool,
  Quote, HelpCircle, ArrowUpRight, Smartphone, ArrowUp
} from 'lucide-react'
import { BoraMarkaLogo } from '../components/BoraMarkaLogo'

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

// ─── CountUp Hook ────────────────────────────────────────
function useCountUp(end: number, duration = 2000, suffix = '') {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const startTime = performance.now()
          const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  return { ref, value: `${value}${suffix}` }
}

// ─── FAQ Item Component ──────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-[15px] font-semibold text-white/80 group-hover:text-white transition-colors duration-300 pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 text-white/30 flex-shrink-0 faq-chevron ${open ? 'open' : ''}`} />
      </button>
      <div className={`faq-answer ${open ? 'open' : ''}`}>
        <p className="text-[14px] text-white/35 font-medium leading-[1.7] pb-4">{answer}</p>
      </div>
    </div>
  )
}


export default function Landing() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('dark')
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

  // CountUp stats
  const stat1 = useCountUp(2400, 2000, '+')
  const stat2 = useCountUp(98, 1800, '%')
  const stat3 = useCountUp(12, 1500, 'h')
  const stat4 = useCountUp(4, 1200, '')

  // Nav links
  const navLinks = [
    { label: 'Dores', href: '#pain' },
    { label: 'Recursos', href: '#features' },
    { label: 'Planos', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ]

  // Close mobile menu on scroll
  useEffect(() => {
    const handler = () => setMobileMenuOpen(false)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

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
          <Link to="/" className="flex items-center">
            <BoraMarkaLogo size="sm" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

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

        {/* Mobile Menu Dropdown */}
        <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''} fixed inset-0 top-20 z-30`}>
          <div className="mobile-menu-panel mx-4 mt-2 glass-nav rounded-2xl p-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a 
                key={link.href} 
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-[14px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                {link.label}
              </a>
            ))}
            <div className="h-px bg-white/[0.04] my-1" />
            <Link 
              to="/register" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-[14px] font-bold text-violet-400 hover:bg-violet-500/[0.06] transition-all"
            >
              Criar conta grátis →
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          HERO — Editorial Split
          ═══════════════════════════════════════════════════ */}
      <main className="relative z-10">
        <section className="min-h-[100dvh] flex items-center px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto w-full pt-24 pb-16 sm:pt-36 sm:pb-24 md:pt-40 md:pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

              {/* Left — Copy */}
              <div className="lg:col-span-5 flex flex-col items-start text-left">
                <Reveal>
                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.06] px-3.5 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] sm:tracking-[0.15em] uppercase text-violet-400 mb-5 sm:mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    Usado por +500 profissionais
                  </div>
                </Reveal>

                <Reveal>
                  <h1 className="text-[clamp(1.65rem,6vw,4.2rem)] font-extrabold tracking-[-0.035em] leading-[1.08] mb-4 sm:mb-7 text-white/95">
                    Pare de perder clientes
                    <br />
                    <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                      no WhatsApp.
                    </span>
                  </h1>
                </Reveal>

                <Reveal>
                  <p className="text-[14px] sm:text-[17px] leading-[1.65] sm:leading-[1.7] text-white/40 font-medium max-w-md mb-5 sm:mb-6">
                    Cada mensagem manual é um cliente que pode desistir. Automatize seus agendamentos, elimine no-shows com lembretes inteligentes e receba pagamentos antecipados — <span className="text-white/60 font-semibold">enquanto você foca no seu trabalho.</span>
                  </p>
                </Reveal>

                <Reveal>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium text-white/40">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span>12h economizadas/semana</span>
                    </div>
                    <div className="hidden sm:block w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium text-white/40">
                      <BellOff className="w-3.5 h-3.5 text-pink-400" />
                      <span>-98% no-shows</span>
                    </div>
                  </div>
                </Reveal>

                <Reveal>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <a
                      href="#pricing"
                      className="mag-btn group inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-6 sm:px-7 py-3 sm:py-3.5 text-[13px] sm:text-[14px] font-bold text-white shadow-lg shadow-violet-600/20"
                    >
                      Começar 7 dias grátis
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </span>
                    </a>
                    <a
                      href="#how-it-works"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-6 sm:px-7 py-3 sm:py-3.5 text-[13px] sm:text-[14px] font-semibold text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    >
                      Como funciona
                    </a>
                  </div>
                </Reveal>

                <Reveal>
                  <p className="mt-4 sm:mt-5 text-[11px] sm:text-[12px] text-white/25 font-medium">
                    Sem cartão de crédito · Cancele quando quiser
                  </p>
                </Reveal>
              </div>

              {/* Right — Phone Simulator (Ultra-Premium 3D Hardware) */}
              <div className="lg:col-span-7 flex justify-center relative">
                <Reveal className="flex justify-center w-full relative">
                  
                  {/* Floating WhatsApp Live Toast Notification */}
                  <div className="hidden sm:flex absolute -right-4 md:-right-8 top-12 z-30 animate-bounce pointer-events-none" style={{ animationDuration: '5s' }}>
                    <div className="bg-[#10162a]/95 border border-emerald-500/40 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl p-3 rounded-2xl flex items-center gap-2.5 max-w-[215px]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/30">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9.5px] font-extrabold text-white">WhatsApp Auto</p>
                          <span className="text-[8px] font-bold text-emerald-400">Agora</span>
                        </div>
                        <p className="text-[9px] text-slate-300 font-medium leading-tight mt-0.5">
                          "✅ Horário confirmado para hoje às 14:00!"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ambient Multi-Layer Glow behind phone */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-pink-500/25 to-orange-500/20 rounded-[4rem] blur-3xl pointer-events-none scale-110" />

                  {/* High-End Titanium Smartphone Chassis */}
                  <div className="relative w-full max-w-[290px] xs:max-w-[315px] sm:max-w-[325px] h-[560px] xs:h-[600px] sm:h-[620px] p-2.5 sm:p-3 rounded-[2.4rem] sm:rounded-[2.8rem] bg-gradient-to-b from-[#3a3b4e] via-[#222332] to-[#0f1019] shadow-[0_30px_80px_-10px_rgba(124,58,237,0.45)] border border-white/20 shrink-0">
                    
                    {/* Metallic Hardware Buttons */}
                    <div className="absolute -left-[5px] top-24 w-[5px] h-9 rounded-l-md bg-gradient-to-r from-[#20212f] to-[#45475e] border-l border-white/30 shadow-md" />
                    <div className="absolute -left-[5px] top-36 w-[5px] h-9 rounded-l-md bg-gradient-to-r from-[#20212f] to-[#45475e] border-l border-white/30 shadow-md" />
                    <div className="absolute -right-[5px] top-28 w-[5px] h-14 rounded-r-md bg-gradient-to-l from-[#20212f] to-[#45475e] border-r border-white/30 shadow-md" />

                    {/* Inner Glass Screen Frame */}
                    <div className="w-full h-full rounded-[2.2rem] bg-[#0b0e1b] overflow-hidden border border-white/15 flex flex-col shadow-2xl relative">
                      
                      {/* Glass Sheen Overlay */}
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent z-20" />

                      {/* Dynamic Island */}
                      <div className="flex justify-center pt-2.5 pb-1 bg-[#0b0e1b] shrink-0 z-10">
                        <div className="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2.5 border border-white/15 shadow-inner">
                          <div className="w-2 h-2 rounded-full bg-[#161616] ring-1 ring-white/10 flex items-center justify-center">
                            <div className="w-0.5 h-0.5 rounded-full bg-blue-500/80" />
                          </div>
                          <div className="w-6 h-0.5 bg-[#161616] rounded-full" />
                        </div>
                      </div>

                      {/* Status Bar */}
                      <div className="flex justify-between items-center text-[9.5px] font-extrabold text-white/80 px-4 pb-1 bg-[#0b0e1b] shrink-0 z-10">
                        <span>09:41</span>
                        <div className="flex items-center gap-1">
                          <Signal className="w-2.5 h-2.5 text-white/90" />
                          <Wifi className="w-2.5 h-2.5 text-white/90" />
                          <Battery className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      {/* App Header */}
                      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-[#12172b]/95 backdrop-blur-xl shrink-0 z-10">
                        <div className="flex items-center gap-2">
                          <BoraMarkaLogo size="sm" showText={false} />
                          <div>
                            <p className="text-[11.5px] font-extrabold text-white leading-none tracking-tight">BoraMarka Barber</p>
                            <span className="text-[8.5px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> • Online
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 text-[7.5px] font-extrabold uppercase tracking-wider">
                          Agendamento
                        </span>
                      </div>

                      {/* Steps Content Screen */}
                      <div className="flex-1 flex flex-col px-3 py-3 overflow-y-auto no-scrollbar bg-gradient-to-b from-[#0b0e1b] via-[#10162a] to-[#070914] z-10">

                        {/* Step 1: Serviço */}
                        {simStep === 1 && (
                          <div className="animate-fade-in flex flex-col gap-2">
                            <div className="flex items-center justify-between px-1 mb-0.5">
                              <p className="text-[9.5px] font-extrabold text-violet-300/90 uppercase tracking-[0.18em]">
                                Escolha o Serviço
                              </p>
                              <span className="text-[8px] font-bold text-white/40">3 opções</span>
                            </div>

                            {mockServices.map((svc, i) => {
                              const Icon = svc.icon
                              const isCombo = svc.name.includes('Combo')
                              const isPopular = svc.name.includes('Degradê')

                              return (
                                <button key={i} onClick={() => { setSimService(svc); setSimStep(2) }}
                                  className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-[#151c33]/90 to-[#18203a]/90 backdrop-blur-md border border-white/10 hover:border-violet-500/60 hover:from-[#1b2340] hover:to-[#202a49] text-left flex items-center justify-between gap-2 group transition-all duration-300 active:scale-[0.98] shadow-md shadow-black/30 relative overflow-hidden">
                                  
                                  {/* Featured Badge */}
                                  {isCombo && (
                                    <span className="absolute top-0 right-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                                      ⭐ Mais Pedido
                                    </span>
                                  )}
                                  {isPopular && (
                                    <span className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                                      🔥 Popular
                                    </span>
                                  )}

                                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pt-1">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600/30 via-pink-600/20 to-purple-600/30 border border-violet-400/30 flex items-center justify-center text-violet-200 group-hover:scale-105 transition-transform shrink-0 shadow-inner">
                                      <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-extrabold text-white leading-tight group-hover:text-violet-200 transition-colors">
                                        {svc.name}
                                      </p>
                                      <p className="text-[9px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                                        <Clock className="w-2.5 h-2.5 text-slate-400" /> {svc.duration} min
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 pt-1">
                                    <span className="text-[10.5px] font-black text-emerald-300 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-2 py-0.5 rounded-xl border border-emerald-400/30 shadow-sm">
                                      R$ {svc.price}
                                    </span>
                                    <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Step 2: Horário */}
                        {simStep === 2 && (
                          <div className="animate-fade-in flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <p className="text-[9.5px] font-extrabold text-violet-300/90 uppercase tracking-[0.18em]">Data & Horário</p>
                              <button onClick={() => setSimStep(1)} className="text-[9.5px] font-bold text-violet-400 hover:underline">Voltar</button>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#151c33]/90 border border-white/10 text-[10.5px] font-semibold text-white flex justify-between items-center shadow-md">
                              <span className="flex items-center gap-1.5 truncate"><Scissors className="w-3.5 h-3.5 text-violet-400 shrink-0" /> {simService?.name}</span>
                              <span className="text-emerald-300 font-black shrink-0 pl-2">R$ {simService?.price}</span>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5">
                              {mockDays.map((d, i) => (
                                <button key={i} onClick={() => setSelectedDay(d.label)}
                                  className={`p-2 rounded-xl text-center border transition-all duration-300 ${selectedDay === d.label
                                    ? 'bg-gradient-to-br from-violet-600 to-pink-600 border-transparent text-white font-black shadow-lg shadow-violet-600/30'
                                    : 'bg-[#151c33]/80 border-white/10 text-white/60 font-semibold hover:border-white/20'
                                  }`}>
                                  <p className="text-[9px] uppercase leading-none opacity-80">{d.label.split(',')[0]}</p>
                                  <p className="text-[12px] font-black mt-0.5">{d.label.split(',')[1]}</p>
                                </button>
                              ))}
                            </div>

                            <p className="text-[9.5px] font-extrabold text-violet-300/90 uppercase tracking-[0.18em] mt-1">Horários Disponíveis</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {mockTimes.map((t, i) => (
                                <button key={i} onClick={() => { setSimTime(t); setSimStep(3) }}
                                  className="p-2.5 rounded-xl bg-[#151c33]/90 border border-white/10 hover:border-violet-500/60 hover:bg-[#1c2542] text-center font-extrabold text-[11.5px] text-white transition-all active:scale-[0.98] shadow-sm">
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 3: Dados */}
                        {simStep === 3 && (
                          <div className="animate-fade-in flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <p className="text-[9.5px] font-extrabold text-violet-300/90 uppercase tracking-[0.18em]">Seus Dados</p>
                              <button onClick={() => setSimStep(2)} className="text-[9.5px] font-bold text-violet-400 hover:underline">Voltar</button>
                            </div>

                            <div className="p-3 rounded-xl bg-[#151c33]/90 border border-white/10 text-[10.5px] font-medium text-white space-y-1.5 shadow-md">
                              <div className="flex justify-between"><span className="text-white/40">Serviço:</span><span className="text-white font-bold">{simService?.name}</span></div>
                              <div className="flex justify-between"><span className="text-white/40">Horário:</span><span className="text-violet-300 font-bold">{selectedDay} às {simTime}</span></div>
                            </div>

                            <div className="space-y-2.5">
                              <div>
                                <label className="text-[9px] font-extrabold uppercase text-white/50 tracking-[0.15em] block mb-1">Nome Completo</label>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                                  <input type="text" placeholder="João Silva" value={simName} onChange={e => setSimName(e.target.value)}
                                    className="w-full bg-[#151c33] border border-white/10 focus:border-violet-500 rounded-xl pl-9 pr-3 py-2.5 text-[11.5px] text-white font-semibold focus:outline-none transition-colors placeholder:text-white/20" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-extrabold uppercase text-white/50 tracking-[0.15em] block mb-1">WhatsApp</label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                                  <input type="text" placeholder="(11) 99999-9999" value={simPhone} onChange={e => setSimPhone(e.target.value)}
                                    className="w-full bg-[#151c33] border border-white/10 focus:border-violet-500 rounded-xl pl-9 pr-3 py-2.5 text-[11.5px] text-white font-semibold focus:outline-none transition-colors placeholder:text-white/20" />
                                </div>
                              </div>

                              <button onClick={() => setSimStep(4)} disabled={!simName || !simPhone}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 via-pink-600 to-rose-600 disabled:opacity-40 rounded-xl text-white font-black text-[12px] shadow-lg shadow-violet-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 mt-1">
                                Confirmar Agendamento <Check className="w-3.5 h-3.5" />
                              </button>
                              <p className="text-[8.5px] text-white/40 font-medium text-center">Sinal de R$ 10,00 via Mercado Pago</p>
                            </div>
                          </div>
                        )}

                        {/* Step 4: Pagamento */}
                        {simStep === 4 && (
                          <div className="animate-fade-in flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <p className="text-[9.5px] font-extrabold text-violet-300/90 uppercase tracking-[0.18em]">Pagamento</p>
                              <button onClick={() => setSimStep(3)} className="text-[9.5px] font-bold text-violet-400 hover:underline">Voltar</button>
                            </div>

                            <div className="text-center py-2.5 bg-[#151c33]/90 border border-white/10 rounded-xl shadow-md">
                              <span className="text-2xl">💳</span>
                              <h4 className="text-[12px] font-black text-white mt-1">Sinal de Reserva</h4>
                              <p className="text-[9.5px] text-slate-300 font-medium mt-0.5 max-w-[210px] mx-auto leading-relaxed">
                                Pague R$ 10,00 para garantir seu horário. O restante (R$ {(simService?.price || 0) - 10}) é pago no atendimento.
                              </p>
                            </div>

                            <div className="rounded-xl bg-[#151c33]/90 border border-white/10 p-3 text-[10.5px] space-y-1.5 shadow-md">
                              <div className="flex justify-between border-b border-white/5 pb-1.5"><span className="text-white/40">Serviço</span><span className="text-white font-bold">{simService?.name}</span></div>
                              <div className="flex justify-between border-b border-white/5 pb-1.5"><span className="text-white/40">Horário</span><span className="text-violet-300 font-bold">{selectedDay} · {simTime}</span></div>
                              <div className="flex justify-between border-b border-white/5 pb-1.5"><span className="text-white/40">Total</span><span className="text-white font-bold">R$ {simService?.price}</span></div>
                              <div className="flex justify-between pt-0.5"><span className="text-white/90 font-black">Sinal agora</span><span className="text-emerald-300 font-black text-[12px]">R$ 10,00</span></div>
                            </div>

                            <button onClick={() => setSimStep(5)}
                              className="w-full py-3 bg-gradient-to-r from-violet-600 via-pink-600 to-rose-600 rounded-xl text-white font-black text-[12px] shadow-lg shadow-violet-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                              Pagar com Mercado Pago
                            </button>

                            <p className="text-[8px] text-white/40 font-medium text-center leading-relaxed">
                              🔒 Pagamento 100% seguro via Mercado Pago.
                            </p>
                          </div>
                        )}

                        {/* Step 5: Sucesso */}
                        {simStep === 5 && (
                          <div className="animate-fade-in flex flex-col items-center justify-center text-center flex-1 py-2">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 animate-bounce shadow-lg shadow-emerald-500/20">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h4 className="text-[13px] font-black text-white mb-0.5">Agendamento Confirmado!</h4>
                            <p className="text-[10px] text-emerald-400 font-bold mb-3">Sinal recebido com sucesso 🎉</p>

                            <div className="w-full rounded-xl bg-[#151c33]/90 border border-white/10 p-3 text-[10.5px] space-y-1.5 text-left mb-4 shadow-md">
                              <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/40">Cliente</span><span className="text-white font-bold">{simName}</span></div>
                              <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/40">Serviço</span><span className="text-white font-bold">{simService?.name}</span></div>
                              <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/40">Data & Hora</span><span className="text-violet-300 font-bold">{selectedDay} · {simTime}</span></div>
                              <div className="flex justify-between pt-0.5"><span className="text-white/70 font-bold">Pagar no local</span><span className="text-emerald-300 font-black">R$ {(simService?.price || 0) - 10}</span></div>
                            </div>

                            <div className="flex flex-col gap-2 w-full">
                              <button onClick={resetSimulator} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl text-[10.5px] font-black text-white shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                                <RotateCcw className="w-3.5 h-3.5" /> Agendar Outro
                              </button>
                              <button onClick={() => { const close = selectedDay === 'Qui, 18' && (simTime === '09:00' || simTime === '10:30'); setSimStep(close ? 8 : 6) }}
                                className="w-full py-2 border border-red-500/30 bg-red-500/10 rounded-xl text-[9.5px] font-bold text-red-300 hover:bg-red-500/20 active:scale-[0.98] transition-all">
                                Cancelar Agendamento
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 6: Confirma cancelamento */}
                        {simStep === 6 && (
                          <div className="animate-fade-in flex flex-col items-center justify-center text-center flex-1 py-2">
                            <div className="w-11 h-11 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-3 animate-pulse">
                              <Shield className="w-5 h-5" />
                            </div>
                            <h4 className="text-[12px] font-black text-white mb-1.5">Cancelar agendamento?</h4>
                            <p className="text-[10px] text-slate-300 font-medium mb-4 max-w-[210px] leading-relaxed">
                              <span className="text-white font-bold">{simService?.name}</span> em <span className="text-violet-300 font-bold">{selectedDay} às {simTime}</span>
                            </p>
                            <div className="flex flex-col gap-2 w-full">
                              <button onClick={() => setSimStep(7)} className="w-full py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white font-black text-[10.5px] active:scale-[0.98] transition-all">Sim, cancelar horário</button>
                              <button onClick={() => setSimStep(5)} className="w-full py-2 border border-white/10 rounded-xl text-[10.5px] font-bold text-white/70 active:scale-[0.98] transition-all">Não, manter horário</button>
                            </div>
                          </div>
                        )}

                        {/* Step 7: Cancelado */}
                        {simStep === 7 && (
                          <div className="animate-fade-in flex flex-col items-center justify-center text-center flex-1 py-2">
                            <div className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 mb-3"><Check className="w-5.5 h-5.5" /></div>
                            <h4 className="text-[12px] font-black text-white mb-1.5">Agendamento Cancelado</h4>
                            <p className="text-[10px] text-slate-300 font-medium mb-4 max-w-[210px] leading-relaxed">A vaga foi liberada instantaneamente no seu sistema.</p>
                            <button onClick={resetSimulator} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl text-[10.5px] font-black text-white active:scale-[0.98] transition-all">Novo Agendamento</button>
                          </div>
                        )}

                        {/* Step 8: Prazo expirado */}
                        {simStep === 8 && (
                          <div className="animate-fade-in flex flex-col items-center justify-center text-center flex-1 py-2">
                            <div className="w-11 h-11 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mb-3 animate-bounce"><AlertCircle className="w-5.5 h-5.5" /></div>
                            <h4 className="text-[12px] font-black text-white mb-1.5">Prazo Expirado</h4>
                            <p className="text-[10px] text-slate-300 font-medium mb-4 max-w-[210px] leading-relaxed">
                              Cancelamentos online só são permitidos com <span className="text-white font-bold">2h</span> de antecedência.
                            </p>
                            <div className="flex flex-col gap-2 w-full">
                              <a href={`https://wa.me/5511999999999`} target="_blank" rel="noopener noreferrer"
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-black text-[10.5px] flex items-center justify-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" /> Falar via WhatsApp
                              </a>
                              <button onClick={() => setSimStep(5)} className="w-full py-2 border border-white/10 rounded-xl text-[10.5px] font-bold text-white/70 active:scale-[0.98]">Voltar</button>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Home Bar Indicator */}
                      <div className="flex justify-center py-2 bg-[#0b0e1b] shrink-0 z-10">
                        <div className="w-28 h-1 bg-white/20 rounded-full" />
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            PAIN STRIP — Emotional Impact Section
            ═══════════════════════════════════════════════════ */}
        <section id="pain" className="py-20 px-4 sm:px-6 border-y border-white/[0.03]">
          <div className="max-w-[1200px] mx-auto">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-14">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-red-400/80 mb-4">O problema</p>
                <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90">
                  Você reconhece essa rotina?
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { 
                  icon: Timer, 
                  stat: '6 min', 
                  label: 'perdidos por agendamento', 
                  desc: 'Cada cliente que agenda pelo WhatsApp consome em média 6 minutos de troca de mensagens. Com 30 clientes/semana, são 12 horas jogadas fora.',
                  color: 'orange'
                },
                { 
                  icon: BellOff, 
                  stat: '22%', 
                  label: 'simplesmente não aparecem', 
                  desc: 'Sem lembrete automático, mais de 1 em cada 5 clientes dá no-show. É receita perdida, horário vago e frustração acumulada.',
                  color: 'red'
                },
                { 
                  icon: MessageSquare, 
                  stat: '47 msgs', 
                  label: 'respondidas à mão por dia', 
                  desc: '"Que horário tem?", "Quanto custa?", "Pode remarcar?" — mensagens repetitivas que tomam seu tempo e energia todos os dias.',
                  color: 'pink'
                }
              ].map((item, i) => (
                <Reveal key={i}>
                  <div className="pain-card doppelrand h-full">
                    <div className="doppelrand-inner p-7 h-full flex flex-col items-start text-left">
                      <div className={`w-10 h-10 rounded-[14px] bg-${item.color}-500/[0.06] border border-${item.color}-500/10 flex items-center justify-center mb-5`}>
                        <item.icon className={`w-5 h-5 ${item.color === 'orange' ? 'text-orange-400' : item.color === 'red' ? 'text-red-400' : 'text-pink-400'}`} />
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-[28px] font-extrabold tracking-tight ${item.color === 'orange' ? 'text-orange-400' : item.color === 'red' ? 'text-red-400' : 'text-pink-400'}`}>{item.stat}</span>
                        <span className="text-[12px] font-medium text-white/30">{item.label}</span>
                      </div>
                      <p className="text-[13px] text-white/30 font-medium leading-[1.65]">{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            BEFORE vs AFTER — Visual Comparison
            ═══════════════════════════════════════════════════ */}
        <section className="py-32 px-4 sm:px-6">
          <div className="max-w-[1000px] mx-auto">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-16">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-violet-400 mb-4">Transformação</p>
                <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90">
                  Seu dia antes e depois<br />do BoraMarka
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* BEFORE */}
              <Reveal>
                <div className="doppelrand h-full">
                  <div className="doppelrand-inner p-7 h-full before-card">
                    <div className="flex items-center gap-2.5 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-red-500/[0.06] border border-red-500/10 flex items-center justify-center">
                        <X className="w-4 h-4 text-red-400" />
                      </div>
                      <h3 className="text-[16px] font-bold text-red-400/90">Sem BoraMarka</h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        'Agenda no papel ou planilha do Google',
                        'Responder "que horário tem?" 30x por dia',
                        'Cliente esquece e não aparece — horário vago',
                        'Controle financeiro no caderninho',
                        'Nenhum lembrete — reza para o cliente lembrar',
                        'Cobra na hora — perde quando dá no-show'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[13px] font-medium text-white/35 leading-[1.5]">
                          <div className="w-5 h-5 rounded-full bg-red-500/[0.06] border border-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="w-2.5 h-2.5 text-red-400" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>

              {/* AFTER */}
              <Reveal>
                <div className="doppelrand h-full">
                  <div className="doppelrand-inner p-7 h-full after-card">
                    <div className="flex items-center gap-2.5 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h3 className="text-[16px] font-bold text-emerald-400/90">Com BoraMarka</h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        'Agenda digital inteligente — atualiza em tempo real',
                        'Link de agendamento: cliente escolhe sozinho',
                        'Lembrete automático via WhatsApp — -98% no-shows',
                        'Fluxo de caixa automático por agendamento',
                        'Confirmação + lembrete + cancelamento tudo via bot',
                        'Sinal antecipado via Mercado Pago — proteção total'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[13px] font-medium text-white/50 leading-[1.5]">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/[0.06] border border-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
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
              <div className="text-center mb-10">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-400 mb-4">WhatsApp Automático</p>
                <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90 mb-3">
                  Seu cliente recebe tudo automaticamente
                </h2>
                <p className="text-[14px] text-white/30 font-medium">Confirmação, lembrete e cancelamento — sem você digitar nada.</p>
              </div>
            </Reveal>
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
            IMPACT NUMBERS — Animated Stats
            ═══════════════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6 border-y border-white/[0.03]">
          <div className="max-w-[1100px] mx-auto">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-16">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-pink-400 mb-4">Resultados reais</p>
                <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90">
                  Números que falam por si
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { ref: stat1.ref, value: stat1.value, label: 'Agendamentos processados', icon: Calendar, color: 'violet' },
                { ref: stat2.ref, value: stat2.value, label: 'Redução em no-shows', icon: BellOff, color: 'emerald' },
                { ref: stat3.ref, value: stat3.value, label: 'Economizadas por semana', icon: Clock, color: 'orange' },
                { ref: stat4.ref, value: `${stat4.value}.8★`, label: 'Satisfação dos clientes', icon: Star, color: 'pink' },
              ].map((stat, i) => (
                <Reveal key={i}>
                  <div ref={stat.ref} className="doppelrand h-full">
                    <div className="doppelrand-inner p-6 h-full flex flex-col items-center text-center">
                      <stat.icon className={`w-6 h-6 mb-4 ${
                        stat.color === 'violet' ? 'text-violet-400' : stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'orange' ? 'text-orange-400' : 'text-pink-400'
                      }`} />
                      <p className={`text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold tracking-tight mb-1 ${
                        stat.color === 'violet' ? 'text-violet-400' : stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'orange' ? 'text-orange-400' : 'text-pink-400'
                      }`}>{stat.value}</p>
                      <p className="text-[11px] text-white/25 font-medium">{stat.label}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
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
            FEATURES — Bento Grid (Expanded)
            ═══════════════════════════════════════════════════ */}
        <section id="features" className="py-32 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-20">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-pink-400 mb-4">Recursos</p>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90">
                  Tudo que você precisa.<br />Nada que não precisa.
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 reveal-stagger">
              {[
                { icon: Calendar, title: 'Agenda inteligente', desc: 'Horários se atualizam em tempo real. Sem conflitos, sem agenda dupla, sem planilha.' },
                { icon: Smartphone, title: 'WhatsApp automático', desc: 'Confirmação, lembrete e cancelamento enviados automaticamente via WhatsApp para seu cliente.' },
                { icon: DollarSign, title: 'Pagamento antecipado', desc: 'Receba sinal de reserva via Mercado Pago antes do atendimento. Adeus no-shows financeiros.' },
                { icon: Users, title: 'Painel de clientes', desc: 'Histórico completo, frequência de visitas, serviços preferidos e faturamento por cliente.' },
                { icon: TrendingUp, title: 'Fluxo de caixa', desc: 'Controle financeiro automático alimentado por cada agendamento confirmado e pago.' },
                { icon: Shield, title: 'Cancelamento inteligente', desc: 'Prazo mínimo configurável para cancelamento. Proteja seu tempo e sua receita.' }
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
            FOR WHO — Professions Grid
            ═══════════════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6">
          <div className="max-w-[1000px] mx-auto">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-16">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-violet-400 mb-4">Para quem é</p>
                <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90 mb-4">
                  Feito para quem atende com hora marcada
                </h2>
                <p className="text-[14px] text-white/30 font-medium">Se você agenda clientes, o BoraMarka é para você.</p>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: Scissors, name: 'Barbeiros' },
                { icon: Palette, name: 'Manicures' },
                { icon: PenTool, name: 'Tatuadores' },
                { icon: Stethoscope, name: 'Clínicas' },
                { icon: Dumbbell, name: 'Personal Trainers' },
                { icon: Heart, name: 'Terapeutas' },
              ].map((prof, i) => (
                <Reveal key={i}>
                  <div className="profession-card rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 flex flex-col items-center text-center gap-3 cursor-default">
                    <div className="w-11 h-11 rounded-[14px] bg-violet-500/[0.06] border border-violet-500/10 flex items-center justify-center text-violet-400">
                      <prof.icon className="w-5 h-5" />
                    </div>
                    <p className="text-[13px] font-semibold text-white/60">{prof.name}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            TESTIMONIALS — Social Proof
            ═══════════════════════════════════════════════════ */}
        <section className="py-32 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-16">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-orange-400 mb-4">Depoimentos</p>
                <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90">
                  Quem usa, recomenda
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  name: 'Carlos Ferreira',
                  role: 'Barbeiro · São Paulo',
                  text: 'Antes eu perdia uns 3 clientes por semana por no-show. Depois que comecei a cobrar o sinal pelo BoraMarka, isso praticamente zerou. Minha receita aumentou sem eu precisar atender mais.',
                  stars: 5
                },
                {
                  name: 'Ana Beatriz',
                  role: 'Manicure · Curitiba',
                  text: 'Eu gastava quase 2 horas por dia no WhatsApp respondendo "que horário tem?". Agora só mando o link e a cliente agenda sozinha. Ganhei minha manhã de volta.',
                  stars: 5
                },
                {
                  name: 'Roberto Lima',
                  role: 'Personal Trainer · BH',
                  text: 'O lembrete automático no WhatsApp foi o que me conquistou. Meus alunos não esquecem mais os treinos e eu parei de perder tempo ligando para confirmar.',
                  stars: 5
                }
              ].map((testimonial, i) => (
                <Reveal key={i}>
                  <div className="doppelrand h-full">
                    <div className="doppelrand-inner p-7 h-full flex flex-col justify-between text-left testimonial-quote relative">
                      <div>
                        <div className="flex items-center gap-0.5 mb-5 mt-2">
                          {Array.from({ length: testimonial.stars }).map((_, j) => (
                            <Star key={j} className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                          ))}
                        </div>
                        <p className="text-[14px] text-white/45 font-medium leading-[1.7] mb-6">
                          "{testimonial.text}"
                        </p>
                      </div>
                      <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-white/[0.06] flex items-center justify-center text-white/50 text-[11px] font-bold">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-white/70">{testimonial.name}</p>
                          <p className="text-[10px] text-white/25 font-medium">{testimonial.role}</p>
                        </div>
                      </div>
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
                        <span className="text-[36px] font-extrabold text-white/90 tracking-tight leading-none">69<span className="text-[22px]">,90</span></span>
                        <span className="text-[11px] text-white/25 font-medium">/mês</span>
                      </div>
                      <p className="text-violet-400 text-[9px] font-bold bg-violet-500/[0.06] px-2.5 py-1 rounded-full inline-block mb-3 tracking-wider uppercase">Domínio Próprio & RH</p>
                      <p className="text-[12px] text-white/25 font-medium mb-6 leading-relaxed">Sua marca, seu domínio, seu controle.</p>
                      <ul className="space-y-3 mb-8">
                        {['Tudo dos outros planos', 'Gestão de RH para equipes', 'Subdomínio profissional grátis', 'Domínio próprio personalizado', 'Remoção total da marca BoraMarka', 'Suporte VIP prioritário'].map((f, i) => (
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

        {/* ═══════════════════════════════════════════════════
            FAQ — Accordion
            ═══════════════════════════════════════════════════ */}
        <section id="faq" className="py-32 px-4 sm:px-6">
          <div className="max-w-[700px] mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-violet-400 mb-4">Perguntas Frequentes</p>
                <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/90">
                  Tire suas dúvidas
                </h2>
              </div>
            </Reveal>

            <Reveal>
              <div className="doppelrand">
                <div className="doppelrand-inner px-7 py-2">
                  <FAQItem 
                    question="Preciso de cartão de crédito para testar?" 
                    answer="Não! O período de teste de 7 dias é completamente gratuito e não requer nenhum cartão de crédito. Ao final do período, você escolhe o plano que mais se adapta ao seu negócio."
                  />
                  <FAQItem 
                    question="Como funciona o lembrete automático no WhatsApp?" 
                    answer="Assim que um cliente agenda, ele recebe uma confirmação automática via WhatsApp. Antes do horário, enviamos um lembrete para ele não esquecer. Tudo sem você digitar nada."
                  />
                  <FAQItem 
                    question="Posso cobrar sinal/antecipação dos clientes?" 
                    answer="Sim! Você pode configurar um valor de sinal (booking fee) que o cliente paga via Mercado Pago no momento do agendamento. O valor vai direto para sua conta do Mercado Pago."
                  />
                  <FAQItem 
                    question="Funciona para qualquer tipo de profissional?" 
                    answer="Sim. Qualquer profissional que trabalhe com hora marcada: barbeiros, manicures, tatuadores, personal trainers, terapeutas, consultores, clínicas, salões de beleza e muito mais."
                  />
                  <FAQItem 
                    question="Posso cancelar a qualquer momento?" 
                    answer="Sim, sem multa e sem burocracia. Você pode cancelar sua assinatura quando quiser, diretamente pelo painel. Sem fidelidade, sem perguntas."
                  />
                  <FAQItem 
                    question="Meus dados e dos meus clientes estão seguros?" 
                    answer="Absolutamente. Utilizamos criptografia, autenticação JWT e boas práticas de segurança. Seus dados e os de seus clientes são tratados com total privacidade."
                  />
                  <FAQItem 
                    question="Preciso instalar algum aplicativo?" 
                    answer="Não! O BoraMarka funciona 100% no navegador, em qualquer dispositivo — celular, tablet ou computador. Seus clientes também agendam pelo navegador, sem instalar nada."
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            FINAL CTA — Persuasive Close
            ═══════════════════════════════════════════════════ */}
        <section className="py-32 px-4 sm:px-6">
          <div className="max-w-[800px] mx-auto">
            <Reveal>
              <div className="doppelrand cta-glow">
                <div className="doppelrand-inner p-10 md:p-16 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.06] px-4 py-1.5 text-[11px] font-semibold tracking-[0.15em] uppercase text-violet-400 mb-8">
                    <Sparkles className="w-3.5 h-3.5" />
                    Comece hoje
                  </div>
                  
                  <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-[-0.03em] leading-[1.1] text-white/95 mb-5">
                    Pare de perder tempo<br />
                    <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                      e clientes.
                    </span>
                  </h2>
                  
                  <p className="text-[16px] text-white/35 font-medium leading-[1.7] max-w-md mx-auto mb-10">
                    Cada dia sem automação é mais um dia de mensagens manuais, no-shows e receita perdida. Comece gratuitamente em menos de 3 minutos.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => navigate('/register')}
                      className="mag-btn group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-violet-600/25"
                    >
                      Criar minha conta grátis
                      <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  </div>

                  <p className="mt-6 text-[12px] text-white/20 font-medium">
                    7 dias grátis · Sem cartão · Cancele quando quiser
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-white/[0.04] py-14 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center">
              <BoraMarkaLogo size="sm" />
            </div>
            
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="text-[12px] font-medium text-white/20 hover:text-white/50 transition-colors duration-300">
                  {link.label}
                </a>
              ))}
            </div>

            <p className="text-[11px] font-medium text-white/15">
              © 2026 BoraMarka. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Botão Voltar ao Topo (Flutuante) */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:border-pink-500/50 hover:bg-gradient-to-tr hover:from-violet-600/80 hover:to-pink-600/80 ${
          showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
        }`}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="w-5 h-5 animate-pulse" />
      </button>

    </div>
  )
}
