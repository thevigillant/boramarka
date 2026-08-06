import { Plus, Tag, DollarSign, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../../utils/dashboardHelpers'

interface CuponsTabProps {
  handleCreateCoupon: (e: any) => void
  couponForm: any
  setCouponForm: (form: any) => void
  coupons: any[]
  handleDeleteCoupon: (id: number) => void
}

export function CuponsTab({
  handleCreateCoupon,
  couponForm,
  setCouponForm,
  coupons,
  handleDeleteCoupon,
}: CuponsTabProps) {
  return (
    <div className="animate-slide-up space-y-6 text-left">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Cupons de Desconto</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Crie códigos promocionais para campanhas de marketing e descontos nos agendamentos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Create Coupon Column (left 5 cols) */}
        <form onSubmit={handleCreateCoupon} className="lg:col-span-5 card-simple p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-[#131826]">
          <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Novo Cupom</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Código do Cupom</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="EX: DESCONTO10"
                  className="input-simple font-bold text-sm pl-12 bg-white dark:bg-[#131826]"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">Os clientes digitarão este código na tela de agendamento.</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Tipo de Desconto</label>
              <select 
                value={couponForm.discountType}
                onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as 'percentage' | 'fixed' })}
                className="input-simple font-bold w-full bg-white text-slate-900 dark:bg-[#131826] dark:text-white"
              >
                <option value="percentage" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Porcentagem (%)</option>
                <option value="fixed" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Valor Fixo (R$)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Valor do Desconto</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  value={couponForm.discountValue}
                  onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                  placeholder={couponForm.discountType === 'percentage' ? 'Ex: 10' : 'Ex: 15.00'}
                  className="input-simple font-bold text-sm pl-12 bg-white dark:bg-[#131826]"
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-md transition-all shadow-xl shadow-pink-500/20 flex items-center justify-center gap-2 hover:opacity-95">
            <Plus className="w-5 h-5" /> Criar Cupom
          </button>
        </form>

        {/* Coupons List Column (right 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cupons Ativos ({coupons.length})</h3>
          </div>

          {coupons.length === 0 ? (
            <div className="card-simple p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-850 bg-white dark:bg-[#131826]/40">
              <span className="text-4xl block mb-3"></span>
              <h4 className="text-md font-black text-slate-900 dark:text-white">Nenhum cupom ativo</h4>
              <p className="text-xs text-slate-400 font-semibold mt-1">Crie um cupom no formulário ao lado para compartilhar com seus clientes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {coupons.map(cp => (
                <div key={cp.id} className="card-simple p-5 flex items-center justify-between bg-white dark:bg-[#131826] hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-500/10 text-pink-500 rounded-2xl shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200 tracking-wider">
                          {cp.code}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5">
                        Desconto: <strong className="text-emerald-500">{cp.discountType === 'percentage' ? `${cp.discountValue}%` : formatCurrency(cp.discountValue)}</strong>
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeleteCoupon(cp.id)}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                    title="Excluir Cupom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
