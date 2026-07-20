import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import {
  Store, User, Lock, Phone, FileText, MapPin, Clock,
  ChevronRight, ChevronLeft, Loader2, AlertCircle,
  Sparkles, Star, CheckCircle2, Image, Building2, X, ArrowLeft, Mail
} from 'lucide-react'
import { BoraMarkaLogo } from '../components/BoraMarkaLogo'

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
// Step indicator — dark theme
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isActive
                ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-600/20 scale-110'
                : isDone
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/[0.03] text-white/20 border border-white/[0.06]'
            }`}>
              {isDone ? <CheckCircle2 className="w-4 h-4" /> : step}
            </div>
            {step < totalSteps && (
              <div className={`w-6 h-0.5 rounded-full transition-all duration-500 ${
                isDone ? 'bg-emerald-500/30' : 'bg-white/[0.06]'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════
// Input field helper (dark)
// ════════════════════════════════════════════
const inputClass = "w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl px-4 py-3 text-[13px] text-white/80 font-medium focus:outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/15"
const inputIconClass = "w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl pl-10 pr-4 py-3 text-[13px] text-white/80 font-medium focus:outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/15"
const labelClass = "text-[9px] font-bold uppercase text-white/25 tracking-[0.15em] block mb-2"

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
    document.documentElement.classList.add('dark')
  }, [])

  // Step 1 — Credenciais
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
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
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        setPhotoUrl(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // ═══ Validation ═══
  const validateStep1 = (): string | null => {
    if (!username.trim()) return 'Digite um nome de usuário'
    if (username.trim().length < 3) return 'Usuário deve ter pelo menos 3 caracteres'
    if (!email.trim()) return 'Digite seu e-mail'
    if (!/\S+@\S+\.\S+/.test(email.trim())) return 'Digite um e-mail válido'
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
    if (step === 1) { const err = validateStep1(); if (err) { setError(err); return } }
    if (step === 2) { const err = validateStep2(); if (err) { setError(err); return } }
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
        email: email.trim().toLowerCase(),
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
      if (msg.includes('Já existe')) { navigate('/login', { replace: true }); return }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-[100dvh] bg-[#050507] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#050507] text-white flex items-center justify-center p-4 relative overflow-hidden grain">

      {/* Mesh Gradient Orbs */}
      <div className="orb w-[600px] h-[600px] bg-violet-600/[0.07] top-[-150px] right-[-100px] blur-[160px]" />
      <div className="orb w-[400px] h-[400px] bg-pink-600/[0.05] bottom-[-100px] left-[-80px] blur-[140px]" style={{ animationDelay: '-7s' }} />

      <div className="w-full max-w-lg relative z-10 animate-slide-up">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-3">
          <BoraMarkaLogo size="md" showText={false} />
          <div>
            <h1 className="text-xl font-extrabold text-white/90 leading-none tracking-tight">
              Bora<span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">Marka</span>
            </h1>
            <p className="text-[9px] text-violet-400 font-bold uppercase tracking-[0.2em] mt-1">
              {step === 1 && 'Crie sua conta • Sua agenda cheia'}
              {step === 2 && 'Dados do negócio • Sem complicação'}
              {step === 3 && 'Horários e descrição'}
            </p>
          </div>
        </div>

        <StepIndicator currentStep={step} totalSteps={3} />

        {/* Card — Doppelrand */}
        <div className="doppelrand">
          <div className="doppelrand-inner p-6 sm:p-7">

            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/[0.06] border border-red-500/15 p-3 rounded-xl text-red-400 text-[12px] font-medium mb-5 animate-slide-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ═══ STEP 1 — Credenciais ═══ */}
            {step === 1 && (
              <div className="space-y-5 animate-slide-up">
                <div>
                  <label className={labelClass}>Nome de Usuário</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                      placeholder="ex: joao.barbearia" className={inputIconClass} autoFocus />
                  </div>
                  <p className="text-[10px] text-white/15 mt-1.5 px-1 font-medium">Usado para entrar no sistema</p>
                </div>

                <div>
                  <label className={labelClass}>E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com" className={inputIconClass} />
                  </div>
                  <p className="text-[10px] text-white/15 mt-1.5 px-1 font-medium">Usado para enviar notificações e recuperação de senha</p>
                </div>

                <div>
                  <label className={labelClass}>Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres" className={inputIconClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Digite a senha novamente" className={inputIconClass} />
                  </div>
                </div>

                <button onClick={handleNext}
                  className="mag-btn group w-full py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-[13px] font-bold text-white shadow-lg shadow-violet-600/15 flex items-center justify-center gap-2 mt-1">
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ═══ STEP 2 — Dados do Negócio ═══ */}
            {step === 2 && (
              <div className="space-y-5 animate-slide-up">
                <div>
                  <label className={labelClass}>Nome do Negócio <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                      placeholder="Ex: Barbearia do João" className={inputIconClass} autoFocus />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Logo ou Foto <span className="text-white/10 normal-case tracking-normal">(opcional)</span></label>
                  <div className="flex items-center gap-4">
                    {photoUrl ? (
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/[0.06] shrink-0">
                        <img src={photoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                        <button onClick={() => setPhotoUrl('')}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-dashed border-white/[0.08] flex items-center justify-center shrink-0">
                        <Image className="w-5 h-5 text-white/15" />
                      </div>
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all font-bold text-white/40 cursor-pointer text-[12px] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      Selecionar Arquivo
                    </label>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>CNPJ <span className="text-white/10 normal-case tracking-normal">(opcional)</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="text" value={cnpj} onChange={e => setCnpj(maskCnpj(e.target.value))}
                      placeholder="00.000.000/0000-00" className={inputIconClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>WhatsApp <span className="text-white/10 normal-case tracking-normal">(opcional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="tel" value={phone} onChange={e => setPhone(maskPhone(e.target.value))}
                      placeholder="(00) 00000-0000" className={inputIconClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Endereço <span className="text-white/10 normal-case tracking-normal">(opcional)</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                      placeholder="Rua das Flores, 123 — Centro" className={inputIconClass} />
                  </div>
                </div>

                <div className="flex gap-3 mt-1">
                  <button onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-white/[0.06] rounded-full hover:bg-white/[0.03] transition-all font-bold text-white/40 text-[12px] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <ChevronLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button onClick={handleNext}
                    className="mag-btn flex-[2] py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-[13px] font-bold text-white shadow-lg shadow-violet-600/15 flex items-center justify-center gap-2">
                    Continuar <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══ STEP 3 — Horários e Descrição ═══ */}
            {step === 3 && (
              <div className="space-y-5 animate-slide-up">
                <div>
                  <label className={labelClass}>Descrição do Negócio <span className="text-white/10 normal-case tracking-normal">(opcional)</span></label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Conte um pouco sobre o seu negócio..."
                    rows={3}
                    className={`${inputClass} resize-none`} />
                </div>

                <div>
                  <label className={`${labelClass} mb-4`}>Horário de Funcionamento</label>
                  <div className="space-y-2">
                    {Object.entries(dayLabels).map(([key, label]) => (
                      <div key={key} className={`flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all duration-500 ${
                        hours[key].active
                          ? 'bg-white/[0.02] border-white/[0.06]'
                          : 'bg-white/[0.01] border-white/[0.03] opacity-50'
                      }`}>
                        <label className="flex items-center gap-2 cursor-pointer min-w-[90px]">
                          <input type="checkbox" checked={hours[key].active}
                            onChange={e => updateHours(key, 'active', e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-white/10 bg-white/[0.03] accent-violet-500 cursor-pointer" />
                          <span className={`text-[12px] font-bold ${hours[key].active ? 'text-white/70' : 'text-white/25'}`}>
                            {label}
                          </span>
                        </label>
                        {hours[key].active && (
                          <div className="flex items-center gap-2 ml-auto sm:ml-auto">
                            <input type="time" value={hours[key].open}
                              onChange={e => updateHours(key, 'open', e.target.value)}
                              className="text-[11px] bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-500/50 text-white/60 font-medium" />
                            <span className="text-white/15 text-[10px] font-bold">até</span>
                            <input type="time" value={hours[key].close}
                              onChange={e => updateHours(key, 'close', e.target.value)}
                              className="text-[11px] bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-500/50 text-white/60 font-medium" />
                          </div>
                        )}
                        {!hours[key].active && (
                          <span className="ml-auto text-[10px] font-bold text-white/15">Fechado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-violet-500/[0.04] border border-violet-500/10 rounded-2xl p-4">
                  <h4 className="text-[11px] font-bold text-violet-400 mb-2 uppercase tracking-[0.1em]">📋 Resumo</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-[12px]">
                    <span className="text-white/25 font-semibold">Usuário:</span>
                    <span className="text-white/70 font-bold">{username}</span>
                    <span className="text-white/25 font-semibold">E-mail:</span>
                    <span className="text-white/70 font-bold truncate">{email}</span>
                    <span className="text-white/25 font-semibold">Negócio:</span>
                    <span className="text-white/70 font-bold">{businessName}</span>
                    {cnpj && (
                      <>
                        <span className="text-white/25 font-semibold">CNPJ:</span>
                        <span className="text-white/70 font-bold">{cnpj}</span>
                      </>
                    )}
                    {phone && (
                      <>
                        <span className="text-white/25 font-semibold">WhatsApp:</span>
                        <span className="text-white/70 font-bold">{phone}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-1">
                  <button onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-white/[0.06] rounded-full hover:bg-white/[0.03] transition-all font-bold text-white/40 text-[12px] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <ChevronLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button onClick={handleSubmit} disabled={loading}
                    className="mag-btn flex-[2] py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-[13px] font-bold text-white shadow-lg shadow-violet-600/15 flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Criar Minha Conta
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-7 space-y-3">
          <button onClick={() => navigate('/login')}
            className="text-violet-400 font-bold text-[12px] hover:text-violet-300 block mx-auto transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
            Já tenho uma conta → Entrar
          </button>
          <button onClick={() => navigate('/')}
            className="text-white/20 hover:text-white/50 text-[11px] font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o início
          </button>
        </div>
      </div>
    </div>
  )
}
