import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Phone, Clock, CheckCircle2, X, MessageSquare, AlertCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { api } from '../../../services/api'

interface QueueEntry {
  id: number
  clientName: string
  clientPhone: string
  serviceName: string
  status: 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'DONE' | 'CANCELLED'
  position: number
  estimatedWait: number
  notified: boolean
  notes: string
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'Aguardando', CALLED: 'Chamado', IN_SERVICE: 'Em atendimento',
  DONE: 'Atendido', CANCELLED: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  WAITING: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
  CALLED: 'bg-violet-500/15 border-violet-500/40 text-violet-400',
  IN_SERVICE: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
  DONE: 'bg-slate-500/15 border-slate-500/30 text-slate-400',
  CANCELLED: 'bg-red-500/15 border-red-500/30 text-red-400 opacity-60',
}

export function FilaEsperaTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await api.request('/queue')
      setQueue(data)
    } catch (err: any) {
      if (!silent) showToast('Erro ao carregar fila.', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchQueue()
    // Poll a cada 15s
    const interval = setInterval(() => fetchQueue(true), 15000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  async function handleAdd() {
    if (!clientName.trim()) return showToast('Nome do cliente é obrigatório.', 'error')
    setSubmitting(true)
    try {
      await api.request('/queue', {
        method: 'POST',
        body: JSON.stringify({ clientName, clientPhone, serviceName, notes }),
      })
      showToast(`${clientName} adicionado à fila!`, 'success')
      setClientName(''); setClientPhone(''); setServiceName(''); setNotes('')
      setShowAddModal(false)
      fetchQueue(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao adicionar.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCall(entry: QueueEntry) {
    try {
      const result = await api.request(`/queue/${entry.id}/call`, { method: 'PATCH' })
      showToast(`${entry.clientName} foi chamado!`, 'success')
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank')
      }
      fetchQueue(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao chamar.', 'error')
    }
  }

  async function handleUpdateStatus(id: number, status: string) {
    try {
      await api.request(`/queue/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      fetchQueue(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar.', 'error')
    }
  }

  async function handleRemove(id: number) {
    try {
      await api.request(`/queue/${id}`, { method: 'DELETE' })
      showToast('Removido da fila.', 'success')
      fetchQueue(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover.', 'error')
    }
  }

  const waiting = queue.filter(q => q.status === 'WAITING')
  const active  = queue.filter(q => q.status === 'CALLED' || q.status === 'IN_SERVICE')

  return (
    <div className="animate-slide-up space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Fila de Espera</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Walk-in — clientes sem hora marcada</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchQueue(true)} disabled={refreshing} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black py-2.5 px-5 rounded-xl transition-all shadow-md shadow-pink-500/20 text-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar à Fila
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Em espera', value: waiting.length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Em atendimento', value: active.length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Tempo médio', value: `~${waiting.length * 15}min`, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 border border-white/10 dark:border-white/5`}>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Queue */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
      ) : queue.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 dark:text-slate-500 font-medium">Fila vazia — sem clientes aguardando</p>
          <button onClick={() => setShowAddModal(true)} className="mt-4 text-xs text-pink-500 hover:text-pink-400 font-bold transition-colors">
            + Adicionar primeiro cliente
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((entry) => (
            <div key={entry.id} className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${STATUS_COLORS[entry.status] || STATUS_COLORS.WAITING}`}>
              {/* Position badge */}
              <div className="flex flex-col items-center min-w-[32px]">
                <span className="text-lg font-black">{entry.position}</span>
                <span className="text-[9px] opacity-60">pos.</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-black text-slate-900 dark:text-white">{entry.clientName}</p>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[entry.status]}`}>
                    {STATUS_LABEL[entry.status]}
                  </span>
                </div>
                {entry.clientPhone && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {entry.clientPhone}
                  </p>
                )}
                {entry.serviceName && (
                  <p className="text-xs text-slate-400 mt-0.5">Serviço: {entry.serviceName}</p>
                )}
                {entry.status === 'WAITING' && (
                  <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> Espera estimada: ~{entry.estimatedWait}min
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 shrink-0">
                {entry.status === 'WAITING' && (
                  <button onClick={() => handleCall(entry)} className="flex items-center gap-1 p-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 transition-all text-xs font-bold" title="Chamar + notificar WhatsApp">
                    <MessageSquare className="w-3.5 h-3.5" /> Chamar
                  </button>
                )}
                {entry.status === 'CALLED' && (
                  <button onClick={() => handleUpdateStatus(entry.id, 'IN_SERVICE')} className="flex items-center gap-1 p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-all text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Atender
                  </button>
                )}
                {entry.status === 'IN_SERVICE' && (
                  <button onClick={() => handleUpdateStatus(entry.id, 'DONE')} className="flex items-center gap-1 p-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                  </button>
                )}
                {entry.status !== 'DONE' && entry.status !== 'CANCELLED' && (
                  <button onClick={() => handleUpdateStatus(entry.id, 'CANCELLED')} className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-all" title="Cancelar">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => handleRemove(entry.id)} className="p-1.5 rounded-xl bg-slate-500/15 hover:bg-slate-500/25 text-slate-400 transition-all" title="Remover da fila">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Adicionar à Fila</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Nome do Cliente *</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="João Silva" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Telefone</label>
                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Serviço desejado</label>
                <input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Ex: Corte + Barba" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Observações</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Anotações opcionais..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-all resize-none" />
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={submitting || !clientName.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar à Fila
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
