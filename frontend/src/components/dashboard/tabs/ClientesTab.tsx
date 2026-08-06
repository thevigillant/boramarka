import { Search, Users, DollarSign, User, Phone } from 'lucide-react'
import { formatDate, formatCurrency } from '../../../utils/dashboardHelpers'

interface ClientesTabProps {
  clientSearch: string
  setClientSearch: (val: string) => void
  aggregatedClients: any[]
  handleOpenClientDetails: (name: string, phone: string) => void
}

export function ClientesTab({
  clientSearch,
  setClientSearch,
  aggregatedClients,
  handleOpenClientDetails,
}: ClientesTabProps) {
  return (
    <div className="animate-slide-up space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Clientes (Mini-CRM)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe a frequência de agendamentos e faturamento por cliente</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={clientSearch}
            onChange={e => setClientSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131826] font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-simple p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Total de Clientes</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white block mt-0.5">{aggregatedClients.length}</span>
          </div>
        </div>

        <div className="card-simple p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Faturamento Médio por Cliente</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white block mt-0.5">
              {formatCurrency(
                aggregatedClients.length > 0 
                  ? aggregatedClients.reduce((acc, curr) => acc + curr.totalSpent, 0) / aggregatedClients.length 
                  : 0
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Table / List */}
      {aggregatedClients.length === 0 ? (
        <div className="card-simple p-12 text-center border-dashed border-2 border-slate-250 dark:border-slate-800/80">
          <span className="text-4xl block mb-3"></span>
          <h3 className="text-md font-black text-slate-900 dark:text-white">Nenhum cliente encontrado</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Os clientes aparecerão aqui automaticamente quando realizarem agendamentos pelos seus links.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100/50 dark:bg-[#1A2235]/20">
                  <th className="py-4 px-6">Nome do Cliente</th>
                  <th className="py-4 px-6">WhatsApp</th>
                  <th className="py-4 px-6 text-center">Consultas</th>
                  <th className="py-4 px-6 text-right">Total Pago</th>
                  <th className="py-4 px-6 text-right">Último Agendamento</th>
                  <th className="py-4 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedClients.map((client, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-[#1A2235]/10 transition-colors">
                    <td className="py-4 px-6 font-black text-sm text-slate-900 dark:text-white">{client.name}</td>
                    <td className="py-4 px-6 text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">{client.phone}</td>
                    <td className="py-4 px-6 text-center font-bold text-sm text-slate-700 dark:text-slate-300">{client.totalBookings}</td>
                    <td className="py-4 px-6 text-right font-black text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(client.totalSpent)}</td>
                    <td className="py-4 px-6 text-right font-bold text-xs text-slate-500 dark:text-slate-400">
                      {client.lastBookingDate ? formatDate(client.lastBookingDate) : 'Sem data'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenClientDetails(client.name, client.phone)}
                          className="p-2 bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white rounded-xl transition-all"
                          title="Ficha do Cliente"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <a 
                          href={`https://wa.me/55${client.phone}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                          title="Iniciar conversa no WhatsApp"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {aggregatedClients.map((client, idx) => (
              <div key={idx} className="card-simple p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">{client.name}</h4>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1">{client.phone}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenClientDetails(client.name, client.phone)}
                      className="p-2.5 bg-pink-500/10 hover:bg-pink-500 text-pink-500 hover:text-white rounded-xl transition-all"
                      title="Ficha do Cliente"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    <a 
                      href={`https://wa.me/55${client.phone}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl transition-all"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Consultas</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-white block mt-0.5">{client.totalBookings}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Total Pago</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">{formatCurrency(client.totalSpent)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Último</span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                      {client.lastBookingDate ? formatDate(client.lastBookingDate) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
