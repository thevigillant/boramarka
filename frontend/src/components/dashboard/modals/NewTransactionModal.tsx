import { X, Check } from 'lucide-react'

interface NewTransactionModalProps {
  showNewTransaction: boolean
  setShowNewTransaction: (show: boolean) => void
  newTx: {
    type: 'receivable' | 'payable'
    description: string
    amount: string
    dueDate: string
    clientName: string
    paid: boolean
    category: string
  }
  setNewTx: (tx: any) => void
  handleCreateTransaction: () => void
}

export function NewTransactionModal({
  showNewTransaction,
  setShowNewTransaction,
  newTx,
  setNewTx,
  handleCreateTransaction,
}: NewTransactionModalProps) {
  if (!showNewTransaction) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#131826] w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Lançar Valor Financeiro</h3>
          <button onClick={() => setShowNewTransaction(false)} className="p-2 text-slate-400"><X className="w-6 h-6" /></button>
        </div>
        <div className="space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-850 rounded-2xl">
            <button onClick={() => setNewTx({...newTx, type: 'receivable'})} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${newTx.type === 'receivable' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>Entrada (+)</button>
            <button onClick={() => setNewTx({...newTx, type: 'payable'})} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${newTx.type === 'payable' ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>Saída (-)</button>
          </div>
          <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">Descrição</label><input type="text" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder="Ex: Corte Cabelo, Pagamento Aluguel..." className="input-simple font-bold" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">Valor (R$)</label><input type="text" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} placeholder="0,00" className="input-simple font-bold" /></div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 flex justify-between">
                Data
                <button onClick={() => setNewTx({...newTx, dueDate: new Date().toISOString().split('T')[0]})} className="text-pink-500 hover:underline">Hoje</button>
              </label>
              <input type="date" value={newTx.dueDate} onChange={e => setNewTx({...newTx, dueDate: e.target.value})} className="input-simple font-bold text-xs" />
            </div>
          </div>
          <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">Cliente / Fornecedor</label><input type="text" value={newTx.clientName} onChange={e => setNewTx({...newTx, clientName: e.target.value})} placeholder="Opcional" className="input-simple font-bold" /></div>
          
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={
                  ['Serviço', 'Venda de Produto', 'Assinatura', 'Fornecedor', 'Aluguel', 'Salário / Comissão', 'Marketing', 'Utilidades', 'Impostos'].includes(newTx.category) 
                    ? newTx.category 
                    : newTx.category === '' ? '' : 'custom'
                }
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setNewTx({...newTx, category: ''})
                  } else {
                    setNewTx({...newTx, category: val})
                  }
                }}
                className="input-simple font-bold text-xs"
              >
                <option value="">Selecione uma Categoria...</option>
                {newTx.type === 'receivable' ? (
                  <>
                    <option value="Serviço">Serviço</option>
                    <option value="Venda de Produto">Venda de Produto</option>
                    <option value="Assinatura">Assinatura / Recorrência</option>
                  </>
                ) : (
                  <>
                    <option value="Fornecedor">Fornecedor</option>
                    <option value="Aluguel">Aluguel</option>
                    <option value="Salário / Comissão">Salário / Comissão</option>
                    <option value="Marketing">Marketing / Anúncios</option>
                    <option value="Utilidades">Utilidades (Água, Luz...)</option>
                    <option value="Impostos">Impostos / Taxas</option>
                  </>
                )}
                <option value="custom">Outra (Personalizada)...</option>
              </select>

              {(!['Serviço', 'Venda de Produto', 'Assinatura', 'Fornecedor', 'Aluguel', 'Salário / Comissão', 'Marketing', 'Utilidades', 'Impostos'].includes(newTx.category) || 
                ['Serviço', 'Venda de Produto', 'Assinatura', 'Fornecedor', 'Aluguel', 'Salário / Comissão', 'Marketing', 'Utilidades', 'Impostos'].includes(newTx.category) && newTx.category === '') && (
                <input 
                  type="text" 
                  value={newTx.category} 
                  onChange={e => setNewTx({...newTx, category: e.target.value})} 
                  placeholder="Nome da categoria" 
                  className="input-simple font-bold" 
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-850 cursor-pointer" onClick={() => setNewTx({...newTx, paid: !newTx.paid})}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${newTx.paid ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-200 text-transparent'}`}>
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Já está {newTx.type === 'receivable' ? 'recebido' : 'pago'}</span>
          </div>

          <button onClick={handleCreateTransaction} className={`w-full py-5 rounded-2xl text-white font-black text-lg transition-all shadow-xl ${newTx.type === 'receivable' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-red-600 shadow-red-600/20'}`}>
            Confirmar Lançamento
          </button>
        </div>
      </div>
    </div>
  )
}
