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
  Receipt,
  Package,
  CalendarDays,
  Megaphone,
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
      id: 'pdv',
      version: 'v2.8',
      date: 'Setembro 2026',
      title: 'Ponto de Venda (PDV) & Frente de Caixa Integrado',
      tag: 'Novo Módulo',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
      iconColor: 'text-emerald-400',
      icon: Receipt,
      description:
        'Frente de caixa rápida e intuitiva para finalizar atendimentos, vender produtos extras no balcão, registrar pagamentos e emitir recibos digitais via WhatsApp.',
      highlights: [
        'Checkout rápido com suporte a Pix, Dinheiro, Débito e Crédito',
        'Venda combinada de serviços + produtos com cálculo de troco e descontos',
        'Emissão de recibo digital formatado enviado direto para o WhatsApp do cliente',
        'Lançamento automático de receitas no módulo Financeiro e baixa no Estoque',
        'Comissão automática vinculada ao profissional responsável pelo atendimento',
      ],
    },
    {
      id: 'estoque',
      version: 'v2.7',
      date: 'Setembro 2026',
      title: 'Controle de Estoque, Insumos & Reposição Inteligente',
      tag: 'Gestão de Estoque',
      badgeClass: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
      iconBg: 'bg-pink-500/10 border border-pink-500/20',
      iconColor: 'text-pink-400',
      icon: Package,
      description:
        'Controle completo do inventário para produtos de revenda e insumos de uso interno, com histórico de movimentações e alertas automáticos de estoque mínimo.',
      highlights: [
        'Cadastro de itens com preço de custo, preço de venda e margem de lucro',
        'Baixa automática do estoque a cada venda realizada no PDV',
        'Alertas visuais de estoque baixo para prevenir falta de produtos críticos',
        'Registro de entradas, saídas e ajustes manuais com justificativa',
        'Relatórios de capital investido e potencial de faturamento do acervo',
      ],
    },
    {
      id: 'calendario',
      version: 'v2.6',
      date: 'Setembro 2026',
      title: 'Calendário Visual de Agenda (Semanal & Diário)',
      tag: 'Visual & Produtividade',
      badgeClass: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      iconBg: 'bg-violet-500/10 border border-violet-500/20',
      iconColor: 'text-violet-400',
      icon: CalendarDays,
      description:
        'Nova interface estilo Google Calendar para visualizar todos os agendamentos da semana de forma panorâmica, com filtros por dia e confirmações rápidas.',
      highlights: [
        'Visão em grade de 7 colunas com cores intuitivas por status de agendamento',
        'Navegação semanal e diária ágil com indicador de hoje em tempo real',
        'Modal de detalhes rápidos para confirmar, cancelar ou concluir atendimentos',
        'Visualização clara de horários vagos vs ocupados para otimizar a equipe',
      ],
    },
    {
      id: 'fila-marketing',
      version: 'v2.5',
      date: 'Setembro 2026',
      title: 'Fila de Espera Walk-in & Marketing Automático',
      tag: 'Crescimento & Operação',
      badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      iconBg: 'bg-amber-500/10 border border-amber-500/20',
      iconColor: 'text-amber-400',
      icon: Megaphone,
      description:
        'Gerencie clientes sem hora marcada com estimativa de espera e chamadas no WhatsApp. Dispare campanhas automáticas para reativar clientes sumidos há mais de 30 dias.',
      highlights: [
        'Painel em tempo real de clientes na fila com tempo estimado de atendimento',
        'Botão "Chamar Próximo" com abertura instantânea de mensagem no WhatsApp',
        'Segmentação inteligente de contatos: sumidos (+30d), VIPs e frequentes',
        'Modelos prontos de mensagem com tags dinâmicas {nome} e {loja}',
      ],
    },
    {
      id: 'encomendas',
      version: 'v2.4',
      date: 'Agosto 2026',
      title: 'Módulo BoraEnkomenda: Gestão de Encomendas',
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
      title: 'Segregação Inteligente de Escopo de Negócio',
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
      title: 'Controle de Acesso Granular & Segurança Multioperador',
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-[#0E1424] border border-slate-800/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
        
        {/* Top Header */}
        <div className="relative p-4 sm:p-5 border-b border-slate-800/80 bg-[#12192D] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-violet-600/20 via-pink-600/20 to-orange-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  Changelog Oficial
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  Atualizações recentes
                </span>
              </div>
              <h3 className="text-sm sm:text-lg font-black text-white tracking-tight truncate mt-0.5">
                Novidades & Atualizações
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
            title="Fechar Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub Navigation (Segmented Control com Scroll Suave) */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-800/80 bg-[#0B101D] overflow-x-auto no-scrollbar shrink-0">
          <div className="inline-flex items-center p-1 bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`inline-flex items-center justify-center px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Todas ({updates.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('MAJOR')}
              className={`inline-flex items-center justify-center px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'MAJOR'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Novos Módulos
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('SECURITY')}
              className={`inline-flex items-center justify-center px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'SECURITY'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Segurança & RH
            </button>
          </div>
        </div>

        {/* Updates List (Scrollable com paddings refinados) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-3 sm:space-y-4 bg-[#090D18] custom-scrollbar">
          {filteredUpdates.map((item) => {
            const IconComponent = item.icon
            return (
              <div
                key={item.id}
                className="bg-[#131A2D] border border-slate-800/90 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-2.5 sm:space-y-3"
              >
                {/* Card Header */}
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor}`}>
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-white px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                        {item.version}
                      </span>
                      <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full ${item.badgeClass}`}>
                        {item.tag}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {item.date}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                      {item.title}
                    </h4>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-normal">
                  {item.description}
                </p>

                {/* Highlights Grid */}
                <div className="pt-2 sm:pt-2.5 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    Principais Destaques
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5">
                    {item.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] sm:text-[11px] leading-tight text-slate-300">
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
        <div className="p-2.5 sm:p-4 border-t border-slate-800/80 bg-[#12192D] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer text-center"
          >
            Fechar
          </button>
          <Link
            to="/register"
            onClick={onClose}
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 hover:opacity-95 transition-all text-center whitespace-nowrap"
          >
            <span>Testar Agora</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>

      </div>
    </div>
  )
}
