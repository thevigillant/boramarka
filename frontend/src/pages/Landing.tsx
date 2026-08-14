import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Check, Sparkles, Clock, Zap, ArrowRight, Calendar, DollarSign, Users, 
  RotateCcw, CheckCircle2, Scissors, Droplet, Star, User, Phone, Shield,
  Menu, X, MessageSquare, Timer, TrendingUp, Heart, Award,
  HelpCircle, ArrowUpRight, Smartphone, ArrowUp, ShieldCheck, Globe, 
  CreditCard, Bot, Play, ChevronRight, Sliders, BarChart3, Lock
} from 'lucide-react'
import { BoraMarkaLogo } from '../components/BoraMarkaLogo'
import { FAQItem } from '../components/landing/FAQItem'
import { Reveal, useCountUp } from '../components/landing/Reveal'

export default function Landing() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')

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

  // ─── Interactive Phone Simulator State ──────────────────────────────
  const [simStep, setSimStep] = useState<number>(1)
  const [simService, setSimService] = useState<{ id: number; name: string; price: number; duration: number; icon: any }>({
    id: 1, name: 'Corte Degradê & Barba', price: 65, duration: 45, icon: Scissors
  })
  const [simDay, setSimDay] = useState<string>('Sexta, 19')
  const [simTime, setSimTime] = useState<string>('15:30')
  const [simClientName, setSimClientName] = useState<string>('Lucas Silva')
  const [simClientPhone, setSimClientPhone] = useState<string>('(11) 98765-4321')

  const servicesList = [
    { id: 1, name: 'Corte Degradê & Barba', price: 65, duration: 45, icon: Scissors },
    { id: 2, name: 'Corte Social Moderno', price: 40, duration: 30, icon: Scissors },
    { id: 3, name: 'Barba Terapia + Toalha Quente', price: 35, duration: 25, icon: Droplet },
  ]

  const daysList = ['Sex, 19', 'Sáb, 20', 'Seg, 22', 'Ter, 23']
  const timesList = ['10:00', '14:00', '15:30', '17:00', '18:30']

  // ─── ROI Calculator State ──────────────────────────────────────────
  const [weeklyBookings, setWeeklyBookings] = useState<number>(35)
  const [averageTicket, setAverageTicket] = useState<number>(55)

  // Calculations:
  // 1. Time saved: 6 minutes per WhatsApp negotiation saved per appointment
  const hoursSavedPerMonth = Math.round((weeklyBookings * 4 * 6) / 60)
  // 2. Recovered revenue from eliminated no-shows and auto-reminders (estimated 18% no-show drop)
  const recoveredNoShowRevenue = Math.round(weeklyBookings * 4 * 0.18 * averageTicket)
  // 3. Reactivated lost clients revenue (average 8% additional monthly bookings)
  const reactivatedRevenue = Math.round(weeklyBookings * 4 * 0.08 * averageTicket)
  const totalExtraMonthlyRevenue = recoveredNoShowRevenue + reactivatedRevenue
  const monthlySubscriptionCost = billingPeriod === 'annual' ? 21.66 : 29.90
  const roiMultiplier = Math.max(1, Math.round(totalExtraMonthlyRevenue / monthlySubscriptionCost))

  // Stats Counters
  const stat1 = useCountUp(98, 1500, '%')
  const stat2 = useCountUp(14, 1200, 'h')
  const stat3 = useCountUp(2800, 2000, '+')
  const stat4 = useCountUp(100, 1000, '%')

  const navLinks = [
    { label: 'Recursos', href: '#features' },
    { label: 'Demonstração', href: '#simulator' },
    { label: 'Calculadora ROI', href: '#roi' },
    { label: 'Preços', href: '#pricing' },
    { label: 'Depoimentos', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-pink-500/30 overflow-x-hidden">
      
      {/* ── Ambient Mesh Lighting Glows ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] sm:w-[1200px] h-[500px] bg-gradient-to-b from-violet-600/15 via-pink-600/10 to-transparent blur-[140px] rounded-full"></div>
        <div className="absolute top-[40%] right-[-15%] w-[600px] h-[600px] bg-pink-600/10 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-[20%] left-[-15%] w-[700px] h-[700px] bg-indigo-600/10 blur-[180px] rounded-full"></div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          1. FLOATING PILL NAVBAR
          ═════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] sm:w-[90%] max-w-5xl">
        <nav className="backdrop-blur-2xl bg-[#0B0F19]/80 border border-white/10 rounded-full px-5 py-2.5 sm:py-3 flex items-center justify-between shadow-2xl shadow-black/60 transition-all duration-300 hover:border-white/20">
          <Link to="/" className="flex items-center gap-2">
            <BoraMarkaLogo size="sm" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <Link
              to="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 transition-colors hidden sm:block"
            >
              Entrar
            </Link>

            <Link
              to="/register"
              className="group relative inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white text-xs font-extrabold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] transition-all duration-300"
            >
              <span>Testar Grátis</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 backdrop-blur-2xl bg-[#0B0F19]/95 border border-white/10 rounded-3xl p-4 shadow-2xl animate-scale-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px bg-white/10 my-1"></div>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Já tenho conta (Entrar)
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-center bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md"
              >
                Criar Conta Grátis (7 Dias)
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═════════════════════════════════════════════════════════════════
          2. HERO SECTION — HIGH VALUE CONVERSION PITCH
          ═════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 max-w-6xl mx-auto text-center">
        
        {/* Floating Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md mb-8 animate-fade-in shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-bold text-slate-300">
            A Plataforma #1 de Agendamento Autônomo & Lucro para Negócios
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08] mb-6 max-w-4xl mx-auto">
          Sua agenda no piloto automático.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400">
            Seu faturamento no topo.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
          Elimine o prejuízo do cliente que marca e não aparece. Receba sinais no Pix automaticamente, atenda 24h por dia e resgate clientes inativos sem perder tempo digitando no WhatsApp.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Experimente 7 Dias Grátis</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#simulator"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-slate-300 text-slate-300" />
            <span>Ver Demonstração Interativa</span>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Sem cartão de crédito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Configuração em 2 minutos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Pix cai direto na sua conta</span>
          </div>
        </div>

        {/* Floating KPI Cards Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-16 max-w-4xl mx-auto">
          <div className="bg-[#0B0F19]/80 border border-white/5 rounded-2xl p-4 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">{stat1.value}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Menos Faltas (No-Show)</div>
          </div>
          <div className="bg-[#0B0F19]/80 border border-white/5 rounded-2xl p-4 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">{stat2.value}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Economizadas / Semana</div>
          </div>
          <div className="bg-[#0B0F19]/80 border border-white/5 rounded-2xl p-4 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-pink-400 mb-1">{stat3.value}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Agendamentos / Mês</div>
          </div>
          <div className="bg-[#0B0F19]/80 border border-white/5 rounded-2xl p-4 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-violet-400 mb-1">{stat4.value}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Autônomo & Seguro</div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          3. INTERACTIVE SIMULATOR (SEE IT IN ACTION)
          ═════════════════════════════════════════════════════════════════ */}
      <section id="simulator" className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Experiência do Seu Cliente
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Veja como seu cliente agenda em 15 segundos
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
            Simule a experiência exata de reserva que seus clientes terão no celular pelo link da sua bio do Instagram.
          </p>
        </div>

        {/* Mobile Device Frame Mockup */}
        <div className="max-w-md mx-auto bg-[#0A0D16] border-4 border-slate-800 rounded-[40px] p-4 shadow-2xl shadow-violet-500/10 relative overflow-hidden">
          {/* Top Notch */}
          <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>

          <div className="bg-[#111625] rounded-3xl p-5 border border-slate-800/80 min-h-[460px] flex flex-col justify-between">
            {/* Header Simulator */}
            <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 flex items-center justify-center text-white font-black text-xs">
                  B
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Barbearia Alfa & Estética</h4>
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" /> 4.9 (128 avaliações)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Aberto
              </span>
            </div>

            {/* Step 1: Select Service */}
            {simStep === 1 && (
              <div className="space-y-3 animate-fade-in">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Escolha o serviço
                </span>
                {servicesList.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => setSimService(svc)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      simService.id === svc.id
                        ? 'bg-violet-500/10 border-pink-500 text-white shadow-md'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{svc.name}</div>
                      <div className="text-[10px] text-slate-400">{svc.duration} min</div>
                    </div>
                    <div className="text-xs font-black text-pink-400">
                      R$ {svc.price},00
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Select Date & Time */}
            {simStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  2. Escolha o dia e horário
                </span>
                
                {/* Days Pills */}
                <div className="grid grid-cols-4 gap-1.5">
                  {daysList.map((day) => (
                    <button
                      key={day}
                      onClick={() => setSimDay(day)}
                      className={`py-2 rounded-xl text-center text-[11px] font-bold border transition-all ${
                        simDay === day
                          ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent'
                          : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Times Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {timesList.map((tm) => (
                    <button
                      key={tm}
                      onClick={() => setSimTime(tm)}
                      className={`py-2 rounded-xl text-center text-xs font-bold border transition-all ${
                        simTime === tm
                          ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                          : 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {tm}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Confirmation Voucher */}
            {simStep === 3 && (
              <div className="space-y-3 animate-fade-in text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-black text-white">Horário Reservado!</h5>
                
                <div className="bg-[#0B0F19] rounded-2xl p-3.5 border border-slate-800 text-left text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-bold">Serviço:</span>
                    <span className="font-bold text-white">{simService.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-bold">Data & Hora:</span>
                    <span className="font-bold text-emerald-400">{simDay} às {simTime}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-bold">Sinal (Pix):</span>
                    <span className="font-bold text-pink-400">R$ 15,00 (Pago)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Comprovante e lembrete enviados via WhatsApp!</span>
                </div>
              </div>
            )}

            {/* Navigation Buttons inside device */}
            <div className="pt-4 border-t border-slate-800 flex gap-2">
              {simStep > 1 && (
                <button
                  onClick={() => setSimStep((s) => s - 1)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Voltar
                </button>
              )}
              {simStep < 3 ? (
                <button
                  onClick={() => setSimStep((s) => s + 1)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-1"
                >
                  <span>Continuar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setSimStep(1)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Testar novamente</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          4. BENTO GRID — OS 4 MOTORES DE LUCRO DO BORAMARKA
          ═════════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-bold text-pink-400 mb-3">
            <Zap className="w-3.5 h-3.5" /> Recursos de Alta Performance
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Tudo o que você precisa para dominar sua região
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-3">
            Ferramentas construídas com foco em uma única métrica: colocar mais lucro no seu bolso todos os meses.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Zero No-Show / Sinal no Pix */}
          <div className="md:col-span-2 bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-pink-500/40 transition-all group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-6">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              Cobrança de Sinal & Zero Prejuízo (No-Show)
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              O cliente paga um sinal no Pix (ex: R$ 15,00) pelo Mercado Pago no momento da reserva. Se ele faltar, você não fica no prejuízo da cadeira vazia. Se comparecer, o valor é abatido.
            </p>
            <div className="bg-[#050811] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Sinal de R$ 20,00 Recebido via Pix</span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                Liquidado
              </span>
            </div>
          </div>

          {/* Card 2: Lembretes Automáticos WhatsApp */}
          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-violet-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              Lembretes no WhatsApp
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Notificações automáticas com 24h e 2h de antecedência contendo o link do mapa e comprovante. O cliente não esquece e você não perde tempo.
            </p>
          </div>

          {/* Card 3: Cartão Fidelidade Digital */}
          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              Fidelidade & Cupons
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Diga adeus aos cartões de papel que o cliente perde. O BoraMarka carimba os pontos automaticamente e gera cupons para clientes fiéis.
            </p>
          </div>

          {/* Card 4: Gestão de RH, Comissões e Portal do Funcionário */}
          <div className="md:col-span-2 bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-orange-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              Portal do Colaborador & Cálculo de Comissões
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
              Cada profissional da sua equipe tem acesso ao próprio portal no celular para ver a agenda, bater ponto digital e conferir o extrato de comissões com total transparência.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="bg-[#050811] p-3 rounded-xl border border-white/5 text-slate-300">Ponto Digital Geolocalizado</div>
              <div className="bg-[#050811] p-3 rounded-xl border border-white/5 text-slate-300">Comissões Automáticas</div>
              <div className="bg-[#050811] p-3 rounded-xl border border-white/5 text-slate-300">Holerite Online</div>
            </div>
          </div>

        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          5. DYNAMIC ROI CALCULATOR
          ═════════════════════════════════════════════════════════════════ */}
      <section id="roi" className="relative z-10 py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-b from-[#0F1424] to-[#080B14] border border-violet-500/20 rounded-3xl p-6 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Calculadora de Retorno Real
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Quanto dinheiro você está deixando na mesa hoje?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Ajuste os valores abaixo para ver o impacto imediato do BoraMarka no seu negócio:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Sliders Input */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-300">Agendamentos por semana:</span>
                  <span className="text-pink-400 font-black text-sm">{weeklyBookings} atendimentos</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={weeklyBookings}
                  onChange={(e) => setWeeklyBookings(parseInt(e.target.value))}
                  className="w-full accent-pink-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-300">Ticket médio do serviço:</span>
                  <span className="text-emerald-400 font-black text-sm">R$ {averageTicket},00</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="5"
                  value={averageTicket}
                  onChange={(e) => setAverageTicket(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#050811] border border-white/5 text-xs text-slate-400 space-y-1">
                <div>⚡ <strong>{hoursSavedPerMonth} horas livres</strong> por mês sem responder WhatsApp manualmente.</div>
                <div>💰 <strong>+R$ {recoveredNoShowRevenue},00</strong> recuperados em faltas evitadas.</div>
              </div>
            </div>

            {/* Calculated Output Card */}
            <div className="bg-[#050811] border border-violet-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
              <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">
                Retorno Estimado no seu Bolso
              </span>
              <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-pink-400">
                +R$ {totalExtraMonthlyRevenue},00
                <span className="text-xs text-slate-400 font-normal block mt-1">por mês em receita extra</span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <span className="text-xs font-bold text-slate-300">
                  Isso representa um retorno de <strong className="text-pink-400 text-sm">{roiMultiplier}x</strong> o valor da mensalidade do BoraMarka!
                </span>
              </div>
              <Link
                to="/register"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-black uppercase tracking-wider block shadow-lg hover:opacity-95"
              >
                Garantir Meu Teste de 7 Dias
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          6. PRICING SECTION — CLEAN & TRANSPARENT
          ═════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400 mb-3">
            <CreditCard className="w-3.5 h-3.5" /> Planos Transparentes
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Investimento que se paga nos primeiros 3 dias
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mt-2">
            Escolha o plano ideal para a sua escala de negócio. Sem multas e sem pegadinhas.
          </p>

          {/* Billing Switch Toggle */}
          <div className="inline-flex items-center bg-[#0B0F19] border border-white/10 p-1.5 rounded-full mt-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingPeriod === 'annual'
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Anual</span>
              <span className="text-[10px] font-black bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded-full">
                -28% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Card 1: BoraMensal */}
          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">BoraMensal</span>
              <h3 className="text-xl font-black text-white mt-1 mb-3">Autônomos & Estúdios</h3>
              <div className="mb-6">
                <span className="text-3xl sm:text-4xl font-black text-white">R$ 29,90</span>
                <span className="text-xs text-slate-400"> / mês</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Até 500 agendamentos / mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Até 1.500 clientes salvos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cobrança de Sinal no Pix (Mercado Pago)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Lembretes automáticos via WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fluxo de Caixa & Relatórios Básicos</span>
                </li>
              </ul>
            </div>
            <Link
              to="/register"
              className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider text-center transition-all"
            >
              Começar 7 Dias Grátis
            </Link>
          </div>

          {/* Card 2: BoraAnual (FEATURED / BEST VALUE) */}
          <div className="bg-[#0F1424] border-2 border-pink-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl shadow-pink-500/15 transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
              Mais Escolhido • Melhor Custo
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-pink-400">BoraAnual</span>
              <h3 className="text-xl font-black text-white mt-1 mb-3">Negócios em Expansão</h3>
              <div className="mb-6">
                <span className="text-3xl sm:text-4xl font-black text-white">R$ 21,66</span>
                <span className="text-xs text-slate-400"> / mês (R$ 260/ano)</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Até 2.500 agendamentos / mês</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Até 8.000 clientes na base</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cartão Fidelidade & Cupons Automáticos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Serviços Adicionais (Upsell no checkout)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Até 20 profissionais na equipe</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Economia direta de R$ 100 ao ano</span>
                </li>
              </ul>
            </div>
            <Link
              to="/register"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white text-xs font-black uppercase tracking-wider text-center shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] transition-all"
            >
              Garantir Plano com Desconto
            </Link>
          </div>

          {/* Card 3: BoraPremium */}
          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">BoraPremium</span>
              <h3 className="text-xl font-black text-white mt-1 mb-3">Clínicas, Franquias & RH</h3>
              <div className="mb-6">
                <span className="text-3xl sm:text-4xl font-black text-white">R$ 79,90</span>
                <span className="text-xs text-slate-400"> / mês</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Agendamentos ILIMITADOS (∞)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Módulo de RH & Folha de Pagamento</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Ponto Digital & Gestão de Comissões</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Domínio Próprio (agendar.suaempresa.com.br)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>100% Whitelabel (sem logo BoraMarka)</span>
                </li>
              </ul>
            </div>
            <Link
              to="/register"
              className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider text-center transition-all"
            >
              Começar 7 Dias Grátis
            </Link>
          </div>

        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          7. TESTIMONIALS / PROOF
          ═════════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 mb-2">
            <Award className="w-3.5 h-3.5" /> Casos de Sucesso
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Quem usa, não troca por nada
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 mb-3">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic mb-6">
                "Eu perdia pelo menos uns R$ 800 todo mês com clientes que marcavam no sábado e não apareciam. Depois que ativei a cobrança de sinal no Pix do BoraMarka, o no-show simplesmente acabou."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center font-black text-white text-xs">
                MR
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Matheus Rezende</h5>
                <span className="text-[10px] text-slate-500 font-semibold">Dono da Barbearia Black Beard (SP)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 mb-3">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic mb-6">
                "O link na bio do Instagram mudou tudo. Minhas clientes marcam no domingo à noite enquanto estou descansando com a família. O sistema confirma e já manda o lembrete certinho."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-600 to-orange-500 flex items-center justify-center font-black text-white text-xs">
                CL
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Camila Lorenzi</h5>
                <span className="text-[10px] text-slate-500 font-semibold">Studio de Estética & Lash (RJ)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 mb-3">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic mb-6">
                "Gerenciar a comissão de 6 profissionais era um caos no Excel. Com o BoraMarka, cada barbeiro vê o próprio extrato no celular e o fechamento do mês é em 1 clique."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-teal-400 flex items-center justify-center font-black text-white text-xs">
                RA
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Rodrigo Almeida</h5>
                <span className="text-[10px] text-slate-500 font-semibold">Rede Royal Cut (MG)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          8. FAQ SECTION
          ═════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="relative z-10 py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400 mb-2">
            <HelpCircle className="w-3.5 h-3.5" /> Dúvidas Comuns
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-3">
          <FAQItem
            question="Preciso colocar cartão de crédito para fazer o teste grátis de 7 dias?"
            answer="Não! Você cria sua conta em menos de 1 minuto apenas com seu e-mail e nome do negócio. Não pedimos nenhum cartão para começar a testar."
          />
          <FAQItem
            question="Como funciona o recebimento do Pix ou sinal antecipado?"
            answer="O valor pago pelo seu cliente (sinal ou valor total) é processado via Mercado Pago e cai direto na sua conta bancária cadastrada, com liquidação imediata ou conforme o seu prazo escolhido."
          />
          <FAQItem
            question="Meus clientes precisam baixar algum aplicativo para agendar?"
            answer="Não! Essa é uma das maiores vantagens do BoraMarka. O cliente clica no link pelo WhatsApp ou Instagram e agenda em 15 segundos direto pelo navegador do celular, sem precisar criar senha ou instalar nada."
          />
          <FAQItem
            question="Posso cancelar a assinatura quando eu quiser?"
            answer="Sim! Não exigimos nenhum contrato de fidelidade ou carência. Você pode cancelar sua assinatura com 1 clique direto pelo painel de controle a qualquer momento."
          />
          <FAQItem
            question="O que acontece se um cliente precisar desmarcar ou cancelar?"
            answer="O cliente recebe um código de gerenciamento exclusivo no comprovante dele. Se ele precisar remarcar ou cancelar dentro da antecedência que você configurou, a vaga é liberada automaticamente na sua agenda."
          />
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          9. FINAL HIGH IMPACT CTA
          ═════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-violet-950/60 via-[#120D26] to-pink-950/60 border border-pink-500/30 rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 max-w-2xl mx-auto">
            Pronto para transformar sua agenda em uma máquina de vendas?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8">
            Comece seu teste de 7 dias grátis agora mesmo. Em menos de 5 minutos seu link estará pronto para receber agendamentos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Criar Minha Conta Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          10. FOOTER
          ═════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/10 pt-12 pb-8 px-4 sm:px-6 max-w-6xl mx-auto text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <BoraMarkaLogo size="sm" />
          <div className="flex flex-wrap gap-6 text-slate-400 font-semibold">
            <Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <Link to="/login" className="hover:text-white transition-colors">Área do Lojista</Link>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">Fale com o Suporte</a>
          </div>
        </div>
        <div className="text-center pt-4 border-t border-white/5 text-[11px]">
          BoraMarka S.A. &copy; {new Date().getFullYear()}. Todos os direitos reservados. Feito com maestria para elevar o seu negócio.
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-40 p-3 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white shadow-xl hover:bg-slate-800 transition-all cursor-pointer"
          title="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
