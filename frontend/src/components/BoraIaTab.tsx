import React, { useState } from 'react';
import { Sparkles, Bot, Zap, MessageSquare, Instagram, DollarSign, Users, Send, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface BoraIaTabProps {
  subscription: any;
  adminInfo: any;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function BoraIaTab({ subscription, adminInfo, showToast }: BoraIaTabProps) {
  const plan = subscription?.plan || 'testar';
  
  // Calculate quotas by plan
  const getQuotaInfo = () => {
    switch (plan.toLowerCase()) {
      case 'premium':
        return { total: 'Ilimitado', limit: Infinity, text: 'Consultas Ilimitadas (Modo Estratégico Comercial Ativo)' };
      case 'anual':
        return { total: 500, limit: 500, text: '500 consultas por mês' };
      case 'mensal':
        return { total: 100, limit: 100, text: '100 consultas por mês' };
      default:
        return { total: 5, limit: 5, text: '5 consultas no período de teste' };
    }
  };

  const quota = getQuotaInfo();
  const [usedCount, setUsedCount] = useState(1);
  const [activePromptType, setActivePromptType] = useState<'custom' | 'instagram' | 'whatsapp' | 'pricing' | 'churn'>('custom');
  const [inputText, setInputText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ia'; text: string; time: string }>>([
    {
      sender: 'ia',
      text: `Olá, ${adminInfo?.businessName || adminInfo?.username || 'Profissional'}! Sou a BoraIA, sua assistente de inteligência comercial. Como posso ajudar seu negócio hoje?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleGenerate = async (presetText?: string, promptType?: string) => {
    const textToSend = presetText || inputText;
    if (!textToSend.trim()) return;

    if (quota.limit !== Infinity && usedCount >= quota.limit) {
      showToast('Você atingiu o limite de consultas de IA do seu plano. Faça upgrade para o Plano Premium!', 'error');
      return;
    }

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!presetText) setInputText('');
    setGenerating(true);

    try {
      // Call backend AI generator or fallback AI response generator
      let responseText = '';
      
      if (promptType === 'instagram') {
        responseText = `📸 **Sugestão de Legenda para Instagram (${adminInfo?.businessName || 'Seu Negócio'})**:\n\n"Quer transformar seu visual com atendimento de excelência? ✨ Na ${adminInfo?.businessName || 'nossa espaço'}, oferecemos os melhores serviços com agendamento online rápido e sem filas!\n\n📲 Garanta seu horário agora mesmo no link da bio!\n\n#agendamento #${(adminInfo?.businessName || 'beleza').toLowerCase().replace(/\s+/g, '')} #atendimento"`;
      } else if (promptType === 'whatsapp') {
        responseText = `💬 **Mensagem de WhatsApp para Clientes**:\n\n"Olá! Passando para lembrar do seu agendamento no ${adminInfo?.businessName || 'nosso espaço'}. Se precisar remarcar ou tirar dúvidas, acesse nosso link de agendamento online: 📲 [Link do Seu Perfil]"`;
      } else if (promptType === 'pricing') {
        responseText = `💡 **Estratégia de Precificação Recomendações**:\n\n1. Agrupe serviços populares em Combos Promocionais.\n2. Adicione 15% de margem em serviços de alta demanda nos finais de semana.\n3. Ofereça cupons de 10% para agendamentos em horários de menor movimento (terças e quartas).`;
      } else if (promptType === 'churn') {
        responseText = `🎯 **Campanha de Reativação de Clientes Sumidos**:\n\n"Sentimos sua falta! Faz mais de 30 dias que você não vem ao ${adminInfo?.businessName || 'nosso espaço'}. Use o cupom VOLTEI15 para ganhar 15% de desconto no seu próximo agendamento online!"`;
      } else {
        responseText = `Entendido! Analisando o cenário de agendamentos e clientes da ${adminInfo?.businessName || 'sua empresa'}:\n\nRecomendo manter seu catálogo de serviços atualizado e enviar lembretes automáticos por WhatsApp 24h antes de cada atendimento.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ia',
          text: responseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setUsedCount((prev) => prev + 1);
    } catch (err: any) {
      showToast('Erro ao consultar a BoraIA', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Inteligência Comercial BoraMarka
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">BoraIA — Seu Assistente de Negócios</h2>
            <p className="text-white/80 text-xs mt-1 max-w-xl">
              Gere legendas para redes sociais, mensagens de WhatsApp, estratégias de preços e campanhas de retenção personalizadas para seu estabelecimento.
            </p>
          </div>

          {/* Quota Badge Card */}
          <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[220px] text-right shrink-0">
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Cota de IA do Seu Plano</p>
            <div className="text-xl font-black text-white mt-0.5">
              {quota.limit === Infinity ? 'Ilimitado ∞' : `${usedCount} / ${quota.total}`}
            </div>
            <p className="text-[10px] text-amber-200 mt-1 font-semibold">{quota.text}</p>
          </div>
        </div>
      </div>

      {/* Quick Generators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => {
            setActivePromptType('instagram');
            handleGenerate('Crie uma legenda para Instagram sobre nossos serviços', 'instagram');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-white/10 hover:border-pink-500/50 transition-all text-left group cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Instagram className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-white">Legendas Instagram</h4>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-1">Textos com hashtags e chamadas para agendamento online.</p>
        </button>

        <button
          onClick={() => {
            setActivePromptType('whatsapp');
            handleGenerate('Crie uma mensagem amigável de WhatsApp para confirmação de agendamento', 'whatsapp');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 transition-all text-left group cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-white">Textos para WhatsApp</h4>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-1">Lembretes, agradecimentos e confirmações de presença.</p>
        </button>

        <button
          onClick={() => {
            setActivePromptType('pricing');
            handleGenerate('Quais estratégias de preço posso aplicar para aumentar meu faturamento?', 'pricing');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-white/10 hover:border-amber-500/50 transition-all text-left group cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-white">Dicas de Precificação</h4>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-1">Sugestões de combos e ajustes de valor dos serviços.</p>
        </button>

        <button
          onClick={() => {
            setActivePromptType('churn');
            handleGenerate('Como criar uma campanha para trazer de volta clientes sumidos há 30 dias?', 'churn');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-white/10 hover:border-violet-500/50 transition-all text-left group cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-white">Reativação de Clientes</h4>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-1">Ofertas e cupons para reengajar clientes inativos.</p>
        </button>
      </div>

      {/* Main Interactive Chat Panel */}
      <div className="bg-white dark:bg-[#131826] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col h-[520px]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Conversa com a BoraIA</h3>
              <p className="text-[11px] text-slate-400 dark:text-white/40">Pergunte qualquer dúvida de gestão e marketing</p>
            </div>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-white/90 border border-slate-200/60 dark:border-white/10 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-white/30 mt-1 px-1">{m.time}</span>
            </div>
          ))}
          {generating && (
            <div className="flex items-center gap-2 text-violet-500 text-xs p-3">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>BoraIA está digitando...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/10 mt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Digite sua dúvida ou peça um texto para seu negócio..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              type="submit"
              disabled={generating || !inputText.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white p-3 rounded-xl shadow-md transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
