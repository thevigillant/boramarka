import React, { useState } from 'react';
import { Award, Gift, Sparkles, CheckCircle2, Phone, Copy, Check } from 'lucide-react';
import { api } from '../services/api';

interface LoyaltyWidgetProps {
  username: string;
}

export default function LoyaltyWidget({ username }: LoyaltyWidgetProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<{
    enabled: boolean;
    target?: number;
    rewardType?: string;
    rewardValue?: number;
    stampsCount?: number;
    rewardsEarned?: number;
    rewardCouponCode?: string;
  } | null>(null);

  const handleCheckStamps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    try {
      const data = await api.getPublicLoyaltyStatus(username, phone.trim());
      setLoyaltyData(data);
    } catch (err) {
      console.error('Erro ao buscar selos de fidelidade:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="card-simple p-6 bg-gradient-to-br from-[#101625] to-[#171d30] border border-pink-500/20 text-white rounded-3xl shadow-xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-black text-white">Cartão Fidelidade Digital</h3>
          <p className="text-xs text-slate-400 font-medium">Acumule selos e ganhe prêmios e descontos!</p>
        </div>
      </div>

      <form onSubmit={handleCheckStamps} className="flex gap-2">
        <div className="relative flex-1">
          <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="tel"
            placeholder="Digite seu WhatsApp..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-all font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-pink-500/20 cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Consultando...' : 'Ver Cartão'}
        </button>
      </form>

      {loyaltyData && (
        <div className="space-y-4 animate-fade-in pt-2">
          {!loyaltyData.enabled ? (
            <p className="text-xs text-slate-400 italic text-center">Este profissional ainda não ativou o programa de fidelidade.</p>
          ) : (
            <>
              {/* Visual Stamp Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Seus Selos Acumulados</span>
                  <span className="font-black text-pink-400 font-mono">
                    {loyaltyData.stampsCount || 0} / {loyaltyData.target || 10}
                  </span>
                </div>

                {/* Stamp Slots Grid */}
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {Array.from({ length: loyaltyData.target || 10 }).map((_, index) => {
                    const isStamped = index < (loyaltyData.stampsCount || 0);
                    return (
                      <div
                        key={index}
                        className={`h-10 rounded-xl border flex items-center justify-center transition-all ${
                          isStamped
                            ? 'bg-gradient-to-br from-orange-500 to-pink-500 border-pink-400 text-white shadow-md shadow-pink-500/30 scale-105'
                            : 'bg-slate-950/60 border-slate-800 text-slate-600'
                        }`}
                      >
                        {isStamped ? (
                          <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
                        ) : (
                          <span className="text-[10px] font-mono font-bold">{index + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reward Coupon Banner if available */}
              {loyaltyData.rewardCouponCode && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-pink-500/10 to-purple-500/10 border border-emerald-500/30 space-y-2 text-left animate-slide-up">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                    <Gift className="w-4 h-4 text-pink-400" />
                    <span> Recompensa de Fidelidade Disponível!</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Você completou sua cartela! Use o cupom abaixo no seu próximo agendamento para ganhar{' '}
                    <strong>
                      {loyaltyData.rewardType === 'percentage'
                        ? `${loyaltyData.rewardValue}% OFF`
                        : `R$ ${loyaltyData.rewardValue?.toFixed(2)} OFF`}
                    </strong>
                    .
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 bg-slate-950 border border-dashed border-emerald-500/40 px-3 py-1.5 rounded-lg text-center font-mono font-black text-xs text-emerald-400 tracking-wider">
                      {loyaltyData.rewardCouponCode}
                    </div>
                    <button
                      onClick={() => handleCopyCoupon(loyaltyData.rewardCouponCode!)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
