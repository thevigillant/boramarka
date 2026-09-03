import { describe, it, expect } from 'vitest';
import { decodeAccessKey, parseNfeXml } from './nfeXmlParser';

describe('nfeXmlParser', () => {
  const sampleKey = '35230912345678000195550010001048291000000015';

  it('decodeAccessKey extrai corretamente os componentes da chave de 44 dígitos', () => {
    const decoded = decodeAccessKey(sampleKey);
    expect(decoded.isValid).toBe(true);
    expect(decoded.ufCode).toBe('35');
    expect(decoded.yearMonth).toBe('2309');
    expect(decoded.emitterCnpj).toBe('12345678000195');
    expect(decoded.model).toBe('55');
    expect(decoded.series).toBe('1');
    expect(decoded.invoiceNumber).toBe('104829');
    expect(decoded.checkDigit).toBe('5');
  });

  it('decodeAccessKey rejeita chave com tamanho inválido', () => {
    const decoded = decodeAccessKey('12345');
    expect(decoded.isValid).toBe(false);
  });

  it('parseNfeXml extrai dados de um XML de NF-e válido', () => {
    const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35230912345678000195550010001048291000000015" versao="4.00">
      <ide>
        <nNF>104829</nNF>
        <serie>1</serie>
        <natOp>VENDA DE MERCADORIA</natOp>
        <mod>55</mod>
        <dhEmi>2026-09-01T10:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>FORNECEDOR DE MATERIAIS LTDA</xNome>
        <xFant>FORNECEDOR MATERIAIS</xFant>
        <IE>123456789</IE>
        <enderEmit>
          <xLgr>RUA DAS INDUSTRIAS</xLgr>
          <nro>500</nro>
          <xBairro>DISTRITO INDUSTRIAL</xBairro>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01000000</CEP>
          <fone>1133334444</fone>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>98765432000198</CNPJ>
        <xNome>BORAMARKA COMERCIO LTDA</xNome>
        <UF>SP</UF>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PROD-001</cProd>
          <xProd>FARINHA DE TRIGO ESPECIAL 25KG</xProd>
          <NCM>11010010</NCM>
          <CFOP>5102</CFOP>
          <uCom>SC</uCom>
          <qCom>10.0000</qCom>
          <vUnCom>120.5000</vUnCom>
          <vProd>1205.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>PROD-002</cProd>
          <xProd>ACUCAR CRISTAL 50KG</xProd>
          <NCM>17019900</NCM>
          <CFOP>5102</CFOP>
          <uCom>SC</uCom>
          <qCom>5.0000</qCom>
          <vUnCom>180.0000</vUnCom>
          <vProd>900.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vBC>2105.00</vBC>
          <vICMS>378.90</vICMS>
          <vProd>2105.00</vProd>
          <vFrete>50.00</vFrete>
          <vDesc>0.00</vDesc>
          <vNF>2155.00</vNF>
        </ICMSTot>
      </total>
      <cobr>
        <dup>
          <nDup>001/01</nDup>
          <dVenc>2026-09-30</dVenc>
          <vDup>2155.00</vDup>
        </dup>
      </cobr>
      <infAdic>
        <infCpl>Entrega no galpão central.</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
</nfeProc>`;

    const parsed = parseNfeXml(mockXml);
    expect(parsed.success).toBe(true);
    expect(parsed.invoiceNumber).toBe('104829');
    expect(parsed.series).toBe('1');
    expect(parsed.accessKey).toBe('35230912345678000195550010001048291000000015');
    expect(parsed.emitter.cnpj).toBe('12345678000195');
    expect(parsed.emitter.corporateName).toBe('FORNECEDOR DE MATERIAIS LTDA');
    expect(parsed.recipient.cnpj).toBe('98765432000198');
    expect(parsed.totals.productsAmount).toBe(2105);
    expect(parsed.totals.freightAmount).toBe(50);
    expect(parsed.totals.totalAmount).toBe(2155);
    expect(parsed.items.length).toBe(2);
    expect(parsed.items[0].description).toBe('FARINHA DE TRIGO ESPECIAL 25KG');
    expect(parsed.items[0].quantity).toBe(10);
    expect(parsed.items[0].totalPrice).toBe(1205);
    expect(parsed.installments.length).toBe(1);
    expect(parsed.installments[0].amount).toBe(2155);
  });
});
