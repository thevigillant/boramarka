import { useState } from 'react'
import { Wallet, X, CheckCircle2, Key, CreditCard, RefreshCw } from 'lucide-react'
import { api } from '../../../services/api'

interface MpConfigModalProps {
  showMpConfigModal: boolean
  setShowMpConfigModal: (show: boolean) => void
  adminInfo: any
  setAdminInfo: (info: any) => void
  pixInputKey: string
  setPixInputKey: (key: string) => void
  mpInputToken: string
  setMpInputToken: (token: string) => void
  setShowMpTutorialModal: (show: boolean) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

export function MpConfigModal({
  showMpConfigModal,
  setShowMpConfigModal,
  adminInfo,
  setAdminInfo,
  pixInputKey,
  setPixInputKey,
  mpInputToken,
  setMpInputToken,
  setShowMpTutorialModal,
  showToast,
}: MpConfigModalProps) {
  const [showAdvancedMp, setShowAdvancedMp] = useState(false)
  const [savingMpToken, setSavingMpToken] = useState(false)

  if (!showMpConfigModal) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl relative animate-scale-in text-left space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Recebimento por PIX</h3>
              <p className="text-xs text-slate-400 font-medium">Informe onde cairão os pagamentos de sinal dos seus clientes</p>
            </div>
          </div>
          <button
            onClick={() => setShowMpConfigModal(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status Atual</span>
          {adminInfo?.pixKey || (adminInfo?.mpAccessToken && adminInfo.mpAccessToken !== 'SIMULADOR') ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" /> Pix Configurado & Ativo
            </span>
          ) : adminInfo?.mpAccessToken === 'SIMULADOR' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase tracking-wider">
              Modo Simulador
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase tracking-wider">
              Pendente
            </span>
          )}
        </div>

        {/* Simple Pix Key Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Sua Chave PIX (Telefone, CPF/CNPJ, E-mail ou Chave Aleatória)
            </label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <input
                type="text"
                value={pixInputKey}
                onChange={e => setPixInputKey(e.target.value)}
                placeholder="Ex: (11) 99999-9999, 123.456.789-00 ou contato@empresa.com"
                className="w-full input-simple font-bold text-xs pl-11 bg-slate-50 dark:bg-[#131826] border border-slate-200 dark:border-white/10 focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Seus clientes enviarão o sinal de agendamento diretamente para essa chave Pix.
            </p>
          </div>

          {/* Quick Actions / Advanced Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={async () => {
                setPixInputKey('SIMULADOR')
                setMpInputToken('SIMULADOR')
                try {
                  setSavingMpToken(true)
                  await api.updateProfile({ pixKey: 'SIMULADOR', mpAccessToken: 'SIMULADOR' })
                  setAdminInfo((prev: any) => prev ? { ...prev, pixKey: 'SIMULADOR', mpAccessToken: 'SIMULADOR' } : prev)
                  showToast('Modo Simulador de Testes ativado!')
                  setShowMpConfigModal(false)
                } catch (err: any) {
                  showToast(err.message || 'Erro ao salvar', 'error')
                } finally {
                  setSavingMpToken(false)
                }
              }}
              className="text-[11px] font-bold text-slate-500 hover:text-emerald-500 dark:text-slate-400 underline transition-colors cursor-pointer"
            >
              Ativar Modo de Testes sem chave real
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedMp(!showAdvancedMp)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{showAdvancedMp ? 'Ocultar Mercado Pago API' : 'Opção Avançada Mercado Pago'}</span>
            </button>
          </div>

          {/* Advanced Mercado Pago API Section */}
          {showAdvancedMp && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131826] border border-slate-200 dark:border-white/10 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Mercado Pago Access Token</span>
                <button
                  type="button"
                  onClick={() => setShowMpTutorialModal(true)}
                  className="text-[11px] text-[#009EE3] font-bold underline cursor-pointer"
                >
                  Como pegar chave em 30s
                </button>
              </div>
              <input
                type="password"
                value={mpInputToken}
                onChange={e => setMpInputToken(e.target.value)}
                placeholder="Cole aqui seu Access Token (APP_USR-...)"
                className="w-full input-simple font-bold text-xs bg-white dark:bg-[#182032] border border-slate-200 dark:border-white/10 focus:border-[#009EE3]"
              />
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowMpConfigModal(false)}
            className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={savingMpToken}
            onClick={async () => {
              try {
                setSavingMpToken(true)
                const cleanPixKey = pixInputKey.trim()
                const payload: any = {
                  pixKey: cleanPixKey,
                }
                if (mpInputToken.trim() && mpInputToken.trim() !== 'SIMULADOR') {
                  payload.mpAccessToken = mpInputToken.trim()
                } else if (cleanPixKey && cleanPixKey !== 'SIMULADOR') {
                  payload.mpAccessToken = ''
                }
                await api.updateProfile(payload)
                if (cleanPixKey && cleanPixKey !== 'SIMULADOR') {
                  await api.updateOrderSettings({ pixKey: cleanPixKey }).catch(() => {})
                }
                setAdminInfo((prev: any) => prev ? { ...prev, ...payload } : prev)
                showToast('Configuração de Recebimento por Pix salva!')
                setShowMpConfigModal(false)
              } catch (err: any) {
                showToast(err.message || 'Erro ao salvar', 'error')
              } finally {
                setSavingMpToken(false)
              }
            }}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-2"
          >
            {savingMpToken && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Salvar Chave Pix
          </button>
        </div>
      </div>
    </div>
  )
}
