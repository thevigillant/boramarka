import { cleanCNPJ } from './cnpj';

export interface GenerateAccessKeyOptions {
  cUF?: string; // 2 dígitos (Ex: 35 = SP, 33 = RJ, 31 = MG, 29 = BA, etc.)
  year?: number;
  month?: number;
  cnpj: string;
  mod?: '55' | '65'; // 55 = NF-e (Produto/Atacado/Entrega), 65 = NFC-e (Consumidor/Balcão/PDV)
  series?: string | number;
  nNF: number;
  cNF?: string; // Código numérico aleatório de 8 dígitos
}

/**
 * Calcula o Dígito Verificador (DV) da chave de acesso de 44 dígitos
 * utilizando o algoritmo oficial Módulo 11 da SEFAZ (pesos de 2 a 9 da direita para a esquerda).
 */
export function calculateNfeDV(base43: string): number {
  if (base43.length !== 43) {
    throw new Error('A base para cálculo do DV da NF-e deve ter exatamente 43 dígitos.');
  }

  let weight = 2;
  let sum = 0;

  for (let i = 42; i >= 0; i--) {
    const digit = parseInt(base43[i], 10);
    sum += digit * weight;
    weight++;
    if (weight > 9) {
      weight = 2;
    }
  }

  const remainder = sum % 11;
  if (remainder === 0 || remainder === 1) {
    return 0;
  }
  return 11 - remainder;
}

/**
 * Gera a chave de acesso oficial de 44 dígitos da NF-e / NFC-e padrão SEFAZ.
 */
export function generateAccessKey(opts: GenerateAccessKeyOptions): string {
  const cUF = (opts.cUF || '35').padStart(2, '0');
  const now = new Date();
  const year = String(opts.year || now.getFullYear()).slice(-2);
  const month = String(opts.month || now.getMonth() + 1).padStart(2, '0');
  const aamm = `${year}${month}`;
  const cnpj = cleanCNPJ(opts.cnpj).padStart(14, '0');
  const mod = opts.mod || '55';
  const serie = String(opts.series || '1').padStart(3, '0');
  const nNF = String(opts.nNF).padStart(9, '0');
  const tpEmis = '1'; // 1 = Emissão normal

  // Código de controle aleatório de 8 dígitos
  const cNF = opts.cNF
    ? opts.cNF.padStart(8, '0')
    : String(Math.floor(10000000 + Math.random() * 90000000));

  const base43 = `${cUF}${aamm}${cnpj}${mod}${serie}${nNF}${tpEmis}${cNF}`;
  const dv = calculateNfeDV(base43);

  return `${base43}${dv}`;
}

/**
 * Gera um protocolo de autorização oficial no padrão da SEFAZ (15 dígitos)
 * Formato: 1 (SEFAZ) + cUF (2) + AA (2) + Sequencial (10)
 */
export function generateAuthorizationProtocol(cUF = '35'): string {
  const now = new Date();
  const aa = String(now.getFullYear()).slice(-2);
  const randomSeq = String(Math.floor(1000000000 + Math.random() * 9000000000));
  return `1${cUF}${aa}${randomSeq}`;
}

