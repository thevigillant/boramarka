import { useState, useEffect, useCallback } from 'react'
import {
  Megaphone, Users, Sparkles, Send, Gift, Clock, RefreshCw,
  Plus, MessageSquare, CheckCircle2, Copy, Trash2, Edit2,
  Calendar, Zap, Star, ExternalLink, Loader2, AlertCircle, Check
} from 'lucide-react'
import { api } from '../../../services/api'
import { formatCurrency } from '../../../utils/dashboardHelpers'

interface CampaignData {
  id: number
  name: string
  type: 'REATIVACAO' | 'ANIVERSARIO' | 'INDICACAO' | 'PROMOCAO'
  trigger: string
  messageTemplate: string
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  sentCount: number
  scheduledAt?: string
  createdAt: string
}

interface SegmentData {
  total: number
  inactive30days: number
  inactive60days: number
  vip: number
  frequent: number
}

interface MarketingTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void
}

const CAMPAIGN_TEMPLATES = [
  {
    type: 'REATIVACAO',
    title: 'Reativação de Clientes Sumidos (+30 dias)',
    badge: 'Alta Conversão',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: Clock,
    iconColor: 'text-emerald-400 bg-emerald-500/10',
    description: 'Resgate clientes que não agendam há mais de 30 dias com uma oferta especial.',
    template: 'Olá {nome}! Tudo bem? Sentimos sua falta aqui na {loja}. Que tal agendar seu horário essa semana? Preparamos um desconto especial de 15% pra você! Responda aqui para garantir seu horário 🚀',
  },
  {
    type: 'ANIVERSARIO',
    title: 'Campanha de Aniversariantes',
    badge: 'Fidelização',
    badgeColor: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    icon: Gift,
    iconColor: 'text-pink-400 bg-pink-500/10',
    description: 'Surpreenda seus clientes no mês do aniversário com um mimo ou desconto exclusivo.',
    template: 'Parabéns {nome}! 🎂 A equipe da {loja} deseja muitas felicidades! No seu mês de aniversário, você tem um presente exclusivo com a gente. Venha comemorar cuidando de você!',
  },
  {
    type: 'PROMOCAO',
    title: 'Promoção Relâmpago / Encher Agenda',
    badge: 'Giro Rápido',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Zap,
    iconColor: 'text-amber-400 bg-amber-500/10',
    description: 'Preencha horários vagos e impulsione o faturamento em dias de menor movimento.',
    template: 'E aí {nome}! Abrimos alguns horários especiais hoje e amanhã na {loja} com condição exclusiva. Não deixe para última hora, garanta o seu horário antes que esgote!',
  },
  {
    type: 'INDICACAO',
    title: 'Programa Indique & Ganhe',
    badge: 'Crescimento',
    badgeColor: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    icon: Users,
    iconColor: 'text-violet-400 bg-violet-500/10',
    description: 'Incentive seus clientes atuais a trazerem novos amigos em troca de benefícios.',
    template: 'Olá {nome}! Sabia que indicando um amigo para a {loja}, vocês dois ganham R$ 15 de crédito no próximo atendimento? É só ele avisar que foi indicado por você!',
  },
]

