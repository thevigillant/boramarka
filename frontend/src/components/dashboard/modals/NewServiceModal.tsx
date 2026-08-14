import { X } from 'lucide-react'
import type { ServiceData } from '../../../types/dashboard'

interface NewServiceModalProps {
  showNewService: boolean
  setShowNewService: (show: boolean) => void
  editingService: ServiceData | null
  serviceForm: {
    name: string
    description: string
    price: string
    duration: string
  }
  setServiceForm: (form: any) => void
  handleCreateService: (e: React.FormEvent) => void
}

export function NewServiceModal({
  showNewService,
  setShowNewService,
  editingService,
  serviceForm,
  setServiceForm,
  handleCreateService,
}: NewServiceModalProps) {
  if (!showNewService) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#131826] w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}</h3>
          <button onClick={() => setShowNewService(false)} className="p-2 text-slate-400"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleCreateService} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Nome do Serviço</label>
            <input 
              type="text" 
              value={serviceForm.name} 
              onChange={e => setServiceForm({...serviceForm, name: e.target.value})} 
              placeholder="Ex: Corte Masculino, Manicure, etc." 
              className="input-simple font-bold" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Descrição (Opcional)</label>
            <textarea 
              value={serviceForm.description} 
              onChange={e => setServiceForm({...serviceForm, description: e.target.value})} 
              placeholder="Explique o que inclui o serviço..." 
              className="input-simple font-medium text-sm min-h-[80px]" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Preço (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                value={serviceForm.price} 
                onChange={e => setServiceForm({...serviceForm, price: e.target.value})} 
                placeholder="0,00" 
                className="input-simple font-bold" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Duração (Minutos)</label>
              <select 
                value={serviceForm.duration} 
                onChange={e => setServiceForm({...serviceForm, duration: e.target.value})} 
                className="input-simple font-bold"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hora</option>
                <option value="90">1h 30min</option>
                <option value="120">2 horas</option>
              </select>
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-lg transition-all shadow-xl shadow-pink-500/20 mt-4">
            {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
          </button>
        </form>
      </div>
    </div>
  )
}
