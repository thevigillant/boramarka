import { CheckCircle2, Sparkles, Clock, AlertCircle, Database, Target, Check, CreditCard, Star, Building2, ShieldCheck, Globe, Crown, Zap } from 'lucide-react'

interface FaturamentoTabProps {
  subscription: any
  usageData: any
  handleCheckout: (plan: any) => void
}

export function FaturamentoTab({
  subscription,
  usageData,
  handleCheckout,
}: FaturamentoTabProps) {
  return (
    <div className="animate-slide-up space-y-6 text-left">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Gerenciar Assinatura</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seu plano, faturamento e acesso à plataforma</p>
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
          <h3 id="plans-section" className="text-md font-black text-slate-900 dark:text-white mb-6">Planos Disponíveis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Monthly Card */}
            <div className={`border p-4 sm:p-6 rounded-3xl space-y-6 flex flex-col justify-between transition-all text-left ${
              subscription?.plan === 'mensal' && subscription?.status === 'active'
                ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Plano Básico Mensal</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Ideal para começar e testar</p>
                  </div>
                  {subscription?.plan === 'mensal' && subscription?.status === 'active' && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-orange-500 text-white px-2.5 py-1 rounded-full">Plano Atual</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">R$ 29,90</span>
                  <span className="text-xs text-slate-400 font-bold uppercase">/ mês</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-xl">
                  <Target className="w-3.5 h-3.5 shrink-0" />
                  <span>Para autônomos e estúdios (1 a 5 pessoas)</span>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {[
                    'Até 500 agendamentos por mês',
                    'Até 1.500 clientes salvos na base',
                    'Até 30 serviços e 10 links ativos',
                    'Até 5 colaboradores na equipe',
                    'Cobrança de Sinal via Mercado Pago (Zero No-Show)',
                    'Fluxo de Caixa e Relatórios em PDF/CSV'
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                onClick={() => handleCheckout('mensal')}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                  subscription?.plan === 'mensal' && subscription?.status === 'active'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-md'
                }`}
                disabled={subscription?.plan === 'mensal' && subscription?.status === 'active'}
              >
                <CreditCard className="w-4 h-4" />
                {subscription?.plan === 'mensal' && subscription?.status === 'active' ? 'Plano Ativo' : 'Assinar Mensal'}
              </button>
            </div>

            {/* Annual Card */}
            <div className={`border p-6 rounded-3xl space-y-6 flex flex-col justify-between transition-all text-left relative overflow-hidden ${
              subscription?.plan === 'anual' && subscription?.status === 'active'
                ? 'border-pink-500 bg-pink-500/5 dark:bg-pink-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-10">
                Economize R$ 100
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Plano Básico Anual</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">O melhor custo-benefício</p>
                  </div>
                  {subscription?.plan === 'anual' && subscription?.status === 'active' && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-pink-500 text-white px-2.5 py-1 rounded-full">Plano Atual</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">R$ 260</span>
                  <span className="text-xs text-slate-400 font-bold uppercase">/ ano</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 rounded-xl">
                  <Target className="w-3.5 h-3.5 shrink-0" />
                  <span>Para negócios em expansão (até 20 pessoas)</span>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {[
                    { text: 'Até 2.500 agendamentos/mês & 8.000 clientes', icon: Check },
                    { text: 'Até 20 colaboradores na equipe', icon: Check },
                    { text: 'Venda Casada (Upsell Automatizado)', icon: Sparkles, highlight: true },
                    { text: 'Cartão Fidelidade Digital & Cupons', icon: Star, highlight: true },
                    { text: 'Até 100 serviços e 30 links ativos', icon: Check },
                    { text: 'Economia de R$ 100/ano (~R$ 21,66/mês)', icon: Check }
                  ].map((feat, i) => {
                    const IconComp = feat.icon;
                    return (
                      <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <IconComp className={`w-4 h-4 shrink-0 ${feat.highlight ? 'text-orange-500' : 'text-emerald-500'}`} />
                        <span className={feat.highlight ? 'text-slate-900 dark:text-white font-extrabold' : ''}>{feat.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <button 
                onClick={() => handleCheckout('anual')}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                  subscription?.plan === 'anual' && subscription?.status === 'active'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-xl shadow-pink-500/20 hover:opacity-95'
                }`}
                disabled={subscription?.plan === 'anual' && subscription?.status === 'active'}
              >
                <CreditCard className="w-4 h-4" />
                {subscription?.plan === 'anual' && subscription?.status === 'active' ? 'Plano Ativo' : 'Assinar Anual'}
              </button>
            </div>

            {/* Premium Card */}
            <div className={`border p-6 rounded-3xl space-y-6 flex flex-col justify-between transition-all text-left relative overflow-hidden ${
              subscription?.plan === 'premium' && subscription?.status === 'active'
                ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10 shadow-lg shadow-violet-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <div className="absolute top-3 right-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-10">
                Mais Completo
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Plano Premium</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Domínio próprio e exclusividade</p>
                  </div>
                  {subscription?.plan === 'premium' && subscription?.status === 'active' && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-violet-600 text-white px-2.5 py-1 rounded-full">Plano Atual</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">R$ 79,90</span>
                  <span className="text-xs text-slate-400 font-bold uppercase">/ mês</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 rounded-xl">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-violet-500" />
                  <span>Para empresas e clínicas com equipe & RH</span>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {[
                    { text: 'Módulo Exclusivo de RH & Gestão de Equipe', icon: ShieldCheck, highlight: true },
                    { text: 'Domínio Próprio (agendar.suaempresa.com.br)', icon: Globe, highlight: true },
                    { text: 'Página 100% Whitelabel sem marca BoraMarka', icon: Crown, highlight: true },
                    { text: 'Recursos TOTALMENTE ILIMITADOS (∞)', icon: Zap, highlight: true },
                    { text: 'Notificações Push e Google Calendar', icon: Check },
                    { text: 'Suporte VIP Prioritário 24/7', icon: Check }
                  ].map((feat, i) => {
                    const IconComp = feat.icon;
                    return (
                      <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <IconComp className={`w-4 h-4 shrink-0 ${feat.highlight ? 'text-violet-500' : 'text-emerald-500'}`} />
                        <span className={feat.highlight ? 'text-slate-900 dark:text-white font-extrabold' : ''}>{feat.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <button 
                onClick={() => handleCheckout('premium')}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                  subscription?.plan === 'premium' && subscription?.status === 'active'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:opacity-95'
                }`}
                disabled={subscription?.plan === 'premium' && subscription?.status === 'active'}
              >
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                {subscription?.plan === 'premium' && subscription?.status === 'active' ? 'Plano Ativo' : 'Assinar Premium'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
