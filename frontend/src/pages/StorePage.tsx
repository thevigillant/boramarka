import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Store,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShoppingBag,
  Plus,
  Minus,
  X,
  CheckCircle,
  Truck,
  Package,
  AlertCircle,
  Loader2,
  ChevronRight,
  Info,
  Sparkles,
  Copy,
  Check,
  QrCode,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Wallet,
  CreditCard,
} from 'lucide-react'
import { api } from '../services/api'
import { formatCurrency, formatImageUrl } from '../utils/dashboardHelpers'
import type { ProductData, ProductCategoryData, OrderSettingsData } from '../types/dashboard'

interface CartItem {
  product: ProductData
  quantity: number
  customizations: Record<string, any>
  notes: string
  subtotal: number
}

export function StorePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Store data
  const [admin, setAdmin] = useState<any>(null)
  const [settings, setSettings] = useState<OrderSettingsData | null>(null)
  const [categories, setCategories] = useState<ProductCategoryData[]>([])
  const [products, setProducts] = useState<ProductData[]>([])
  const [minDeliveryDate, setMinDeliveryDate] = useState('')

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL')

  // Product detail modal state
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalCustomizations, setModalCustomizations] = useState<Record<string, any>>({})
  const [modalNotes, setModalNotes] = useState('')
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  // Cart & Checkout states
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

  // Modal de Pagamento PIX e Confirmação de Sucesso
  const [submittedOrderData, setSubmittedOrderData] = useState<any>(null)
  const [showPixSuccessModal, setShowPixSuccessModal] = useState(false)
  const [copiedPixKey, setCopiedPixKey] = useState(false)
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false)

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

  // Open Product Modal
  function handleOpenProduct(product: ProductData) {
    setSelectedProduct(product)
    setModalQuantity(1)
    setModalNotes('')
    setActivePhotoIndex(0)
    const initialCustoms: Record<string, any> = {}
    product.customFields?.forEach(cf => {
      let options: string[] = []
      try {
        options = typeof cf.options === 'string' ? JSON.parse(cf.options || '[]') : cf.options
      } catch {}
      if (cf.fieldType === 'SELECT' && options.length > 0) {
        initialCustoms[cf.label] = options[0]
      } else {
        initialCustoms[cf.label] = ''
      }
    })
    setModalCustomizations(initialCustoms)
  }

  // Add to cart
  function handleAddToCart() {
    if (!selectedProduct) return

    // Valida campos obrigatórios
    for (const cf of selectedProduct.customFields || []) {
      if (cf.required && !modalCustomizations[cf.label]?.trim()) {
        alert(`O campo "${cf.label}" é obrigatório.`)
        return
      }
    }

    const subtotal = selectedProduct.price * modalQuantity
    setCart(prev => [
      ...prev,
      {
        product: selectedProduct,
        quantity: modalQuantity,
        customizations: modalCustomizations,
        notes: modalNotes.trim(),
        subtotal,
      },
    ])

    setSelectedProduct(null)
  }

  function handleRemoveFromCart(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index))
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

  // Submit Order
  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!username) return

    if (!clientName.trim()) {
      setSubmitError('Por favor, informe seu nome.')
      return
    }
    const cleanPhone = clientPhone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setSubmitError('Informe um WhatsApp válido com DDD.')
      return
    }
    if (!deliveryDate) {
      setSubmitError('Selecione a data de entrega desejada.')
      return
    }
    if (deliveryType === 'DELIVERY' && !deliveryAddress.trim()) {
      setSubmitError('Informe o endereço completo para entrega.')
      return
    }

    setSubmittingOrder(true)
    setSubmitError('')

    try {
      const payload = {
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
      }

      const res = await api.createPublicOrder(username, payload)
      setSubmittedOrderData(res)
      setShowCheckout(false)
      setCart([])
      setShowPixSuccessModal(true)
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao enviar pedido. Tente novamente.')
    } finally {
      setSubmittingOrder(false)
    }
  }

  function handleCopyPix(pixKey: string) {
    if (!pixKey) return
    navigator.clipboard.writeText(pixKey)
    setCopiedPixKey(true)
    setTimeout(() => setCopiedPixKey(false), 3000)
  }

  function handleCopyOrderNumber(orderNumber: string) {
    if (!orderNumber) return
    navigator.clipboard.writeText(orderNumber)
    setCopiedOrderNumber(true)
    setTimeout(() => setCopiedOrderNumber(false), 3000)
  }

  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'ALL') return true
    return p.categoryId === selectedCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    )
  }

  if (error || !admin) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 text-white text-center">
        <div className="bg-[#131826] p-8 rounded-3xl max-w-sm w-full border border-slate-800 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Loja Indisponível</h2>
          <p className="text-sm text-slate-400">{error || 'Não foi possível carregar a vitrine.'}</p>
        </div>
      </div>
    )
  }

  const accentColor = admin.accentColor || '#f97316'
  const secondaryColor = admin.secondaryColor || '#ec4899'

  return (
    <div className={`min-h-screen ${admin.publicTheme === 'dark' ? 'dark bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-900'} pb-28 font-sans`}>
      <style>{`
        .store-accent-gradient { background: linear-gradient(135deg, ${accentColor}, ${secondaryColor}) !important; }
        .store-accent-color { color: ${accentColor} !important; }
        .store-accent-border { border-color: ${accentColor} !important; }
      `}</style>

      {/* ── Hero Banner da Loja ── */}
      <div className="relative">
        {admin.bannerUrl ? (
          <div className="w-full h-48 sm:h-64 overflow-hidden bg-slate-900">
            <img src={admin.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-44 sm:h-56 store-accent-gradient flex items-center justify-center">
            <Store className="w-16 h-16 text-white/40" />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-10">
          <div className="bg-white dark:bg-[#131826] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {admin.photoUrl ? (
              <img
                src={admin.photoUrl}
                alt={admin.businessName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white dark:border-[#131826] shadow-xl flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl store-accent-gradient flex items-center justify-center text-2xl font-black text-white shadow-xl flex-shrink-0">
                {admin.businessName?.[0] || 'B'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  Encomendas Abertas
                </span>
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Mín. {settings?.minAdvanceDays || 2} dias de antecedência
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {settings?.storeName || admin.businessName || admin.username}
              </h1>

              {(settings?.storeDescription || admin.description) && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-medium">
                  {settings?.storeDescription || admin.description}
                </p>
              )}

              {admin.address && (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {admin.address}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Categorias (Chips) ── */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`py-2 px-5 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'store-accent-gradient text-white shadow-md'
                : 'bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-pink-500/50'
            }`}
          >
            Todos os Produtos
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`py-2 px-5 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'store-accent-gradient text-white shadow-md'
                  : 'bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-pink-500/50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid de Produtos do Cardápio ── */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.map(prod => (
            <div
              key={prod.id}
              onClick={() => handleOpenProduct(prod)}
              className="bg-white dark:bg-[#131826] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800/80 shadow-md hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Foto */}
                {prod.photos?.[0]?.url ? (
                  <div className="w-full h-48 overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    <img
                      src={formatImageUrl(prod.photos[0].url)}
                      alt={prod.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/400x400/1e293b/f43f5e?text=' + encodeURIComponent(prod.name);
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {prod.featured && (
                      <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                        Destaque
                      </span>
                    )}
                    {prod.photos.length > 1 && (
                      <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {prod.photos.length} fotos
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-48 bg-slate-900 flex items-center justify-center text-slate-600">
                    <Package className="w-10 h-10" />
                  </div>
                )}

                <div className="p-5">
                  {prod.category && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-pink-500 block mb-1">
                      {prod.category.name}
                    </span>
                  )}

                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight mb-1">
                    {prod.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium mb-3">
                    {prod.description || 'Produto artesanal sob encomenda.'}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                    <span>Mín. {prod.minDaysNotice} dias</span>
                    <span>·</span>
                    <span>{prod.unitLabel}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 mt-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">A partir de</span>
                  <span className="text-base font-black text-pink-600 dark:text-pink-400">
                    {formatCurrency(prod.price)}
                  </span>
                </div>

                <button
                  type="button"
                  className="py-2 px-4 rounded-xl store-accent-gradient text-white text-xs font-black shadow-md flex items-center gap-1 hover:opacity-90"
                >
                  <Plus className="w-3.5 h-3.5" /> Encomendar
                </button>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-[#131826] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                Nenhum produto nesta categoria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de Detalhe e Personalização do Produto ── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#131826] w-full max-w-xl rounded-3xl shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100 overflow-y-auto max-h-[90vh] flex flex-col">
            {/* Foto / Carrossel */}
            <div className="relative">
              {selectedProduct.photos?.length > 0 ? (
                <div className="w-full h-64 bg-slate-900 overflow-hidden">
                  <img
                    src={formatImageUrl(selectedProduct.photos[activePhotoIndex]?.url || selectedProduct.photos[0].url)}
                    alt={selectedProduct.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400/1e293b/f43f5e?text=' + encodeURIComponent(selectedProduct.name);
                    }}
                    className="w-full h-full object-cover"
                  />
                  {selectedProduct.photos.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      {selectedProduct.photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActivePhotoIndex(i)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            activePhotoIndex === i ? 'bg-white w-4' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-44 bg-slate-900 flex items-center justify-center text-slate-600">
                  <Package className="w-12 h-12" />
                </div>
              )}

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 sm:p-8 space-y-6 flex-1">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <span className="text-xs font-semibold text-slate-400 mt-1 block">
                      Prazo mínimo de preparo: {selectedProduct.minDaysNotice} dias
                    </span>
                  </div>
                  <span className="text-xl font-black text-pink-600 dark:text-pink-400 shrink-0 ml-3">
                    {formatCurrency(selectedProduct.price * modalQuantity)}
                  </span>
                </div>

                {selectedProduct.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}
              </div>

              {/* Perguntas de Personalização */}
              {selectedProduct.customFields?.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Personalize seu Pedido
                  </h4>

                  {selectedProduct.customFields.map((cf, idx) => {
                    let options: string[] = []
                    try {
                      options = typeof cf.options === 'string' ? JSON.parse(cf.options || '[]') : cf.options
                    } catch {}

                    return (
                      <div key={idx} className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                          {cf.label} {cf.required && <span className="text-pink-500">*</span>}
                        </label>

                        {cf.fieldType === 'SELECT' ? (
                          <select
                            value={modalCustomizations[cf.label] || ''}
                            onChange={e =>
                              setModalCustomizations({
                                ...modalCustomizations,
                                [cf.label]: e.target.value,
                              })
                            }
                            className="input-simple text-xs font-bold"
                          >
                            {options.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={modalCustomizations[cf.label] || ''}
                            onChange={e =>
                              setModalCustomizations({
                                ...modalCustomizations,
                                [cf.label]: e.target.value,
                              })
                            }
                            placeholder="Digite aqui..."
                            className="input-simple text-xs font-medium"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">
                  Observações Extras (Opcional)
                </label>
                <textarea
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  placeholder="Ex: sem glúten, embalagem para presente, etc."
                  className="input-simple text-xs font-medium min-h-[60px]"
                />
              </div>

              {/* Quantidade e Botão Adicionar */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                    className="p-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow hover:bg-slate-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-black text-sm px-2 text-slate-900 dark:text-white">
                    {modalQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity(q => Math.min(selectedProduct.maxQuantityPerOrder || 99, q + 1))}
                    className="p-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow hover:bg-slate-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-4 store-accent-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-pink-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Adicionar · {formatCurrency(selectedProduct.price * modalQuantity)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Carrinho Flutuante (Bottom Bar) ── */}
      {cart.length > 0 && !showCheckout && (
        <div className="fixed bottom-6 left-4 right-4 max-w-xl mx-auto z-40 animate-slide-up">
          <div
            onClick={() => setShowCheckout(true)}
            className="store-accent-gradient p-4 rounded-3xl text-white shadow-2xl flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-base shadow">
                {totalCartCount}
              </div>
              <div>
                <span className="text-xs font-black block">Ver Encomenda</span>
                <span className="text-[11px] opacity-90">{cart.length} produto(s) selecionado(s)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-black">{formatCurrency(cartSubtotal)}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Checkout ── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#131826] w-full max-w-xl rounded-3xl shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100 overflow-y-auto max-h-[90vh] p-6 sm:p-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <span className="text-xs font-black text-pink-500 uppercase tracking-widest">
                  Finalizar Encomenda
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  Detalhes do seu Pedido
                </h3>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Itens no Carrinho */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                  Itens Selecionados ({cart.length})
                </span>
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 dark:text-white truncate">
                        {item.quantity}x {item.product.name}
                      </p>
                      {Object.entries(item.customizations).map(([k, v], cIdx) => (
                        <span key={cIdx} className="text-[10px] text-slate-400 block truncate">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                    <span className="font-black text-pink-500 shrink-0">
                      {formatCurrency(item.subtotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(idx)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Dados do Cliente ── */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                  Seus Dados
                </span>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">Seu Nome *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Nome completo"
                    className="input-simple text-xs font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">WhatsApp (DDD) *</label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="input-simple text-xs font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">E-mail (Opcional)</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="input-simple text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* ── Data e Forma de Entrega ── */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                  Data e Horário de Entrega / Retirada
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">Data *</label>
                    <input
                      type="date"
                      min={minDeliveryDate}
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      className="input-simple text-xs font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">Horário Previsto *</label>
                    <input
                      type="time"
                      value={deliveryTime}
                      onChange={e => setDeliveryTime(e.target.value)}
                      className="input-simple text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Tipo de Entrega */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {settings?.allowScheduledPickup && (
                    <button
                      type="button"
                      onClick={() => setDeliveryType('PICKUP')}
                      className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                        deliveryType === 'PICKUP'
                          ? 'store-accent-gradient text-white border-transparent shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Package className="w-4 h-4" /> Retirada no Local
                    </button>
                  )}

                  {settings?.allowDelivery && (
                    <button
                      type="button"
                      onClick={() => setDeliveryType('DELIVERY')}
                      className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                        deliveryType === 'DELIVERY'
                          ? 'store-accent-gradient text-white border-transparent shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Truck className="w-4 h-4" /> Entrega (+{formatCurrency(settings.deliveryFee || 0)})
                    </button>
                  )}
                </div>

                {deliveryType === 'DELIVERY' && (
                  <div className="animate-slide-up">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">
                      Endereço Completo de Entrega *
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Rua, número, complemento, bairro..."
                      className="input-simple text-xs font-bold"
                      required
                    />
                  </div>
                )}
              </div>

              {/* ── Opção de Pagamento: Sinal vs Total ── */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                  Como deseja pagar agora?
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentOption('DEPOSIT')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      paymentOption === 'DEPOSIT'
                        ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 ring-2 ring-pink-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentOption === 'DEPOSIT' ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-400'}`}>
                          {paymentOption === 'DEPOSIT' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        Pagar Entrada ({depositPercentage}%)
                      </span>
                      <span className="text-xs font-black text-emerald-500">
                        {formatCurrency(depositAmount)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-5">
                      Garante a produção agora e pague o restante ({formatCurrency(Math.max(0, cartTotal - depositAmount))}) na entrega/retirada.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption('FULL')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      paymentOption === 'FULL'
                        ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 ring-2 ring-pink-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentOption === 'FULL' ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-400'}`}>
                          {paymentOption === 'FULL' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        Pagar Valor Total (100%)
                      </span>
                      <span className="text-xs font-black text-pink-500">
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-5">
                      Quita o valor integral da encomenda antecipadamente.
                    </p>
                  </button>
                </div>
              </div>

              {/* ── Forma de Pagamento ── */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                  Forma de Pagamento
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-3 rounded-2xl border text-xs font-black flex items-center gap-2 transition-all ${
                      paymentMethod === 'PIX'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-500" />
                    PIX Instantâneo
                  </button>

                  {admin.mpAccessToken && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MERCADOPAGO')}
                      className={`p-3 rounded-2xl border text-xs font-black flex items-center gap-2 transition-all ${
                        paymentMethod === 'MERCADOPAGO'
                          ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-sky-500" />
                      Cartão / Mercado Pago
                    </button>
                  )}
                </div>
              </div>

              {/* ── Resumo Financeiro ── */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                {deliveryType === 'DELIVERY' && deliveryFee > 0 && (
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>Taxa de Entrega</span>
                    <span>+{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                  <span>Total do Pedido</span>
                  <span className="text-pink-400">{formatCurrency(cartTotal)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div className={`p-2.5 rounded-xl border ${paymentOption === 'DEPOSIT' ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-pink-950/40 border-pink-500/30'}`}>
                    <span className="text-[10px] font-bold text-slate-300 block">
                      {paymentOption === 'DEPOSIT' ? `Entrada (${depositPercentage}%)` : 'Valor Total (100%)'}
                    </span>
                    <span className="text-sm font-black text-emerald-400">
                      {formatCurrency(amountToPayNow)}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Pagar agora via PIX</span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/40">
                    <span className="text-[10px] font-bold text-slate-400 block">Restante</span>
                    <span className="text-sm font-black text-slate-200">
                      {formatCurrency(amountRemaining)}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {amountRemaining === 0 ? 'Quitado antecipadamente' : 'Pagar na entrega/retirada'}
                    </span>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingOrder}
                className="w-full py-4 store-accent-gradient text-white rounded-2xl font-black text-base shadow-xl shadow-pink-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processando Pedido...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" /> Confirmar e Pagar via PIX ({formatCurrency(amountToPayNow)})
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 4. MODAL DE PAGAMENTO PIX E CONFIRMAÇÃO DE PEDIDO */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showPixSuccessModal && submittedOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#131826] w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 space-y-6 max-h-[95vh] overflow-y-auto">
            {/* Header de Sucesso */}
            <div className="text-center space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                Pedido Realizado com Sucesso!
              </span>
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {submittedOrderData.order?.orderNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopyOrderNumber(submittedOrderData.order?.orderNumber)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                  title="Copiar número do pedido"
                >
                  {copiedOrderNumber ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Guarde o número do pedido para acompanhar a produção
              </p>
            </div>

            {/* Card de Pagamento PIX */}
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-500" /> Pagamento via PIX
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {submittedOrderData.pixInfo?.paymentLabel || 'Entrada'}
                </span>
              </div>

              {/* Valor em destaque */}
              <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-center space-y-1">
                <span className="text-xs font-bold text-slate-400">Valor a Transferir Agora:</span>
                <p className="text-3xl font-black text-emerald-500 font-mono">
                  {formatCurrency(submittedOrderData.pixInfo?.amount || submittedOrderData.order?.depositAmount || 0)}
                </p>
                {submittedOrderData.order?.remainingAmount > 0 && (
                  <p className="text-[11px] font-semibold text-slate-400">
                    Restante de {formatCurrency(submittedOrderData.order.remainingAmount)} a pagar na entrega/retirada
                  </p>
                )}
              </div>

              {/* Chave PIX com botão de copiar */}
              {submittedOrderData.pixInfo?.pixKey ? (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-400 uppercase">
                    Chave PIX do Estabelecimento ({submittedOrderData.pixInfo?.merchantName || admin.businessName})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={submittedOrderData.pixInfo.pixKey}
                      className="input-simple text-xs font-bold font-mono select-all bg-slate-100 dark:bg-slate-800 py-2.5"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyPix(submittedOrderData.pixInfo.pixKey)}
                      className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                        copiedPixKey
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600'
                      }`}
                    >
                      {copiedPixKey ? (
                        <>
                          <Check className="w-4 h-4" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copiar Chave
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-medium">
                  Combine o pagamento diretamente com o estabelecimento no WhatsApp abaixo.
                </div>
              )}

              {/* Passo a passo */}
              <div className="p-3.5 rounded-2xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/60 dark:border-pink-900/40 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <p className="font-black text-pink-600 dark:text-pink-400 text-[11px] uppercase tracking-wider">
                  Como concluir seu pedido:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <li>Copie a chave PIX acima</li>
                  <li>Abra o app do seu banco e faça a transferência no valor indicado</li>
                  <li>Clique no botão verde abaixo para <strong>enviar o comprovante no WhatsApp</strong></li>
                </ol>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-2.5">
              {(() => {
                const rawPhone = admin?.phone || admin?.pixKey || settings?.pixKey || '';
                const cleanPhone = rawPhone.replace(/\D/g, '');
                const msg = encodeURIComponent(
                  `Olá! Acabei de fazer o pedido *${submittedOrderData.order?.orderNumber}* no valor de ${formatCurrency(submittedOrderData.pixInfo?.amount || submittedOrderData.order?.depositAmount || 0)} via PIX na sua loja. Segue o comprovante em anexo!`
                );
                const finalWhatsappUrl = submittedOrderData.whatsappUrl || (
                  (cleanPhone.length === 10 || cleanPhone.length === 11)
                    ? `https://wa.me/55${cleanPhone}?text=${msg}`
                    : `https://api.whatsapp.com/send?text=${msg}`
                );

                return (
                  <a
                    href={finalWhatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <MessageSquare className="w-5 h-5" /> Enviar Comprovante no WhatsApp
                  </a>
                );
              })()}

              {submittedOrderData.paymentUrl && (
                <a
                  href={submittedOrderData.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-sky-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-center"
                >
                  <CreditCard className="w-4 h-4" /> Pagar via Mercado Pago / Cartão
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowPixSuccessModal(false)
                  if (submittedOrderData.trackingUrl) {
                    navigate(submittedOrderData.trackingUrl)
                  }
                }}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5"
              >
                Acompanhar Status da Encomenda <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
