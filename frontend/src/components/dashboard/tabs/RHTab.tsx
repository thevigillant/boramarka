import { UserCheck, Sparkles, Plus, Users, DollarSign, AlertTriangle, Archive, FileText, Calendar, Bell, UserX, Search, Filter, Loader2, Paperclip, Phone, Link, Pencil, CheckCircle2, Clock, Trash2, RefreshCw } from 'lucide-react'
import { formatDate, formatCurrency } from '../../../utils/dashboardHelpers'
import { EmployeeData } from '../../../types/dashboard'
import { api } from '../../../services/api'

interface RHTabProps {
  subscription: any
  isMaster: boolean
  setActiveTab: (tab: any) => void
  setEditingEmployee: (emp: any) => void
  setEmployeeForm: (form: any) => void
  setEmployeeModalOpen: (open: boolean) => void
  employees: EmployeeData[]
  rhSubTab: string
  setRhSubTab: (subtab: any) => void
  rhPaystubs: any[]
  rhVacations: any[]
  rhProfileRequests: any[]
  rhAnnouncements: any[]
  rhSearch: string
  setRhSearch: (val: string) => void
  rhPendingStatusFilter: string
  setRhPendingStatusFilter: (val: string) => void
  rhPendingTypeFilter: string
  setRhPendingTypeFilter: (val: string) => void
  loadingEmployees: boolean
  openDocManager: (emp: EmployeeData) => void
  openEditEmployee: (emp: EmployeeData) => void
  openDismissModal: (emp: EmployeeData) => void
  handleResolvePending: (empId: number, resolved: boolean) => void
  handleArchiveEmployee: (empId: number) => void
  handleRestoreEmployee: (empId: number) => void
  handleDeleteEmployee: (empId: number) => void
  setPortalLinkModal: (modal: any) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  fetchEmployees: () => void
  fetchRhData: () => void
  setRhPaystubModalOpen: (open: boolean) => void
  setRhAnnouncementModalOpen: (open: boolean) => void
}

