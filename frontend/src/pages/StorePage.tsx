import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Store,
  Clock,
  MapPin,
  ShoppingBag,
  Plus,
  Minus,
  X,
  CheckCircle2,
  Truck,
  Package,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Copy,
  Check,
  QrCode,
  MessageSquare,
  ArrowRight,
  CreditCard,
  Search,
  Share2,
  Heart,
  Calendar,
  Flame,
  Star,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Info,
  CheckCircle,
} from 'lucide-react'
import { api } from '../services/api'
import { formatCurrency, formatImageUrl } from '../utils/dashboardHelpers'
import { generatePixPayload, generatePixQrCodeDataUrl } from '../utils/pixPayload'
import type { ProductData, ProductCategoryData, OrderSettingsData } from '../types/dashboard'

// Sanitiza cores para prevenir CSS Injection
function sanitizeColor(color: string, fallback: string): string {
  if (!color) return fallback
  const t = color.trim()
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(t)) return t
  if (/^(rgb|hsl)a?\([^)]{1,80}\)$/.test(t)) return t
  return fallback
}

// Verifica se produto é recente (últimos 14 dias)
function isRecentProduct(product: ProductData): boolean {
  const created = (product as any).createdAt
  if (!created) return false
  return Date.now() - new Date(created).getTime() < 14 * 24 * 60 * 60 * 1000
}

interface CartItem {
  product: ProductData
  quantity: number
  customizations: Record<string, any>
  notes: string
  subtotal: number
}

const CHECKOUT_STEPS = ['Resumo', 'Identificação', 'Agendamento', 'Pagamento']

