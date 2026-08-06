import { Copy, Palette, ExternalLink, Plus, DollarSign, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../../utils/dashboardHelpers'

interface LinksTabProps {
  adminInfo: any
  showToast: (msg: string, type?: 'success' | 'error') => void
  setActiveTab: (tab: any) => void
  editingLink: any
  editLinkTitle: string
  setEditLinkTitle: (val: string) => void
  editLinkServiceId: number | null
  setEditLinkServiceId: (val: number | null) => void
  services: any[]
  editLinkBookingFeeEnabled: boolean
  setEditLinkBookingFeeEnabled: (val: boolean) => void
  editLinkBookingFeeAmount: string
  setEditLinkBookingFeeAmount: (val: string) => void
  handleUpdateLink: () => void
  setEditingLink: (link: any) => void
  showNewLink: boolean
  setShowNewLink: (val: boolean) => void
  newLinkTitle: string
  setNewLinkTitle: (val: string) => void
  newLinkServiceId: number | null
  setNewLinkServiceId: (val: number | null) => void
  newLinkBookingFeeEnabled: boolean
  setNewLinkBookingFeeEnabled: (val: boolean) => void
  newLinkBookingFeeAmount: string
  setNewLinkBookingFeeAmount: (val: string) => void
  handleCreateLink: () => void
  links: any[]
  startEditingLink: (link: any) => void
  handleDeleteLink: (id: number) => void
}

export function LinksTab({
  adminInfo,
  showToast,
  setActiveTab,
  editingLink,
  editLinkTitle,
  setEditLinkTitle,
  editLinkServiceId,
  setEditLinkServiceId,
  services,
  editLinkBookingFeeEnabled,
  setEditLinkBookingFeeEnabled,
  editLinkBookingFeeAmount,
  setEditLinkBookingFeeAmount,
  handleUpdateLink,
  setEditingLink,
  showNewLink,
  setShowNewLink,
  newLinkTitle,
  setNewLinkTitle,
  newLinkServiceId,
  setNewLinkServiceId,
  newLinkBookingFeeEnabled,
  setNewLinkBookingFeeEnabled,
  newLinkBookingFeeAmount,
  setNewLinkBookingFeeAmount,
  handleCreateLink,
  links,
  startEditingLink,
  handleDeleteLink,
}: LinksTabProps) {
  return (
    <div className="animate-slide-up space-y-6">
      {/* Profile Link Section */}
      <div className="card-simple p-4 sm:p-6 bg-gradient-to-br from-orange-500 to-pink-500 text-white border-none shadow-xl shadow-pink-500/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-black mb-1">Seu Link Mestre</h3>
            <p className="text-pink-100 text-xs sm:text-sm font-medium leading-relaxed">Envie este link para seus clientes verem TODOS os seus serviços de uma vez.</p>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => { 
                const url = `${window.location.origin}/p/${adminInfo?.username}`; 
                navigator.clipboard.writeText(url); 
                showToast('Link do perfil copiado!') 
              }} 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-pink-600 font-bold py-2.5 px-4 rounded-xl hover:bg-pink-50 transition-all text-xs sm:text-sm shadow-md min-h-[42px]"
            >
              <Copy className="w-4 h-4" /> Copiar Perfil
            </button>
            <button 
              onClick={() => setActiveTab('personalizar')} 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/15 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-white/25 transition-all border border-white/20 text-xs sm:text-sm shadow-md min-h-[42px]"
            >
              <Palette className="w-4 h-4" /> Personalizar Página
            </button>
            <a 
              href={`/p/${adminInfo?.username}`} 
              target="_blank" 
              rel="noreferrer"
              className="p-2.5 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-all border border-white/20 shrink-0 flex items-center justify-center min-h-[42px] min-w-[42px]"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-4.5 h-4.5" />
            </a>
          </div>
        </div>
      </div>

      {editingLink ? (
        <div className="card-simple p-5 sm:p-8 border-pink-200 dark:border-pink-500/30 shadow-xl mb-6 animate-scale-in">
          <h3 className="font-black text-slate-900 dark:text-white mb-6 text-xl">Editar Link de Venda</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Título do Link</label>
              <input type="text" value={editLinkTitle} onChange={e => setEditLinkTitle(e.target.value)} placeholder="Ex: Cortes de Cabelo..." className="w-full input-simple text-lg font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Vincular a um Serviço (Opcional)</label>
              <select 
                value={editLinkServiceId || ''} 
                onChange={e => setEditLinkServiceId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full input-simple font-bold"
              >
                <option value="">Nenhum (Apenas título)</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price)})</option>
                ))}
              </select>
            </div>
            
            {/* Taxa de Agendamento */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editLinkBookingFeeEnabled}
                  onChange={e => setEditLinkBookingFeeEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Cobrar Sinal de Reserva (direto no seu Pix / banco)</span>
              </label>
              
              {editLinkBookingFeeEnabled && (
                <div className="animate-fade-in pl-6">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Valor do Sinal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editLinkBookingFeeAmount}
                    onChange={e => setEditLinkBookingFeeAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-32 input-simple font-bold text-sm bg-white dark:bg-[#131826]"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <button onClick={handleUpdateLink} className="flex-1 btn-primary-simple py-4 font-black text-lg">SALVAR ALTERAÇÕES</button>
              <button onClick={() => setEditingLink(null)} className="px-8 font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
            </div>
          </div>
        </div>
      ) : !showNewLink ? (
        <button onClick={() => setShowNewLink(true)} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2.5 text-sm sm:text-base font-extrabold shadow-lg shadow-pink-500/20 transition-all mb-6">
          <Plus className="w-5 h-5" /> CRIAR NOVO LINK DE VENDA
        </button>
      ) : (
        <div className="card-simple p-5 sm:p-8 border-pink-200 dark:border-pink-500/30 shadow-xl mb-6 animate-scale-in">
          <h3 className="font-black text-slate-900 dark:text-white mb-6 text-xl">Criar Novo Link de Venda</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Título do Link</label>
              <input type="text" value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)} placeholder="Ex: Cortes de Cabelo, Consultoria, Unhas..." className="w-full input-simple text-lg font-bold" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Vincular a um Serviço (Opcional)</label>
              <select 
                value={newLinkServiceId || ''} 
                onChange={e => setNewLinkServiceId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full input-simple font-bold"
              >
                <option value="">Nenhum (Apenas título)</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price)})</option>
                ))}
              </select>
            </div>

            {/* Taxa de Agendamento */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newLinkBookingFeeEnabled}
                  onChange={e => setNewLinkBookingFeeEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Cobrar Sinal de Reserva (direto no seu Pix / banco)</span>
              </label>
              
              {newLinkBookingFeeEnabled && (
                <div className="animate-fade-in pl-6">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Valor do Sinal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLinkBookingFeeAmount}
                    onChange={e => setNewLinkBookingFeeAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-32 input-simple font-bold text-sm bg-white dark:bg-[#131826]"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <button onClick={handleCreateLink} className="flex-1 btn-primary-simple py-4 font-black text-lg">CRIAR LINK AGORA</button>
              <button onClick={() => setShowNewLink(false)} className="px-8 font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map(link => (
          <div key={link.id} className="card-simple p-4 sm:p-5 hover:shadow-xl transition-all border-l-4 border-pink-500 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{link.title}</h3>
                  {link.service && <p className="text-xs font-bold text-pink-500 mt-1">{link.service.name} • {formatCurrency(link.service.price)}</p>}
                  {link.bookingFeeEnabled ? (
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Sinal: {formatCurrency(link.bookingFeeAmount)} (direto no seu Pix / banco)
                    </p>
                  ) : (
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Sem sinal de reserva</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-center">
                  <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-200">{link.totalSlots}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-xl text-center">
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{link.availableSlots}</p>
                  <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500 uppercase tracking-wider">Livres</p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-500/10 p-2 rounded-xl text-center">
                  <p className="text-xl sm:text-2xl font-black text-pink-500">{link.bookedSlots}</p>
                  <p className="text-[9px] font-bold text-pink-400 uppercase tracking-wider">Agendados</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { const url = `${window.location.origin}/agendar/${link.token}`; navigator.clipboard.writeText(url); showToast('Link copiado!') }} className="flex-1 text-center py-2 px-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-pink-500 dark:hover:text-pink-400 bg-slate-100 dark:bg-slate-800/70 rounded-xl transition-all flex items-center justify-center gap-1"><Copy className="w-3.5 h-3.5" /> COPIAR</button>
              <button onClick={() => startEditingLink(link)} className="flex-1 text-center py-2 px-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-pink-500 dark:hover:text-pink-400 bg-slate-100 dark:bg-slate-800/70 rounded-xl transition-all flex items-center justify-center gap-1"><Pencil className="w-3.5 h-3.5" /> EDITAR</button>
              <button onClick={() => handleDeleteLink(link.id)} className="flex-1 text-center py-2 px-1.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 bg-red-500/10 rounded-xl transition-all flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /> EXCLUIR</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
