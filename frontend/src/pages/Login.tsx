import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Lock, User, AlertCircle, Loader2, Store, Sparkles, Calendar } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

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
      localStorage.setItem('token', res.token)
      localStorage.setItem('role', res.role || 'user')
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-pink-500 shadow-xl shadow-pink-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">Bora Marka</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Seu Agendamento Simples
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="card-simple p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 p-3 rounded-xl text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário"
                  required
                  className="input-simple pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  className="input-simple pl-12"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-simple py-4 flex items-center justify-center gap-2 text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Entrar'}
            </button>
          </form>
        </div>

        <div className="text-center mt-8 space-y-4">
          <button
            onClick={() => navigate('/register')}
            className="text-pink-500 font-bold text-sm hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Ainda não tem conta? Cadastre-se agora
          </button>
          
          <p className="text-slate-400 text-xs">
            Sistema de Agendamento Simples
          </p>
        </div>
      </div>
    </div>
  )
}
