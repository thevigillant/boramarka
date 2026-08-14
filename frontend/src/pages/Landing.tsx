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
          2. HERO SECTION — ENTERPRISE LEVEL BIG TECH SHOWCASE
          ═════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pt-28 sm:pt-36 pb-20 px-4 sm:px-6 max-w-6xl mx-auto text-center">
        
        {/* Floating Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300">
            A Plataforma #1 de Agendamento Autônomo & Lucro no Piloto Automático
          </span>
        </div>

        {/* High-Impact Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.12] mb-5 max-w-4xl mx-auto">
          Sua agenda no piloto automático.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200">
            Seu tempo e faturamento de volta.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto mb-8">
          Elimine o prejuízo do cliente que marca e não aparece. Receba sinais no Pix automaticamente, preencha seus horários 24h por dia e resgate clientes sumidos sem perder tempo digitando no WhatsApp.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Experimentar 7 Dias Grátis</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <a
            href="#features"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Conhecer Todos os Recursos</span>
          </a>
        </div>

        {/* Micro Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400 mb-14">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Sem cartão de crédito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Configuração guiada em 2 min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Pix cai direto na sua conta</span>
          </div>
        </div>

        {/* ── HIGH-DENSITY ENTERPRISE DASHBOARD SHOWCASE (LINEAR / STRIPE GRADE) ── */}
        <div className="relative max-w-5xl mx-auto">
          
          {/* Ambient Lighting Behind Dashboard */}
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/30 via-pink-600/20 to-indigo-600/30 rounded-3xl blur-2xl opacity-50 -z-10" />

          {/* Floating Pill 1: Live Pix Sinal (Top Left) */}
          <div className="absolute -top-6 -left-2 sm:-left-6 z-30 hidden sm:flex items-center gap-2.5 bg-[#0D1222]/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl px-4 py-2.5 shadow-2xl shadow-emerald-500/10 animate-bounce" style={{ animationDuration: '4s' }}>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              💰
            </div>
            <div className="text-left text-[11px]">
              <div className="font-bold text-white">Sinal Pix Recebido • R$ 25,00</div>
              <div className="text-emerald-400 text-[10px]">Amanda Souza (Corte & Mechas)</div>
            </div>
          </div>

          {/* Floating Pill 2: AI WhatsApp Sent           {/* Main Dashboard Window — EXACT REPLICA OF REAL BORAMARKA DASHBOARD */}
          <div className="bg-[#050711] border border-white/15 rounded-3xl overflow-hidden shadow-2xl text-left">
            
            {/* Topbar: BoraMarka Logo, Slogan, Search & User Profile */}
            <div className="bg-[#0A0D18] px-4 sm:px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BoraMarkaLogo size="sm" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:inline">
                  Sua agenda cheia, sem complicação
                </span>
              </div>

              {/* Search bar ⌘K */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#050711] border border-white/10 text-xs text-slate-400 w-64">
                <span>🔍 Buscar cliente, serviço...</span>
                <kbd className="ml-auto text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 font-mono">⌘K</kbd>
              </div>

              {/* User Avatar Card */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#050711] border border-white/10 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center font-bold text-white text-[10px]">
                    B
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-bold text-white text-[11px]">BoraMarka Admin</div>
                    <div className="text-[9px] text-pink-400 font-semibold">@odonodoboramarka</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation Strip */}
            <div className="bg-[#080B14] px-4 sm:px-6 py-2.5 border-b border-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar text-xs font-bold">
              <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-pink-500/20 shrink-0 flex items-center gap-1.5">
                <span>⊞ Visão Geral</span>
              </button>
              <button className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5">
                <span>✨ BoraIA</span>
              </button>
              <button className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5">
                <span>📅 Operacional <span className="bg-white/10 text-white px-1.5 py-0.2 rounded-full text-[10px]">6</span> ▾</span>
              </button>
              <button className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5">
                <span>🛍️ Comercial ▾</span>
              </button>
              <button className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5">
                <span>💲 Gestão & Finanças ▾</span>
              </button>
              <button className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5">
                <span>⚙️ Sistema & Ajustes ▾</span>
              </button>
            </div>

            {/* Dashboard Body Content */}
            <div className="p-4 sm:p-6 space-y-5 bg-[#050711]">
              
              {/* 4 Real KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                
                {/* Card 1: Total de Clientes */}
                <div className="p-4 rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Total de Clientes
                    </span>
                    <span className="text-2xl font-black text-white">6</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 2: Saldo Financeiro */}
                <div className="p-4 rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Saldo Financeiro
                    </span>
                    <span className="text-2xl font-black text-white">R$ 20,00</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 3: A Receber */}
                <div className="p-4 rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      A Receber
                    </span>
                    <span className="text-2xl font-black text-white">R$ 100,00</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 4: A Pagar */}
                <div className="p-4 rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      A Pagar
                    </span>
                    <span className="text-2xl font-black text-white">R$ 0,00</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Ações Rápidas & Atalhos Banner */}
              <div className="p-4 rounded-2xl bg-[#0A0D18] border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Ações Rápidas & Atalhos</h4>
                    <p className="text-[10px] text-slate-400">Navegue rapidamente para as principais tarefas do seu dia</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                  <div className="p-2.5 rounded-xl bg-[#050711] border border-violet-500/30 text-violet-300 flex items-center justify-center gap-2 shadow-sm">
                    <Calendar className="w-3.5 h-3.5" /> Ver Agendamentos
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#050711] border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-2 shadow-sm">
                    <DollarSign className="w-3.5 h-3.5" /> Lançar Finança
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#050711] border border-pink-500/30 text-pink-400 flex items-center justify-center gap-2 shadow-sm">
                    <span>+</span> Novo Serviço
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#050711] border border-amber-500/30 text-amber-400 flex items-center justify-center gap-2 shadow-sm">
                    <Smartphone className="w-3.5 h-3.5" /> Copiar Link Público
                  </div>
                </div>
              </div>

              {/* 2 Charts Grid (Exact Replica) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left Chart: Evolução do Faturamento */}
                <div className="p-4 rounded-2xl bg-[#0A0D18] border border-white/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white">Evolução do Faturamento</h4>
                      <span className="text-[10px] text-slate-400">Receita bruta dos últimos 6 meses</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      ↑ 100% vs mês anterior
                    </span>
                  </div>

                  {/* Visual Bar Chart */}
                  <div className="h-32 pt-4 flex items-end justify-between gap-2 px-2 border-b border-white/5">
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-slate-800/40 h-2 rounded-t" />
                      <span className="text-[9px] text-slate-500">Mar</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-slate-800/40 h-2 rounded-t" />
                      <span className="text-[9px] text-slate-500">Abr</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-slate-800/40 h-2 rounded-t" />
                      <span className="text-[9px] text-slate-500">Mai</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-slate-800/40 h-2 rounded-t" />
                      <span className="text-[9px] text-slate-500">Jun</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-slate-800/40 h-2 rounded-t" />
                      <span className="text-[9px] text-slate-500">Jul</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-pink-400">R$ 180</span>
                      <div className="w-full bg-gradient-to-t from-violet-600 to-pink-500 h-20 rounded-t shadow-md" />
                      <span className="text-[9px] font-bold text-white">Ago</span>
                    </div>
                  </div>
                </div>

                {/* Right Chart: Movimento por Dia */}
                <div className="p-4 rounded-2xl bg-[#0A0D18] border border-white/10 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Movimento por Dia</h4>
                    <span className="text-[10px] text-slate-400">Distribuição semanal de agendamentos</span>
                  </div>

                  {/* Horizontal Bar list */}
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-slate-500">Dom</span>
                      <div className="flex-1 bg-slate-800/30 h-2.5 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-slate-500">Seg</span>
                      <div className="flex-1 bg-slate-800/30 h-2.5 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 font-bold text-white">Ter</span>
                      <div className="flex-1 bg-slate-800/30 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-600 to-pink-500 h-full w-[85%]" />
                      </div>
                      <span className="font-bold text-pink-400">5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-slate-400">Qua</span>
                      <div className="flex-1 bg-slate-800/30 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-violet-600/60 h-full w-[20%]" />
                      </div>
                      <span className="text-slate-400">1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-slate-500">Qui</span>
                      <div className="flex-1 bg-slate-800/30 h-2.5 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-slate-500">Sex</span>
                      <div className="flex-1 bg-slate-800/30 h-2.5 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-slate-500">Sáb</span>
                      <div className="flex-1 bg-slate-800/30 h-2.5 rounded-full" />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[10px] font-bold border-t border-white/5">
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">📈 Dia mais forte: Ter (5)</span>
                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">📉 Dia mais fraco: Qua (1)</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

      </section>

      {/* ═════════════════════════════════════════════════════════════════
          3. ENTERPRISE LIVE SHOWCASE — APPLE-GRADE IPHONE EXPERIENCE
          ═════════════════════════════════════════════════════════════════ */}
      <section id="simulator" className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Demonstração Interativa em Tempo Real
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Simplicidade brutal para o cliente.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400">
              Controle total para você.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-3">
            Sem cadastros burocráticos e sem instalar aplicativos. O cliente clica no link da sua bio e agenda em menos de 20 segundos.
          </p>
        </div>

        {/* Side by Side Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-5xl mx-auto">
          
          {/* Left Column: Interactive Step Selectors & Value Bullets (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Step 1 Card */}
            <div 
              onClick={() => setSimStep(1)}
              className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 cursor-pointer ${
                simStep === 1 
                  ? 'bg-[#0F1424] border-pink-500/50 shadow-xl shadow-pink-500/10' 
                  : 'bg-[#070A12]/60 border-white/5 hover:border-white/10 hover:bg-[#070A12]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                  simStep === 1 ? 'bg-gradient-to-tr from-violet-600 to-pink-500 text-white shadow-md shadow-pink-500/20' : 'bg-white/5 text-slate-400'
                }`}>
                  01
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white">Catálogo de Serviços & Venda Adicional (Upsell)</h3>
                    {simStep === 1 && <span className="text-[10px] font-black text-pink-400 uppercase tracking-wider bg-pink-500/10 px-2 py-0.5 rounded-full">Ativo no celular</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Apresente seus serviços com fotos, duração e preços claros. O cliente pode adicionar combos extras com 1 toque antes de finalizar.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 Card */}
            <div 
              onClick={() => setSimStep(2)}
              className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 cursor-pointer ${
                simStep === 2 
                  ? 'bg-[#0F1424] border-violet-500/50 shadow-xl shadow-violet-500/10' 
                  : 'bg-[#070A12]/60 border-white/5 hover:border-white/10 hover:bg-[#070A12]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                  simStep === 2 ? 'bg-gradient-to-tr from-violet-600 to-pink-500 text-white shadow-md shadow-violet-500/20' : 'bg-white/5 text-slate-400'
                }`}>
                  02
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white">Escolha Inteligente de Horários em Tempo Real</h3>
                    {simStep === 2 && <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2 py-0.5 rounded-full">Ativo no celular</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Sua agenda só exibe horários realmente livres. Elimina de vez o risco de marcações duplas ou confusão de agenda.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 Card */}
            <div 
              onClick={() => setSimStep(3)}
              className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 cursor-pointer ${
                simStep === 3 
                  ? 'bg-[#0F1424] border-emerald-500/50 shadow-xl shadow-emerald-500/10' 
                  : 'bg-[#070A12]/60 border-white/5 hover:border-white/10 hover:bg-[#070A12]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                  simStep === 3 ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20' : 'bg-white/5 text-slate-400'
                }`}>
                  03
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white">Sinal Pix + Código de Cancelamento + WhatsApp</h3>
                    {simStep === 3 && <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full">Ativo no celular</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    O sinal antecipado garante o compromisso do cliente. Ele recebe o comprovante no WhatsApp com o código para remarcar ou cancelar sem complicação.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-2 flex items-center gap-4 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> <span>Conversão Média de 84%</span>
              </div>
              <div className="flex items-center gap-1.5 text-pink-400">
                <Clock className="w-4 h-4" /> <span>Reserva em ~18 segundos</span>
              </div>
            </div>
          </div>

          {/* Right Column: Titanium iPhone Mockup (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            
            {/* Apple iPhone 16 Pro Titanium Frame */}
            <div className="w-[300px] sm:w-[320px] rounded-[50px] p-[10px] bg-gradient-to-b from-[#2A3040] via-[#151926] to-[#0A0D18] border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(236,72,153,0.12)] ring-1 ring-black/80 relative">
              
              {/* Volume and Power Buttons simulation */}
              <div className="absolute -left-[12px] top-24 w-[3px] h-9 bg-slate-700 rounded-l-md"></div>
              <div className="absolute -left-[12px] top-36 w-[3px] h-12 bg-slate-700 rounded-l-md"></div>
              <div className="absolute -right-[12px] top-28 w-[3px] h-16 bg-slate-700 rounded-r-md"></div>

              {/* Screen Glass Container */}
              <div className="w-full bg-[#090C16] rounded-[40px] overflow-hidden border border-white/5 text-white flex flex-col justify-between h-[580px] relative">
                
                {/* Status Bar & Dynamic Island */}
                <div className="pt-3 px-6 flex items-center justify-between z-20 text-[11px] font-semibold text-slate-300">
                  <span>09:41</span>
                  
                  {/* Dynamic Island Pill */}
                  <div className="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-inner">
                    <div className="w-2 h-2 rounded-full bg-[#1A1E2D]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span>5G</span>
                    <div className="w-4 h-2.5 border border-white/60 rounded-sm p-0.5 flex items-center">
                      <div className="w-full h-full bg-white rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Simulated WhatsApp Push Notification Toast (Only on Step 3) */}
                {simStep === 3 && (
                  <div className="absolute top-12 inset-x-3 z-30 animate-slide-up">
                    <div className="bg-[#121B2B]/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-2.5 shadow-xl flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-emerald-400">WhatsApp • Agora</span>
                        </div>
                        <p className="text-[10px] text-slate-200 truncate font-medium">
                          BoraMarka: Horário confirmado! Código: <strong>#BM-8492</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inner Screen Content */}
                <div className="px-4 py-3 flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                  
                  {/* Shop Header */}
                  <div className="pt-1 pb-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                        B
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">Barbearia Alfa & Spa</h4>
                        <div className="flex items-center gap-1 text-[9px] text-amber-400 font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-400" /> 4.9 (128 avaliações)
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Disponível
                    </span>
                  </div>

                  {/* Step 1 View: Service Selection */}
                  {simStep === 1 && (
                    <div className="space-y-2 py-2 animate-fade-in">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <span>Serviços Disponíveis</span>
                        <span className="text-pink-400">1 de 3</span>
                      </div>

                      {servicesList.map((svc) => (
                        <div
                          key={svc.id}
                          onClick={() => setSimService(svc)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                            simService.id === svc.id
                              ? 'bg-gradient-to-r from-violet-900/30 to-pink-900/30 border-pink-500/60 shadow-md shadow-pink-500/10'
                              : 'bg-[#111625] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-bold text-white">{svc.name}</div>
                              <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5" /> {svc.duration} minutos
                              </div>
                            </div>
                            <div className="text-xs font-black text-pink-400">
                              R$ {svc.price},00
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Upsell mini badge */}
                      <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[9px] text-violet-300 flex items-center justify-between">
                        <span>✨ Combo Cabelo + Sobrancelha (+R$ 15)</span>
                        <span className="font-bold text-pink-400">Adicionado</span>
                      </div>
                    </div>
                  )}

                  {/* Step 2 View: Date & Time */}
                  {simStep === 2 && (
                    <div className="space-y-3 py-2 animate-fade-in">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <span>Escolha a Data & Horário</span>
                        <span className="text-violet-400">2 de 3</span>
                      </div>

                      {/* Days Row */}
                      <div className="grid grid-cols-4 gap-1">
                        {daysList.map((d) => (
                          <button
                            key={d}
                            onClick={() => setSimDay(d)}
                            className={`py-2 rounded-xl text-center text-[10px] font-bold border transition-all ${
                              simDay === d
                                ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent shadow-sm'
                                : 'bg-[#111625] border-white/5 text-slate-400'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>

                      {/* Times Grid */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {timesList.map((t) => (
                          <button
                            key={t}
                            onClick={() => setSimTime(t)}
                            className={`py-2 rounded-xl text-center text-[11px] font-bold border transition-all ${
                              simTime === t
                                ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-sm'
                                : 'bg-[#111625] border-white/5 text-slate-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3 View: Confirmation Voucher with Cancellation Code */}
                  {simStep === 3 && (
                    <div className="py-2 text-center space-y-2 animate-fade-in">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                        <Check className="w-4 h-4" />
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-black text-white">Reserva Confirmada!</h5>
                        <p className="text-[9px] text-slate-400">Comprovante gerado com sucesso</p>
                      </div>

                      {/* Details Box */}
                      <div className="bg-[#111625] rounded-2xl p-2.5 border border-white/5 text-left text-[10px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Serviço:</span>
                          <span className="font-bold text-white truncate max-w-[130px]">{simService.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Horário:</span>
                          <span className="font-bold text-emerald-400">{simDay} às {simTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sinal Pix:</span>
                          <span className="font-bold text-pink-400">R$ 15,00 (Pago)</span>
                        </div>
                      </div>

                      {/* Cancellation & Management Code Card */}
                      <div className="p-2.5 rounded-2xl bg-[#090C16] border border-amber-500/30 text-left space-y-1">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Código de Cancelamento</span>
                          <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            #BM-8492
                          </span>
                        </div>
                        <p className="text-[8px] text-slate-400 leading-tight">
                          Guarde este código para remarcar ou cancelar seu horário pelo Portal do Cliente sem precisar ligar.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bottom Action inside Screen */}
                  <div className="pt-2 border-t border-white/5 flex gap-1.5">
                    {simStep > 1 && (
                      <button
                        onClick={() => setSimStep((s) => s - 1)}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-[10px] font-bold text-slate-300"
                      >
                        Voltar
                      </button>
                    )}
                    {simStep < 3 ? (
                      <button
                        onClick={() => setSimStep((s) => s + 1)}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white text-[11px] font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-1"
                      >
                        <span>Próximo Passo</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setSimStep(1)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Simular Novo Agendamento</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* Home Indicator Bar */}
                <div className="pb-2 flex justify-center">
                  <div className="w-28 h-1 bg-white/20 rounded-full" />
                </div>

              </div>
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
