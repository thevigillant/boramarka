import { Plus, Clock, ImageIcon } from 'lucide-react'
import { formatCurrency } from '../../../utils/dashboardHelpers'

interface ServicosTabProps {
  subscription: any
  setShowPaywall: (open: boolean) => void
  setEditingService: (service: any) => void
  setServiceForm: (form: any) => void
  setShowNewService: (open: boolean) => void
  services: any[]
  handleDeleteService: (id: number) => void
}

export function ServicosTab({
  subscription,
  setShowPaywall,
  setEditingService,
  setServiceForm,
  setShowNewService,
  services,
  handleDeleteService,
}: ServicosTabProps) {
  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Catálogo de Serviços</h2>
        <button
          onClick={() => {
            if (subscription?.status === 'inactive') {
              setShowPaywall(true)
            } else {
              setEditingService(null)
              setServiceForm({ name: '', description: '', price: '', duration: '30', photoUrl: '' })
              setShowNewService(true)
            }
          }}
          className="btn-primary-simple py-2.5 px-6 flex items-center gap-2 font-black text-sm"
        >
          <Plus className="w-5 h-5" /> NOVO SERVIÇO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map(service => (
          <div
            key={service.id}
            className="card-simple overflow-hidden hover:shadow-xl transition-all border-l-4 border-pink-500 flex flex-col"
          >
            {/* ── Foto do serviço ── */}
            {service.photoUrl ? (
              <div className="w-full h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={service.photoUrl}
                  alt={service.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Sem foto</p>
                </div>
              </div>
            )}

            {/* ── Conteúdo ── */}
            <div className="p-5 flex flex-col flex-1 justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{service.name}</h3>
                  <p className="text-base font-black text-pink-500 ml-2 shrink-0">{formatCurrency(service.price)}</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                  {service.description || 'Sem descrição.'}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" /> {service.duration} minutos
                </div>
              </div>

              {/* ── Ações ── */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  onClick={() => {
                    if (subscription?.status === 'inactive') {
                      setShowPaywall(true)
                    } else {
                      setEditingService(service)
                      setServiceForm({
                        name: service.name,
                        description: service.description || '',
                        price: service.price.toString(),
                        duration: service.duration.toString(),
                        photoUrl: service.photoUrl || '',
                      })
                      setShowNewService(true)
                    }
                  }}
                  className="flex-1 text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all"
                >
                  EDITAR
                </button>
                <button
                  onClick={() => {
                    if (subscription?.status === 'inactive') {
                      setShowPaywall(true)
                    } else {
                      handleDeleteService(service.id)
                    }
                  }}
                  className="flex-1 text-center py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                >
                  EXCLUIR
                </button>
              </div>
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="col-span-full card-simple py-20 text-center border-dashed border-2 dark:border-slate-800">
            <ImageIcon className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
              Seu catálogo está vazio
            </p>
            <p className="text-xs text-slate-300 mt-1">Clique em "Novo Serviço" para começar</p>
          </div>
        )}
      </div>
    </div>
  )
}
