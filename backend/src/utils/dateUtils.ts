/**
 * Utilitários de data padronizados para o fuso horário brasileiro (America/Sao_Paulo - GMT-3)
 * Evita bugs de virada antecipada de dia que ocorrem ao usar toISOString() com UTC puro.
 */

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a data no formato YYYY-MM-DD considerando o fuso horário de Brasília
 */
export function getBrazilianDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Retorna a data atual de hoje em formato YYYY-MM-DD no fuso de Brasília
 */
export function getBrazilianToday(): string {
  return getBrazilianDateString(new Date());
}

/**
 * Adiciona N dias à data fornecida respeitando o fuso de Brasília e retorna YYYY-MM-DD
 */
export function addDaysBrazilian(days: number, baseDate: Date = new Date()): string {
  // Ajusta a data base
  const target = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  return getBrazilianDateString(target);
}

/**
 * Calcula a diferença em dias entre duas datas no formato YYYY-MM-DD
 */
export function diffDaysBrazilian(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(`${dateStr1}T12:00:00-03:00`);
  const d2 = new Date(`${dateStr2}T12:00:00-03:00`);
  const diffMs = d1.getTime() - d2.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
