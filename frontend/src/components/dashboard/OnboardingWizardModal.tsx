import { useState } from 'react'
import { Sparkles, CheckCircle2, Copy, ExternalLink, Scissors, Clock, DollarSign, ArrowRight, X, Store, Link2 } from 'lucide-react'

interface OnboardingWizardModalProps {
  isOpen: boolean
  onClose: () => void
  businessName: string
  publicLinkToken?: string
  onCreateService?: (name: string, price: number, duration: number) => Promise<void>
}

export function OnboardingWizardModal({
  isOpen,
  onClose,
  businessName,
  publicLinkToken = 'agendar',
  onCreateService
}: OnboardingWizardModalProps) {
  const [step, setStep] = useState(1)
  const [serviceName, setServiceName] = useState('Atendimento Padrão')
  const [servicePrice, setServicePrice] = useState('40')
  const [serviceDuration, setServiceDuration] = useState('30')
  const [savingService, setSavingService] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  if (!isOpen) return null

  const bookingUrl = `${window.location.origin}/agendar/${publicLinkToken}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleSaveService = async () => {
    if (onCreateService && serviceName.trim()) {
      setSavingService(true)
      try {
        await onCreateService(
          serviceName.trim(),
          parseFloat(servicePrice) || 30,
          parseInt(serviceDuration) || 30
        )
      } catch (err) {
        console.error('Erro ao salvar serviço inicial:', err)
      } finally {
        setSavingService(false)
      }
    }
    setStep(3)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0b0e1a] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-violet-950/50 relative overflow-hidden text-white">
        
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-pink-600 to-emerald-400" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-2 justify-center mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                s === step
                  ? 'w-8 bg-gradient-to-r from-violet-500 to-pink-500'
                  : s < step
                  ? 'w-4 bg-emerald-500'
                  : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: WELCOME & LOJA */}
        {step === 1 && (
          <div className="text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-pink-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 mx-auto shadow-lg shadow-violet-500/20">
              <Store className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Bem-vindo ao BoraMarka!
              </div>
              <h3 className="text-2xl font-black text-white">
                {businessName || 'Sua Loja'} no Ar!
              </h3>
              <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
                Sua plataforma de agendamento automático foi configurada com sucesso. Vamos cadastrar seu 1º serviço em 15 segundos!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left space-y-2">
              <div className="flex items-center gap-2.5 text-xs text-emerald-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Atendente Virtual no WhatsApp ativado</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cobrança de Sinal PIX pronta</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>7 Dias de Teste Grátis ativos</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-violet-600 via-pink-600 to-rose-600 text-xs font-extrabold text-white shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
            >
              <span>Cadastrar Primeiro Serviço</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: CADASTRAR 1º SERVIÇO */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto mb-3 shadow-md">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Cadastre seu 1º Serviço</h3>
              <p className="text-xs text-slate-400 mt-1">Exemplo: Corte de Cabelo, Designer de Sobrancelhas, Banho & Tosa</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1">Nome do Serviço</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Corte Masculino Degradê"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-pink-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1">Preço (R$)</label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                    <input
                      type="number"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white outline-none focus:border-pink-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1">Duração (Min)</label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                    <input
                      type="number"
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white outline-none focus:border-pink-500 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(3)}
                className="w-1/3 py-3 rounded-full bg-white/[0.05] border border-white/10 text-xs font-semibold text-white/60 hover:text-white"
              >
                Pular
              </button>
              <button
                onClick={handleSaveService}
                disabled={savingService || !serviceName.trim()}
                className="w-2/3 py-3 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5"
              >
                {savingService ? 'Salvando...' : 'Avançar →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LINK PRONTO! */}
        {step === 3 && (
          <div className="text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
              <Link2 className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3 h-3" /> Tudo Pronto!
              </div>
              <h3 className="text-2xl font-black text-white">Seu Link de Agendamento</h3>
              <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto mt-1">
                Cole este link na Bio do seu Instagram e WhatsApp. Seus clientes agendarão sozinhos!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/15 text-left flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-semibold text-violet-300 truncate">
                {bookingUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-[11px] font-bold text-white flex items-center gap-1 shrink-0 transition-colors"
              >
                {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <a
                href={bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="w-1/2 py-3 rounded-full bg-white/[0.06] border border-white/10 text-xs font-bold text-white hover:bg-white/10 flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver como Cliente
              </a>
              <button
                onClick={onClose}
                className="w-1/2 py-3 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-xs font-extrabold text-white shadow-lg flex items-center justify-center gap-1.5"
              >
                Ir ao Painel →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