export function StorePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()

  // Store state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [admin, setAdmin] = useState<any>(null)
  const [settings, setSettings] = useState<OrderSettingsData | null>(null)
  const [categories, setCategories] = useState<ProductCategoryData[]>([])
  const [products, setProducts] = useState<ProductData[]>([])
  const [minDeliveryDate, setMinDeliveryDate] = useState('')

  // Filter + Search
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL' | 'FAVORITES'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Wishlist com localStorage
  const wishlistKey = `bm-wishlist-${username || ''}`
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`bm-wishlist-${username || ''}`) || '[]')
    } catch { return [] }
  })

  // Destaques Carousel
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const featuredTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Calculadora de Prazo Inteligente
  const [calcDate, setCalcDate] = useState('')
  const [calcFeedback, setCalcFeedback] = useState<'ok' | 'too-soon' | null>(null)
  const [calcSuggestedDate, setCalcSuggestedDate] = useState('')

  // Product detail modal
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalCustomizations, setModalCustomizations] = useState<Record<string, any>>({})
  const [modalNotes, setModalNotes] = useState('')
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('14:00')
  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [paymentOption, setPaymentOption] = useState<'DEPOSIT' | 'FULL'>('DEPOSIT')
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'MERCADOPAGO'>('PIX')
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // PIX Success Modal
  const [submittedOrderData, setSubmittedOrderData] = useState<any>(null)
  const [showPixSuccessModal, setShowPixSuccessModal] = useState(false)
  const [pixPayloadCode, setPixPayloadCode] = useState('')
  const [pixQrCodeDataUrl, setPixQrCodeDataUrl] = useState('')
  const [copiedPixPayload, setCopiedPixPayload] = useState(false)
  const [copiedPixKey, setCopiedPixKey] = useState(false)
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false)

  // Wishlist heart animation
  const [heartAnimIds, setHeartAnimIds] = useState<Set<number>>(new Set())

  // Effects
  useEffect(() => {
    if (!submittedOrderData?.pixInfo?.pixKey) return
    const { pixKey, merchantName, amount } = submittedOrderData.pixInfo
    const orderNum = submittedOrderData.order?.orderNumber?.replace(/[^a-zA-Z0-9]/g, '') || 'ENK'
    const payload = generatePixPayload({
      pixKey,
      merchantName: merchantName || admin?.businessName || 'BoraMarka',
      amount: Number(amount || submittedOrderData.order?.depositAmount || 0) || undefined,
      txid: orderNum,
      description: `Pedido ${submittedOrderData.order?.orderNumber || ''}`,
    })
    setPixPayloadCode(payload)
    generatePixQrCodeDataUrl(payload).then(url => setPixQrCodeDataUrl(url))
  }, [submittedOrderData, admin])

  useEffect(() => {
    if (!username) return
    api.getPublicStore(username)
      .then(data => {
        setAdmin(data.admin)
        setSettings(data.settings)
        setCategories(data.categories || [])
        setProducts(data.products || [])
        setMinDeliveryDate(data.minDeliveryDate)
        setDeliveryDate(data.minDeliveryDate)
      })
      .catch(err => setError(err.message || 'Loja não encontrada'))
      .finally(() => setLoading(false))
  }, [username])

  // Destaques auto-rotate
  const featuredProducts = products.filter(p => p.featured)
  useEffect(() => {
    if (featuredProducts.length <= 1) return
    featuredTimerRef.current = setInterval(() => {
      setFeaturedIndex(i => (i + 1) % featuredProducts.length)
    }, 6000)
    return () => { if (featuredTimerRef.current) clearInterval(featuredTimerRef.current) }
  }, [featuredProducts.length])

  // Novidades
  const novidades = products.filter(isRecentProduct)

  function handleOpenProduct(product: ProductData) {
    setSelectedProduct(product)
    setModalQuantity(1)
    setModalNotes('')
    setActivePhotoIndex(0)
    const initialCustoms: Record<string, any> = {}
    product.customFields?.forEach(cf => {
      let options: string[] = []
      try { options = typeof cf.options === 'string' ? JSON.parse(cf.options || '[]') : cf.options } catch {}
      initialCustoms[cf.label] = cf.fieldType === 'SELECT' && options.length > 0 ? options[0] : ''
    })
    setModalCustomizations(initialCustoms)
  }

  function handleAddToCart() {
    if (!selectedProduct) return
    for (const cf of selectedProduct.customFields || []) {
      if (cf.required && !modalCustomizations[cf.label]?.trim()) {
        alert(`O campo "${cf.label}" é obrigatório.`)
        return
      }
    }
    setCart(prev => [...prev, {
      product: selectedProduct,
      quantity: modalQuantity,
      customizations: modalCustomizations,
      notes: modalNotes.trim(),
      subtotal: selectedProduct.price * modalQuantity,
    }])
    setSelectedProduct(null)
  }

  function handleRemoveFromCart(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  function toggleWishlist(e: React.MouseEvent, productId: number) {
    e.stopPropagation()
    setWishlist(prev => {
      const next = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
      localStorage.setItem(wishlistKey, JSON.stringify(next))
      return next
    })
    setHeartAnimIds(prev => {
      const next = new Set(prev)
      next.add(productId)
      return next
    })
    setTimeout(() => {
      setHeartAnimIds(prev => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }, 600)
  }

  function handleCalcDate(date: string) {
    setCalcDate(date)
    if (!date) { setCalcFeedback(null); return }
    const chosen = new Date(`${date}T00:00:00`)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const diff = Math.ceil((chosen.getTime() - today.getTime()) / 86400000)
    const min = settings?.minAdvanceDays || 2
    if (diff >= min) {
      setCalcFeedback('ok')
      setCalcSuggestedDate('')
    } else {
      setCalcFeedback('too-soon')
      const suggested = new Date(today.getTime() + min * 86400000)
      setCalcSuggestedDate(suggested.toLocaleDateString('pt-BR'))
    }
  }

  async function handleShareStore() {
    const url = window.location.href
    const title = settings?.storeName || admin?.businessName || 'Vitrine'
    if (navigator.share) {
      try { await navigator.share({ title, text: `Confira o catálogo exclusivo de ${title} no BoraMarka!`, url }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); alert('Link copiado para a área de transferência.') } catch {}
    }
  }

  function handleCustomOrderWhatsapp() {
    const rawPhone = (admin?.phone || '').replace(/\D/g, '')
    let phone = rawPhone
    if (rawPhone.length >= 10 && !rawPhone.startsWith('55')) phone = `55${rawPhone}`
    const storeName = settings?.storeName || admin?.businessName || ''
    const msg = encodeURIComponent(
      `Olá! Estive visualizando sua vitrine "${storeName}" no BoraMarka e gostaria de solicitar um orçamento para um produto personalizado sob medida.`
    )
    const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`
    window.open(url, '_blank')
  }

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!username) return
    if (!clientName.trim()) { setSubmitError('Por favor, informe seu nome.'); return }
    const cleanPhone = clientPhone.replace(/\D/g, '')
    if (cleanPhone.length < 10) { setSubmitError('Informe um WhatsApp válido com DDD.'); return }
    if (!deliveryDate) { setSubmitError('Selecione a data de entrega desejada.'); return }
    if (deliveryType === 'DELIVERY' && !deliveryAddress.trim()) { setSubmitError('Informe o endereço completo para entrega.'); return }
    setSubmittingOrder(true); setSubmitError('')
    try {
      const res = await api.createPublicOrder(username, {
        clientName: clientName.trim(),
        clientPhone: cleanPhone,
        clientEmail: clientEmail.trim(),
        deliveryDate,
        deliveryTime,
        deliveryType,
        deliveryAddress: deliveryAddress.trim(),
        notes: orderNotes.trim(),
        paymentOption,
        paymentMethod,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          customizations: item.customizations,
          notes: item.notes,
        })),
      })
      setSubmittedOrderData(res); setShowCheckout(false); setCart([]); setShowPixSuccessModal(true)
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao processar pedido. Tente novamente.')
    } finally { setSubmittingOrder(false) }
  }

  function handleCopyPix(pixKey: string) {
    if (!pixKey) return
    navigator.clipboard.writeText(pixKey)
    setCopiedPixKey(true); setTimeout(() => setCopiedPixKey(false), 3000)
  }
  function handleCopyOrderNumber(orderNumber: string) {
    if (!orderNumber) return
    navigator.clipboard.writeText(orderNumber)
    setCopiedOrderNumber(true); setTimeout(() => setCopiedOrderNumber(false), 3000)
  }

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const deliveryFee = deliveryType === 'DELIVERY' ? (settings?.deliveryFee || 0) : 0
  const cartTotal = cartSubtotal + deliveryFee
  const depositPercentage = settings?.depositPercentage !== undefined ? settings.depositPercentage : 50
  const depositAmount = (cartTotal * depositPercentage) / 100
  const isFullPayment = paymentOption === 'FULL'
  const amountToPayNow = isFullPayment ? cartTotal : depositAmount
  const amountRemaining = isFullPayment ? 0 : Math.max(0, cartTotal - depositAmount)
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Checkout progress
  const checkoutProgress = [
    { label: 'Resumo', done: cart.length > 0 },
    { label: 'Identificação', done: clientName.trim().length >= 2 && clientPhone.replace(/\D/g, '').length >= 10 },
    { label: 'Agendamento', done: !!deliveryDate && (deliveryType === 'PICKUP' || !!deliveryAddress.trim()) },
    { label: 'Pagamento', done: false },
  ]
  const currentStep = checkoutProgress.filter(s => s.done).length + 1

  // Filter products
  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'FAVORITES') return wishlist.includes(p.id)
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory
    const matchesSearch = !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Skeleton loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] text-slate-200 pb-32 flex flex-col justify-start">
        <div className="w-full h-80 bg-gradient-to-b from-slate-800/40 via-slate-900/60 to-[#07090E] animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 -mt-24 w-full">
          <div className="bg-slate-900/60 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 shadow-2xl">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-slate-800/80 animate-pulse shrink-0" />
            <div className="flex-1 space-y-3 w-full">
              <div className="h-4 bg-slate-800 rounded-full w-32 animate-pulse" />
              <div className="h-8 bg-slate-800 rounded-xl w-64 animate-pulse" />
              <div className="h-4 bg-slate-800/50 rounded-md w-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !admin) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="bg-slate-900/80 border border-white/10 backdrop-blur-2xl p-10 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Vitrine Indisponível</h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">{error || 'Não foi possível carregar os dados desta loja.'}</p>
        </div>
      </div>
    )
  }

  const accentColor = sanitizeColor(admin.accentColor, '#f97316')
  const secondaryColor = sanitizeColor(admin.secondaryColor, '#ec4899')

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 pb-44 font-sans selection:bg-pink-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient mesh lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[140px] opacity-25"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, ${secondaryColor} 100%)` }}
        />
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] rounded-full blur-[160px] opacity-15 bg-purple-600/30" />
        <div className="absolute bottom-[10%] -right-[10%] w-[600px] h-[600px] rounded-full blur-[180px] opacity-15 bg-blue-600/20" />
      </div>

      <style>{`
        .luxury-gradient { background: linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%) !important; }
        .luxury-glow { box-shadow: 0 0 35px -5px ${accentColor}50 !important; }
        .luxury-text-gradient {
          background: linear-gradient(135deg, #ffffff 30%, ${accentColor} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes subtle-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        .animate-subtle-pulse { animation: subtle-pulse 3s infinite ease-in-out; }
      `}</style>

      {/* ─────────────────────────────────────────────────────────
          HEADER & HERO LUXURY BANNER
      ───────────────────────────────────────────────────────── */}
      <div className="relative z-10">
        {/* Banner with soft seamless fade */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
          {admin.bannerUrl ? (
            <img
              src={admin.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover object-center transform scale-105 filter brightness-90 transition-transform duration-1000"
            />
          ) : (
            <div className="w-full h-full relative" style={{ background: `linear-gradient(135deg, #0f172a 0%, ${accentColor}33 50%, #07090E 100%)` }}>
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px]" />
            </div>
          )}
          {/* Deep dark gradient blending */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

          {/* Share Button (Glass Capsule) */}
          <div className="max-w-6xl mx-auto px-4 sm:px-8 absolute top-6 inset-x-0 flex justify-end">
            <button
              onClick={handleShareStore}
              className="px-4 py-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-slate-200 border border-white/15 backdrop-blur-xl transition-all duration-300 flex items-center gap-2 text-xs font-semibold shadow-2xl hover:scale-105 active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Compartilhar Vitrine</span>
            </button>
          </div>
        </div>

        {/* Store Profile Floating Glass Card */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 -mt-28 sm:-mt-32 relative">
          <div className="bg-slate-900/70 border border-white/[0.12] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Avatar Profile */}
            <div className="relative shrink-0 group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden p-1 bg-gradient-to-br from-white/30 to-white/5 border border-white/20 shadow-2xl">
                {admin.photoUrl ? (
                  <img
                    src={admin.photoUrl}
                    alt={admin.businessName}
                    className="w-full h-full object-cover rounded-[20px]"
                  />
                ) : (
                  <div className="w-full h-full luxury-gradient flex items-center justify-center text-3xl font-black text-white rounded-[20px]">
                    {admin.businessName?.[0] || 'B'}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-slate-950 border border-emerald-500/40 shadow-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-2.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Encomendas Abertas
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-slate-300 bg-white/[0.04] border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Mínimo {settings?.minAdvanceDays || 2} dias de antecedência
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {settings?.storeName || admin.businessName || admin.username}
              </h1>

              {(settings?.storeDescription || admin.description) && (
                <p className="text-xs sm:text-sm text-slate-300/80 font-normal leading-relaxed max-w-2xl">
                  {settings?.storeDescription || admin.description}
                </p>
              )}

              {admin.address && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>{admin.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          SCHEDULING ESTIMATOR & BOOKING HUD
      ───────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8 relative z-10">
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-white/[0.08] backdrop-blur-2xl rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Calendar className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Simulador de Data de Entrega
              </h3>
              <p className="text-xs text-slate-400">
                Selecione quando você precisa e verifique a disponibilidade em tempo real
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-56">
              <input
                type="date"
                min={minDeliveryDate}
                value={calcDate}
                onChange={e => handleCalcDate(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/15 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all cursor-pointer"
              />
            </div>

            {calcFeedback === 'ok' && (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-fade-in shadow-lg">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Data disponível para encomenda</span>
              </div>
            )}
            {calcFeedback === 'too-soon' && (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-fade-in shadow-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Antecedência insuficiente (a partir de {calcSuggestedDate})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          CINEMATIC SHOWCASE / FEATURED CAROUSEL
      ───────────────────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-10 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 rounded-full luxury-gradient" />
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Destaques da Coleção
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span className="text-white font-bold">{featuredIndex + 1}</span>
              <span>/</span>
              <span>{featuredProducts.length}</span>
            </div>
          </div>

          <div
            className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer group select-none"
            style={{ aspectRatio: '21 / 9', minHeight: 240, maxHeight: 420 }}
            onClick={() => handleOpenProduct(featuredProducts[featuredIndex])}
          >
            {featuredProducts.map((prod, idx) => (
              <div
                key={prod.id}
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: idx === featuredIndex ? 1 : 0, pointerEvents: idx === featuredIndex ? 'auto' : 'none' }}
              >
                {prod.photos?.[0]?.url ? (
                  <img
                    src={formatImageUrl(prod.photos[0].url)}
                    alt={prod.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000"
                  />
                ) : (
                  <div className="w-full h-full luxury-gradient flex items-center justify-center">
                    <Package className="w-16 h-16 text-white/20" />
                  </div>
                )}

                {/* Dark Luxury Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#07090E]/90 via-[#07090E]/40 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 z-10">
                  <div className="max-w-xl space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-400/10 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                      <Star className="w-3 h-3 fill-amber-300" />
                      Destaque Especial
                    </div>

                    <h3 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                      {prod.name}
                    </h3>

                    {prod.description && (
                      <p className="text-xs sm:text-sm text-slate-300/80 font-normal line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 pt-2">
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {formatCurrency(prod.price)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleOpenProduct(prod) }}
                        className="px-5 py-2.5 rounded-xl luxury-gradient text-white text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Ver Detalhes</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            {featuredProducts.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setFeaturedIndex(i => (i - 1 + featuredProducts.length) % featuredProducts.length) }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 text-white border border-white/10 backdrop-blur-md flex items-center justify-center transition-all z-20 hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setFeaturedIndex(i => (i + 1) % featuredProducts.length) }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 text-white border border-white/10 backdrop-blur-md flex items-center justify-center transition-all z-20 hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Progress Indicators */}
                <div className="absolute bottom-4 right-6 flex items-center gap-1.5 z-20">
                  {featuredProducts.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setFeaturedIndex(i) }}
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === featuredIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          NOVIDADES (RECENT RELEASES)
      ───────────────────────────────────────────────────────── */}
      {novidades.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-12 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 rounded-full bg-emerald-400" />
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Novidades Recentes
              </h2>
            </div>
            <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Lançados recentemente
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 -mx-2 px-2">
            {novidades.map(prod => (
              <div
                key={prod.id}
                onClick={() => handleOpenProduct(prod)}
                className="w-48 sm:w-56 shrink-0 bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden p-3 transition-all duration-300 cursor-pointer group shadow-lg flex flex-col justify-between"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950">
                  {prod.photos?.[0]?.url ? (
                    <img
                      src={formatImageUrl(prod.photos[0].url)}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <Package className="w-8 h-8 text-slate-700" />
                    </div>
                  )}

                  <button
                    onClick={(e) => toggleWishlist(e, prod.id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition-all shadow-md z-10"
                  >
                    <Heart className={`w-3.5 h-3.5 ${wishlist.includes(prod.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </button>

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                    Novo
                  </div>
                </div>

                <div className="pt-3 space-y-1">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-pink-400 transition-colors">
                    {prod.name}
                  </h4>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-extrabold text-white">
                      {formatCurrency(prod.price)}
                    </span>
                    <span className="w-7 h-7 rounded-lg luxury-gradient flex items-center justify-center text-white shadow">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          SEARCH & CATEGORY FILTERS
      ───────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-12 relative z-10">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Buscar em ${products.length} itens do catálogo...`}
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-slate-900/60 border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 backdrop-blur-xl transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pt-4 pb-2">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 flex items-center gap-2 ${
              selectedCategory === 'ALL'
                ? 'luxury-gradient text-white shadow-lg luxury-glow'
                : 'bg-slate-900/60 hover:bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Todos os Produtos</span>
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'luxury-gradient text-white shadow-lg luxury-glow'
                  : 'bg-slate-900/60 hover:bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}

          {wishlist.length > 0 && (
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'FAVORITES' ? 'ALL' : 'FAVORITES')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 flex items-center gap-2 ${
                selectedCategory === 'FAVORITES'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${selectedCategory === 'FAVORITES' ? 'fill-white' : 'fill-red-400'}`} />
              <span>Favoritos ({wishlist.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          PRODUCT CATALOG GRID
      ───────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((prod, idx) => {
            const isNew = isRecentProduct(prod)
            const isHot = prod.featured && featuredProducts.indexOf(prod) < 3

            return (
              <div
                key={prod.id}
                onClick={() => handleOpenProduct(prod)}
                className="bg-slate-900/50 hover:bg-slate-900/90 border border-white/[0.08] hover:border-white/20 backdrop-blur-2xl rounded-3xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-xl group cursor-pointer"
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
                    {prod.photos?.[0]?.url ? (
                      <img
                        src={formatImageUrl(prod.photos[0].url)}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                        <Package className="w-10 h-10 text-slate-700" />
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => toggleWishlist(e, prod.id)}
                      className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white transition-all shadow-md z-10"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-transform ${heartAnimIds.has(prod.id) ? 'scale-125' : ''} ${
                          wishlist.includes(prod.id) ? 'fill-red-500 text-red-500' : 'text-white'
                        }`}
                      />
                    </button>

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                      {isHot && (
                        <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Flame className="w-3 h-3" /> Em Alta
                        </span>
                      )}
                      {isNew && !isHot && (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                          Novo
                        </span>
                      )}
                    </div>

                    {prod.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-white">
                        +{prod.photos.length - 1} fotos
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="pt-3.5 space-y-1">
                    {prod.category && (
                      <span className="text-[10px] font-extrabold tracking-widest text-pink-400 uppercase">
                        {prod.category.name}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-pink-400 transition-colors">
                      {prod.name}
                    </h3>
                    {prod.description && (
                      <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Price & CTA */}
                <div className="pt-4 mt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block">A partir de</span>
                    <span className="text-base sm:text-lg font-black text-white">
                      {formatCurrency(prod.price)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="p-2.5 rounded-xl luxury-gradient text-white shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Custom Bespoke VIP Order Card */}
          {selectedCategory === 'ALL' && !searchQuery && (
            <div
              onClick={handleCustomOrderWhatsapp}
              className="bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-pink-950/40 border border-purple-500/30 backdrop-blur-2xl rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 hover:-translate-y-1.5 shadow-xl group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl luxury-gradient flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Projeto Personalizado?
                </h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs">
                  Criamos qualquer encomenda sob medida para atender exatamente sua necessidade.
                </p>
              </div>
              <span className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center gap-2 transition-all">
                <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
                Falar com Especialista
              </span>
            </div>
          )}
        </div>

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-slate-900/40 border border-white/[0.06] rounded-3xl backdrop-blur-xl p-8 max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-400">Tente ajustar seus termos de busca ou remover os filtros aplicados.</p>
            <button
              onClick={() => { setSelectedCategory('ALL'); setSearchQuery('') }}
              className="px-4 py-2 rounded-xl luxury-gradient text-xs font-bold text-white"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────
          PRODUCT DETAIL MODAL
      ───────────────────────────────────────────────────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/15 text-slate-100 w-full max-w-xl rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col pb-8 sm:pb-0 animate-slide-up sm:animate-scale-in">
            {/* Mobile Top Drag Indicator */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3 sm:hidden shrink-0" />

            {/* Modal Image Carousel */}
            <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden shrink-0">
              {selectedProduct.photos?.length > 0 ? (
                <img
                  src={formatImageUrl(selectedProduct.photos[activePhotoIndex]?.url || selectedProduct.photos[0].url)}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700">
                  <Package className="w-12 h-12" />
                </div>
              )}

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {selectedProduct.photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIndex(i => (i - 1 + selectedProduct.photos.length) % selectedProduct.photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white backdrop-blur-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIndex(i => (i + 1) % selectedProduct.photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white backdrop-blur-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6 flex-1">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      {selectedProduct.name}
                    </h2>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Tempo de preparo: {selectedProduct.minDaysNotice} dias úteis
                    </span>
                  </div>
                  <span className="text-xl font-black text-pink-400 shrink-0">
                    {formatCurrency(selectedProduct.price * modalQuantity)}
                  </span>
                </div>

                {selectedProduct.description && (
                  <p className="text-xs sm:text-sm text-slate-300/80 font-normal mt-3 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}
              </div>

              {/* Custom fields */}
              {selectedProduct.customFields?.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    Personalização
                  </h4>

                  {selectedProduct.customFields.map((cf, idx) => {
                    let options: string[] = []
                    try { options = typeof cf.options === 'string' ? JSON.parse(cf.options || '[]') : cf.options } catch {}
                    return (
                      <div key={idx} className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          {cf.label} {cf.required && <span className="text-pink-400">*</span>}
                        </label>
                        {cf.fieldType === 'SELECT' ? (
                          <select
                            value={modalCustomizations[cf.label] || ''}
                            onChange={e => setModalCustomizations({ ...modalCustomizations, [cf.label]: e.target.value })}
                            className="w-full bg-slate-950 border border-white/15 text-slate-200 text-xs font-medium px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-pink-500"
                          >
                            {options.map((opt, oIdx) => <option key={oIdx} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={modalCustomizations[cf.label] || ''}
                            onChange={e => setModalCustomizations({ ...modalCustomizations, [cf.label]: e.target.value })}
                            placeholder="Preencha sua especificação..."
                            className="w-full bg-slate-950 border border-white/15 text-slate-200 text-xs font-medium px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-pink-500"
                            maxLength={250}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Observações Extras (Opcional)
                </label>
                <textarea
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  placeholder="Alguma restrição, preferência de cor ou mensagem comemorativa?"
                  className="w-full bg-slate-950 border border-white/15 text-slate-200 text-xs font-medium p-3 rounded-xl focus:outline-none focus:border-pink-500 min-h-[70px]"
                  maxLength={500}
                />
              </div>

              {/* Quantity + Add Button */}
              <div className="pt-4 border-t border-white/10 flex items-center gap-4">
                <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-sm text-white px-2">{modalQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity(q => Math.min(selectedProduct.maxQuantityPerOrder || 99, q + 1))}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 rounded-2xl luxury-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Adicionar ao Pedido · {formatCurrency(selectedProduct.price * modalQuantity)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          FLOATING BOTTOM CART HUD
      ───────────────────────────────────────────────────────── */}
      {cart.length > 0 && !showCheckout && !showPixSuccessModal && (
        <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-40 animate-slide-up">
          <div
            onClick={() => setShowCheckout(true)}
            className="luxury-gradient p-4 rounded-3xl text-white shadow-2xl luxury-glow flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black/30 backdrop-blur-md flex items-center justify-center font-black text-sm shadow-inner">
                {totalCartCount}
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wide block">Ver Pedido</span>
                <span className="text-[11px] opacity-90">{cart.length} item(ns) selecionado(s)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black">{formatCurrency(cartSubtotal)}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          CHECKOUT MODAL
      ───────────────────────────────────────────────────────── */}
      {showCheckout && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/15 text-slate-100 w-full max-w-xl rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] sm:max-h-[90vh] p-5 sm:p-8 pb-12 sm:pb-8 animate-slide-up sm:animate-scale-in">
            {/* Mobile Top Drag Indicator */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
              <div>
                <span className="text-[11px] font-extrabold text-pink-400 uppercase tracking-widest">Etapa Final</span>
                <h3 className="text-xl font-bold text-white tracking-tight">Confirmar Encomenda</h3>
              </div>
              <button onClick={() => setShowCheckout(false)} className="p-2 text-slate-400 hover:text-white rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center mb-6">
              {CHECKOUT_STEPS.map((step, idx) => {
                const stepNum = idx + 1
                const isDone = currentStep > stepNum
                const isActive = currentStep === stepNum
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                        isDone ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : isActive ? 'luxury-gradient border-transparent text-white scale-110 shadow-lg'
                            : 'bg-transparent border-slate-700 text-slate-500'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepNum}
                      </div>
                      <span className={`text-[9px] font-bold whitespace-nowrap hidden sm:block ${isActive ? 'text-pink-400' : isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {step}
                      </span>
                    </div>
                    {idx < CHECKOUT_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${isDone ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Order Items */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Itens Selecionados ({cart.length})</span>
                {cart.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{item.quantity}x {item.product.name}</p>
                      {Object.entries(item.customizations).filter(([, v]) => v).map(([k, v], cIdx) => (
                        <span key={cIdx} className="text-[10px] text-slate-400 block truncate">{k}: {String(v)}</span>
                      ))}
                    </div>
                    <span className="font-bold text-pink-400 shrink-0">{formatCurrency(item.subtotal)}</span>
                    <button type="button" onClick={() => handleRemoveFromCart(idx)} className="text-slate-500 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>

              {/* Customer Info */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Identificação</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Seu Nome Completo *</label>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Maria da Silva" className="w-full bg-slate-950 border border-white/15 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500" required maxLength={120} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">WhatsApp com DDD *</label>
                    <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-slate-950 border border-white/15 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">E-mail (Opcional)</label>
                    <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="seuemail@exemplo.com" className="w-full bg-slate-950 border border-white/15 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500" />
                  </div>
                </div>
              </div>

              {/* Delivery Date and Mode */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Agendamento de Entrega</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Data *</label>
                    <input type="date" min={minDeliveryDate} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full bg-slate-950 border border-white/15 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Horário Previsto</label>
                    <input type="time" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="w-full bg-slate-950 border border-white/15 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {settings?.allowScheduledPickup && (
                    <button type="button" onClick={() => setDeliveryType('PICKUP')} className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${deliveryType === 'PICKUP' ? 'luxury-gradient text-white border-transparent shadow-lg' : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'}`}>
                      <Package className="w-4 h-4" /> Retirada no Local
                    </button>
                  )}
                  {settings?.allowDelivery && (
                    <button type="button" onClick={() => setDeliveryType('DELIVERY')} className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${deliveryType === 'DELIVERY' ? 'luxury-gradient text-white border-transparent shadow-lg' : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'}`}>
                      <Truck className="w-4 h-4" /> Entrega (+{formatCurrency(settings.deliveryFee || 0)})
                    </button>
                  )}
                </div>

                {deliveryType === 'DELIVERY' && (
                  <div className="animate-fade-in pt-1">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Endereço Completo com Bairro *</label>
                    <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Rua, número, complemento, bairro..." className="w-full bg-slate-950 border border-white/15 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500" required maxLength={300} />
                  </div>
                )}
              </div>

              {/* Payment Split Options */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Condição de Pagamento</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'DEPOSIT', label: `Entrada (${depositPercentage}%)`, value: formatCurrency(depositAmount), desc: `Restante de ${formatCurrency(Math.max(0, cartTotal - depositAmount))} no ato da entrega` },
                    { id: 'FULL', label: 'Pagamento Total (100%)', value: formatCurrency(cartTotal), desc: 'Quitação antecipada e liberação expressa' },
                  ].map(opt => (
                    <button key={opt.id} type="button" onClick={() => setPaymentOption(opt.id as any)}
                      className={`p-4 rounded-2xl border text-left transition-all ${paymentOption === opt.id ? 'border-pink-500 bg-pink-500/10 ring-2 ring-pink-500/20' : 'border-white/10 bg-slate-950/60 hover:border-white/20'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{opt.label}</span>
                        <span className="text-xs font-extrabold text-pink-400">{opt.value}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Método de Pagamento</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPaymentMethod('PIX')} className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all ${paymentMethod === 'PIX' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-slate-400 hover:text-white'}`}>
                    <QrCode className="w-4 h-4 text-emerald-400" /> PIX Instantâneo
                  </button>
                  {admin.hasMercadoPago && (
                    <button type="button" onClick={() => setPaymentMethod('MERCADOPAGO')} className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all ${paymentMethod === 'MERCADOPAGO' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-white/10 text-slate-400 hover:text-white'}`}>
                      <CreditCard className="w-4 h-4 text-sky-400" /> Cartão / Mercado Pago
                    </button>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span><span>{formatCurrency(cartSubtotal)}</span>
                </div>
                {deliveryType === 'DELIVERY' && deliveryFee > 0 && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Taxa de Entrega</span><span>+{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-2.5 border-t border-white/10">
                  <span>Total do Pedido</span>
                  <span className="text-pink-400">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block">{isFullPayment ? 'Total a Pagar' : `Entrada (${depositPercentage}%)`}</span>
                    <span className="text-base font-black text-emerald-400">{formatCurrency(amountToPayNow)}</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block">Restante</span>
                    <span className="text-base font-black text-slate-300">{formatCurrency(amountRemaining)}</span>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingOrder}
                className="w-full py-4 rounded-2xl luxury-gradient text-white font-bold text-sm tracking-wide shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingOrder ? <><Loader2 className="w-4 h-4 animate-spin" /> Transmitindo Pedido...</> : <><CheckCircle className="w-4 h-4" /> Concluir e Gerar PIX ({formatCurrency(amountToPayNow)})</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          PIX PAYMENT & ORDER SUCCESS MODAL
      ───────────────────────────────────────────────────────── */}
      {showPixSuccessModal && submittedOrderData && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/15 text-slate-100 w-full max-w-lg rounded-t-[28px] sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] sm:max-h-[95vh] overflow-y-auto pb-12 sm:pb-8 animate-slide-up sm:animate-scale-in">
            {/* Mobile Top Drag Indicator */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            {/* Header */}
            <div className="text-center space-y-2 pb-4 border-b border-white/10">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Pedido Confirmado</span>
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-2xl font-black text-white font-mono">
                  {submittedOrderData.order?.orderNumber}
                </h3>
                <button onClick={() => handleCopyOrderNumber(submittedOrderData.order?.orderNumber)} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-white/10">
                  {copiedOrderNumber ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 font-medium">Guarde o código para rastrear sua encomenda</p>
            </div>

            {/* PIX Details */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" /> Pagamento Instantâneo PIX
                </span>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {submittedOrderData.pixInfo?.paymentLabel || 'Entrada'}
                </span>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 text-center space-y-1">
                <span className="text-xs font-semibold text-slate-400">Valor para Quitação / Entrada:</span>
                <p className="text-3xl font-black text-emerald-400 font-mono">
                  {formatCurrency(submittedOrderData.pixInfo?.amount || submittedOrderData.order?.depositAmount || 0)}
                </p>
              </div>

              {pixQrCodeDataUrl && (
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-white/20 shadow-md">
                  <img src={pixQrCodeDataUrl} alt="QR Code PIX" className="w-48 h-48 object-contain" />
                  <span className="text-[10px] font-bold text-slate-800 mt-2 uppercase tracking-wider">Aponte a câmera do aplicativo do seu banco</span>
                </div>
              )}

              {pixPayloadCode ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(pixPayloadCode); setCopiedPixPayload(true); setTimeout(() => setCopiedPixPayload(false), 3000) }}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                      copiedPixPayload ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20 hover:scale-[1.01]'
                    }`}
                  >
                    {copiedPixPayload ? <><Check className="w-4 h-4 stroke-[3]" /> Código PIX Copiado</> : <><Copy className="w-4 h-4" /> Copiar Código PIX Copia e Cola</>}
                  </button>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Ou copie a chave direta:</span>
                    <button type="button" onClick={() => handleCopyPix(submittedOrderData.pixInfo?.pixKey)} className="text-pink-400 hover:underline font-bold">
                      {copiedPixKey ? 'Chave copiada' : submittedOrderData.pixInfo?.pixKey}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              {(() => {
                const rawPhone = (admin?.phone || '').replace(/\D/g, '')
                let formattedPhone = rawPhone
                if (rawPhone.length >= 10 && !rawPhone.startsWith('55')) formattedPhone = `55${rawPhone}`
                const msg = encodeURIComponent(`Olá! Acabei de registrar o pedido *${submittedOrderData.order?.orderNumber}* no valor de ${formatCurrency(submittedOrderData.pixInfo?.amount || 0)} via PIX. Segue o comprovante de pagamento.`)
                const waUrl = submittedOrderData.whatsappUrl || (formattedPhone ? `https://wa.me/${formattedPhone}?text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`)
                return (
                  <a href={waUrl} target="_blank" rel="noreferrer" className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 text-center transition-all hover:scale-[1.01]">
                    <MessageSquare className="w-4 h-4" /> Enviar Comprovante pelo WhatsApp
                  </a>
                )
              })()}

              <button
                type="button"
                onClick={() => { setShowPixSuccessModal(false); if (submittedOrderData.trackingUrl) navigate(submittedOrderData.trackingUrl) }}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-white/10"
              >
                Acompanhar Status da Encomenda <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          LUXURY FOOTER
      ───────────────────────────────────────────────────────── */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-8 py-10 mt-12 border-t border-white/[0.06] text-center relative z-10">
        <a href="https://boramarka.com.br" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors">
          <span>Vitrine exclusiva por</span>
          <span className="luxury-text-gradient font-black flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> BoraMarka
          </span>
        </a>
      </footer>
    </div>
  )
}
