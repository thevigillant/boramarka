import React from 'react'
import {
  X, User, Mail, Store, Briefcase, Phone, MapPin, Clock, Loader2
} from 'lucide-react'

interface EditProfileModalProps {
  showEditProfile: boolean
  setShowEditProfile: (val: boolean) => void
  profileForm: {
    username: string
    email?: string
    businessName: string
    cnpj?: string
    phone?: string
    address?: string
    description?: string
    operatingHours?: string
  }
  setProfileForm: React.Dispatch<React.SetStateAction<any>>
  handleEditProfileSubmit: (e: React.FormEvent) => void
  dayLabels: Record<string, string>
  updateProfileHours: (dayKey: string, field: 'open' | 'close' | 'active', value: any) => void
  waStatus?: { isConfigured?: boolean; details?: string } | null
  waTestPhone?: string
  setWaTestPhone?: (val: string) => void
  handleTestWhatsAppSend?: () => void
  waTestLoading?: boolean
  waTestResult?: { success: boolean; method?: string; error?: string } | null
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  showEditProfile,
  setShowEditProfile,
  profileForm,
  setProfileForm,
  handleEditProfileSubmit,
  dayLabels,
  updateProfileHours,
  waStatus,
  waTestPhone,
  setWaTestPhone,
  handleTestWhatsAppSend,
  waTestLoading,
  waTestResult
}) => {
  if (!showEditProfile) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEditProfile(false)}></div>
      <div className="bg-white dark:bg-[#1A2235] rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Editar Perfil</h3>
          <button onClick={() => setShowEditProfile(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleEditProfileSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Login / @ Usuário</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={profileForm.username}
                onChange={e => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase() })}
                placeholder="Seu @ de login"
                className="input-simple font-bold text-sm pl-12"
                required
              />
            </div>
            <p className="text-[10px] text-orange-500 font-bold mt-1.5 px-1 leading-tight">
              Atenção: mudar o @ altera seu link de agendamento e login de acesso ao painel.
            </p>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">E-mail para Notificações e Recuperação de Senha</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={profileForm.email || ''}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="seu@email.com"
                className="input-simple font-bold text-sm pl-12"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Nome do Negócio</label>
            <div className="relative">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={profileForm.businessName}
                onChange={e => setProfileForm({ ...profileForm, businessName: e.target.value })}
                placeholder="Ex: Barber Shop"
                className="input-simple font-bold text-sm pl-12"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">CNPJ</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={profileForm.cnpj}
                  onChange={e => setProfileForm({ ...profileForm, cnpj: e.target.value })}
                  placeholder="CNPJ (opcional)"
                  className="input-simple font-bold text-sm pl-12"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="Ex: (11) 99999-9999"
                  className="input-simple font-bold text-sm pl-12"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp API Real Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Integração WhatsApp API Real</h4>
                  <p className="text-[10px] font-bold text-slate-400">Notificações automáticas de agendamento & lembretes</p>
                </div>
              </div>
              {waStatus && (
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  waStatus.isConfigured
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                }`}>
                  {waStatus.isConfigured ? `${waStatus.details}` : 'Modo wa.me'}
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Testar Envio Real de Mensagem WhatsApp
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={waTestPhone || ''}
                  onChange={e => setWaTestPhone && setWaTestPhone(e.target.value)}
                  placeholder="DDD + Telefone (ex: 11999999999)"
                  className="input-simple text-xs py-2 px-3 flex-1 bg-white dark:bg-[#131826]"
                />
                <button
                  type="button"
                  onClick={handleTestWhatsAppSend}
                  disabled={waTestLoading}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {waTestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Testar Envio'}
                </button>
              </div>
              {waTestResult && (
                <div className={`p-2.5 rounded-xl text-xs font-bold border ${
                  waTestResult.success
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                }`}>
                  {waTestResult.success ? (
                    <span>
                      {waTestResult.method === 'meta' && 'Mensagem enviada via Meta Cloud API Oficial!'}
                      {waTestResult.method === 'gateway' && 'Mensagem enviada via Gateway HTTP!'}
                      {waTestResult.method === 'link' && 'Link wa.me gerado (Modo Fallback sem credenciais API).'}
                    </span>
                  ) : (
                    <span>Erro: {waTestResult.error || 'Falha no disparo'}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Endereço</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="Seu endereço físico (opcional)"
                className="input-simple font-bold text-sm pl-12"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Descrição / Bio</label>
            <textarea
              value={profileForm.description}
              onChange={e => setProfileForm({ ...profileForm, description: e.target.value })}
              placeholder="Fale um pouco sobre o seu negócio..."
              className="input-simple font-bold text-sm resize-none h-24"
            ></textarea>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">
              <Clock className="w-4 h-4" />
              Horário de Funcionamento
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(dayLabels).map(([key, label]) => {
                let hoursObj: any = {}
                try { hoursObj = JSON.parse(profileForm.operatingHours || '{}') } catch {}
                const dayData = hoursObj[key] || { open: '', close: '', active: false }

                return (
                  <div key={key} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all ${
                    dayData.active
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      : 'bg-transparent border-slate-100 dark:border-slate-800 opacity-60'
                  }`}>
                    <label className="flex items-center gap-2 cursor-pointer min-w-[100px]">
                      <input
                        type="checkbox"
                        checked={dayData.active}
                        onChange={e => updateProfileHours(key, 'active', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                      />
                      <span className={`text-sm font-bold ${dayData.active ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                        {label}
                      </span>
                    </label>
                    {dayData.active ? (
                      <div className="flex items-center gap-2 ml-0 sm:ml-auto">
                        <input
                          type="time"
                          value={dayData.open}
                          onChange={e => updateProfileHours(key, 'open', e.target.value)}
                          className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-pink-500 bg-white dark:bg-[#131826]"
                        />
                        <span className="text-slate-400 text-[10px] font-bold">até</span>
                        <input
                          type="time"
                          value={dayData.close}
                          onChange={e => updateProfileHours(key, 'close', e.target.value)}
                          className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-pink-500 bg-white dark:bg-[#131826]"
                        />
                      </div>
                    ) : (
                      <span className="ml-0 sm:ml-auto text-xs font-bold text-slate-400">Fechado</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-lg transition-all shadow-xl shadow-pink-500/20 mt-4">
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  )
}
