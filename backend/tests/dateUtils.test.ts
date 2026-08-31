import { describe, it, expect } from 'vitest';
import { getBrazilianDateString, getBrazilianToday, addDaysBrazilian, diffDaysBrazilian } from '../src/utils/dateUtils';

describe('dateUtils', () => {
  it('should format date in YYYY-MM-DD format for Brazil timezone', () => {
    const d = new Date('2026-08-31T23:30:00-03:00');
    expect(getBrazilianDateString(d)).toBe('2026-08-31');
  });

  it('should add days correctly in Brazil timezone', () => {
    const d = new Date('2026-08-31T12:00:00-03:00');
    expect(addDaysBrazilian(2, d)).toBe('2026-09-02');
  });

  it('should calculate difference in days correctly', () => {
    expect(diffDaysBrazilian('2026-09-02', '2026-08-31')).toBe(2);
    expect(diffDaysBrazilian('2026-08-31', '2026-08-31')).toBe(0);
  });
});
