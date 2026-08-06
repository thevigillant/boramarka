import { CheckCircle2, XCircle, RotateCcw, Loader2 } from 'lucide-react'
import { formatDate, formatCurrency } from '../../../utils/dashboardHelpers'

interface EstornosTabProps {
  refundRequests: any[]
  processingRefundId: number | null
  handleApproveRefund: (id: number) => void
  handleRejectRefund: (id: number) => void
}

export function EstornosTab({
  refundRequests,
  processingRefundId,
  handleApproveRefund,
  handleRejectRefund,
}: EstornosTabProps) {
  return (
    <div className="animate-slide-up space-y-6 text-left">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Solicitações de Estorno</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie e processe reembolsos solicitados por clientes via Mercado Pago</p>
        </div>
      </div>

      {refundRequests.length === 0 ? (
        <div className="card-simple p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <RotateCcw className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-md font-black text-slate-900 dark:text-white">Nenhuma solicitação de estorno</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Quando um cliente solicitar cancelamento com reembolso, o pedido aparecerá aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {refundRequests.map(req => (
            <div key={req.id} className="card-simple p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#131826] border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">{req.clientName}</h4>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    req.refundStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                    req.refundStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {req.refundStatus === 'PENDING' ? 'Pendente' : req.refundStatus === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {req.timeSlot?.link?.service?.name || req.timeSlot?.link?.title || 'Serviço'} • {req.timeSlot?.date ? formatDate(req.timeSlot.date) : ''}
                </p>
                <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  Valor Pago: <strong className="text-emerald-500">{formatCurrency(req.paidAmount || 0)}</strong>
                </p>
                {req.refundReason && (
                  <p className="text-xs italic text-slate-400 dark:text-slate-500">Motivo: "{req.refundReason}"</p>
                )}
              </div>

              {req.refundStatus === 'PENDING' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleApproveRefund(req.id)}
                    disabled={processingRefundId === req.id}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {processingRefundId === req.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Aprovar Estorno
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRejectRefund(req.id)}
                    disabled={processingRefundId === req.id}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
