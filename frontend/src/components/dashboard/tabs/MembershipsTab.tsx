import { Plus, User, Trash2 } from 'lucide-react'
import { formatCurrency, maskPhone } from '../../../utils/dashboardHelpers'

interface MembershipsTabProps {
  clientSubscriptions: any[]
  membershipPlans: any[]
  handleCreateMembershipPlan: (e: any) => void
  planForm: any
  setPlanForm: (form: any) => void
  handleCreateClientSubscription: (e: any) => void
  subForm: any
  setSubForm: (form: any) => void
  handleDeleteMembershipPlan: (id: number) => void
  handleDeleteClientSubscription: (id: number) => void
}

export function MembershipsTab({
  clientSubscriptions,
  membershipPlans,
  handleCreateMembershipPlan,
  planForm,
  setPlanForm,
  handleCreateClientSubscription,
  subForm,
  setSubForm,
  handleDeleteMembershipPlan,
  handleDeleteClientSubscription,
}: MembershipsTabProps) {
  return (
    <div className="animate-slide-up space-y-8 text-left">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Clube de Assinaturas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Crie planos de assinatura recorrentes para seus clientes fidelizados (mensais/anuais)</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card-simple p-6 bg-gradient-to-br from-orange-500/5 to-pink-500/5 border-orange-500/10">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recorrência Mensal (MRR)</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(
              clientSubscriptions.reduce((acc, sub) => {
                if (sub.status !== 'active') return acc;
                const planPrice = sub.plan.price;
                return acc + (sub.plan.interval === 'yearly' ? planPrice / 12 : planPrice);
              }, 0)
            )}
          </h3>
        </div>

        <div className="card-simple p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Assinantes Ativos</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {clientSubscriptions.filter(s => s.status === 'active').length}
          </h3>
        </div>

        <div className="card-simple p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Planos Ativos</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {membershipPlans.length}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Plan & Register Subscriber Forms */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Create Plan Form */}
          <form onSubmit={handleCreateMembershipPlan} className="card-simple p-6 space-y-4 bg-white dark:bg-[#131826] border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Plano de Assinatura
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nome do Plano</label>
                <input 
                  type="text"
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Ex: Assinatura Barba e Cabelo"
                  className="input-simple text-xs font-bold w-full bg-slate-50 dark:bg-[#131826]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Intervalo de Cobrança</label>
                <select
                  value={planForm.interval}
                  onChange={e => setPlanForm({ ...planForm, interval: e.target.value as 'monthly' | 'yearly' })}
                  className="input-simple text-xs font-bold w-full bg-white text-slate-900 dark:bg-[#131826] dark:text-white"
                >
                  <option value="monthly" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Mensal</option>
                  <option value="yearly" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Preço do Plano</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={planForm.price}
                    onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                    placeholder="Ex: 80.00"
                    className="input-simple text-xs font-bold pl-9 w-full bg-slate-50 dark:bg-[#131826]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Descrição (opcional)</label>
                <textarea
                  value={planForm.description}
                  onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Descreva o que o plano oferece..."
                  className="input-simple text-xs font-bold w-full h-16 bg-slate-50 dark:bg-[#131826]"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl text-white font-black text-xs transition-all uppercase tracking-wider">
              Criar Plano
            </button>
          </form>

          {/* Register Subscriber Form */}
          <form onSubmit={handleCreateClientSubscription} className="card-simple p-6 space-y-4 bg-white dark:bg-[#131826] border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <User className="w-4 h-4" /> Vincular Novo Assinante
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nome do Cliente</label>
                <input 
                  type="text"
                  value={subForm.clientName}
                  onChange={e => setSubForm({ ...subForm, clientName: e.target.value })}
                  placeholder="Ex: Bruno Santana"
                  className="input-simple text-xs font-bold w-full bg-slate-50 dark:bg-[#131826]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">WhatsApp do Cliente</label>
                <input 
                  type="tel"
                  value={subForm.clientPhone}
                  onChange={e => setSubForm({ ...subForm, clientPhone: maskPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  className="input-simple text-xs font-bold w-full bg-slate-50 dark:bg-[#131826]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Plano Escolhido</label>
                <select
                  value={subForm.planId}
                  onChange={e => setSubForm({ ...subForm, planId: e.target.value })}
                  className="input-simple text-xs font-bold w-full bg-white text-slate-900 dark:bg-[#131826] dark:text-white"
                  required
                >
                  <option value="" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Selecione o Plano...</option>
                  {membershipPlans.map(plan => (
                    <option key={plan.id} value={plan.id} className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">{plan.name} ({plan.interval === 'yearly' ? 'Anual' : 'Mensal'} - R$ {plan.price.toFixed(2)})</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={membershipPlans.length === 0}
              className="w-full py-3 bg-slate-800 dark:bg-[#1A2235] text-white hover:bg-slate-700 rounded-xl font-black text-xs transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ativar Assinatura
            </button>
          </form>

        </div>

        {/* Right Column: Plans and Subscriptions Lists */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Membership Plans List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">Planos Disponíveis ({membershipPlans.length})</h3>
            {membershipPlans.length === 0 ? (
              <div className="card-simple p-8 text-center text-xs text-slate-400 font-semibold border-dashed">
                Nenhum plano de assinatura cadastrado ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {membershipPlans.map(plan => (
                  <div key={plan.id} className="card-simple p-4 flex items-center justify-between bg-white dark:bg-[#131826]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{plan.name}</h4>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 uppercase tracking-wider">
                          {plan.interval === 'yearly' ? 'Anual' : 'Mensal'}
                        </span>
                      </div>
                      {plan.description && <p className="text-[10px] text-slate-400 mt-1 font-semibold">{plan.description}</p>}
                      <p className="text-[10px] text-slate-500 font-bold mt-1.5">
                        Assinantes ativos: <strong className="text-slate-800 dark:text-slate-200">{plan._count?.subscriptions || 0}</strong>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-emerald-500">{formatCurrency(plan.price)}</span>
                      <button 
                        onClick={() => handleDeleteMembershipPlan(plan.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                        title="Excluir Plano"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Subscriptions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">Lista de Assinantes ({clientSubscriptions.length})</h3>
            {clientSubscriptions.length === 0 ? (
              <div className="card-simple p-8 text-center text-xs text-slate-400 font-semibold border-dashed">
                Nenhum cliente cadastrado no clube de assinaturas ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {clientSubscriptions.map(sub => (
                  <div key={sub.id} className="card-simple p-4 flex items-center justify-between bg-white dark:bg-[#131826]">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{sub.clientName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">Plano: <span className="text-pink-500 font-black">{sub.plan.name}</span></p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Celular: {maskPhone(sub.clientPhone)}</p>
                    </div>

                    <div className="text-right space-y-2 shrink-0">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
                        Renova: {new Date(sub.expiresAt).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDeleteClientSubscription(sub.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                          title="Cancelar Assinatura"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