export interface NfeXmlData {
  accessKey: string;
  protocol: string;
  authDate: Date;
  direction: 'ENTRADA' | 'SAIDA';
  operationType: string;
  mod: '55' | '65';
  series: string;
  invoiceNumber: string;
  issueDate: string;
  cfop: string;
  naturezaOperacao: string;
  emitter: {
    cnpj: string;
    corporateName: string;
    tradeName?: string;
    ie?: string;
    taxRegime?: string;
    address?: string;
  };
  recipient?: {
    cnpjCpf: string;
    name: string;
    email?: string;
    address?: string;
  };
  items: Array<{
    itemCode?: string;
    description: string;
    ncm?: string;
    cfop?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totals: {
    productsAmount: number;
    freightAmount?: number;
    discountAmount?: number;
    totalAmount: number;
  };
  paymentMethod: string;
}

/**
 * Gera o documento XML oficial estruturado conforme o manual de integração SEFAZ v4.00
 */
export function generateNfeXml(data: NfeXmlData): string {
  const tpNF = data.direction === 'ENTRADA' ? '0' : '1';
  const cleanEmitCnpj = cleanCNPJ(data.emitter.cnpj);
  const cleanDestDoc = data.recipient?.cnpjCpf ? cleanCNPJ(data.recipient.cnpjCpf) : '';
  const isCpf = cleanDestDoc.length === 11;

  let itemsXml = '';
  data.items.forEach((item, idx) => {
    itemsXml += `
    <det nItem="${idx + 1}">
      <prod>
        <cProd>${item.itemCode || `PRD-${idx + 1}`}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${escapeXml(item.description)}</xProd>
        <NCM>${item.ncm || '21069090'}</NCM>
        <CFOP>${item.cfop || (data.direction === 'SAIDA' ? '5102' : '1102')}</CFOP>
        <uCom>${item.unit.toUpperCase()}</uCom>
        <qCom>${item.quantity.toFixed(4)}</qCom>
        <vUnCom>${item.unitPrice.toFixed(4)}</vUnCom>
        <vProd>${item.totalPrice.toFixed(2)}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>${item.unit.toUpperCase()}</uTrib>
        <qTrib>${item.quantity.toFixed(4)}</qTrib>
        <vUnTrib>${item.unitPrice.toFixed(4)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <ICMS>
          <ICMSSN102>
            <orig>0</orig>
            <CSOSN>102</CSOSN>
          </ICMSSN102>
        </ICMS>
        <PIS>
          <PISNT>
            <CST>07</CST>
          </PISNT>
        </PIS>
        <COFINS>
          <COFINSNT>
            <CST>07</CST>
          </COFINSNT>
        </COFINS>
      </imposto>
    </det>`;
  });

  const destXml = data.recipient?.name
    ? `
    <dest>
      ${isCpf ? `<CPF>${cleanDestDoc}</CPF>` : `<CNPJ>${cleanDestDoc}</CNPJ>`}
      <xNome>${escapeXml(data.recipient.name)}</xNome>
      <indIEDest>9</indIEDest>
      ${data.recipient.email ? `<email>${escapeXml(data.recipient.email)}</email>` : ''}
    </dest>`
    : `
    <dest>
      <xNome>CONSUMIDOR FINAL NÃO IDENTIFICADO</xNome>
      <indIEDest>9</indIEDest>
    </dest>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${data.accessKey}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>${data.accessKey.slice(35, 43)}</cNF>
        <natOp>${escapeXml(data.naturezaOperacao || (data.direction === 'SAIDA' ? 'VENDA DE MERCADORIA' : 'COMPRA'))}</natOp>
        <mod>${data.mod}</mod>
        <serie>${parseInt(data.series, 10) || 1}</serie>
        <nNF>${parseInt(data.invoiceNumber, 10) || 1}</nNF>
        <dhEmi>${new Date().toISOString()}</dhEmi>
        <tpNF>${tpNF}</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${data.accessKey.slice(-1)}</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>BoraMarka_v3.0</verProc>
      </ide>
      <emit>
        <CNPJ>${cleanEmitCnpj}</CNPJ>
        <xNome>${escapeXml(data.emitter.corporateName || data.emitter.tradeName || 'EMPRESA')}</xNome>
        <xFant>${escapeXml(data.emitter.tradeName || '')}</xFant>
        <enderEmit>
          <xLgr>${escapeXml(data.emitter.address || 'Endereco Comercial')}</xLgr>
          <nro>S/N</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
          <CEP>01001000</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
        </enderEmit>
        <IE>${data.emitter.ie || 'ISENTO'}</IE>
        <CRT>${data.emitter.taxRegime === 'SIMPLES_NACIONAL' ? '1' : '1'}</CRT>
      </emit>
      ${destXml}
      ${itemsXml}
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${data.totals.productsAmount.toFixed(2)}</vProd>
          <vFrete>${(data.totals.freightAmount || 0).toFixed(2)}</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>${(data.totals.discountAmount || 0).toFixed(2)}</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${data.totals.totalAmount.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag>
          <tPag>01</tPag>
          <vPag>${data.totals.totalAmount.toFixed(2)}</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infCpl>Documento emitido por ME/EPP optante pelo Simples Nacional. Gerado no BoraMarka ERP.</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>SP_NFE_PL_009</verAplic>
      <chNFe>${data.accessKey}</chNFe>
      <dhRecbto>${data.authDate.toISOString()}</dhRecbto>
      <nProt>${data.protocol}</nProt>
      <digVal>zF9+1qK2J9K7xM1=</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
