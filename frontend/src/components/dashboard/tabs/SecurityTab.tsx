import { ShieldCheck, UserPlus, Users, CheckCircle2, Lock, Key, RefreshCw, Loader2, Shield, Pencil, Trash2, Calendar, DollarSign, Scissors, Gift, Briefcase } from 'lucide-react'

interface SecurityTabProps {
  securityPermissions: any[]
  loadingSecurity: boolean
  openNewSecurityModal: () => void
  fetchSecurityPermissions: () => void
  handleToggleSecurityActive: (perm: any) => void
  openEditSecurityModal: (perm: any) => void
  handleDeleteSecurityPermission: (id: number) => void
}

export function SecurityTab({
  securityPermissions,
  loadingSecurity,
  openNewSecurityModal,
  fetchSecurityPermissions,
  handleToggleSecurityActive,
  openEditSecurityModal,
  handleDeleteSecurityPermission,
}: SecurityTabProps) {
  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-violet-700 via-purple-700 to-pink-600 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-6 rounded-3xl border border-violet-400/30 dark:border-violet-500/30 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 dark:bg-gradient-to-tr dark:from-violet-600 dark:to-pink-500 flex items-center justify-center shadow-lg backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Segurança & Controle de Acessos (RBAC)</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-100 dark:text-violet-300">Proteção Defensiva & Permissões Granulares</span>
            </div>
          </div>
          <p className="text-xs text-white/95 dark:text-slate-100 max-w-2xl font-semibold leading-relaxed drop-shadow-sm">
            Gerencie o nível de privilégios de cada funcionário, recepcionista ou gerente do seu estabelecimento. Defina exatamente quais seções, relatórios financeiro e botões estarão visíveis para cada usuário.
          </p>
        </div>
        <button
          onClick={openNewSecurityModal}
          className="px-5 py-3 bg-white text-violet-700 hover:bg-slate-100 dark:bg-gradient-to-r dark:from-violet-600 dark:to-pink-600 dark:hover:from-violet-500 dark:hover:to-pink-500 dark:text-white font-black text-xs rounded-2xl uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Novo Operador / Perfil
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#131826]/60 border border-slate-200 dark:border-white/[0.08] p-5 rounded-2xl flex items-center justify-between shadow-md dark:shadow-none">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-400">Operadores Cadastrados</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{securityPermissions.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131826]/60 border border-slate-200 dark:border-white/[0.08] p-5 rounded-2xl flex items-center justify-between shadow-md dark:shadow-none">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-400">Status do Acesso</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{securityPermissions.filter(p => p.active).length} Ativos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131826]/60 border border-slate-200 dark:border-white/[0.08] p-5 rounded-2xl flex items-center justify-between shadow-md dark:shadow-none">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-400">Criptografia & Sessões</p>
            <p className="text-xs font-black text-violet-700 dark:text-violet-400 mt-1">JWT 256-bit & Fastify Shield</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Operator List Table / Grid */}
      <div className="bg-white dark:bg-[#131826]/60 border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-md dark:shadow-none">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Matriz de Privilégios por Operador
          </h3>
          <button
            onClick={() => fetchSecurityPermissions()}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Atualizar Tabela"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSecurity ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingSecurity ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Carregando operadores e privilégios...</p>
          </div>
        ) : securityPermissions.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <Shield className="w-12 h-12 text-slate-400 mx-auto opacity-40 animate-pulse" />
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-300">Nenhum operador configurado</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
              Cadastre gerentes, recepcionistas ou atendentes para restringir o acesso a módulos confidenciais como o Financeiro.
            </p>
            <button
              onClick={openNewSecurityModal}
              className="px-4 py-2.5 bg-violet-600 text-white font-black text-xs rounded-xl uppercase tracking-wider hover:bg-violet-700 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Criar Primeiro Perfil
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {securityPermissions.map(perm => (
              <div
                key={perm.id}
                className="p-5 bg-slate-50/80 dark:bg-[#0f131f]/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-3.5 transition-all hover:border-violet-500/40 shadow-xs"
              >
                {/* Top Row: User Info & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-gradient-to-tr dark:from-violet-600/20 dark:to-pink-500/20 text-violet-700 dark:text-violet-400 flex items-center justify-center font-black text-base border border-violet-300 dark:border-violet-500/20 shadow-xs">
                      {perm.userName[0]?.toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{perm.userName}</h4>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30">
                          {perm.roleTitle}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${perm.active ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30'}`}>
                          {perm.active ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </div>
                      {perm.email && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-0.5">{perm.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleSecurityActive(perm)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        perm.active
                          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-600 hover:text-white dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-600 hover:text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                      }`}
                    >
                      {perm.active ? 'Suspender' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => openEditSecurityModal(perm)}
                      className="p-2 bg-slate-200 text-slate-800 border border-slate-300 hover:bg-violet-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
                      title="Editar Permissões"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSecurityPermission(perm.id)}
                      className="p-2 bg-red-100 text-red-700 border border-red-300 hover:bg-red-600 hover:text-white dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 rounded-xl transition-all cursor-pointer"
                      title="Remover Perfil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Permissions Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 mr-1 tracking-wider">Módulos:</span>
                  {perm.canViewBookings && <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"><Calendar className="w-3 h-3 text-blue-500 dark:text-blue-400" /> Agenda</span>}
                  {perm.canViewFinance && <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"><DollarSign className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> Financeiro</span>}
                  {perm.canManageServices && <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"><Scissors className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Serviços</span>}
                  {perm.canViewClients && <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"><Users className="w-3 h-3 text-purple-500 dark:text-purple-400" /> Clientes</span>}
                  {perm.canManageLoyalty && <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-pink-100 text-pink-900 border border-pink-300 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30"><Gift className="w-3 h-3 text-pink-500 dark:text-pink-400" /> Fidelidade</span>}
                  {perm.canManageStaff && <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30"><Briefcase className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> RH</span>}
                  {perm.canManageSettings && <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-orange-100 text-orange-900 border border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30"><Pencil className="w-3 h-3 text-orange-500 dark:text-orange-400" /> Configurações</span>}
                  {perm.canViewAuditLogs && <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-red-100 text-red-900 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30"><Shield className="w-3 h-3 text-red-500 dark:text-red-400" /> Audit Logs</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
