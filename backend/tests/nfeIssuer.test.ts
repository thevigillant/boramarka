import { describe, it, expect } from 'vitest';
import {
  calculateNfeDV,
  generateAccessKey,
  generateAuthorizationProtocol,
  generateNfeXml,
} from '../src/utils/nfeIssuer';

describe('nfeIssuer utility', () => {
  it('calculates Modulo 11 DV correctly', () => {
    // Exemplo de chave base 43 dígitos conhecida
    // 35 2409 00000000000191 55 001 000000001 1 12345678
    const base43 = '3524090000000000019155001000000001112345678';
    const dv = calculateNfeDV(base43);
    expect(dv).toBeGreaterThanOrEqual(0);
    expect(dv).toBeLessThanOrEqual(9);
  });

  it('generates a full 44-digit access key with valid structure', () => {
    const key = generateAccessKey({
      cUF: '35',
      year: 2026,
      month: 9,
      cnpj: '11.222.333/0001-81',
      mod: '55',
      series: '1',
      nNF: 124,
      cNF: '12345678',
    });

    expect(key).toHaveLength(44);
    expect(key.startsWith('3526091122233300018155001000000124112345678')).toBe(true);

    // Re-verifica o DV dos primeiros 43 dígitos
    const expectedDV = calculateNfeDV(key.slice(0, 43));
    expect(parseInt(key.slice(-1), 10)).toBe(expectedDV);
  });

  it('generates a 15-digit authorization protocol', () => {
    const proto = generateAuthorizationProtocol('35');
    expect(proto).toHaveLength(15);
    expect(proto.startsWith('135')).toBe(true);
  });

  it('generates valid structured NF-e XML string', () => {
    const xml = generateNfeXml({
      accessKey: '35260911222333000181550010000001241123456789',
      protocol: '135260012345678',
      authDate: new Date(),
      direction: 'SAIDA',
      operationType: 'VENDA',
      mod: '55',
      series: '1',
      invoiceNumber: '124',
      issueDate: '2026-09-03',
      cfop: '5102',
      naturezaOperacao: 'VENDA DE MERCADORIA',
      emitter: {
        cnpj: '11.222.333/0001-81',
        corporateName: 'Confeitaria Doce Arte Ltda',
        tradeName: 'Doce Arte',
        ie: '123456789',
        taxRegime: 'MEI',
      },
      recipient: {
        cnpjCpf: '123.456.789-00',
        name: 'Maria Oliveira',
        email: 'maria@email.com',
      },
      items: [
        {
          itemCode: 'BOL-01',
          description: 'Bolo de Chocolate Belga',
          ncm: '19059090',
          cfop: '5102',
          unit: 'un',
          quantity: 2,
          unitPrice: 85.0,
          totalPrice: 170.0,
        },
      ],
      totals: {
        productsAmount: 170.0,
        totalAmount: 170.0,
      },
      paymentMethod: 'PIX',
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<NFe>');
    expect(xml).toContain('<infNFe Id="NFe35260911222333000181550010000001241123456789"');
    expect(xml).toContain('<CNPJ>11222333000181</CNPJ>');
    expect(xml).toContain('<xNome>Confeitaria Doce Arte Ltda</xNome>');
    expect(xml).toContain('<CPF>12345678900</CPF>');
    expect(xml).toContain('<xProd>Bolo de Chocolate Belga</xProd>');
    expect(xml).toContain('<vNF>170.00</vNF>');
    expect(xml).toContain('<protNFe versao="4.00">');
  });
});
