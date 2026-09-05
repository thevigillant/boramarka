import React from 'react'
import { X, UserX, AlertTriangle } from 'lucide-react'

interface DismissalModalProps {
  dismissModalOpen: boolean
  setDismissModalOpen: (val: boolean) => void
  employeeToDismiss: any
  setEmployeeToDismiss: (val: any) => void
  dismissForm: {
    dismissalDate: string
    dismissalReason: string
    dismissalNotes: string
    hasPending: boolean
    pendingType: string
    pendingNotes: string
  }
  setDismissForm: React.Dispatch<React.SetStateAction<any>>
  handleConfirmDismissal: (e: React.FormEvent) => void
}

export const DismissalModal: React.FC<DismissalModalProps> = ({
  dismissModalOpen,
  setDismissModalOpen,
  employeeToDismiss,
  setEmployeeToDismiss,
  dismissForm,
  setDismissForm,
  handleConfirmDismissal
}) => {
  if (!dismissModalOpen || !employeeToDismiss) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="bg-white dark:bg-[#131826] w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-in border border-amber-500/30 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Demissão do Colaborador</h3>
              <p className="text-xs text-amber-500 font-bold">{employeeToDismiss.name} — {employeeToDismiss.role}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setDismissModalOpen(false)
              setEmployeeToDismiss(null)
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleConfirmDismissal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Data do Desligamento *</label>
              <input
                type="date"
                value={dismissForm.dismissalDate}
                onChange={e => setDismissForm({ ...dismissForm, dismissalDate: e.target.value })}
                className="input-simple font-bold text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Motivo do Desligamento *</label>
              <select
                value={dismissForm.dismissalReason}
                onChange={e => setDismissForm({ ...dismissForm, dismissalReason: e.target.value })}
                className="input-simple font-bold text-xs"
                required
              >
                <option value="Sem justa causa">Sem justa causa</option>
                <option value="Com justa causa">Com justa causa</option>
                <option value="Pedido de demissão">Pedido de demissão</option>
                <option value="Término de contrato de experiência">Término de contrato de experiência</option>
                <option value="Acordo entre as partes">Acordo entre as partes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-1">Observações da Demissão</label>
            <textarea
              rows={2}
              value={dismissForm.dismissalNotes}
              onChange={e => setDismissForm({ ...dismissForm, dismissalNotes: e.target.value })}
              placeholder="Ex: Entregou aviso prévio trabalhado..."
              className="input-simple font-semibold text-xs"
            />
          </div>

          {/* Toggle Pending Issue */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-amber-500 uppercase tracking-wider">Registrar Pendência Demissional?</span>
              </div>
              <input
                type="checkbox"
                checked={dismissForm.hasPending}
                onChange={e => setDismissForm({ ...dismissForm, hasPending: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
              />
            </div>

            {dismissForm.hasPending && (
              <div className="space-y-3 pt-2 border-t border-amber-500/20">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tipo da Pendência principal</label>
                  <select
                    value={dismissForm.pendingType}
                    onChange={e => setDismissForm({ ...dismissForm, pendingType: e.target.value })}
                    className="input-simple font-bold text-xs"
                  >
                    <option value="RESCISAO">Pagamento de Rescisão / Verbas</option>
                    <option value="EQUIPAMENTO">Devolução de Chaves / Notebook / Equipamentos</option>
                    <option value="EXAME_DEMISSIONAL">Exame Médico Demissional</option>
                    <option value="DOCUMENTACAO">Assinatura de Documentação / Carteira</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Detalhes da Pendência</label>
                  <input
                    type="text"
                    value={dismissForm.pendingNotes}
                    onChange={e => setDismissForm({ ...dismissForm, pendingNotes: e.target.value })}
                    placeholder="Ex: Falta devolução da chave do portão e pagamento da 2ª parcela"
                    className="input-simple font-semibold text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-red-600 text-white font-black rounded-xl transition-all shadow-md hover:opacity-95 text-sm uppercase tracking-wider"
            >
              Confirmar Demissão & Mover para Pendências
            </button>
            <button
              type="button"
              onClick={() => {
                setDismissModalOpen(false)
                setEmployeeToDismiss(null)
              }}
              className="px-5 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-xl transition-all text-sm uppercase tracking-wider"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
