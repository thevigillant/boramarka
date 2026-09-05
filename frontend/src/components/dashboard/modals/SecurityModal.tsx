import React from 'react'
import {
  X, ShieldCheck, Building2, Eye, EyeOff, Zap, Crown, Briefcase, User, DollarSign,
  Scissors, Calendar, Palette
} from 'lucide-react'

interface SecurityModalProps {
  showSecurityModal: boolean
  setShowSecurityModal: (val: boolean) => void
  editingSecurityPerm: any
  adminInfo: any
  securityForm: {
    userName: string
    email: string
    password: string
    roleTitle: string
    canAgendamentos: boolean
    canEstornos: boolean
    canClientes: boolean
    canHorarios: boolean
    canServicos: boolean
    canLinks: boolean
    canCupons: boolean
    canMemberships: boolean
    canFinanceiro: boolean
    canRh: boolean
    canFaturamento: boolean
    canSeguranca: boolean
    canPersonalizar: boolean
    canSocial: boolean
    canAudit: boolean
    canTrash: boolean
  }
  setSecurityForm: React.Dispatch<React.SetStateAction<any>>
  showOperatorPassword: boolean
  setShowOperatorPassword: (val: boolean) => void
  handleSaveSecurityPermission: (e: React.FormEvent) => void
  handleApplyRolePreset: (role: 'admin' | 'gerente' | 'recepcionista' | 'financeiro' | 'profissional') => void
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  showSecurityModal,
  setShowSecurityModal,
  editingSecurityPerm,
  adminInfo,
  securityForm,
  setSecurityForm,
  showOperatorPassword,
  setShowOperatorPassword,
  handleSaveSecurityPermission,
  handleApplyRolePreset
}) => {
  if (!showSecurityModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="bg-white dark:bg-[#131826] w-full max-w-2xl rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-200 dark:border-violet-500/30 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editingSecurityPerm ? 'Editar Perfil de Segurança' : 'Novo Operador / Perfil de Acesso'}
              </h3>
              <p className="text-xs text-violet-600 dark:text-violet-400 font-bold">Defina as permissões individuais do operador</p>
            </div>
          </div>
          <button onClick={() => setShowSecurityModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSaveSecurityPermission} className="space-y-6 text-left">
          {/* Indicador da Empresa / Conta Principal */}
          <div className="p-3.5 rounded-2xl bg-violet-50/80 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-200 dark:bg-violet-500/20 text-violet-800 dark:text-violet-400 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-400 block">Empresa / Conta Principal</span>
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  {adminInfo?.businessName || 'Minha Empresa'}
                  <span className="text-violet-800 dark:text-violet-300 font-bold bg-violet-100 dark:bg-violet-500/15 px-2.5 py-0.5 rounded-lg border border-violet-300 dark:border-violet-500/30 text-[11px]">
                    @{adminInfo?.username || 'empresa'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Profile Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">Nome do Operador / Usuário *</label>
              <input
                type="text"
                value={securityForm.userName}
                onChange={e => setSecurityForm({ ...securityForm, userName: e.target.value })}
                placeholder="Ex: Amanda Lima (Recepção)"
                className="input-simple font-bold text-xs"
                required
              />
              <div className="mt-1.5 p-2.5 rounded-xl bg-violet-50 dark:bg-white/[0.04] border border-violet-200 dark:border-white/[0.08] text-[11px] text-slate-800 dark:text-slate-300 font-medium">
                <span className="font-bold">Para entrar como colaborador:</span> Empresa: <code className="text-pink-600 dark:text-pink-400 font-bold">@{adminInfo?.username || 'empresa'}</code> + Operador: <code className="text-emerald-700 dark:text-emerald-400 font-bold">{securityForm.userName || 'usuario'}</code>
              </div>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">E-mail (opcional)</label>
              <input
                type="email"
                value={securityForm.email}
                onChange={e => setSecurityForm({ ...securityForm, email: e.target.value })}
                placeholder="Ex: amanda@empresa.com"
                className="input-simple font-bold text-xs"
              />
            </div>
          </div>

          {/* Password & Role Title Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">
                {editingSecurityPerm ? 'Alterar Senha de Acesso (opcional)' : 'Senha de Acesso do Operador *'}
              </label>
              <div className="relative">
                <input
                  type={showOperatorPassword ? 'text' : 'password'}
                  value={securityForm.password}
                  onChange={e => setSecurityForm({ ...securityForm, password: e.target.value })}
                  placeholder={editingSecurityPerm ? 'Deixe em branco para manter a atual' : 'Crie uma senha de acesso'}
                  className="input-simple font-bold text-xs pr-10"
                  required={!editingSecurityPerm}
                />
                <button
                  type="button"
                  onClick={() => setShowOperatorPassword(!showOperatorPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                  title={showOperatorPassword ? 'Ocultar Senha' : 'Exibir Senha'}
                >
                  {showOperatorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">Título da Função / Cargo *</label>
              <input
                type="text"
                value={securityForm.roleTitle}
                onChange={e => setSecurityForm({ ...securityForm, roleTitle: e.target.value })}
                placeholder="Ex: Recepcionista, Gerente, Barbeiro..."
                className="input-simple font-bold text-xs"
                required
              />
            </div>
          </div>

          {/* Quick Role Presets */}
          <div className="p-4 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-2xl space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-800 dark:text-violet-300 block flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Perfis Rápidos Pré-configurados (1-Clique)
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyRolePreset('admin')}
                className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" /> Gestor Principal
              </button>
              <button
                type="button"
                onClick={() => handleApplyRolePreset('gerente')}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" /> Gerente de Operação
              </button>
              <button
                type="button"
                onClick={() => handleApplyRolePreset('recepcionista')}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" /> Recepcionista
              </button>
              <button
                type="button"
                onClick={() => handleApplyRolePreset('financeiro')}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" /> Financeiro
              </button>
              <button
                type="button"
                onClick={() => handleApplyRolePreset('profissional')}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Scissors className="w-3.5 h-3.5" /> Profissional
              </button>
            </div>
          </div>

          {/* Toggles Matrix */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
              Matriz de Permissões Granulares (Módulos & Submenus)
            </h4>

            {/* Módulo Operacional */}
            <div className="space-y-2">
              <span className="text-xs font-black text-violet-700 dark:text-violet-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" /> Módulo: Operacional
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-violet-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Agendamentos</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Lista e confirmação de horários agendados</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canAgendamentos}
                    onChange={e => setSecurityForm({ ...securityForm, canAgendamentos: e.target.checked })}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-violet-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Solicitações de Estorno</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Gerenciar cancelamentos com reembolso</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canEstornos}
                    onChange={e => setSecurityForm({ ...securityForm, canEstornos: e.target.checked })}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-violet-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Clientes</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Base completa e histórico de clientes</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canClientes}
                    onChange={e => setSecurityForm({ ...securityForm, canClientes: e.target.checked })}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-violet-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Gerenciar Agenda</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Configuração da grade de horários</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canHorarios}
                    onChange={e => setSecurityForm({ ...securityForm, canHorarios: e.target.checked })}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Módulo Comercial */}
            <div className="space-y-2">
              <span className="text-xs font-black text-pink-700 dark:text-pink-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5" /> Módulo: Comercial
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Serviços</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Catálogo de serviços, preços e durações</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canServicos}
                    onChange={e => setSecurityForm({ ...securityForm, canServicos: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Links de Venda</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Links para clientes agendarem online</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canLinks}
                    onChange={e => setSecurityForm({ ...securityForm, canLinks: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Cupons de Desconto</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Crie códigos promocionais</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canCupons}
                    onChange={e => setSecurityForm({ ...securityForm, canCupons: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Clube de Assinaturas</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Planos e assinaturas recorrentes</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canMemberships}
                    onChange={e => setSecurityForm({ ...securityForm, canMemberships: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Módulo Gestão & Finanças */}
            <div className="space-y-2">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <DollarSign className="w-3.5 h-3.5" /> Módulo: Gestão & Finanças
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Financeiro</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Fluxo de caixa, recebíveis e despesas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canFinanceiro}
                    onChange={e => setSecurityForm({ ...securityForm, canFinanceiro: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">RH / Equipe</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Gestão de funcionários, funções e comissões</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canRh}
                    onChange={e => setSecurityForm({ ...securityForm, canRh: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Plano & Assinatura</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Gerenciar seu plano no BoraMarka</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canFaturamento}
                    onChange={e => setSecurityForm({ ...securityForm, canFaturamento: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Módulo Sistema & Ajustes */}
            <div className="space-y-2">
              <span className="text-xs font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Palette className="w-3.5 h-3.5" /> Módulo: Sistema & Ajustes
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Segurança & Permissões</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Controle granular de acesso por perfil</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canSeguranca}
                    onChange={e => setSecurityForm({ ...securityForm, canSeguranca: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Personalizar Página</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Identidade visual, tema e banner</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canPersonalizar}
                    onChange={e => setSecurityForm({ ...securityForm, canPersonalizar: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Explorar Rede</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Rede de contatos e chat</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canSocial}
                    onChange={e => setSecurityForm({ ...securityForm, canSocial: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Logs & Auditoria</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Registro de ações, logins e IP</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canAudit}
                    onChange={e => setSecurityForm({ ...securityForm, canAudit: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">Lixeira</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Recuperar itens excluídos recentemente</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.canTrash}
                    onChange={e => setSecurityForm({ ...securityForm, canTrash: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-violet-600/25 hover:opacity-95 text-xs uppercase tracking-wider cursor-pointer"
            >
              {editingSecurityPerm ? 'Salvar Alterações de Permissão' : 'Cadastrar Operador & Atribuir Regras'}
            </button>
            <button
              type="button"
              onClick={() => setShowSecurityModal(false)}
              className="px-5 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
