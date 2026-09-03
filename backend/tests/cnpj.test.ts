import { describe, it, expect } from 'vitest';
import { cleanCNPJ, formatCNPJ, isValidCNPJ } from '../src/utils/cnpj';

describe('Backend CNPJ Utilities', () => {
  it('cleanCNPJ remove caracteres não-numéricos e limita a 14 dígitos', () => {
    expect(cleanCNPJ('12.345.678/0001-95')).toBe('12345678000195');
    expect(cleanCNPJ('12345678000195123')).toBe('12345678000195');
    expect(cleanCNPJ(null)).toBe('');
    expect(cleanCNPJ(undefined)).toBe('');
  });

  it('formatCNPJ formata no padrão XX.XXX.XXX/XXXX-XX', () => {
    expect(formatCNPJ('12345678000195')).toBe('12.345.678/0001-95');
  });

  it('isValidCNPJ valida corretamente CNPJs válidos', () => {
    // CNPJ de teste com dígitos verificadores válidos (ex: Banco do Brasil 00.000.000/0001-91)
    expect(isValidCNPJ('00.000.000/0001-91')).toBe(true);
    expect(isValidCNPJ('00000000000191')).toBe(true);
    // Petrobras: 33.000.167/0001-01
    expect(isValidCNPJ('33.000.167/0001-01')).toBe(true);
  });

  it('isValidCNPJ rejeita CNPJs com dígitos repetidos ou inválidos', () => {
    expect(isValidCNPJ('00.000.000/0000-00')).toBe(false);
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
    expect(isValidCNPJ('12.345.678/0001-99')).toBe(false);
    expect(isValidCNPJ('123')).toBe(false);
    expect(isValidCNPJ('')).toBe(false);
  });
});