export function MarketingTab({ showToast }: MarketingTabProps) {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [segments, setSegments] = useState<SegmentData>({
    total: 0,
    inactive30days: 0,
    inactive60days: 0,
    vip: 0,
    frequent: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [campaignName, setCampaignName] = useState('')
  const [campaignType, setCampaignType] = useState<'REATIVACAO' | 'ANIVERSARIO' | 'INDICACAO' | 'PROMOCAO'>('REATIVACAO')
  const [messageTemplate, setMessageTemplate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Dispatch links modal
  const [dispatchResults, setDispatchResults] = useState<{
    message: string
    totalContacts: number
    whatsappLinks: { name: string; phone: string; link: string }[]
  } | null>(null)
  const [showDispatchModal, setShowDispatchModal] = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [campsRes, segsRes] = await Promise.all([
        api.request('/marketing/campaigns').catch(() => []),
        api.request('/marketing/segments').catch(() => ({
          total: 0, inactive30days: 0, inactive60days: 0, vip: 0, frequent: 0
        })),
      ])
      setCampaigns(campsRes || [])
      setSegments(segsRes)
    } catch (err: any) {
      if (!silent) showToast('Erro ao carregar campanhas.', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleUseTemplate(tpl: typeof CAMPAIGN_TEMPLATES[0]) {
    setCampaignName(tpl.title)
    setCampaignType(tpl.type as any)
    setMessageTemplate(tpl.template)
    setShowModal(true)
  }

  async function handleSaveCampaign(e: React.FormEvent) {
    e.preventDefault()
    if (!campaignName.trim() || !messageTemplate.trim()) {
      return showToast('Preencha o nome e o modelo da mensagem.', 'error')
    }

    setSubmitting(true)
    try {
      await api.request('/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: campaignName,
          type: campaignType,
          messageTemplate,
        }),
      })
      showToast('🎉 Campanha criada com sucesso!', 'success')
      setShowModal(false)
      setCampaignName('')
      setMessageTemplate('')
      fetchData(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar campanha.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTriggerCampaign(campaign: CampaignData) {
    try {
      const res = await api.request(`/marketing/campaigns/${campaign.id}/send`, { method: 'POST' })
      setDispatchResults(res)
      setShowDispatchModal(true)
      showToast(res.message || 'Disparos preparados!', 'success')
      fetchData(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao disparar campanha.', 'error')
    }
  }

  async function handleDeleteCampaign(id: number) {
    if (!confirm('Deseja realmente remover esta campanha?')) return
    try {
      await api.request(`/marketing/campaigns/${id}`, { method: 'DELETE' })
      showToast('Campanha excluída.', 'success')
      fetchData(true)
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir campanha.', 'error')
    }
  }

  return (
    <div className="animate-slide-up space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Campanhas de Marketing & Reativação</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Recupere clientes inativos, fidelize aniversariantes e preencha sua agenda com inteligência.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setCampaignName('')
              setCampaignType('REATIVACAO')
              setMessageTemplate(CAMPAIGN_TEMPLATES[0].template)
              setShowModal(true)
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black py-2.5 px-5 rounded-xl transition-all shadow-md shadow-pink-500/20 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Campanha</span>
          </button>
        </div>
      </div>

      {/* ── Segment KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-simple p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Base de Contatos</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{segments.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Clientes cadastrados</p>
        </div>

        <div className="card-simple p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Sumidos (+30 dias)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-500 mt-2">{segments.inactive30days}</p>
          <p className="text-[11px] text-amber-400/80 mt-0.5">Prontos para reativação</p>
        </div>

        <div className="card-simple p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clientes VIPs</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{segments.vip}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">10+ atendimentos realizados</p>
        </div>

        <div className="card-simple p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Frequentes</span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{segments.frequent}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">5+ agendamentos</p>
        </div>
      </div>

      {/* ── Ready Campaign Templates ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" /> Modelos Prontos de Alta Conversão
          </h3>
          <span className="text-xs text-slate-400">1-Clique para ativar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CAMPAIGN_TEMPLATES.map((tpl, i) => {
            const Icon = tpl.icon
            return (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-pink-500/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tpl.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${tpl.badgeColor}`}>
                      {tpl.badge}
                    </span>
                  </div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white leading-snug mb-1">
                    {tpl.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <button
                  onClick={() => handleUseTemplate(tpl)}
                  className="mt-3.5 w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-gradient-to-r hover:from-orange-500 hover:to-pink-500 text-slate-700 dark:text-slate-300 hover:text-white rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Usar Modelo</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Active Campaigns List ── */}
      <div className="space-y-3">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-violet-500" /> Suas Campanhas Criadas
        </h3>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white/40 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-40" />
            <p className="text-xs text-slate-400 font-medium">Nenhuma campanha personalizada ainda.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Escolha um dos modelos acima ou crie uma campanha do zero.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {campaigns.map(camp => (
              <div
                key={camp.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-slate-900 dark:text-white truncate">{camp.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      {camp.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      camp.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {camp.status === 'ACTIVE' ? 'Disparada' : 'Rascunho'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                    "{camp.messageTemplate}"
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                    <span>Impactos: <strong className="text-pink-500">{camp.sentCount}</strong> clientes</span>
                    <span>Criada em: {new Date(camp.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleTriggerCampaign(camp)}
                    className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black text-xs rounded-xl shadow-md shadow-pink-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCampaign(camp.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal: Criar / Configurar Campanha ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-lg p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Configurar Campanha</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Nome da Campanha *</label>
                <input
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="Ex: Reativação Clientes Sumidos - Março"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Objetivo / Tipo</label>
                <select
                  value={campaignType}
                  onChange={e => setCampaignType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500"
                >
                  <option value="REATIVACAO">Reativação (+30 dias sem agendar)</option>
                  <option value="ANIVERSARIO">Aniversário do Cliente</option>
                  <option value="PROMOCAO">Promoção Relâmpago / Todos os Contatos</option>
                  <option value="INDICACAO">Indique & Ganhe</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Texto da Mensagem (WhatsApp) *</label>
                  <span className="text-[10px] text-pink-500 font-bold">Tags: &#123;nome&#125;, &#123;loja&#125;</span>
                </div>
                <textarea
                  value={messageTemplate}
                  onChange={e => setMessageTemplate(e.target.value)}
                  rows={5}
                  placeholder="Escreva a mensagem personalizada..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-pink-500 resize-none leading-relaxed"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  As tags <code>&#123;nome&#125;</code> e <code>&#123;loja&#125;</code> serão substituídas automaticamente pelo nome do cliente e do seu estabelecimento.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black rounded-xl shadow-md flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Salvar Campanha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Links de Disparo WhatsApp ── */}
      {showDispatchModal && dispatchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDispatchModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-lg p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Disparos Preparados</h3>
                <p className="text-xs text-pink-500 font-bold">{dispatchResults.totalContacts} cliente(s) selecionado(s)</p>
              </div>
              <button onClick={() => setShowDispatchModal(false)} className="p-1 text-slate-400 hover:text-white">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clique no botão ao lado de cada cliente para abrir a conversa no WhatsApp já com a mensagem personalizada pronta para envio:
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {dispatchResults.whatsappLinks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.phone}</p>
                  </div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDispatchModal(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
