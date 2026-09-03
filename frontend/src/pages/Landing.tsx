import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Check, Sparkles, Clock, Zap, ArrowRight, Calendar, DollarSign, Users, 
  RotateCcw, CheckCircle2, Scissors, Droplet, Star, User, Phone, Shield,
  Menu, X, MessageSquare, Timer, TrendingUp, TrendingDown, Heart, Award,
  HelpCircle, ArrowUpRight, Smartphone, ArrowUp, ShieldCheck, Globe, 
  CreditCard, Bot, Play, ChevronRight, Sliders, BarChart3, Lock, Search,
  LayoutGrid, ShoppingBag, Settings, Plus, Bell, Cake, PackageCheck, 
  Receipt, ListChecks, ChefHat, Layers
} from 'lucide-react'
import { BoraMarkaLogo } from '../components/BoraMarkaLogo'
import { FAQItem } from '../components/landing/FAQItem'
import { Reveal, useCountUp } from '../components/landing/Reveal'
import { UpdatesModal } from '../components/landing/UpdatesModal'

export default function Landing() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [updatesModalOpen, setUpdatesModalOpen] = useState(false)
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

  // ─── Dual Product Selection State ─────────────────────────────────
  const [heroProduct, setHeroProduct] = useState<'boramarka' | 'boraenkomenda'>('boramarka')
  const [pricingProduct, setPricingProduct] = useState<'boramarka' | 'boraenkomenda'>('boramarka')
  const [roiMode, setRoiMode] = useState<'services' | 'orders'>('services')

  // ─── ROI Calculator State (Serviços) ───────────────────────────────
  const [weeklyBookings, setWeeklyBookings] = useState<number>(35)
  const [averageTicket, setAverageTicket] = useState<number>(55)

  // Calculations (Serviços):
  // 1. Time saved: 6 minutes per WhatsApp negotiation saved per appointment
  const hoursSavedPerMonth = Math.round((weeklyBookings * 4 * 6) / 60)
  // 2. Recovered revenue from eliminated no-shows and auto-reminders (estimated 18% no-show drop)
  const recoveredNoShowRevenue = Math.round(weeklyBookings * 4 * 0.18 * averageTicket)
  // 3. Reactivated lost clients revenue (average 8% additional monthly bookings)
  const reactivatedRevenue = Math.round(weeklyBookings * 4 * 0.08 * averageTicket)
  const totalExtraMonthlyRevenue = recoveredNoShowRevenue + reactivatedRevenue
  const monthlySubscriptionCost = billingPeriod === 'annual' ? 29.90 : 39.90
  const roiMultiplier = Math.max(1, Math.round(totalExtraMonthlyRevenue / monthlySubscriptionCost))

  // ─── ROI Calculator State (BoraEnkomenda - Produção & Encomendas) ──
  const [weeklyOrders, setWeeklyOrders] = useState<number>(18)
  const [averageOrderTicket, setAverageOrderTicket] = useState<number>(120)

  // Calculations (Encomendas):
  // 1. Time saved: 15 minutes per order negotiation on WhatsApp (photos, fillings, delivery address, pix receipts)
  const orderHoursSavedPerMonth = Math.round((weeklyOrders * 4 * 15) / 60)
  // 2. Extra orders captured by digital storefront link in bio 24/7 (est. 20% gain)
  const orderAdditionalRevenue = Math.round(weeklyOrders * 4 * 0.20 * averageOrderTicket)
  // 3. Guaranteed 50% deposit avoiding loss of personalized cakes/sweets
  const orderDepositSecured = Math.round(weeklyOrders * 4 * 0.50 * averageOrderTicket)
  const orderTotalExtraRevenue = orderAdditionalRevenue
  const orderSubscriptionCost = billingPeriod === 'annual' ? 29.90 : 39.90
  const orderRoiMultiplier = Math.max(1, Math.round(orderTotalExtraRevenue / orderSubscriptionCost))

  // Stats Counters
  const stat1 = useCountUp(98, 1500, '%')
  const stat2 = useCountUp(14, 1200, 'h')
  const stat3 = useCountUp(2800, 2000, '+')
  const stat4 = useCountUp(100, 1000, '%')

  const navLinks = [
    { label: 'Recursos', href: '#features' },
    { label: 'BoraEnkomenda', href: '#boraenkomenda', badge: 'Produção' },
    { label: 'Simulador', href: '#simulator' },
    { label: 'Preços', href: '#pricing' },
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
          1. FLOATING PILL NAVBAR (CLEAN ENTERPRISE GLASS)
          ═════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] sm:w-[88%] max-w-4xl">
        <nav className="backdrop-blur-2xl bg-[#0B0F19]/90 border border-white/10 rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shadow-2xl shadow-black/70 transition-all duration-300 hover:border-white/20">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <BoraMarkaLogo size="sm" />
          </Link>

          {/* Desktop Nav Links (Limpos, focados e sem poluição) */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200 flex items-center gap-1.5"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/25">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Sininho de Novidades & Atualizações */}
            <button
              onClick={() => setUpdatesModalOpen(true)}
              className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all group shrink-0"
              title="Ver Novidades e Atualizações da Plataforma"
            >
              <Bell className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
              </span>
            </button>

            <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

            <Link
              to="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1.5 transition-colors hidden sm:block"
            >
              Entrar
            </Link>

            <Link
              to="/register"
              className="hidden sm:inline-flex group relative items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white text-xs font-black shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] transition-all duration-300 shrink-0"
            >
              <span>Testar Grátis</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white shrink-0"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 backdrop-blur-2xl bg-[#0B0F19]/95 border border-white/10 rounded-3xl p-4 shadow-2xl animate-scale-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/25">
                      {link.badge}
                    </span>
                  )}
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
      <section className="relative z-10 pt-20 sm:pt-36 pb-14 sm:pb-20 px-3 sm:px-6 max-w-6xl mx-auto text-center">
        
        {/* Floating Interactive Announcement Badge */}
        <button
          type="button"
          onClick={() => setUpdatesModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/15 via-pink-500/15 to-amber-500/10 border border-pink-500/30 backdrop-blur-xl mb-4 sm:mb-6 shadow-sm hover:border-pink-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group max-w-full"
        >
          <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-ping shrink-0" />
          <span className="text-[11px] sm:text-xs font-bold text-pink-300 flex items-center gap-1.5 truncate">
            <span>✨ Novidade: Módulo BoraEnkomenda com Cardápio Digital & Kanban de Produção</span>
            <span className="underline group-hover:text-white transition-colors shrink-0">Ver novidades →</span>
          </span>
        </button>

        {/* Interactive Dual-Product Switcher */}
        <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6 sm:mb-8 shadow-2xl max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setHeroProduct('boramarka')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              heroProduct === 'boramarka'
                ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-pink-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-violet-300" />
            <span>BoraMarka · Serviços & Agenda</span>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-violet-500/30 text-white border border-violet-400/30">
              Serviços
            </span>
          </button>

          <button
            type="button"
            onClick={() => setHeroProduct('boraenkomenda')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              heroProduct === 'boraenkomenda'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 ring-1 ring-pink-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-pink-300" />
            <span>BoraEnkomenda · Cardápio & Produção</span>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-pink-500/30 text-white border border-pink-400/30">
              Produção
            </span>
          </button>
        </div>

        {/* Dynamic High-Impact Headline & Subtitle */}
        {heroProduct === 'boramarka' ? (
          <>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.18] sm:leading-[1.12] mb-3.5 sm:mb-5 max-w-4xl mx-auto px-1 animate-fade-in">
              Sua agenda no piloto automático.{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200">
                Seu tempo e faturamento de volta.
              </span>
            </h1>

            <p className="text-xs sm:text-base md:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto mb-6 sm:mb-8 px-2 sm:px-0 animate-fade-in">
              Elimine o prejuízo do cliente que marca e não aparece. Receba sinais no Pix automaticamente, preencha seus horários 24h por dia e resgate clientes sumidos sem perder tempo digitando no WhatsApp.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.18] sm:leading-[1.12] mb-3.5 sm:mb-5 max-w-4xl mx-auto px-1 animate-fade-in">
              Seu ateliê e encomendas no piloto automático.{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200">
                Do cardápio digital à lista de compras.
              </span>
            </h1>

            <p className="text-xs sm:text-base md:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto mb-6 sm:mb-8 px-2 sm:px-0 animate-fade-in">
              Receba pedidos pelo WhatsApp sem confusão, cobre sinal de 50% no Pix automático, acompanhe a produção no Kanban e gere a lista de ingredientes com 1 clique para o mercado.
            </p>
          </>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 mb-6 sm:mb-8">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Experimentar 7 Dias Grátis</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <a
            href={heroProduct === 'boraenkomenda' ? '#boraenkomenda' : '#features'}
            className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{heroProduct === 'boraenkomenda' ? 'Conhecer Recursos do BoraEnkomenda' : 'Conhecer Todos os Recursos'}</span>
          </a>
        </div>

        {/* Micro Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-8 text-[11px] sm:text-xs text-slate-400 mb-8 sm:mb-14">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Sem cartão de crédito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{heroProduct === 'boraenkomenda' ? 'Cardápio pronto em 3 min' : 'Configuração em 2 min'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Sinal Pix direto na sua conta</span>
          </div>
        </div>

        {/* ── HIGH-DENSITY ENTERPRISE DASHBOARD SHOWCASE (LINEAR / STRIPE GRADE) ── */}
        <div className="relative max-w-5xl mx-auto">
          
          {/* Ambient Lighting Behind Dashboard */}
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/30 via-pink-600/20 to-indigo-600/30 rounded-3xl blur-2xl opacity-50 -z-10" />

          {/* Floating Pills */}
          {heroProduct === 'boramarka' ? (
            <>
              {/* Floating Pill 1: Live Pix Sinal (Top Left) */}
              <div className="absolute -top-6 -left-2 sm:-left-6 z-30 hidden sm:flex items-center gap-2.5 bg-[#0D1222]/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl px-4 py-2.5 shadow-2xl shadow-emerald-500/10 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div className="text-left text-[11px]">
                  <div className="font-bold text-white">Sinal Pix Recebido • R$ 25,00</div>
                  <div className="text-emerald-400 text-[10px]">Amanda Souza (Corte & Mechas)</div>
                </div>
              </div>

              {/* Floating Pill 2: AI WhatsApp Sent (Top Right) */}
              <div className="absolute -top-6 -right-2 sm:-right-6 z-30 hidden sm:flex items-center gap-2.5 bg-[#0D1222]/95 backdrop-blur-xl border border-violet-500/30 rounded-2xl px-4 py-2.5 shadow-2xl shadow-violet-500/10 animate-bounce" style={{ animationDuration: '4.8s' }}>
                <div className="w-7 h-7 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="text-left text-[11px]">
                  <div className="font-bold text-white">WhatsApp Automático</div>
                  <div className="text-violet-300 text-[10px]">Lembrete de 2h disparado</div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Floating Pill 1: Live Pix Sinal Encomenda (Top Left) */}
              <div className="absolute -top-6 -left-2 sm:-left-6 z-30 hidden sm:flex items-center gap-2.5 bg-[#0D1222]/95 backdrop-blur-xl border border-pink-500/30 rounded-2xl px-4 py-2.5 shadow-2xl shadow-pink-500/10 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div className="text-left text-[11px]">
                  <div className="font-bold text-white">Sinal Pix 50% • R$ 140,00</div>
                  <div className="text-pink-300 text-[10px]">Mariana Costa (Bolo Red Velvet 2kg)</div>
                </div>
              </div>

              {/* Floating Pill 2: Lista de Compras Inteligente (Top Right) */}
              <div className="absolute -top-6 -right-2 sm:-right-6 z-30 hidden sm:flex items-center gap-2.5 bg-[#0D1222]/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl px-4 py-2.5 shadow-2xl shadow-emerald-500/10 animate-bounce" style={{ animationDuration: '4.8s' }}>
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <ListChecks className="w-3.5 h-3.5" />
                </div>
                <div className="text-left text-[11px]">
                  <div className="font-bold text-white">Lista de Compras Pronta</div>
                  <div className="text-emerald-400 text-[10px]">12 latas Moça, 4kg Chocolate Nobre</div>
                </div>
              </div>
            </>
          )}

          {/* Main Dashboard Window */}
          {heroProduct === 'boramarka' ? (
            <div className="bg-[#050711] border border-white/15 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl text-left">
              
              {/* Topbar: BoraMarka Logo, Slogan, Search & User Profile */}
              <div className="bg-[#0A0D18] px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <BoraMarkaLogo size="sm" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:inline">
                    Sua agenda cheia, sem complicação
                  </span>
                </div>

                {/* Search bar ⌘K */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#050711] border border-white/10 text-xs text-slate-400 w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>Buscar cliente, serviço...</span>
                  <kbd className="ml-auto text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 font-mono">⌘K</kbd>
                </div>

                {/* User Avatar Card */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-xl bg-[#050711] border border-white/10 text-xs">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center font-bold text-white text-[9px] sm:text-[10px]">
                      A
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="font-bold text-white text-[11px]">Administrador</div>
                      <div className="text-[9px] text-pink-400 font-semibold">@studioalfaprime</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation Strip */}
              <div className="bg-[#080B14] px-2.5 sm:px-6 py-2 sm:py-2.5 border-b border-white/5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar text-xs font-bold">
                <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-pink-500/20 shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Visão Geral</span>
                </button>
                <button className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>BoraIA</span>
                </button>
                <button className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Operacional <span className="bg-white/10 text-white px-1.5 py-0.2 rounded-full text-[9px]">6</span></span>
                  <ChevronRight className="w-3 h-3 rotate-90" />
                </button>
                <button className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Comercial</span>
                  <ChevronRight className="w-3 h-3 rotate-90" />
                </button>
                <button className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>Gestão</span>
                  <ChevronRight className="w-3 h-3 rotate-90" />
                </button>
              </div>

              {/* Dashboard Body Content */}
              <div className="p-3 sm:p-6 space-y-3.5 sm:space-y-5 bg-[#050711]">
                
                {/* 4 Real KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-bold sm:font-black uppercase tracking-wider text-slate-400 block mb-0.5 truncate">
                        Clientes
                      </span>
                      <span className="text-lg sm:text-2xl font-black text-white">6</span>
                    </div>
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-bold sm:font-black uppercase tracking-wider text-slate-400 block mb-0.5 truncate">
                        Saldo
                      </span>
                      <span className="text-base sm:text-2xl font-black text-white truncate">R$ 20,00</span>
                    </div>
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-bold sm:font-black uppercase tracking-wider text-slate-400 block mb-0.5 truncate">
                        A Receber
                      </span>
                      <span className="text-base sm:text-2xl font-black text-white truncate">R$ 100,00</span>
                    </div>
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-bold sm:font-black uppercase tracking-wider text-slate-400 block mb-0.5 truncate">
                        A Pagar
                      </span>
                      <span className="text-base sm:text-2xl font-black text-white truncate">R$ 0,00</span>
                    </div>
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas & Atalhos Banner */}
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0A0D18] border border-white/10 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-bold text-white">Ações Rápidas & Atalhos</h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block">Navegue rapidamente para as principais tarefas do seu dia</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold">
                    <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#050711] border border-violet-500/30 text-violet-300 flex items-center justify-center gap-1.5 shadow-sm">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Agendamentos</span>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#050711] border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-1.5 shadow-sm">
                      <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Finança</span>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#050711] border border-pink-500/30 text-pink-400 flex items-center justify-center gap-1.5 shadow-sm">
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Serviço</span>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#050711] border border-amber-500/30 text-amber-400 flex items-center justify-center gap-1.5 shadow-sm">
                      <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Link Público</span>
                    </div>
                  </div>
                </div>

                {/* 2 Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#0A0D18] border border-white/10 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white">Evolução do Faturamento</h4>
                        <span className="text-[10px] text-slate-400">Receita bruta dos últimos 6 meses</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> 100% vs mês anterior
                      </span>
                    </div>
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

                  <div className="p-4 rounded-2xl bg-[#0A0D18] border border-white/10 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">Movimento por Dia</h4>
                      <span className="text-[10px] text-slate-400">Distribuição semanal de agendamentos</span>
                    </div>
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
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Dia mais forte: Ter (5)
                      </span>
                      <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Dia mais fraco: Qua (1)
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* BoraEnkomenda Production Dashboard Preview */
            <div className="bg-[#050711] border border-pink-500/30 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl text-left animate-fade-in">
              {/* Topbar */}
              <div className="bg-[#0A0D18] px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-pink-500/30 shrink-0">
                    <ShoppingBag className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white tracking-tight">Bora<span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Enkomenda</span></span>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        Produção
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 hidden sm:block">Cardápio digital, controle de encomendas e listas de compras</p>
                  </div>
                </div>

                {/* Search bar */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#050711] border border-white/10 text-xs text-slate-400 w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>Buscar encomenda, sabor...</span>
                  <kbd className="ml-auto text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 font-mono">⌘K</kbd>
                </div>

                {/* User Avatar Card */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-xl bg-[#050711] border border-white/10 text-xs">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center font-bold text-white text-[10px]">
                      D
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="font-bold text-white text-[11px]">Doceria Doce Sabor</div>
                      <div className="text-[9px] text-pink-400 font-semibold">@doceriadocesabor</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Strip */}
              <div className="bg-[#080B14] px-2.5 sm:px-6 py-2 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-bold">
                <button className="px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20 shrink-0 flex items-center gap-1.5 text-[11px]">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kanban de Produção</span>
                </button>
                <button className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5 text-[11px]">
                  <Cake className="w-3.5 h-3.5 text-pink-400" />
                  <span>Cardápio & Vitrine</span>
                </button>
                <button className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5 text-[11px]">
                  <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Listas de Compras <span className="bg-pink-500/20 text-pink-300 px-1.5 py-0.2 rounded-full text-[9px]">Nova</span></span>
                </button>
                <button className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5 text-[11px]">
                  <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Entrada de Insumos / NF-e</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-3 sm:p-6 space-y-4 bg-[#050711]">
                {/* 4 KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Encomendas Ativas</span>
                      <span className="text-xl sm:text-2xl font-black text-white">18</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Faturamento da Semana</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400">R$ 4.850</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Sinais no Pix (50%)</span>
                      <span className="text-xl sm:text-2xl font-black text-white">R$ 2.425</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0A0D18] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Entregas Hoje</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-400">6 Pedidos</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Production Kanban Simulation */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
                  {/* Col 1: A Fazer */}
                  <div className="p-3 rounded-2xl bg-[#0A0D18] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> A Fazer (4)
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#050711] border border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-white">
                        <span>Bolo Vulcão Ninho & Nutella</span>
                        <span className="text-pink-400 font-extrabold">R$ 95</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Entrega: Sex, 16:00 • Cliente: Camila R.</p>
                      <span className="inline-block text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400">Sinal 50% Pago</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#050711] border border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-white">
                        <span>100 Brigadeiros Gourmet Belga</span>
                        <span className="text-pink-400 font-extrabold">R$ 160</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Entrega: Sáb, 11:00 • Cliente: Bruno M.</p>
                      <span className="inline-block text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400">Sinal 50% Pago</span>
                    </div>
                  </div>

                  {/* Col 2: Em Produção */}
                  <div className="p-3 rounded-2xl bg-[#0A0D18] border border-pink-500/40 space-y-2 shadow-lg shadow-pink-500/5">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="text-xs font-black text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" /> Na Bancada (5)
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#050711] border border-pink-500/30 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-white">
                        <span>Bolo Casamento 3 Andares</span>
                        <span className="text-pink-400 font-extrabold">R$ 680</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Entrega: Sáb, 17:00 • Recheio Nozes & Doce Leite</p>
                      <span className="inline-block text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300">Confeitando</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#050711] border border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-white">
                        <span>50 Cupcakes Personalizados</span>
                        <span className="text-pink-400 font-extrabold">R$ 220</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Tema: Princesas • No forno</p>
                    </div>
                  </div>

                  {/* Col 3: Pronto */}
                  <div className="p-3 rounded-2xl bg-[#0A0D18] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" /> Pronto (3)
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#050711] border border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-white">
                        <span>Kit Festa Escolar Completo</span>
                        <span className="text-pink-400 font-extrabold">R$ 310</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Retirada: 14:30 • Geladeira 02</p>
                      <span className="inline-block text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400">WhatsApp Notificado</span>
                    </div>
                  </div>

                  {/* Col 4: Entregue */}
                  <div className="p-3 rounded-2xl bg-[#0A0D18] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Entregue (6)
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#050711] border border-white/5 space-y-1 opacity-75">
                      <div className="flex justify-between text-[11px] font-bold text-white">
                        <span>Cesta Café da Manhã Especial</span>
                        <span className="text-emerald-400 font-extrabold">R$ 185</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Entregue às 08:30 • Restante pago no Pix</p>
                      <span className="inline-block text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400">100% Liquidado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </section>

      {/* ═════════════════════════════════════════════════════════════════
          3. BORAENKOMENDA SHOWCASE — O SISTEMA OPERACIONAL DA SUA CONFEITARIA & ATELIÊ
          ═════════════════════════════════════════════════════════════════ */}
      <section id="boraenkomenda" className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-bold text-pink-400 mb-3 shadow-sm">
            <Cake className="w-3.5 h-3.5" /> Módulo BoraEnkomenda · Especial para Confeitarias, Docerias & Ateliês
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Da vitrine digital à lista de compras no mercado.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200">
              Sem estresse e sem pedidos esquecidos.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl mx-auto mt-3 leading-relaxed">
            Você não vende &quot;horários de agenda vazia&quot;, você produz com amor, data marcada e ingredientes contados. O BoraEnkomenda foi esculpido para organizar pedidos, receber sinal no Pix e calcular os insumos da sua bancada.
          </p>
        </div>

        {/* Bento Grid 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1 (Span 7): Cardápio Digital Elegante & Link na Bio */}
          <div className="md:col-span-7 bg-[#0B0F19] border border-white/10 hover:border-pink-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all group relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-5">
                <Cake className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-pink-400">Cardápio & Vitrine</span>
                <span className="text-[10px] font-bold text-white/60 bg-white/5 px-2 py-0.5 rounded-full">Link na Bio</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
                Cardápio Digital com Fotos, Sabores & Cálculo de Entrega
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Chega de mandar PDF pesado ou ficar 20 minutos explicando sabores e tamanhos no direct do Instagram. O cliente monta o pedido sozinho no celular, escolhe a data e horário de retirada e paga o sinal no Pix sem burocracia.
              </p>
            </div>

            {/* Visual Mini Showcase */}
            <div className="bg-[#050711] rounded-2xl p-4 border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                  <span>Pedido Online: Mariana Silva</span>
                </span>
                <span className="text-emerald-400">Sinal 50% Pix Confirmado</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-white font-bold block truncate">1x Bolo Red Velvet 2kg</span>
                  <span className="text-[10px] text-slate-400">Massa Red • Recheio Cream Cheese</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-white font-bold block truncate">50x Brigadeiros Belga</span>
                  <span className="text-[10px] text-slate-400">Ao Leite + Ninho com Nutella</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 (Span 5): Kanban de Produção */}
          <div className="md:col-span-5 bg-[#0B0F19] border border-white/10 hover:border-pink-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all group shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-violet-400 block mb-2">Controle Visual</span>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
                Kanban de Produção em Tempo Real
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Acompanhe cada encomenda sem post-its ou cadernos rasurados:
                <strong className="text-white block mt-1">A Fazer ➔ Na Bancada ➔ Pronto ➔ Entregue</strong>
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#050711] border border-amber-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-bold text-white">4 Pedidos Aguardando Massa</span>
                </div>
                <span className="text-[10px] text-amber-300 font-mono">Fornos às 14h</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050711] border border-pink-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                  <span className="font-bold text-white">5 Pedidos na Bancada de Confeitar</span>
                </div>
                <span className="text-[10px] text-pink-300 font-mono">Entrega Sáb</span>
              </div>
            </div>
          </div>

          {/* Card 3 (Span 6): Listas de Compras Inteligentes */}
          <div className="md:col-span-6 bg-[#0B0F19] border border-white/10 hover:border-emerald-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all group shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <ListChecks className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Automação de Mercado</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Exclusivo</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
                Listas de Compras Agrupadas por Fim de Semana
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                O BoraEnkomenda analisa todas as encomendas confirmadas e soma automaticamente os insumos necessários. Você vai ao supermercado ou distribuidor com o checklist na tela do celular e não esquece nenhuma lata de leite moça.
              </p>
            </div>

            <div className="bg-[#050711] rounded-2xl p-4 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[11px] font-bold pb-1 border-b border-white/5">
                <span className="text-slate-300">COMPRAS PRODUÇÃO • FIM DE SEMANA</span>
                <span className="text-emerald-400 font-mono">18/22 Itens Pegos (82%)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="line-through text-slate-500">14 latas Leite Condensado 395g</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">No Carrinho</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded border border-slate-600" />
                  <span>4kg Chocolate Nobre Meio Amargo</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Falta pegar</span>
              </div>
            </div>
          </div>

          {/* Card 4 (Span 6): Entrada de Notas da SEFAZ & Cupom Fiscal */}
          <div className="md:col-span-6 bg-[#0B0F19] border border-white/10 hover:border-cyan-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all group shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400">Financeiro & Fiscal</span>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">Sem CNPJ Obrigatório</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
                Entrada de Notas da SEFAZ & Cupons de Mercado
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Comprou ingredientes no Atacadão, Assaí ou Sam&apos;s Club? Envie a nota ou o cupom fiscal impresso (NFC-e): o BoraEnkomenda extrai automaticamente cada produto, alimenta seu estoque e calcula o custo exato da sua receita.
              </p>
            </div>

            <div className="bg-[#050711] rounded-2xl p-4 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-300 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cyan-400" />
                  <span>Entrada NFC-e SEFAZ Processada</span>
                </span>
                <span className="text-cyan-400 text-[11px]">R$ 482,90</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                18 itens importados e estoque de insumos atualizado automaticamente com preço unitário por grama e unidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          4. ENTERPRISE LIVE SHOWCASE — APPLE-GRADE IPHONE EXPERIENCE
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
                        <span className="flex items-center gap-1">
                          <Plus className="w-2.5 h-2.5 text-pink-400" /> Combo Cabelo + Sobrancelha (+R$ 15)
                        </span>
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

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Calculadora de Retorno Real
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Quanto dinheiro você está deixando na mesa hoje?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Simule o faturamento recuperado e o tempo economizado no WhatsApp escolhendo o seu tipo de negócio:
            </p>

            {/* Mode Toggle Switch */}
            <div className="inline-flex p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl mt-6">
              <button
                type="button"
                onClick={() => setRoiMode('services')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  roiMode === 'services'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>BoraMarka · Serviços</span>
              </button>

              <button
                type="button"
                onClick={() => setRoiMode('orders')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  roiMode === 'orders'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>BoraEnkomenda · Encomendas</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Sliders Input */}
            {roiMode === 'services' ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-slate-300">Atendimentos por semana:</span>
                    <span className="text-pink-400 font-black text-sm">{weeklyBookings} agendamentos</span>
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

                <div className="p-4 rounded-2xl bg-[#050811] border border-white/5 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>{hoursSavedPerMonth} horas livres</strong> por mês sem responder WhatsApp manualmente.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>+R$ {recoveredNoShowRevenue},00</strong> recuperados em faltas evitadas com sinal no Pix.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-slate-300">Encomendas por semana:</span>
                    <span className="text-pink-400 font-black text-sm">{weeklyOrders} encomendas</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={weeklyOrders}
                    onChange={(e) => setWeeklyOrders(parseInt(e.target.value))}
                    className="w-full accent-pink-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-slate-300">Ticket médio da encomenda:</span>
                    <span className="text-emerald-400 font-black text-sm">R$ {averageOrderTicket},00</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="500"
                    step="10"
                    value={averageOrderTicket}
                    onChange={(e) => setAverageOrderTicket(parseInt(e.target.value))}
                    className="w-full accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#050811] border border-white/5 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>{orderHoursSavedPerMonth} horas livres</strong> sem digitar cardápio e sabores no WhatsApp.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span><strong>+R$ {orderDepositSecured},00</strong> garantidos em sinal Pix antecipado (sem prejuízo de bolo pronto abandonado).</span>
                  </div>
                </div>
              </div>
            )}

            {/* Calculated Output Card */}
            <div className="bg-[#050811] border border-violet-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
              <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">
                {roiMode === 'services' ? 'Retorno Estimado em Serviços' : 'Retorno Estimado em Encomendas'}
              </span>
              <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-pink-400">
                +R$ {roiMode === 'services' ? totalExtraMonthlyRevenue : orderTotalExtraRevenue},00
                <span className="text-xs text-slate-400 font-normal block mt-1">por mês em receita líquida protegida</span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <span className="text-xs font-bold text-slate-300">
                  Isso representa um retorno de <strong className="text-pink-400 text-sm">{roiMode === 'services' ? roiMultiplier : orderRoiMultiplier}x</strong> o investimento do plano mensal!
                </span>
              </div>
              <Link
                to="/register"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-black uppercase tracking-wider block shadow-lg hover:opacity-95"
              >
                Garantir Meu Teste de 7 Dias Grátis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          6. PRICING SECTION — CLEAN ENTERPRISE SAAS TIERS
          ═════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400 mb-3">
            <CreditCard className="w-3.5 h-3.5" /> Planos & Investimento
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Planos sob medida para o seu modelo de trabalho
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mt-3">
            Comece com 7 dias de teste gratuito sem precisar cadastrar cartão de crédito. Cancele quando quiser.
          </p>

          {/* Dual Product Segment Switcher */}
          <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl mt-8 mb-6 shadow-xl max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setPricingProduct('boramarka')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                pricingProduct === 'boramarka'
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-pink-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 text-violet-300" />
              <span>Planos BoraMarka (Serviços & Agenda)</span>
            </button>

            <button
              type="button"
              onClick={() => setPricingProduct('boraenkomenda')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                pricingProduct === 'boraenkomenda'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 ring-1 ring-pink-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-pink-300" />
              <span>Planos BoraEnkomenda (Produção & Encomendas)</span>
            </button>
          </div>

          {/* Billing Switch Toggle (Mensal vs Anual) */}
          <div>
            <div className="inline-flex items-center bg-[#070A12] border border-white/10 p-1.5 rounded-full shadow-xl">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('annual')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                  billingPeriod === 'annual'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-pink-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Anual</span>
                <span className="text-[10px] font-black bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Economize até 25%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        {pricingProduct === 'boramarka' ? (
          /* BoraMarka Services Plans */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch animate-fade-in">
            {/* Card 1: BoraMarka Essencial */}
            <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Essencial</span>
                  <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">Profissional Solo</span>
                </div>
                <h3 className="text-xl font-black text-white mt-1 mb-2">Para Autônomos</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Automatize sua agenda, acabe com as faltas com sinal no Pix e pare de perder tempo digitando no WhatsApp.
                </p>

                <div className="mb-6 pb-6 border-b border-white/5">
                  {billingPeriod === 'monthly' ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">R$ 39,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Cobrança mensal • Sem fidelidade
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">R$ 29,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-bold mt-1">
                        Cobrado R$ 358,80/ano (Economia de R$ 120,00)
                      </div>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>1 profissional</strong> (atendimento individual)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Agendamentos ilimitados</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Link exclusivo para a bio do Instagram</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Cobrança de Sinal / Taxa no Pix via Mercado Pago</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Lembretes e confirmações automáticas por WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Fluxo de caixa básico e controle de clientes</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider text-center transition-all block"
              >
                Testar 7 Dias Grátis
              </Link>
            </div>

            {/* Card 2: BoraMarka Pro (Mais Escolhido) */}
            <div className="bg-[#0D1222] border-2 border-violet-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl shadow-violet-500/20 transform md:-translate-y-3">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Mais Escolhido • Serviços</span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-violet-400">Pro</span>
                  <span className="text-[10px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                    Em Expansão
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1 mb-2">Para Equipes e Salões</h3>
                <p className="text-xs text-slate-300 mb-6">
                  Gestão completa com múltiplos colaboradores, comissões automáticas, IA integrada e marketing de fidelidade.
                </p>

                <div className="mb-6 pb-6 border-b border-white/10">
                  {billingPeriod === 'monthly' ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-black text-white">R$ 59,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Cobrança mensal • Sem fidelidade
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-black text-white">R$ 44,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-violet-300 font-bold mt-1">
                        Cobrado R$ 538,80/ano (Economia de R$ 180,00)
                      </div>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-200 mb-8">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Tudo do plano Essencial</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Até 5 colaboradores</strong> na mesma conta</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Cálculo automático de comissões</strong> por barbeiro/profissional</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Cartão fidelidade digital & Cupons de desconto</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Upsell visual no checkout com fotos dos serviços</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Inteligência Artificial <strong>BoraIA</strong> para relatórios e insights</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Suporte prioritário via WhatsApp</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white text-xs font-black uppercase tracking-wider text-center shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all block"
              >
                Começar Teste Grátis de 7 Dias
              </Link>
            </div>

            {/* Card 3: BoraMarka Studio VIP */}
            <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">Studio VIP</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    Franquias & Grandes Salões
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1 mb-2">Estrutura Ilimitada</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Para redes, franquias e estúdios que precisam de equipe sem limites, gestão de RH e atendimento VIP.
                </p>

                <div className="mb-6 pb-6 border-b border-white/5">
                  {billingPeriod === 'monthly' ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">R$ 89,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Cobrança mensal • Sem fidelidade
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">R$ 69,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-amber-400 font-bold mt-1">
                        Cobrado R$ 838,80/ano (Economia de R$ 240,00)
                      </div>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Tudo do plano Pro</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Profissionais ilimitados</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Módulo de RH completo: Ponto digital com geolocalização e holerites</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Portal de autosserviço para colaboradores</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Controle de acessos e permissões granulares (RBAC)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Gerente de conta dedicado e suporte 24/7</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider text-center transition-all block"
              >
                Testar 7 Dias Grátis
              </Link>
            </div>
          </div>
        ) : (
          /* BoraEnkomenda Production Plans */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch animate-fade-in">
            {/* Card 1: BoraEnkomenda Ateliê */}
            <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-pink-500/30 transition-all shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-pink-400">Ateliê</span>
                  <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">Confeiteiro(a) Solo</span>
                </div>
                <h3 className="text-xl font-black text-white mt-1 mb-2">Para Pequenos Ateliês</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Crie seu cardápio digital profissional na bio e garanta o sinal no Pix antes de ligar a batedeira.
                </p>

                <div className="mb-6 pb-6 border-b border-white/5">
                  {billingPeriod === 'monthly' ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">R$ 39,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Cobrança mensal • Sem fidelidade
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">R$ 29,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-bold mt-1">
                        Cobrado R$ 358,80/ano (Economia de R$ 120,00)
                      </div>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <span><strong>1 confeiteiro / artesão</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <span><strong>Cardápio Digital exclusivo na bio</strong> com fotos e sabores</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <span>Sinal Pix obrigatório de 50% antecipado</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <span>Até 150 encomendas por mês</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <span>Listas de compras básicas para o mercado</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <span>Notificações automáticas de pedido pronto via WhatsApp</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider text-center transition-all block"
              >
                Testar 7 Dias Grátis
              </Link>
            </div>

            {/* Card 2: BoraEnkomenda Confeitaria Pro (Mais Escolhido) */}
            <div className="bg-[#0D1222] border-2 border-pink-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl shadow-pink-500/25 transform md:-translate-y-3">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                <Cake className="w-3 h-3 text-pink-200" />
                <span>Mais Escolhido • Produção Sob Encomenda</span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-pink-400">Confeitaria Pro</span>
                  <span className="text-[10px] font-bold text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                    Em Escala
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1 mb-2">Para Confeitarias & Buffets</h3>
                <p className="text-xs text-slate-300 mb-6">
                  Controle total de bancada com Kanban em tempo real, consolidação de listas de compras e entrada de notas fiscais da SEFAZ.
                </p>

                <div className="mb-6 pb-6 border-b border-white/10">
                  {billingPeriod === 'monthly' ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-black text-white">R$ 69,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Cobrança mensal • Sem fidelidade
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-black text-white">R$ 54,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-pink-300 font-bold mt-1">
                        Cobrado R$ 658,80/ano (Economia de R$ 180,00)
                      </div>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-200 mb-8">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Tudo do plano Ateliê</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Encomendas ilimitadas</strong> por mês</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Kanban de Produção em Tempo Real</strong> (A Fazer, Na Bancada, Pronto, Entregue)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Listas de Compras Inteligentes</strong> consolidadas por data / fim de semana</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Entrada de Notas da SEFAZ & Cupons NFC-e</strong> (sem CNPJ obrigatório)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Controle de estoque de insumos e cálculo de custo de matéria-prima</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Exportação de checklist e resumo para compras no WhatsApp</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-600 to-amber-500 text-white text-xs font-black uppercase tracking-wider text-center shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all block"
              >
                Começar Teste Grátis de 7 Dias
              </Link>
            </div>

            {/* Card 3: BoraEnkomenda Gourmet VIP */}
            <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-pink-500/30 transition-all shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">Gourmet VIP</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    Fábricas de Doces & Eventos
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1 mb-2">Para Grandes Operações</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Para buffets, confeitarias com equipe de produção, controle de fichas técnicas e análise avançada de margem de lucro.
                </p>

                <div className="mb-6 pb-6 border-b border-white/5">
                  {billingPeriod === 'monthly' ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">R$ 99,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Cobrança mensal • Sem fidelidade
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">R$ 79,90</span>
                        <span className="text-xs text-slate-400 font-medium">/ mês</span>
                      </div>
                      <div className="text-[11px] text-amber-400 font-bold mt-1">
                        Cobrado R$ 958,80/ano (Economia de R$ 240,00)
                      </div>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Tudo do plano Confeitaria Pro</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Múltiplas bancadas e confeiteiros</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Relatórios de CMV e margem de lucro real por fatia e encomenda</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Fichas técnicas avançadas com rendimento por batelada</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Emissão de relatórios contábeis e fiscais completos</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Gerente de conta dedicado com atendimento VIP no WhatsApp</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider text-center transition-all block"
              >
                Testar 7 Dias Grátis
              </Link>
            </div>
          </div>
        )}

        {/* Reassurance & Guarantee Strip */}
        <div className="mt-14 p-6 rounded-3xl bg-[#070A12] border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>7 dias de teste grátis sem cartão de crédito</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 text-xs text-slate-300">
            <RotateCcw className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Cancele a qualquer momento com 1 clique</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 text-xs text-slate-300">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Pagamentos seguros via Mercado Pago</span>
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
              <div className="flex gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
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
              <div className="flex gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
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
              <div className="flex gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
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
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 p-2.5 sm:p-3 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 text-white shadow-2xl hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Updates / Changelog Modal */}
      <UpdatesModal
        isOpen={updatesModalOpen}
        onClose={() => setUpdatesModalOpen(false)}
      />
    </div>
  )
}
