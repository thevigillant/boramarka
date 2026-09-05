import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Phone,
  MessageCircle,
  Calendar,
  Sparkles,
  Award,
  ArrowUpDown,
  Loader2,
} from 'lucide-react'
import { api } from '../../../services/api'
import { formatCurrency } from '../../../utils/dashboardHelpers'

interface ClientItem {
  clientName: string
  clientPhone: string
  clientEmail: string
  ordersCount: number
  completedCount: number
  totalSpent: number
  averageTicket: number
  lastOrderDate: string
  topProducts: Array<{ name: string; quantity: number }>
}

export function BoraEncomendaClientsSubTab() {
  const [clients, setClients] = useState<ClientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'recent'>('spent')

  useEffect(() => {
    setLoading(true)
    api
      .getOrderClients()
      .then((data) => setClients(data || []))
      .catch((err) => console.error('Erro ao buscar CRM de clientes:', err))
      .finally(() => setLoading(false))
  }, [])

  // Métricas gerais de CRM
  const totalClients = clients.length
  const totalLtv = clients.reduce((acc, c) => acc + c.totalSpent, 0)
  const totalOrders = clients.reduce((acc, c) => acc + c.ordersCount, 0)
  const overallAverageTicket = totalOrders > 0 ? totalLtv / totalOrders : 0
  const vipCount = clients.filter((c) => c.ordersCount >= 2).length

  // Filtragem e Ordenação
  const filtered = clients
    .filter((c) => {
      const q = search.toLowerCase()
      return (
        c.clientName.toLowerCase().includes(q) ||
        c.clientPhone.includes(q) ||
        (c.clientEmail && c.clientEmail.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      if (sortBy === 'orders') return b.ordersCount - a.ordersCount
      if (sortBy === 'recent')
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
      return b.totalSpent - a.totalSpent
    })

  function getWhatsAppGreeting(client: ClientItem) {
    const cleanPhone = client.clientPhone.replace(/\D/g, '')
    const msg = `Olá, *${client.clientName}*! Tudo bem? Passando para agradecer pela preferência de sempre em nossas encomendas! Temos novidades no cardápio. Gostaria de conferir?`
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="space-y-5">
      {/* ── Métricas Executivas do CRM ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#131826] border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total de Clientes</span>
            <Users className="w-4 h-4 text-pink-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
            {totalClients}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {vipCount} clientes recorrentes (VIP)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#131826] border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Faturamento LTV</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
            {formatCurrency(totalLtv)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Valor vitalício acumulado
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#131826] border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Ticket Médio</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1 block">
            {formatCurrency(overallAverageTicket)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Média por encomenda
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#131826] border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Taxa de Recompra</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono mt-1 block">
            {totalClients > 0 ? ((vipCount / totalClients) * 100).toFixed(0) : 0}%
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Fidelização de clientes
          </span>
        </div>
      </div>

      {/* ── Barra de Busca & Ordenação ── */}
      <div className="p-3.5 rounded-2xl bg-[#131826] border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou email..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-pink-500 transition-all placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Ordenar por:</span>
          <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSortBy('spent')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                sortBy === 'spent'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Maior Valor (LTV)
            </button>
            <button
              type="button"
              onClick={() => setSortBy('orders')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                sortBy === 'orders'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Mais Pedidos
            </button>
            <button
              type="button"
              onClick={() => setSortBy('recent')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                sortBy === 'recent'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Mais Recente
            </button>
          </div>
        </div>
      </div>

      {/* ── Listagem de Clientes & Histórico ── */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500 mb-2" />
          <p className="text-xs text-slate-400 font-bold">Carregando CRM e histórico de clientes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800/80 rounded-2xl bg-[#131826]">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {search ? 'Nenhum cliente encontrado para a busca' : 'Nenhum cliente registrado ainda'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            À medida que as encomendas forem criadas no BoraEnkomenda, seus clientes aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client, idx) => {
            const isVip = client.ordersCount >= 3 || client.totalSpent >= 300

            return (
              <div
                key={idx}
                className="bg-[#131826] rounded-2xl border border-slate-800/90 hover:border-slate-700 p-4 shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Cabeçalho do Cliente */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-white">{client.clientName}</h4>
                        {isVip && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Award className="w-3 h-3" /> VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{client.clientPhone}</p>
                    </div>

                    <a
                      href={getWhatsAppGreeting(client)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all flex items-center gap-1 text-xs font-bold shadow-xs active:scale-95"
                      title="Enviar mensagem WhatsApp de fidelização"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="text-[10px]">WhatsApp</span>
                    </a>
                  </div>

                  {/* Estatísticas do Cliente */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Pedidos</span>
                      <span className="text-sm font-black text-white font-mono">{client.ordersCount}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">LTV Total</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {formatCurrency(client.totalSpent)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Ticket Médio</span>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {formatCurrency(client.averageTicket)}
                      </span>
                    </div>
                  </div>

                  {/* Top Produtos Favoritos */}
                  {client.topProducts && client.topProducts.length > 0 && (
                    <div className="mt-3 pt-2 text-[11px]">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">
                        Preferências do Cliente:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {client.topProducts.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20"
                          >
                            {p.quantity}x {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Data da Última Encomenda */}
                <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Último pedido:
                  </span>
                  <span className="font-medium text-slate-300">
                    {new Date(client.lastOrderDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
