import { useState } from 'react'
import {
  X,
  Sparkles,
  ShoppingBag,
  Camera,
  Layers,
  ShieldCheck,
  Bot,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface UpdatesModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UpdateItem {
  id: string
  version: string
  date: string
  title: string
  tag: string
  badgeClass: string
  iconBg: string
  iconColor: string
  icon: any
  description: string
  highlights: string[]
}

export function UpdatesModal({ isOpen, onClose }: UpdatesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'MAJOR' | 'SECURITY'>('ALL')

  if (!isOpen) return null

  const updates: UpdateItem[] = [
    {
      id: 'encomendas',
      version: 'v2.4',
      date: 'Agosto 2026',
      title: 'Módulo BoraEncomenda: Gestão Completa de Encomendas',
      tag: 'Novo Módulo',
      badgeClass: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
      iconBg: 'bg-pink-500/10 border border-pink-500/20',
      iconColor: 'text-pink-400',
      icon: ShoppingBag,
      description:
        'Sistema completo para confeitarias, docerias, gastronomia e artesanato. Receba pedidos sob encomenda com vitrine digital, opções de sabores/recheios, pagamento de entrada no Pix e fluxo de produção.',
      highlights: [
        'Vitrine pública digital de produtos com fotos e prazos de preparo',
        'Campos de personalização do cliente (sabores, dedicatórias, extras)',
        'Cobrança de entrada online configurável (padrão 50%) via Mercado Pago',
        'Kanban de produção em 5 etapas para controle total do ateliê ou cozinha',
        'Link de rastreamento do pedido em tempo real para o cliente final',
      ],
    },
    {
      id: 'photos',
      version: 'v2.3',
      date: 'Agosto 2026',
      title: 'Fotos em Alta Resolução nos Serviços & Upsells',
      tag: 'Visual & UX',
      badgeClass: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      iconBg: 'bg-violet-500/10 border border-violet-500/20',
      iconColor: 'text-violet-400',
      icon: Camera,
      description:
        'Apresente seus serviços e vendas adicionais com fotos de alta qualidade, upload otimizado e exibição destacada no topo da página de agendamento.',
      highlights: [
        'Upload com arrastar e soltar (drag-and-drop) e compressão automática',
        'Hero destacado com imagem, tempo e descrição no topo do fluxo',
        'Miniaturas visuais nos cards de serviços e adicionais no checkout',
      ],
    },
    {
      id: 'business-modes',
      version: 'v2.2',
      date: 'Agosto 2026',
      title: 'Segregação Inteligente de Escopo e Modelo de Negócio',
      tag: 'Personalização',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
      iconColor: 'text-emerald-400',
      icon: Layers,
      description:
        'Painel adaptativo e cadastro personalizado conforme seu modelo de atuação: Serviços Autônomos por Hora, Venda sob Encomenda ou Modelo Híbrido.',
      highlights: [
        'Seleção do modelo de atuação durante o cadastro ou no perfil',
        'Navegação inteligente que prioriza os recursos do seu segmento',
        'Isolamento completo entre catálogo de serviços e catálogo de produtos',
      ],
    },
    {
      id: 'boraia',
      version: 'v2.1',
      date: 'Julho 2026',
      title: 'Assistente Inteligente BoraIA Integrada',
      tag: 'Inteligência Artificial',
      badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      iconBg: 'bg-amber-500/10 border border-amber-500/20',
      iconColor: 'text-amber-400',
      icon: Bot,
      description:
        'IA generativa treinada para negócios locais, gerando mensagens persuasivas para WhatsApp, estratégias promocionais e análise da agenda.',
      highlights: [
        'Redação instantânea de lembretes e campanhas promocionais',
        'Análise preditiva de horários ociosos com sugestões de promoções',
        'Atendimento e insights de faturamento automatizados',
      ],
    },
    {
      id: 'rbac',
      version: 'v2.0',
      date: 'Julho 2026',
      title: 'Controle de Acesso Granular & Segurança Multioperador (RBAC)',
      tag: 'Segurança & RH',
      badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      iconBg: 'bg-blue-500/10 border border-blue-500/20',
      iconColor: 'text-blue-400',
      icon: ShieldCheck,
      description:
        'Controle granular de acesso para colaboradores e operadores, limitando permissões por módulo e garantindo sigilo financeiro.',
      highlights: [
        'Permissões restritas por aba (Agendamentos, Financeiro, Serviços, RH)',
        'Registro detalhado de logs e auditoria de ações',
        'Portal individual de autoatendimento para cada colaborador',
      ],
    },
  ]

  const filteredUpdates = updates.filter(u => {
    if (selectedCategory === 'MAJOR') return u.version.startsWith('v2.4') || u.version.startsWith('v2.3')
    if (selectedCategory === 'SECURITY') return u.id === 'rbac'
    return true
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[88vh] bg-[#0E1424] border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
        
        {/* Top Header */}
        <div className="relative p-6 sm:p-7 border-b border-slate-800/80 bg-[#12192D] flex items-start justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600/20 via-pink-600/20 to-orange-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-md shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  Changelog Oficial
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Atualizações recentes da plataforma
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Novidades & Atualizações
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Conheça os novos recursos desenvolvidos para impulsionar seu faturamento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
            title="Fechar Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub Navigation (Segmented Control Robustíssimo sem desalinhamento) */}
        <div className="px-6 sm:px-7 py-3 border-b border-slate-800/80 bg-[#0B101D]">
          <div className="inline-flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 gap-1 max-w-full overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Todas as Atualizações ({updates.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('MAJOR')}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'MAJOR'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Novos Módulos & Recursos
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('SECURITY')}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'SECURITY'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Segurança & RH
            </button>
          </div>
        </div>

        {/* Updates List (Scrollable com espaçamento confortável) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-5 bg-[#090D18] custom-scrollbar">
          {filteredUpdates.map((item) => {
            const IconComponent = item.icon
            return (
              <div
                key={item.id}
                className="bg-[#131A2D] border border-slate-800/90 hover:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Card Header */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-mono font-bold text-white px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                        {item.version}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${item.badgeClass}`}>
                        {item.tag}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {item.date}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white leading-tight">
                      {item.title}
                    </h4>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {item.description}
                </p>

                {/* Highlights Grid */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Principais Destaques
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-snug text-slate-300 font-medium">
                          {h}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-[#12192D] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400 font-medium text-center sm:text-left">
            Todas as novidades já estão ativas e disponíveis no seu painel.
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              Fechar
            </button>
            <Link
              to="/register"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 hover:opacity-95 transition-all"
            >
              <span>Experimentar Agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