export function RHTab({
  subscription,
  isMaster,
  setActiveTab,
  setEditingEmployee,
  setEmployeeForm,
  setEmployeeModalOpen,
  employees,
  rhSubTab,
  setRhSubTab,
  rhPaystubs,
  rhVacations,
  rhProfileRequests,
  rhAnnouncements,
  rhSearch,
  setRhSearch,
  rhPendingStatusFilter,
  setRhPendingStatusFilter,
  rhPendingTypeFilter,
  setRhPendingTypeFilter,
  loadingEmployees,
  openDocManager,
  openEditEmployee,
  openDismissModal,
  handleResolvePending,
  handleArchiveEmployee,
  handleRestoreEmployee,
  handleDeleteEmployee,
  setPortalLinkModal,
  showToast,
  fetchEmployees,
  fetchRhData,
  setRhPaystubModalOpen,
  setRhAnnouncementModalOpen,
}: RHTabProps) {
  return (
    <div className="animate-slide-up space-y-6">
      {subscription && subscription.status === 'inactive' && !isMaster ? (
        <div className="max-w-md mx-auto text-center py-16 px-6 bg-white/80 dark:bg-[#131826]/40 border border-slate-200 dark:border-white/[0.06] rounded-3xl backdrop-blur-xl shadow-2xl space-y-6 text-slate-900 dark:text-slate-100">
          <div className="w-16 h-16 bg-violet-500/20 text-violet-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-violet-500/30">
            <UserCheck className="w-8 h-8 text-violet-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Gestão de RH Inativa</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold leading-relaxed">
            A Gestão de RH e Colaboradores é uma funcionalidade exclusiva do <strong>Plano Premium</strong> (R$ 79,90/mês). 
            Organize sua equipe, controle arquivos, gerencie demissões e controle pendências!
          </p>
          <button
            onClick={() => setActiveTab('faturamento')}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 animate-spin-slow" />
            Fazer Upgrade para o Plano Premium
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Title & Action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-violet-500" />
                Gestão de Recursos Humanos (RH)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Controle completo de colaboradores, arquivos, desligamentos e pendências</p>
            </div>
            <button
              onClick={() => {
                setEditingEmployee(null)
                setEmployeeForm({
                  name: '', role: '', phone: '', email: '',
                  cpf: '', rg: '', birthDate: '',
                  admissionDate: new Date().toISOString().split('T')[0],
                  salary: '', commission: '', workingHours: ''
                })
                setEmployeeModalOpen(true)
              }}
              className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-md shadow-indigo-500/10 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" /> Cadastrar Colaborador
            </button>
          </div>

          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-simple p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Equipe Ativa</span>
                <Users className="w-4 h-4 text-violet-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {employees.filter(e => e.status === 'ACTIVE' || !e.status).length}
              </p>
              <span className="text-[10px] text-slate-400 font-bold">Colaboradores trabalhando</span>
            </div>

            <div className="card-simple p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Folha Salarial Base</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(employees.filter(e => e.status === 'ACTIVE' || !e.status).reduce((acc, c) => acc + (c.salary || 0), 0))}
              </p>
              <span className="text-[10px] text-slate-400 font-bold">Total salários bases ativos</span>
            </div>

            <div className={`card-simple p-5 border-2 ${
              employees.filter(e => e.status === 'DISMISSED' && !e.pendingResolved).length > 0 
                ? 'border-amber-500/40 bg-amber-500/5' 
                : 'border-transparent'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Pendências Demissionais</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {employees.filter(e => e.status === 'DISMISSED' && !e.pendingResolved).length}
              </p>
              <span className="text-[10px] text-amber-400 font-bold">Ex-funcionários pendentes</span>
            </div>

            <div className="card-simple p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Arquivo Morto</span>
                <Archive className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {employees.filter(e => e.status === 'ARCHIVED').length}
              </p>
              <span className="text-[10px] text-slate-400 font-bold">Registros arquivados</span>
            </div>
          </div>

          {/* Sub-Tab Navigation Bar & Search Filters */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white/40 dark:bg-[#131826]/30 p-2 rounded-3xl border border-slate-200 dark:border-white/[0.06]">
            {/* Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setRhSubTab('ACTIVE')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                  rhSubTab === 'ACTIVE'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Equipe Ativa
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-bold">
                  {employees.filter(e => e.status === 'ACTIVE' || !e.status).length}
                </span>
              </button>

              <button
                onClick={() => setRhSubTab('HOLERITES')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                  rhSubTab === 'HOLERITES'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Holerites & Assinaturas
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-bold">
                  {rhPaystubs.length}
                </span>
              </button>

              <button
                onClick={() => setRhSubTab('VACATIONS')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                  rhSubTab === 'VACATIONS'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Férias & Licenças
                {rhVacations.filter((v: any) => v.status === 'PENDING').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-red-600 text-white font-bold animate-pulse">
                    {rhVacations.filter((v: any) => v.status === 'PENDING').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setRhSubTab('ANNOUNCEMENTS')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                  rhSubTab === 'ANNOUNCEMENTS'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                Comunicados
              </button>

              <button
                onClick={() => setRhSubTab('PROFILE_REQ')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                  rhSubTab === 'PROFILE_REQ'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Alterações Cadastrais
                {rhProfileRequests.filter((r: any) => r.status === 'PENDING').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-red-600 text-white font-bold animate-pulse">
                    {rhProfileRequests.filter((r: any) => r.status === 'PENDING').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setRhSubTab('DISMISSED')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 relative ${
                  rhSubTab === 'DISMISSED'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                Demitidos & Pendências
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  employees.filter(e => e.status === 'DISMISSED' && !e.pendingResolved).length > 0
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-white/20 text-white'
                }`}>
                  {employees.filter(e => e.status === 'DISMISSED').length}
                </span>
              </button>

              <button
                onClick={() => setRhSubTab('ARCHIVED')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                  rhSubTab === 'ARCHIVED'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                Arquivo Morto
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-bold">
                  {employees.filter(e => e.status === 'ARCHIVED').length}
                </span>
              </button>
            </div>

            {/* Search input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={rhSearch}
                  onChange={e => setRhSearch(e.target.value)}
                  placeholder="Buscar por nome, cargo, CPF..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Specific Filters for DISMISSED Tab */}
          {rhSubTab === 'DISMISSED' && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-wrap items-center gap-4 text-xs font-bold">
              <span className="text-amber-500 flex items-center gap-1.5 uppercase text-[10px] tracking-wider font-black">
                <Filter className="w-3.5 h-3.5" /> Filtrar Pendências:
              </span>

              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-[10px] uppercase">Status da Pendência:</label>
                <select
                  value={rhPendingStatusFilter}
                  onChange={e => setRhPendingStatusFilter(e.target.value)}
                  className="bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl font-bold"
                >
                  <option value="ALL">Todas (Abertas e Resolvidas)</option>
                  <option value="PENDING">Apenas Pendentes (Abertas)</option>
                  <option value="RESOLVED">Apenas Resolvidas</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-[10px] uppercase">Tipo de Pendência:</label>
                <select
                  value={rhPendingTypeFilter}
                  onChange={e => setRhPendingTypeFilter(e.target.value)}
                  className="bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl font-bold"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="RESCISAO">Pagamento de Rescisão</option>
                  <option value="EQUIPAMENTO">Devolução de Chaves / Equipamentos</option>
                  <option value="EXAME_DEMISSIONAL">Exame Demissional</option>
                  <option value="DOCUMENTACAO">Assinatura de Documentação / Carteira</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
            </div>
          )}

          {/* Employees Cards Container */}
          {loadingEmployees ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              <p className="text-xs font-bold text-slate-400">Carregando colaboradores...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees
                .filter(emp => {
                  if (rhSubTab === 'ACTIVE') return emp.status === 'ACTIVE' || !emp.status;
                  if (rhSubTab === 'DISMISSED') return emp.status === 'DISMISSED';
                  if (rhSubTab === 'ARCHIVED') return emp.status === 'ARCHIVED';
                  return true;
                })
                .filter(emp => {
                  if (!rhSearch.trim()) return true;
                  const query = rhSearch.toLowerCase();
                  return (
                    emp.name.toLowerCase().includes(query) ||
                    emp.role.toLowerCase().includes(query) ||
                    (emp.cpf && emp.cpf.includes(query)) ||
                    (emp.phone && emp.phone.includes(query))
                  );
                })
                .filter(emp => {
                  if (rhSubTab !== 'DISMISSED') return true;
                  if (rhPendingStatusFilter === 'PENDING') return !emp.pendingResolved;
                  if (rhPendingStatusFilter === 'RESOLVED') return emp.pendingResolved;
                  return true;
                })
                .filter(emp => {
                  if (rhSubTab !== 'DISMISSED') return true;
                  if (rhPendingTypeFilter === 'ALL') return true;
                  return emp.pendingType === rhPendingTypeFilter;
                })
                .map(emp => (
                  <div key={emp.id} className={`card-simple p-6 flex flex-col justify-between relative overflow-hidden group border-2 ${
                    rhSubTab === 'DISMISSED' && !emp.pendingResolved
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : rhSubTab === 'ARCHIVED'
                      ? 'opacity-75 bg-slate-900/40 border-slate-800'
                      : 'border-transparent'
                  }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/10 dark:group-hover:bg-violet-500/20 transition-all duration-500" />
                    
                    <div className="relative space-y-4">
                      {/* Card Header: Avatar & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-md ${
                            rhSubTab === 'DISMISSED'
                              ? 'bg-gradient-to-br from-amber-500 to-red-500'
                              : rhSubTab === 'ARCHIVED'
                              ? 'bg-slate-700'
                              : 'bg-gradient-to-br from-violet-500 to-indigo-500'
                          }`}>
                            {emp.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">{emp.name}</h3>
                            <span className="inline-block mt-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                              {emp.role}
                            </span>
                          </div>
                        </div>

                        {/* Document counter badge */}
                        <button
                          onClick={() => openDocManager(emp)}
                          className="flex items-center gap-1 text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl hover:bg-violet-500 hover:text-white transition-all"
                          title="Ver Arquivos & Documentos"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{emp.documents?.length || 0}</span>
                        </button>
                      </div>

                      {/* Dismissed Status Box */}
                      {rhSubTab === 'DISMISSED' && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1 text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Demissão em {emp.dismissalDate || formatDate(emp.createdAt.split('T')[0])}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              emp.pendingResolved
                                ? 'bg-emerald-500 text-white'
                                : 'bg-red-500 text-white animate-pulse'
                            }`}>
                              {emp.pendingResolved ? 'Pendência Resolvida' : 'Pendência Aberta'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Motivo: {emp.dismissalReason}</p>
                          {emp.pendingType && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                              <strong>Pendência:</strong> {emp.pendingType} {emp.pendingNotes && `— ${emp.pendingNotes}`}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Archived Status Box */}
                      {rhSubTab === 'ARCHIVED' && (
                        <div className="p-2.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-left">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Registro no Arquivo Morto</span>
                        </div>
                      )}

                      {/* Details List */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.05] text-xs font-semibold text-slate-600 dark:text-slate-350 text-left">
                        {emp.cpf && (
                          <p className="text-[11px]">
                            <span className="text-slate-400 font-bold">CPF:</span> {emp.cpf}
                          </p>
                        )}
                        {emp.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{emp.phone}</span>
                          </p>
                        )}
                        {emp.email && (
                          <p className="flex items-center gap-2">
                            <span className="text-slate-400 font-bold">@</span>
                            <span className="truncate">{emp.email}</span>
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-dashed border-slate-100 dark:border-white/[0.05]">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">Salário Base</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(emp.salary)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">Comissão</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">{emp.commission}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 mt-6 relative z-10">
                      <button
                        onClick={() => openDocManager(emp)}
                        className="w-full flex items-center justify-center gap-2 bg-violet-500/10 hover:bg-violet-500 hover:text-white text-violet-500 font-black py-2.5 rounded-xl transition-all text-xs border border-violet-500/20"
                      >
                        <Paperclip className="w-3.5 h-3.5" /> Arquivos & Documentos ({emp.documents?.length || 0})
                      </button>

                      <div className="flex gap-2">
                        {rhSubTab === 'ACTIVE' && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await api.generateEmployeePortalLink(emp.id);
                                  const fullLink = `${window.location.origin}/portal?token=${res.token}`;
                                  setPortalLinkModal({ open: true, link: fullLink, name: emp.name });
                                } catch (err: any) {
                                  showToast(err.message || 'Erro ao gerar link', 'error');
                                }
                              }}
                              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black py-2 rounded-xl text-xs hover:opacity-95 shadow-sm mb-2"
                            >
                              <Link className="w-3.5 h-3.5" /> Portal & Senha
                            </button>

                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => openEditEmployee(emp)}
                                className="flex-1 flex items-center justify-center gap-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 font-black py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all text-xs"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                onClick={() => openDismissModal(emp)}
                                className="flex-1 flex items-center justify-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white font-black py-2 rounded-xl transition-all text-xs"
                                title="Demitir Colaborador"
                              >
                                <UserX className="w-3.5 h-3.5" /> Demitir
                              </button>
                            </div>
                          </>
                        )}

                        {rhSubTab === 'DISMISSED' && (
                          <>
                            {!emp.pendingResolved ? (
                              <button
                                onClick={() => handleResolvePending(emp.id, true)}
                                className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 text-white font-black py-2 rounded-xl hover:bg-emerald-600 transition-all text-xs shadow-md"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Resolver Pendência
                              </button>
                            ) : (
                              <button
                                onClick={() => handleArchiveEmployee(emp.id)}
                                className="flex-1 flex items-center justify-center gap-1 bg-slate-800 text-slate-200 font-black py-2 rounded-xl hover:bg-slate-700 transition-all text-xs"
                              >
                                <Archive className="w-3.5 h-3.5" /> Arquivo Morto
                              </button>
                            )}
                            <button
                              onClick={() => handleRestoreEmployee(emp.id)}
                              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl transition-all text-xs font-bold"
                              title="Reativar Colaborador na Equipe"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {rhSubTab === 'ARCHIVED' && (
                          <>
                            <button
                              onClick={() => handleRestoreEmployee(emp.id)}
                              className="flex-1 flex items-center justify-center gap-1 bg-violet-600 text-white font-black py-2 rounded-xl hover:bg-violet-700 transition-all text-xs"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Reativar Equipe
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                              title="Excluir Definitivamente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {employees
                .filter(emp => {
                  if (rhSubTab === 'ACTIVE') return emp.status === 'ACTIVE' || !emp.status;
                  if (rhSubTab === 'DISMISSED') return emp.status === 'DISMISSED';
                  if (rhSubTab === 'ARCHIVED') return emp.status === 'ARCHIVED';
                  return true;
                })
                .length === 0 && (
                <div className="col-span-full py-20 text-center bg-white/40 dark:bg-[#131826]/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <UserCheck className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4 opacity-40 animate-pulse" />
                  <h4 className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-sm">
                    Nenhum colaborador nesta categoria
                  </h4>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1 max-w-xs mx-auto">
                    {rhSubTab === 'ACTIVE' && 'Cadastre membros da sua equipe ativa.'}
                    {rhSubTab === 'DISMISSED' && 'Nenhum funcionário demitido ou com pendências registradas.'}
                    {rhSubTab === 'ARCHIVED' && 'Nenhum colaborador arquivado no histórico.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB: HOLERITES & ASSINATURAS */}
          {rhSubTab === 'HOLERITES' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/40 dark:bg-[#131826]/30 p-4 rounded-3xl border border-slate-200 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" /> Gestão de Holerites Mensais
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">Publique holerites para os colaboradores e acompanhe a assinatura eletrônica em tempo real</p>
                </div>
                <button
                  onClick={() => setRhPaystubModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" /> Lançar Holerite
                </button>
              </div>

              {rhPaystubs.length === 0 ? (
                <div className="p-12 text-center bg-white/40 dark:bg-[#131826]/20 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 text-xs font-semibold">
                  Nenhum holerite lançado no sistema até o momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rhPaystubs.map((stub: any) => (
                    <div key={stub.id} className="card-simple p-5 space-y-3 border-2 border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                            {stub.employee?.name || 'Funcionário'}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">Mês Ref: {stub.referenceMonth}</h4>
                        </div>
                        {stub.signed ? (
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Assinado
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black rounded-lg flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Salário Líquido</span>
                          <span className="text-xs font-black text-emerald-500">R$ {stub.netSalary?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Descontos</span>
                          <span className="text-xs font-black text-red-500">R$ {stub.discounts?.toFixed(2)}</span>
                        </div>
                      </div>

                      {stub.signed && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          Assinado em: {new Date(stub.signedAt).toLocaleString('pt-BR')} (IP: {stub.signatureIp})
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={async () => {
                            if (window.confirm('Excluir este holerite?')) {
                              await api.deleteEmployeePaystub(stub.id);
                              showToast('Holerite excluído com sucesso!');
                              fetchRhData();
                            }
                          }}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBTAB: FÉRIAS & LICENÇAS */}
          {rhSubTab === 'VACATIONS' && (
            <div className="space-y-6">
              <div className="bg-white/40 dark:bg-[#131826]/30 p-4 rounded-3xl border border-slate-200 dark:border-white/[0.06]">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" /> Solicitações de Férias & Licenças
                </h3>
                <p className="text-xs text-slate-400 font-semibold">Análise e aprove solicitações enviadas pelos colaboradores no Portal do Funcionário</p>
              </div>

              {rhVacations.length === 0 ? (
                <div className="p-12 text-center bg-white/40 dark:bg-[#131826]/20 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 text-xs font-semibold">
                  Nenhuma solicitação de férias ou licença registrada.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rhVacations.map((v: any) => (
                    <div key={v.id} className="card-simple p-5 space-y-3 border-2 border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">
                            {v.employee?.name || 'Funcionário'}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {v.type === 'VACATION' ? 'Férias Regulamentares' : 'Afastamento'} ({v.daysCount} dias)
                          </h4>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                            v.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : v.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {v.status === 'APPROVED' ? 'Aprovado' : v.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Período: {v.startDate} até {v.endDate}
                      </p>
                      {v.reason && <p className="text-xs text-slate-400">Motivo: {v.reason}</p>}

                      {v.status === 'PENDING' && (
                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={async () => {
                              await api.updateEmployeeVacationStatus(v.id, 'APPROVED');
                              showToast('Solicitação de férias aprovada!');
                              fetchRhData();
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-md"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprovar
                          </button>
                          <button
                            onClick={async () => {
                              const reason = window.prompt('Motivo da recusa (opcional):');
                              await api.updateEmployeeVacationStatus(v.id, 'REJECTED', reason || undefined);
                              showToast('Solicitação rejeitada.');
                              fetchRhData();
                            }}
                            className="flex-1 py-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 border border-red-500/20"
                          >
                            <UserX className="w-4 h-4" /> Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBTAB: COMUNICADOS */}
          {rhSubTab === 'ANNOUNCEMENTS' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/40 dark:bg-[#131826]/30 p-4 rounded-3xl border border-slate-200 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-500" /> Mural de Comunicados
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">Publique avisos e comunicados no Portal do Funcionário</p>
                </div>
                <button
                  onClick={() => setRhAnnouncementModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" /> Novo Comunicado
                </button>
              </div>

              {rhAnnouncements.length === 0 ? (
                <div className="p-12 text-center bg-white/40 dark:bg-[#131826]/20 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 text-xs font-semibold">
                  Nenhum comunicado publicado no mural.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rhAnnouncements.map((item: any) => (
                    <div key={item.id} className="card-simple p-5 space-y-3 border-2 border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-violet-500/10 text-violet-500 text-[10px] font-black rounded-lg">
                          {item.priority || 'GERAL'}
                        </span>
                        <button
                          onClick={async () => {
                            if (window.confirm('Excluir comunicado?')) {
                              await api.deleteEmployeeAnnouncement(item.id);
                              showToast('Comunicado removido.');
                              fetchRhData();
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-slate-400 whitespace-pre-line">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBTAB: ALTERAÇÕES CADASTRAIS */}
          {rhSubTab === 'PROFILE_REQ' && (
            <div className="space-y-6">
              <div className="bg-white/40 dark:bg-[#131826]/30 p-4 rounded-3xl border border-slate-200 dark:border-white/[0.06]">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-500" /> Atualizações Cadastrais Solicitadas
                </h3>
                <p className="text-xs text-slate-400 font-semibold">Aprove ou rejeite alterações de telefone, e-mail e endereço solicitadas pelos funcionários</p>
              </div>

              {rhProfileRequests.length === 0 ? (
                <div className="p-12 text-center bg-white/40 dark:bg-[#131826]/20 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 text-xs font-semibold">
                  Nenhuma solicitação de alteração cadastral pendente.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rhProfileRequests.map((req: any) => (
                    <div key={req.id} className="card-simple p-5 space-y-3 border-2 border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{req.employee?.name || 'Funcionário'}</h4>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : req.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {req.status === 'APPROVED' ? 'Aprovado' : req.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {req.phone && <p><strong>Novo Telefone:</strong> {req.phone}</p>}
                        {req.email && <p><strong>Novo E-mail:</strong> {req.email}</p>}
                        {req.address && <p><strong>Novo Endereço:</strong> {req.address}</p>}
                      </div>

                      {req.status === 'PENDING' && (
                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={async () => {
                              await api.updateEmployeeProfileRequest(req.id, 'APPROVED');
                              showToast('Dados atualizados com sucesso no cadastro!');
                              fetchEmployees();
                              fetchRhData();
                            }}
                            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-md"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprovar & Atualizar
                          </button>
                          <button
                            onClick={async () => {
                              await api.updateEmployeeProfileRequest(req.id, 'REJECTED');
                              showToast('Solicitação rejeitada.');
                              fetchRhData();
                            }}
                            className="flex-1 py-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 border border-red-500/20"
                          >
                            <UserX className="w-4 h-4" /> Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
