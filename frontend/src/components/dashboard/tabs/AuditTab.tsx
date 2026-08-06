import { ShieldAlert, RefreshCw, Search, Loader2, User, Laptop } from 'lucide-react'
import { formatDate } from '../../../utils/dashboardHelpers'

interface AuditTabProps {
  auditSearch: string
  setAuditSearch: (val: string) => void
  auditSeverityFilter: string
  setAuditSeverityFilter: (val: string) => void
  auditEntityFilter: string
  setAuditEntityFilter: (val: string) => void
  loadingAuditLogs: boolean
  auditLogs: any[]
  fetchAuditLogs: () => void
}

export function AuditTab({
  auditSearch,
  setAuditSearch,
  auditSeverityFilter,
  setAuditSeverityFilter,
  auditEntityFilter,
  setAuditEntityFilter,
  loadingAuditLogs,
  auditLogs,
  fetchAuditLogs,
}: AuditTabProps) {
  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-violet-500" />
            Logs & Auditoria de Atividades
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Rastreamento completo de alterações em serviços, cupons, colaboradores e endereço IP das máquinas
          </p>
        </div>
        <button
          onClick={() => fetchAuditLogs()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-white/40 dark:bg-[#131826]/30 border border-slate-200 dark:border-white/[0.06] rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={auditSearch}
            onChange={e => setAuditSearch(e.target.value)}
            placeholder="Filtrar por usuário, ação, dispositivo ou IP..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400">Severidade:</label>
            <select
              value={auditSeverityFilter}
              onChange={e => setAuditSeverityFilter(e.target.value)}
              className="bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold"
            >
              <option value="ALL">Todas Severidades</option>
              <option value="CRITICAL">Crítico</option>
              <option value="HIGH">Alto</option>
              <option value="MEDIUM">Médio</option>
              <option value="INFO">Informativo</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400">Categoria:</label>
            <select
              value={auditEntityFilter}
              onChange={e => setAuditEntityFilter(e.target.value)}
              className="bg-white dark:bg-[#0f131f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="SERVICE">Serviços</option>
              <option value="COUPON">Cupons</option>
              <option value="EMPLOYEE">Colaboradores (RH)</option>
              <option value="DOCUMENT">Documentos</option>
              <option value="AUTH">Login & Segurança</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      {loadingAuditLogs ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400">Carregando histórico de auditoria...</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="py-20 text-center bg-white/40 dark:bg-[#131826]/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
          <h4 className="text-slate-500 dark:text-slate-400 font-black uppercase text-sm">Nenhum registro de auditoria encontrado</h4>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            As ações realizadas na plataforma serão registradas aqui em tempo real.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {auditLogs.map((log: any) => {
            const severity = log.severity || 'INFO'
            const isCritical = severity === 'CRITICAL'
            const isHigh = severity === 'HIGH'
            const isMedium = severity === 'MEDIUM'

            return (
              <div
                key={log.id}
                className={`p-4 bg-white/80 dark:bg-[#131826]/60 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left shadow-sm transition-all ${
                  isCritical
                    ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                    : isHigh
                    ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                    : 'border-slate-200 dark:border-white/[0.06] hover:border-violet-500/30'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
                    isCritical
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-md shadow-red-500/10'
                      : isHigh
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isMedium
                      ? 'bg-violet-500/10 text-violet-500 border border-violet-500/20'
                      : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Severity Tag */}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isCritical
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse'
                          : isHigh
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : isMedium
                          ? 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                      }`}>
                        {isCritical ? 'CRÍTICO' : isHigh ? 'ALTO' : isMedium ? 'MÉDIO' : 'INFO'}
                      </span>

                      {/* Action Tag */}
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                        {log.action}
                      </span>

                      <span className="text-[10px] font-bold text-slate-400 ml-auto sm:ml-0">
                        {log.createdAt && log.createdAt.includes('T')
                          ? `${formatDate(log.createdAt.split('T')[0])} às ${log.createdAt.split('T')[1]?.substring(0, 5)}`
                          : log.createdAt || ''}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                      {log.details || 'Ação registrada no sistema'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold pt-1">
                      <span className="flex items-center gap-1 text-violet-500 font-bold">
                        <User className="w-3.5 h-3.5" />
                        {log.userName || 'Usuário'} ({log.userRole || 'user'})
                      </span>

                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                        <Laptop className="w-3.5 h-3.5 text-slate-400" />
                        {log.deviceInfo || 'Dispositivo Desconhecido'}
                      </span>

                      <span className={`flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        (log.ipAddress && (log.ipAddress.includes('Localhost') || log.ipAddress === '127.0.0.1'))
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        IP: {log.ipAddress || '127.0.0.1'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
