import { describe, it, expect } from 'vitest';

describe('ERP Production Capacity & Overbooking Prevention', () => {
  function checkDateCapacity(
    maxOrdersPerDay: number,
    ordersOnDate: Array<{ status: string }>
  ): { allowed: boolean; activeCount: number; reason?: string } {
    if (!maxOrdersPerDay || maxOrdersPerDay <= 0) {
      return { allowed: true, activeCount: ordersOnDate.length };
    }

    const activeCount = ordersOnDate.filter((o) =>
      ['PENDENTE', 'CONFIRMADO', 'EM_PRODUCAO'].includes(o.status)
    ).length;

    if (activeCount >= maxOrdersPerDay) {
      return {
        allowed: false,
        activeCount,
        reason: 'Capacidade máxima de produção atingida para esta data.',
      };
    }

    return { allowed: true, activeCount };
  }

  it('permits booking when maxOrdersPerDay is 0 (unlimited capacity)', () => {
    const orders = Array.from({ length: 50 }, () => ({ status: 'CONFIRMADO' }));
    const result = checkDateCapacity(0, orders);
    expect(result.allowed).toBe(true);
    expect(result.activeCount).toBe(50);
  });

  it('permits booking when active orders are below daily capacity', () => {
    const orders = [
      { status: 'CONFIRMADO' },
      { status: 'EM_PRODUCAO' },
    ];
    const result = checkDateCapacity(5, orders);
    expect(result.allowed).toBe(true);
    expect(result.activeCount).toBe(2);
  });

  it('blocks booking when active orders reach daily capacity', () => {
    const orders = [
      { status: 'CONFIRMADO' },
      { status: 'EM_PRODUCAO' },
      { status: 'PENDENTE' },
    ];
    const result = checkDateCapacity(3, orders);
    expect(result.allowed).toBe(false);
    expect(result.activeCount).toBe(3);
    expect(result.reason).toContain('Capacidade máxima');
  });

  it('ignores CANCELADO and DEVOLVIDO orders when checking daily capacity', () => {
    const orders = [
      { status: 'CANCELADO' },
      { status: 'CANCELADO' },
      { status: 'CONFIRMADO' },
    ];
    const result = checkDateCapacity(2, orders);
    expect(result.allowed).toBe(true);
    expect(result.activeCount).toBe(1);
  });
});

describe('ERP Cash Flow Forecasting (Fluxo de Caixa Projetado)', () => {
  function projectCashFlow(
    initialBalance: number,
    timeline: Array<{
      date: string;
      inflows: number;
      outflows: number;
    }>
  ): {
    finalBalance: number;
    minBalance: number;
    hasInsolvencyRisk: boolean;
    dailyBalances: Array<{ date: string; balance: number }>;
  } {
    let running = initialBalance;
    let minBal = initialBalance;
    const dailyBalances: Array<{ date: string; balance: number }> = [];

    for (const day of timeline) {
      running += (day.inflows - day.outflows);
      if (running < minBal) minBal = running;
      dailyBalances.push({ date: day.date, balance: running });
    }

    return {
      finalBalance: running,
      minBalance: minBal,
      hasInsolvencyRisk: minBal < 0,
      dailyBalances,
    };
  }

  it('projects cash balance growth with positive daily net', () => {
    const initial = 1000;
    const timeline = [
      { date: '2026-09-06', inflows: 500, outflows: 200 },
      { date: '2026-09-07', inflows: 800, outflows: 300 },
    ];
    const result = projectCashFlow(initial, timeline);
    expect(result.finalBalance).toBe(1800);
    expect(result.hasInsolvencyRisk).toBe(false);
    expect(result.minBalance).toBe(1000);
  });

  it('detects insolvency risk when outflows exceed balance and inflows', () => {
    const initial = 300;
    const timeline = [
      { date: '2026-09-06', inflows: 100, outflows: 600 }, // 300 + 100 - 600 = -200
      { date: '2026-09-07', inflows: 1000, outflows: 100 }, // -200 + 1000 - 100 = 700
    ];
    const result = projectCashFlow(initial, timeline);
    expect(result.hasInsolvencyRisk).toBe(true);
    expect(result.minBalance).toBe(-200);
    expect(result.finalBalance).toBe(700);
  });
});
