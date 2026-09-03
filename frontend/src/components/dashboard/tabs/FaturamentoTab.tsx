import { CheckCircle2, Sparkles, Clock, AlertCircle, Database, Target, Check, CreditCard, Star, Building2, ShieldCheck, Globe, Crown, Zap, Calendar, ShoppingBag, Repeat, ArrowRight } from 'lucide-react'

interface FaturamentoTabProps {
  subscription: any
  usageData: any
  handleCheckout: (plan: any) => void
  businessType?: 'SERVICES' | 'PRODUCTS'
  onToggleBusinessType?: (type?: 'SERVICES' | 'PRODUCTS') => void
}

export function FaturamentoTab({
  subscription,
  usageData,
  handleCheckout,
  businessType = 'SERVICES',
  onToggleBusinessType,
}: FaturamentoTabProps) {
  const isProducts = businessType === 'PRODUCTS'

  return (
    <div className="animate-slide-up space-y-6 text-left">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Gerenciar Assinatura & Vertical</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie seu plano, faturamento e alterne entre BoraMarka e BoraEnkomenda
          </p>
        </div>
      </div>

      {/* ═══ VERTICAL SELECTOR / PRODUCT SWITCH CARD ═══ */}
      <div className="card-simple p-5 sm:p-6 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-[#131826] rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Vertical de Operação Ativa
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              {isProducts ? (
                <>
                  <span className="p-1.5 rounded-lg bg-pink-500/15 text-pink-500">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                  <span>BoraEnkomenda — Modo Produção & Cardápio</span>
                </>
              ) : (
                <>
                  <span className="p-1.5 rounded-lg bg-violet-500/15 text-violet-500">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <span>BoraMarka — Modo Serviços & Agendamentos</span>
                </>
              )}
            </h3>
          </div>

          {onToggleBusinessType && (
            <button
              type="button"
              onClick={() => onToggleBusinessType(isProducts ? 'SERVICES' : 'PRODUCTS')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                isProducts
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/20'
                  : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-pink-500/20'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>
                Alternar para {isProducts ? '📅 BoraMarka (Serviços)' : '🧁 BoraEnkomenda (Produção)'}
              </span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className={`p-4 rounded-2xl border transition-all ${
            !isProducts
              ? 'bg-violet-500/10 border-violet-500 text-violet-900 dark:text-violet-200 ring-1 ring-violet-500/30'
              : 'bg-slate-50 dark:bg-[#1A2235]/40 border-slate-200 dark:border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-violet-500" /> BoraMarka (Serviços)
              </span>
              {!isProducts && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-violet-500 text-white uppercase tracking-wider">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed">
              Barbearias, salões, clínicas e estética. Agendamento com sinal Pix anti-falta e controle de horários.
            </p>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${
            isProducts
              ? 'bg-pink-500/10 border-pink-500 text-pink-900 dark:text-pink-200 ring-1 ring-pink-500/30'
              : 'bg-slate-50 dark:bg-[#1A2235]/40 border-slate-200 dark:border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-xs flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-pink-500" /> BoraEnkomenda (Produção)
              </span>
              {isProducts && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-pink-500 text-white uppercase tracking-wider">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed">
              Confeitarias, bolos decorados, salgados e ateliês. Cardápio na bio, sinal 50% Pix e Kanban de produção.
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className="card-simple p-4 sm:p-8 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-[#131826] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Status da Conta</span>
            <div className="flex flex-wrap items-center gap-2">
              {subscription?.status === 'active' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Ativo
                </span>
              )}
              {subscription?.status === 'trialing' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Período de Testes (Trial)
                </span>
              )}
              {subscription?.status === 'pending' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                  <Clock className="w-4 h-4 animate-pulse" /> Pagamento Pendente
                </span>
              )}
              {(!subscription || subscription.status === 'inactive') && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" /> Inativo / Expirado
                </span>
              )}
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                (Plano {subscription?.plan === 'anual' ? 'Anual' : 'Mensal'})
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Validade / Próxima Cobrança</span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block mt-1">
              {subscription?.status === 'active' && subscription.expiresAt
                ? new Date(subscription.expiresAt).toLocaleDateString('pt-BR')
                : subscription?.status === 'trialing' && subscription.trialEndsAt
                ? `${new Date(subscription.trialEndsAt).toLocaleDateString('pt-BR')} (Fim do teste grátis)`
                : subscription?.status === 'pending'
                ? 'Aguardando compensação'
                : 'Expirada'}
            </span>
          </div>
        </div>

        {subscription?.status === 'inactive' && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-red-800 dark:text-red-400 uppercase tracking-wide">Agendamentos Suspensos</h4>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                Sua assinatura expirou e a sua página pública está temporariamente desativada para novos agendamentos dos seus clientes. Escolha um plano abaixo para reativar seu negócio imediatamente.
              </p>
            </div>
          </div>
        )}

        {subscription?.status === 'pending' && (
          <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 p-4 rounded-2xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-yellow-800 dark:text-yellow-400 uppercase tracking-wide">Pagamento em Processamento</h4>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
                Identificamos seu pedido de assinatura. O Mercado Pago está processando a transação. Assim que for confirmed, seu plano será atualizado automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* Resource Usage & Quota Limits Card */}
        {usageData && (
          <div className="bg-slate-50 dark:bg-[#1A2235]/60 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-5 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Uso do Banco de Dados & Armazenamento</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Consumo de cotas do plano ({usageData.plan.toUpperCase()})</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto">
                Ciclo Atual
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Agendamentos */}
              {(() => {
                const used = usageData.usage.bookingsThisMonth;
                const max = usageData.limits.maxBookingsPerMonth;
                const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
                const isHigh = pct >= 85;
                return (
                  <div className="bg-white dark:bg-[#131826] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 dark:text-slate-400">Agendamentos / Mês</span>
                      <span className={isHigh ? 'text-red-500 font-black' : 'text-slate-900 dark:text-white font-black'}>
                        {used} / {max ? max : '∞'}
                      </span>
                    </div>
                    {max ? (
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Sem limite</span>
                    )}
                  </div>
                );
              })()}

              {/* 2. Clientes */}
              {(() => {
                const used = usageData.usage.customers;
                const max = usageData.limits.maxCustomers;
                const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
                const isHigh = pct >= 85;
                return (
                  <div className="bg-white dark:bg-[#131826] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 dark:text-slate-400">Clientes Salvos</span>
                      <span className={isHigh ? 'text-red-500 font-black' : 'text-slate-900 dark:text-white font-black'}>
                        {used} / {max ? max : '∞'}
                      </span>
                    </div>
                    {max ? (
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Sem limite</span>
                    )}
                  </div>
                );
              })()}

              {/* 3. Serviços */}
              {(() => {
                const used = usageData.usage.services;
                const max = usageData.limits.maxServices;
                const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
                const isHigh = pct >= 85;
                return (
                  <div className="bg-white dark:bg-[#131826] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 dark:text-slate-400">Serviços Cadastrados</span>
                      <span className={isHigh ? 'text-red-500 font-black' : 'text-slate-900 dark:text-white font-black'}>
                        {used} / {max ? max : '∞'}
                      </span>
                    </div>
                    {max ? (
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Sem limite</span>
                    )}
                  </div>
                );
              })()}

              {/* 4. Colaboradores */}
              {(() => {
                const used = usageData.usage.employees;
                const max = usageData.limits.maxEmployees;
                const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
                const isHigh = pct >= 85;
                return (
                  <div className="bg-white dark:bg-[#131826] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 dark:text-slate-400">Colaboradores</span>
                      <span className={isHigh ? 'text-red-500 font-black' : 'text-slate-900 dark:text-white font-black'}>
                        {used} / {max ? max : '∞'}
                      </span>
                    </div>
                    {max ? (
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Sem limite</span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Plan Options */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 id="plans-section" className="text-md font-black text-slate-900 dark:text-white">
                Planos Oficiais — {isProducts ? 'BoraEnkomenda (Produção)' : 'BoraMarka (Serviços)'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                {isProducts 
                  ? 'Planos desenhados para confeitarias, ateliês e encomendas sob medida.' 
                  : 'Planos desenhados para barbeiros, salões, clínicas e serviços com agendamento.'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isProducts ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 'bg-violet-500/10 text-violet-500 border border-violet-500/20'
            }`}>
              {isProducts ? '🧁 Cardápio & Produção' : '📅 Agenda & Serviços'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Solo (Essencial / Ateliê) */}
            <div className={`border p-4 sm:p-6 rounded-3xl space-y-6 flex flex-col justify-between transition-all text-left ${
              (subscription?.plan === 'mensal' || subscription?.plan === 'essencial' || subscription?.plan === 'atelie') && subscription?.status === 'active'
                ? (isProducts ? 'border-pink-500 bg-pink-500/5 dark:bg-pink-500/10' : 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10')
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      {isProducts ? 'Plano Ateliê' : 'Plano Essencial'}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      {isProducts ? 'Para quem produz em casa ou solo' : 'Ideal para autônomos e atendimento solo'}
                    </p>
                  </div>
                  {((subscription?.plan === 'mensal' || subscription?.plan === 'essencial' || subscription?.plan === 'atelie') && subscription?.status === 'active') && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-full">Plano Atual</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">R$ 39,90</span>
                  <span className="text-xs text-slate-400 font-bold uppercase">/ mês</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-xl">
                  <Target className="w-3.5 h-3.5 shrink-0" />
                  <span>{isProducts ? '1 confeiteiro / artesão solo' : '1 profissional autônomo'}</span>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {(isProducts ? [
                    'Cardápio digital na bio do Instagram',
                    'Sinal Pix de 50% antecipado (Zero calote)',
                    'Kanban de produção visual e prazos',
                    'Até 100 pedidos por mês',
                    'Relatórios básicos de faturamento',
                  ] : [
                    'Agenda online por horário para clientes',
                    'Sinal Pix no agendamento (Zero No-Show)',
                    'Até 500 agendamentos por mês',
                    'Até 1.500 clientes salvos na base',
                    'Lembretes via WhatsApp',
                  ]).map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                onClick={() => handleCheckout(isProducts ? 'atelie' : 'essencial')}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                  (subscription?.plan === 'mensal' || subscription?.plan === 'essencial' || subscription?.plan === 'atelie') && subscription?.status === 'active'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-md'
                }`}
                disabled={(subscription?.plan === 'mensal' || subscription?.plan === 'essencial' || subscription?.plan === 'atelie') && subscription?.status === 'active'}
              >
                <CreditCard className="w-4 h-4" />
                {(subscription?.plan === 'mensal' || subscription?.plan === 'essencial' || subscription?.plan === 'atelie') && subscription?.status === 'active' ? 'Plano Ativo' : 'Assinar'}
              </button>
            </div>

            {/* Card 2: Pro (Confeitaria Pro / BoraMarka Pro) */}
            <div className={`border p-6 rounded-3xl space-y-6 flex flex-col justify-between transition-all text-left relative overflow-hidden ${
              (subscription?.plan === 'pro' || subscription?.plan === 'confeitaria_pro') && subscription?.status === 'active'
                ? (isProducts ? 'border-pink-500 bg-pink-500/10 ring-2 ring-pink-500/30' : 'border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/30')
                : (isProducts ? 'border-pink-500/40 bg-pink-500/5' : 'border-violet-500/40 bg-violet-500/5')
            }`}>
              <div className={`absolute top-3 right-3 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-10 ${
                isProducts ? 'bg-gradient-to-r from-pink-500 to-rose-600' : 'bg-gradient-to-r from-violet-600 to-pink-600'
              }`}>
                Mais Escolhido
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      {isProducts ? 'Confeitaria Pro' : 'BoraMarka Pro'}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      {isProducts ? 'Gestão completa de produção e compras' : 'Para salões, clínicas e estúdios com equipe'}
                    </p>
                  </div>
                  {((subscription?.plan === 'pro' || subscription?.plan === 'confeitaria_pro') && subscription?.status === 'active') && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-full">Plano Atual</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {isProducts ? 'R$ 69,90' : 'R$ 59,90'}
                  </span>
                  <span className="text-xs text-slate-400 font-bold uppercase">/ mês</span>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border ${
                  isProducts ? 'text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/20' : 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{isProducts ? 'Lista de compras + Kanban avançado' : 'Até 10 colaboradores + comissões'}</span>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {(isProducts ? [
                    'Lista automática de compras para supermercado',
                    'Kanban com alertas de atraso e etapas',
                    'Controle de estoque de insumos e embalagens',
                    'Equipe de ajudantes de confeitaria',
                    'Pedidos ilimitados & cupons promocionais',
                    'Fluxo de caixa e faturamento detalhado',
                  ] : [
                    'Até 10 colaboradores na equipe com comissões',
                    'Agendamentos e clientes ilimitados',
                    'Controle de estoque e produtos de revenda',
                    'Venda Casada (Upsell Automatizado)',
                    'Fila de espera walk-in no WhatsApp',
                    'Fluxo de Caixa e Relatórios em PDF/CSV',
                  ]).map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => handleCheckout(isProducts ? 'confeitaria_pro' : 'pro')}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                  (subscription?.plan === 'pro' || subscription?.plan === 'confeitaria_pro') && subscription?.status === 'active'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : isProducts
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-xl shadow-pink-500/25 hover:opacity-95'
                    : 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-xl shadow-violet-500/25 hover:opacity-95'
                }`}
                disabled={(subscription?.plan === 'pro' || subscription?.plan === 'confeitaria_pro') && subscription?.status === 'active'}
              >
                <CreditCard className="w-4 h-4" />
                {(subscription?.plan === 'pro' || subscription?.plan === 'confeitaria_pro') && subscription?.status === 'active' ? 'Plano Ativo' : 'Assinar Plano Pro'}
              </button>
            </div>

            {/* Card 3: VIP (Gourmet VIP / Studio VIP) */}
            <div className={`border p-6 rounded-3xl space-y-6 flex flex-col justify-between transition-all text-left relative overflow-hidden ${
              (subscription?.plan === 'vip' || subscription?.plan === 'gourmet_vip' || subscription?.plan === 'premium') && subscription?.status === 'active'
                ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-10 flex items-center gap-1">
                <Crown className="w-3 h-3 text-slate-950" /> VIP Ilimitado
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      {isProducts ? 'Gourmet VIP' : 'Studio VIP'}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      Domínio próprio, whitelabel e suporte prioritário
                    </p>
                  </div>
                  {((subscription?.plan === 'vip' || subscription?.plan === 'gourmet_vip' || subscription?.plan === 'premium') && subscription?.status === 'active') && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full font-black">VIP Ativo</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {isProducts ? 'R$ 99,90' : 'R$ 89,90'}
                  </span>
                  <span className="text-xs text-slate-400 font-bold uppercase">/ mês</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl">
                  <Crown className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span>Para ateliês e clínicas com alta demanda</span>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {[
                    'Domínio Próprio mapeado na sua página',
                    'Página 100% Whitelabel sem menção externa',
                    'Recursos e limites TOTALMENTE ILIMITADOS (∞)',
                    'Módulo de RH e Controle de Acesso por Operador',
                    'Notificações Push e Relatórios Executivos',
                    'Atendimento Direto e Suporte VIP 24/7',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => handleCheckout(isProducts ? 'gourmet_vip' : 'vip')}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                  (subscription?.plan === 'vip' || subscription?.plan === 'gourmet_vip' || subscription?.plan === 'premium') && subscription?.status === 'active'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-xl shadow-amber-500/20 hover:opacity-95'
                }`}
                disabled={(subscription?.plan === 'vip' || subscription?.plan === 'gourmet_vip' || subscription?.plan === 'premium') && subscription?.status === 'active'}
              >
                <Crown className="w-4 h-4" />
                {(subscription?.plan === 'vip' || subscription?.plan === 'gourmet_vip' || subscription?.plan === 'premium') && subscription?.status === 'active' ? 'Plano Ativo' : 'Assinar VIP'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
