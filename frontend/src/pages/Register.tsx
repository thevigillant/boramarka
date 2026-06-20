import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import {
  Store, User, Lock, Phone, FileText, MapPin, Clock,
  ChevronRight, ChevronLeft, Loader2, AlertCircle,
  Sparkles, Star, CheckCircle2, Image, Building2, Calendar, X, ArrowLeft
} from 'lucide-react'

// ════════════════════════════════════════════
// CNPJ Mask: XX.XXX.XXX/XXXX-XX
// ════════════════════════════════════════════
function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// ════════════════════════════════════════════
// Step indicator
// ════════════════════════════════════════════
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isDone = step < currentStep
        return (
          <div key={step} className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-pink-500/30 scale-110'
                : isDone
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-400'
            }`}>
              {isDone ? <CheckCircle2 className="w-5 h-5" /> : step}
            </div>
            {step < totalSteps && (
              <div className={`w-8 h-0.5 rounded-full transition-all duration-300 ${
                isDone ? 'bg-emerald-400' : 'bg-slate-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════
// Feature Badge (premium feel)
// ════════════════════════════════════════════
function FeatureBadge({ icon: Icon, label, pro }: { icon: any; label: string; pro?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
      pro
        ? 'bg-amber-50 border border-amber-200 text-amber-700'
        : 'bg-slate-50 border border-slate-200 text-slate-600'
    }`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
      {pro && <Sparkles className="w-3 h-3 text-amber-500" />}
    </div>
  )
}

// ════════════════════════════════════════════
// Main Register Component
// ════════════════════════════════════════════
export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    setChecking(false)
  }, [])

  // Step 1 — Credenciais
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 2 — Negócio
  const [businessName, setBusinessName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  // Step 3 — Perfil
  const [description, setDescription] = useState('')
  const [operatingHours, setOperatingHours] = useState(
    JSON.stringify({
      seg: { open: '08:00', close: '18:00', active: true },
      ter: { open: '08:00', close: '18:00', active: true },
      qua: { open: '08:00', close: '18:00', active: true },
      qui: { open: '08:00', close: '18:00', active: true },
      sex: { open: '08:00', close: '18:00', active: true },
      sab: { open: '08:00', close: '13:00', active: true },
      dom: { open: '', close: '', active: false },
    })
  )

  const hours = JSON.parse(operatingHours)
  const dayLabels: Record<string, string> = {
    seg: 'Segunda', ter: 'Terça', qua: 'Quarta',
    qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo'
  }

  const updateHours = (day: string, field: string, value: string | boolean) => {
    const updated = { ...hours, [day]: { ...hours[day], [field]: value } }
    setOperatingHours(JSON.stringify(updated))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const MAX_WIDTH = 400
        const MAX_HEIGHT = 400
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setPhotoUrl(dataUrl)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // ═══ Validation ═══
  const validateStep1 = (): string | null => {
    if (!username.trim()) return 'Digite um nome de usuário'
    if (username.trim().length < 3) return 'Usuário deve ter pelo menos 3 caracteres'
    if (!password) return 'Digite uma senha'
    if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres'
    if (password !== confirmPassword) return 'As senhas não conferem'
    return null
  }

  const validateStep2 = (): string | null => {
    if (!businessName.trim()) return 'Digite o nome do seu negócio'
    return null
  }

  const handleNext = () => {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
    }
    setStep(s => Math.min(s + 1, 3))
  }

  const handleBack = () => {
    setError('')
    setStep(s => Math.max(s - 1, 1))
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const res = await api.register({
        username: username.trim().toLowerCase(),
        password,
        businessName: businessName.trim(),
        cnpj: cnpj.replace(/\D/g, ''),
        phone: phone.replace(/\D/g, ''),
        description: description.trim(),
        photoUrl: photoUrl.trim(),
        address: address.trim(),
        operatingHours,
      })

      localStorage.removeItem('token')
      localStorage.removeItem('role')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('role')

      localStorage.setItem('token', res.token)
      localStorage.setItem('role', 'user')
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.message || 'Erro ao criar conta'
      if (msg.includes('Já existe')) {
        // Account was created — redirect to login
        navigate('/login', { replace: true })
        return
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-[#0B0F19] dark:via-[#0B0F19] dark:to-[#0B0F19] flex items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-lg animate-slide-up">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-pink-500 shadow-xl shadow-pink-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">Bora Marka</h1>
              <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest mt-1">
                Seu Agendamento Inteligente
              </p>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            {step === 1 && 'Crie sua conta de administrador'}
            {step === 2 && 'Dados do seu negócio'}
            {step === 3 && 'Horários e descrição'}
          </p>
        </div>

        <StepIndicator currentStep={step} totalSteps={3} />

        {/* Card */}
        <div className="card-simple p-6 sm:p-8">
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 p-3 rounded-xl text-red-600 text-sm mb-6 animate-slide-up">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* STEP 1 — Credenciais */}
          {/* ═══════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5 animate-slide-up">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-1 opacity-50" />
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                  placeholder="ex: joao.barbearia"
                  className="input-simple"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1 px-1">Usado para entrar no sistema</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-1 opacity-50" />
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="input-simple"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-1 opacity-50" />
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="input-simple"
                />
              </div>

              <button
                onClick={handleNext}
                className="w-full btn-primary-simple py-4 flex items-center justify-center gap-2 text-lg mt-2"
              >
                Continuar
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* STEP 2 — Dados do Negócio */}
          {/* ═══════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5 animate-slide-up">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <Store className="w-4 h-4 inline mr-1 opacity-50" />
                  Nome do Negócio <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Ex: Barbearia do João, Studio Maria Nails..."
                  className="input-simple"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <Image className="w-4 h-4 inline mr-1 opacity-50" />
                  Logo ou Foto de Perfil
                  <span className="text-xs text-slate-400 font-normal ml-2">(opcional)</span>
                </label>
                <div className="flex items-center gap-4">
                  {photoUrl ? (
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-pink-500/20 shrink-0 border-2 border-white">
                      <img src={photoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setPhotoUrl('')}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        title="Remover imagem"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0">
                      <Image className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-600 cursor-pointer text-sm">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                      Selecionar Arquivo
                    </label>
                    <p className="text-[10px] text-slate-400 mt-2 px-1">Tamanho máximo recomendado: 2MB. A imagem será redimensionada.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1 opacity-50" />
                  CNPJ
                  <span className="text-xs text-slate-400 font-normal ml-2">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={e => setCnpj(maskCnpj(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className="input-simple"
                />
                <p className="text-xs text-slate-400 mt-1 px-1">Aparecerá na página de agendamento para seus clientes</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1 opacity-50" />
                  WhatsApp do Negócio
                  <span className="text-xs text-slate-400 font-normal ml-2">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="input-simple"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1 opacity-50" />
                  Endereço
                  <span className="text-xs text-slate-400 font-normal ml-2">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 123 — Centro"
                  className="input-simple"
                />
              </div>

              {/* Premium tease */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-amber-800">Em breve — Plano PRO</span>
                </div>
                <p className="text-xs text-amber-700 mb-3">Destaque o seu negócio com recursos exclusivos:</p>
                <div className="flex flex-wrap gap-2">
                  <FeatureBadge icon={Image} label="Logo & Fotos" pro />
                  <FeatureBadge icon={Star} label="Página personalizada" pro />
                  <FeatureBadge icon={FileText} label="Recibos automáticos" pro />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button
                  onClick={handleNext}
                  className="flex-[2] btn-primary-simple py-4 flex items-center justify-center gap-2 text-lg"
                >
                  Continuar
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* STEP 3 — Horários e Descrição */}
          {/* ═══════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-5 animate-slide-up">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-1 opacity-50" />
                  Descrição do Negócio
                  <span className="text-xs text-slate-400 font-normal ml-2">(opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Conte um pouco sobre o seu negócio... Ex: Barbearia especializada em cortes modernos e barba, com 10 anos de experiência."
                  rows={3}
                  className="input-simple resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
                  <Clock className="w-4 h-4 opacity-50" />
                  Horário de Funcionamento
                </label>
                <div className="space-y-2">
                  {Object.entries(dayLabels).map(([key, label]) => (
                    <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      hours[key].active
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}>
                      <label className="flex items-center gap-2 cursor-pointer min-w-[100px]">
                        <input
                          type="checkbox"
                          checked={hours[key].active}
                          onChange={e => updateHours(key, 'active', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                        />
                        <span className={`text-sm font-bold ${hours[key].active ? 'text-slate-700' : 'text-slate-400'}`}>
                          {label}
                        </span>
                      </label>
                      {hours[key].active && (
                        <div className="flex items-center gap-2 ml-auto">
                          <input
                            type="time"
                            value={hours[key].open}
                            onChange={e => updateHours(key, 'open', e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-pink-500"
                          />
                          <span className="text-slate-400 text-xs font-bold">até</span>
                          <input
                            type="time"
                            value={hours[key].close}
                            onChange={e => updateHours(key, 'close', e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-pink-500"
                          />
                        </div>
                      )}
                      {!hours[key].active && (
                        <span className="ml-auto text-xs font-bold text-slate-400">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-pink-50 border border-blue-100 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2">📋 Resumo da sua conta</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-pink-500 font-semibold">Usuário:</span>
                  <span className="text-blue-900 font-bold">{username}</span>
                  <span className="text-pink-500 font-semibold">Negócio:</span>
                  <span className="text-blue-900 font-bold">{businessName}</span>
                  {cnpj && (
                    <>
                      <span className="text-pink-500 font-semibold">CNPJ:</span>
                      <span className="text-blue-900 font-bold">{cnpj}</span>
                    </>
                  )}
                  {phone && (
                    <>
                      <span className="text-pink-500 font-semibold">WhatsApp:</span>
                      <span className="text-blue-900 font-bold">{phone}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] btn-primary-simple py-4 flex items-center justify-center gap-2 text-lg shadow-lg shadow-pink-500/20"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Criar Minha Conta
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="text-pink-500 font-bold text-sm hover:underline block mx-auto"
          >
            Já tenho uma conta → Entrar
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </button>
        </div>

        <p className="text-center text-slate-400 text-xs mt-4">
          Sistema de Agendamento Inteligente
        </p>
      </div>
    </div>
  )
}
