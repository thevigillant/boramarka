import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import { ArrowLeft, Lock, User, AlertCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

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
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-violet-500/20">
            B
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white/90 leading-none tracking-tight">BoraMarka</h1>
            <p className="text-[9px] text-white/25 font-bold uppercase tracking-[0.2em] mt-1">
              Sistema de Agendamento
            </p>
          </div>
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-violet-500/50 rounded-xl pl-10 pr-4 py-3 text-[13px] text-white/80 font-medium focus:outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/15"
                  />
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
    </div>
  )
}
