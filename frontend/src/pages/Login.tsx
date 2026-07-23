import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { ArrowLeft, Lock, User, AlertCircle, Loader2, Sparkles, ArrowRight, Mail, KeyRound, CheckCircle2, X, Eye, EyeOff } from 'lucide-react'
import { BoraMarkaLogo } from '../components/BoraMarkaLogo'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Estados do Modal "Esqueceu a Senha"
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState<1 | 2>(1)
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')

  // Estados de visibilidade de senha
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const role = localStorage.getItem('role') || sessionStorage.getItem('role')
    if (token) {
      if (role === 'superadmin') {
        navigate('/superadmin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [navigate])

  // Forçar modo escuro na tela de login
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  // Check if account exists on mount
  useEffect(() => {
    api.checkAccount()
      .then(res => {
        if (!res.hasAccount) {
          navigate('/register', { replace: true })
        }
      })
      .catch(() => {
        // If check fails, show login anyway
      })
      .finally(() => setChecking(false))
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.login(username, password)
      
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('role')

      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem('token', res.token)
      storage.setItem('role', res.role || 'user')

      if (res.role === 'superadmin') {
        navigate('/superadmin')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar. Verifique seus dados.')
    } finally {
      setLoading(false)
    }
  }

  // Enviar solicitação de código por e-mail
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')

    if (!resetEmail.trim()) {
      setForgotError('Por favor, informe seu e-mail ou nome de usuário')
      return
    }

    setForgotLoading(true)
    try {
      const res = await api.forgotPassword(resetEmail)
      setForgotSuccess(res.message || 'Código enviado! Verifique seu e-mail.')
      setForgotStep(2)
    } catch (err: any) {
      setForgotError(err.message || 'Erro ao solicitar código. Tente novamente.')
    } finally {
      setForgotLoading(false)
    }
  }

  // Redefinir senha com o código recebido
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')

    if (!resetCode.trim()) {
      setForgotError('Informe o código de 6 dígitos enviado por e-mail')
      return
    }

    if (!newPassword) {
      setForgotError('Digite sua nova senha')
      return
    }

    if (newPassword.length < 6) {
      setForgotError('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('As senhas não conferem')
      return
    }

    setForgotLoading(true)
    try {
      const res = await api.resetPassword({
        email: resetEmail,
        code: resetCode,
        newPassword,
      })
      setForgotSuccess(res.message || 'Senha redefinida com sucesso!')
      
      // Preenche o campo de usuário com o email/username da recuperação
      if (resetEmail.trim() && !resetEmail.includes('@')) {
        setUsername(resetEmail.trim())
      }

      setTimeout(() => {
        closeForgotModal()
      }, 2500)
    } catch (err: any) {
      setForgotError(err.message || 'Erro ao redefinir a senha.')
    } finally {
      setForgotLoading(false)
    }
  }

  const closeForgotModal = () => {
    setShowForgotModal(false)
    setForgotStep(1)
    setResetEmail('')
    setResetCode('')
    setNewPassword('')
    setConfirmNewPassword('')
    setForgotError('')
    setForgotSuccess('')
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
      <div className="orb w-[600px] h-[600px] bg-violet-600/[0.07] top-[-150px] left-[-100px] blur-[160px]" />
      <div className="orb w-[400px] h-[400px] bg-pink-600/[0.05] bottom-[-100px] right-[-80px] blur-[140px]" style={{ animationDelay: '-7s' }} />

      <div className="w-full max-w-sm relative z-10 animate-slide-up">

        {/* Logo */}
        <div className="mb-10">
          <BoraMarkaLogo size="lg" showSlogan={true} />
        </div>

        {/* Form Card — Doppelrand */}
        <div className="doppelrand">
          <div className="doppelrand-inner p-7">
            <form onSubmit={handleSubmit} className="space-y-5">

              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/[0.06] border border-red-500/15 p-3 rounded-xl text-red-400 text-[12px] font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold uppercase text-white/25 tracking-[0.15em] block mb-2">Usuário</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu usuário"
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl pl-10 pr-4 py-3 text-[13px] text-white/80 font-medium focus:outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/15"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase text-white/25 tracking-[0.15em] block mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl pl-10 pr-10 py-3 text-[13px] text-white/80 font-medium focus:outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/10 bg-white/[0.03] accent-violet-500 cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-white/30">
                    Lembrar de mim
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(username)
                    setShowForgotModal(true)
                  }}
                  className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mag-btn group w-full py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-[13px] font-bold text-white shadow-lg shadow-violet-600/15 flex items-center justify-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Entrar
                    <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="text-center mt-8 space-y-4">
          <button
            onClick={() => navigate('/register')}
            className="text-violet-400 font-bold text-[12px] hover:text-violet-300 flex items-center justify-center gap-2 mx-auto transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ainda não tem conta? Cadastre-se agora
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="text-white/20 hover:text-white/50 text-[11px] font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para o início
          </button>
        </div>
      </div>

      {/* ═══ Modal Esqueceu a Senha ═══ */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md relative animate-slide-up max-h-[90dvh] overflow-y-auto custom-scrollbar rounded-[2rem]">
            <div className="doppelrand">
              <div className="doppelrand-inner p-5 sm:p-7 relative">
                
                {/* Close Button */}
                <button
                  onClick={closeForgotModal}
                  className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pr-8">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">Recuperação de Senha</h3>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {forgotStep === 1 ? 'Etapa 1: Envio do código' : 'Etapa 2: Redefinição da senha'}
                    </p>
                  </div>
                </div>

                {forgotError && (
                  <div className="flex items-center gap-2.5 bg-red-500/[0.06] border border-red-500/15 p-3 rounded-xl text-red-400 text-[12px] font-medium mb-5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="flex items-center gap-2.5 bg-emerald-500/[0.08] border border-emerald-500/20 p-3 rounded-xl text-emerald-400 text-[12px] font-medium mb-5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                {/* ETAPA 1 — Enviar Código */}
                {forgotStep === 1 && (
                  <form onSubmit={handleRequestCode} className="space-y-4">
                    <p className="text-[12px] text-white/60 leading-relaxed">
                      Informe o **e-mail** cadastrado na sua conta. Enviaremos um código de verificação de 6 dígitos.
                    </p>

                    <div>
                      <label className="text-[9px] font-bold uppercase text-white/25 tracking-[0.15em] block mb-2">E-mail ou Usuário</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          type="text"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="seu@email.com ou usuario"
                          required
                          className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl pl-10 pr-4 py-3.5 text-[14px] text-white/80 font-medium focus:outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/15"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeForgotModal}
                        className="flex-1 py-3.5 rounded-full border border-white/[0.06] text-white/50 text-[12px] font-bold hover:bg-white/[0.04] transition-colors min-h-[44px]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="flex-[2] py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-[12px] font-bold text-white shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                      >
                        {forgotLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Enviar Código por E-mail'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* ETAPA 2 — Digitar Código e Nova Senha */}
                {forgotStep === 2 && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <p className="text-[12px] text-white/60 leading-relaxed">
                      Digite o código de 6 dígitos que você recebeu e a sua nova senha.
                    </p>

                    <div>
                      <label className="text-[9px] font-bold uppercase text-white/25 tracking-[0.15em] block mb-2">Código de Verificação</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Ex: 123456"
                          maxLength={6}
                          required
                          className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl pl-10 pr-4 py-3.5 text-[15px] text-violet-300 font-bold tracking-widest focus:outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/15"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase text-white/25 tracking-[0.15em] block mb-2">Nova Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          required
                          className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl pl-10 pr-10 py-3 text-[13px] text-white/80 font-medium focus:outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/15"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase text-white/25 tracking-[0.15em] block mb-2">Confirmar Nova Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Digite a senha novamente"
                          required
                          className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl pl-10 pr-10 py-3 text-[13px] text-white/80 font-medium focus:outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/15"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="flex-1 py-3 rounded-full border border-white/[0.06] text-white/50 text-[12px] font-bold hover:bg-white/[0.04] transition-colors"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="flex-[2] py-3 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-[12px] font-bold text-white shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {forgotLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Redefinir Senha'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
