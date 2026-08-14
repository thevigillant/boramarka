import { CreditCard, ExternalLink, X } from 'lucide-react'

interface MpTutorialModalProps {
  showMpTutorialModal: boolean
  setShowMpTutorialModal: (show: boolean) => void
}

export function MpTutorialModal({
  showMpTutorialModal,
  setShowMpTutorialModal,
}: MpTutorialModalProps) {
  if (!showMpTutorialModal) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative animate-scale-in text-left space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#009EE3]/15 text-[#009EE3] flex items-center justify-center font-black">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Como Conectar seu Mercado Pago</h3>
              <p className="text-xs text-slate-400 font-semibold">Passo a passo simples em 30 segundos</p>
            </div>
          </div>
          <button
            onClick={() => setShowMpTutorialModal(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-medium text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-100 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-[#009EE3] text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Clique no link direto para o painel oficial:</p>
              <a
                href="https://www.mercadopago.com.br/developers/panel/app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#009EE3] font-bold underline mt-1"
              >
                Abrir Painel de Desenvolvedores do Mercado Pago <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-100 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-[#009EE3] text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Selecione sua aplicação ou clique em "Criar Aplicação":</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Nomeie como "BoraMarka" se for criar uma nova aplicação.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-100 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-[#009EE3] text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Copie a chave "Access Token de Produção":</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">É o código longo que começa com <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">APP_USR-...</code></p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setShowMpTutorialModal(false)}
            className="px-5 py-2.5 bg-[#009EE3] hover:bg-[#008ac7] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
          >
            Entendi!
          </button>
        </div>
      </div>
    </div>
  )
}
