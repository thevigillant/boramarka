/**
 * Parser de XML de Nota Fiscal Eletrônica (NF-e v4.00 / NFC-e) - Padrão SEFAZ
 * Suporta execução tanto no Navegador (DOMParser) quanto em ambiente de testes/Node.js.
 */

export interface ParsedNfeItem {
  id: string
  itemNumber: number
  itemCode: string
  description: string
  ncm: string
  cfop: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discount: number
  expenseCategory: string
  inventoryItemId?: number | null
}

export interface ParsedNfeInstallment {
  number: number
  installmentLabel: string
  dueDate: string
  amount: number
}

export interface ParsedNfeData {
  success: boolean
  error?: string
  rawXml?: string
  accessKey: string
  invoiceNumber: string
  series: string
  issueDate: string
  entryDate: string
  operationNature: string
  model: string

  // Emitente (Fornecedor)
  emitter: {
    cnpj: string
    corporateName: string
    tradeName: string
    stateRegistration: string
    phone: string
    email: string
    address: string
    neighborhood: string
    city: string
    uf: string
    cep: string
  }

  // Destinatário
  recipient: {
    cnpj: string
    corporateName: string
    uf: string
  }

  // Totais
  totals: {
    productsAmount: number
    freightAmount: number
    insuranceAmount: number
    discountAmount: number
    otherExpenses: number
    icmsBase: number
    icmsAmount: number
    ipiAmount: number
    pisAmount: number
    cofinsAmount: number
    totalAmount: number
  }

  // Itens da Nota
  items: ParsedNfeItem[]

  // Duplicatas de Cobrança / Parcelamento
  installments: ParsedNfeInstallment[]

  // Observações e dados adicionais
  notes: string
}

/**
 * Decodifica uma Chave de Acesso de 44 dígitos da NF-e
 */
export function decodeAccessKey(key: string): {
  isValid: boolean
  ufCode: string
  yearMonth: string
  emitterCnpj: string
  model: string
  series: string
  invoiceNumber: string
  emissionType: string
  randomCode: string
  checkDigit: string
} {
  const clean = key.replace(/\D/g, '');
  if (clean.length !== 44) {
    return {
      isValid: false,
      ufCode: '',
      yearMonth: '',
      emitterCnpj: '',
      model: '',
      series: '',
      invoiceNumber: '',
      emissionType: '',
      randomCode: '',
      checkDigit: '',
    };
  }

  return {
    isValid: true,
    ufCode: clean.slice(0, 2),
    yearMonth: clean.slice(2, 6),
    emitterCnpj: clean.slice(6, 20),
    model: clean.slice(20, 22),
    series: clean.slice(22, 25).replace(/^0+/, '') || '1',
    invoiceNumber: clean.slice(25, 34).replace(/^0+/, ''),
    emissionType: clean.slice(34, 35),
    randomCode: clean.slice(35, 43),
    checkDigit: clean.slice(43, 44),
  };
}

/**
 * Heurística para categorizar despesas com base na descrição / NCM
 */
function categorizeItem(desc: string, ncm: string): string {
  const text = (desc + ' ' + ncm).toLowerCase();
  if (text.includes('embal') || text.includes('caixa') || text.includes('sacol') || text.includes('pote')) {
    return 'EMBALAGENS';
  }
  if (text.includes('frete') || text.includes('transp') || text.includes('entrega')) {
    return 'FRETE';
  }
  if (text.includes('equip') || text.includes('maquin') || text.includes('ferram')) {
    return 'EQUIPAMENTOS';
  }
  if (text.includes('manut') || text.includes('peca') || text.includes('repar')) {
    return 'MANUTENCAO';
  }
  if (text.includes('limp') || text.includes('higien') || text.includes('deterg')) {
    return 'CONSUMO';
  }
  return 'INSUMOS';
}

// ── Utilitários Robustos de Extração de Tags e Atributos XML ──
function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tag}[^>]*\\b${attr}=["']([^"']*)["']`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractAllTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tag}>`, 'gi');
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

function parseNumber(text: string): number {
  if (!text) return 0;
  const clean = text.replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : Number(n.toFixed(2));
}

/**
 * Analisa e extrai dados completos de um XML de NF-e v4.00
 */
export function parseNfeXml(xmlString: string): ParsedNfeData {
  const emptyResult: ParsedNfeData = {
    success: false,
    accessKey: '',
    invoiceNumber: '',
    series: '',
    issueDate: '',
    entryDate: '',
    operationNature: '',
    model: '55',
    emitter: {
      cnpj: '',
      corporateName: '',
      tradeName: '',
      stateRegistration: '',
      phone: '',
      email: '',
      address: '',
      neighborhood: '',
      city: '',
      uf: '',
      cep: '',
    },
    recipient: {
      cnpj: '',
      corporateName: '',
      uf: '',
    },
    totals: {
      productsAmount: 0,
      freightAmount: 0,
      insuranceAmount: 0,
      discountAmount: 0,
      otherExpenses: 0,
      icmsBase: 0,
      icmsAmount: 0,
      ipiAmount: 0,
      pisAmount: 0,
      cofinsAmount: 0,
      totalAmount: 0,
    },
    items: [],
    installments: [],
    notes: '',
  };

  if (!xmlString || typeof xmlString !== 'string') {
    return { ...emptyResult, error: 'O arquivo XML está vazio ou corrompido.' };
  }

  try {
    // 1. Chave de Acesso
    let accessKey = extractAttr(xmlString, 'infNFe', 'Id').replace(/^NFe/i, '');
    if (!accessKey) {
      accessKey = extractTag(xmlString, 'chNFe');
    }

    // 2. Cabeçalho (ide)
    const ideBlock = extractTag(xmlString, 'ide');
    const invoiceNumber = extractTag(ideBlock || xmlString, 'nNF');
    const series = extractTag(ideBlock || xmlString, 'serie') || '1';
    const operationNature = extractTag(ideBlock || xmlString, 'natOp') || 'COMPRA DE MERCADORIAS';
    const model = extractTag(ideBlock || xmlString, 'mod') || '55';

    // Datas
    const rawDhEmi = extractTag(ideBlock || xmlString, 'dhEmi') || extractTag(ideBlock || xmlString, 'dEmi');
    const rawDhSai = extractTag(ideBlock || xmlString, 'dhSaiEnt') || extractTag(ideBlock || xmlString, 'dSaiEnt') || rawDhEmi;
    const issueDate = rawDhEmi ? rawDhEmi.split('T')[0] : new Date().toISOString().split('T')[0];
    const entryDate = rawDhSai ? rawDhSai.split('T')[0] : issueDate;

    // 3. Emitente (emit)
    const emitBlock = extractTag(xmlString, 'emit');
    const emitterCnpj = extractTag(emitBlock, 'CNPJ') || extractTag(emitBlock, 'CPF');
    const emitterName = extractTag(emitBlock, 'xNome');
    const emitterFant = extractTag(emitBlock, 'xFant') || emitterName;
    const emitterIE = extractTag(emitBlock, 'IE');

    const enderEmitBlock = extractTag(emitBlock, 'enderEmit');
    const logr = extractTag(enderEmitBlock, 'xLgr');
    const num = extractTag(enderEmitBlock, 'nro');
    const cpl = extractTag(enderEmitBlock, 'xCpl');
    const neighborhood = extractTag(enderEmitBlock, 'xBairro');
    const city = extractTag(enderEmitBlock, 'xMun');
    const uf = extractTag(enderEmitBlock, 'UF');
    const cep = extractTag(enderEmitBlock, 'CEP');
    const phone = extractTag(enderEmitBlock, 'fone');

    let fullAddress = [logr, num, cpl].filter(Boolean).join(', ');
    if (neighborhood) fullAddress += ` - ${neighborhood}`;
    if (city) fullAddress += `, ${city}/${uf}`;

    // 4. Destinatário (dest)
    const destBlock = extractTag(xmlString, 'dest');
    const recipientCnpj = extractTag(destBlock, 'CNPJ') || extractTag(destBlock, 'CPF');
    const recipientName = extractTag(destBlock, 'xNome');
    const recipientUf = extractTag(destBlock, 'UF');

    // 5. Totais (total / ICMSTot)
    const totalBlock = extractTag(xmlString, 'ICMSTot') || extractTag(xmlString, 'total');
    const productsAmount = parseNumber(extractTag(totalBlock, 'vProd'));
    const freightAmount = parseNumber(extractTag(totalBlock, 'vFrete'));
    const insuranceAmount = parseNumber(extractTag(totalBlock, 'vSeg'));
    const discountAmount = parseNumber(extractTag(totalBlock, 'vDesc'));
    const otherExpenses = parseNumber(extractTag(totalBlock, 'vOutro'));
    const icmsBase = parseNumber(extractTag(totalBlock, 'vBC'));
    const icmsAmount = parseNumber(extractTag(totalBlock, 'vICMS'));
    const ipiAmount = parseNumber(extractTag(totalBlock, 'vIPI'));
    const pisAmount = parseNumber(extractTag(totalBlock, 'vPIS'));
    const cofinsAmount = parseNumber(extractTag(totalBlock, 'vCOFINS'));
    const totalAmount = parseNumber(extractTag(totalBlock, 'vNF')) || (productsAmount + freightAmount - discountAmount);

    // 6. Itens da Nota (<det>)
    const detBlocks = extractAllTags(xmlString, 'det');
    const items: ParsedNfeItem[] = detBlocks.map((detStr, index) => {
      const itemNumber = parseInt(extractAttr(detStr, 'det', 'nItem') || String(index + 1), 10);
      const prodBlock = extractTag(detStr, 'prod') || detStr;
      const itemCode = extractTag(prodBlock, 'cProd');
      const description = extractTag(prodBlock, 'xProd');
      const ncm = extractTag(prodBlock, 'NCM');
      const cfop = extractTag(prodBlock, 'CFOP');
      const unit = (extractTag(prodBlock, 'uCom') || 'un').toLowerCase();
      const quantity = parseNumber(extractTag(prodBlock, 'qCom')) || 1;
      const unitPrice = parseNumber(extractTag(prodBlock, 'vUnCom'));
      const totalPrice = parseNumber(extractTag(prodBlock, 'vProd')) || Number((quantity * unitPrice).toFixed(2));
      const discount = parseNumber(extractTag(prodBlock, 'vDesc'));

      return {
        id: `xml-item-${itemNumber}-${index}`,
        itemNumber,
        itemCode,
        description,
        ncm,
        cfop,
        unit,
        quantity,
        unitPrice,
        totalPrice,
        discount,
        expenseCategory: categorizeItem(description, ncm),
      };
    });

    // 7. Cobrança e Duplicatas (<dup>)
    const dupBlocks = extractAllTags(xmlString, 'dup');
    const installments: ParsedNfeInstallment[] = dupBlocks.map((dupStr, idx) => {
      const nDup = extractTag(dupStr, 'nDup') || String(idx + 1);
      const dVenc = extractTag(dupStr, 'dVenc') || issueDate;
      const vDup = parseNumber(extractTag(dupStr, 'vDup')) || (totalAmount / (dupBlocks.length || 1));
      return {
        number: idx + 1,
        installmentLabel: nDup,
        dueDate: dVenc,
        amount: vDup,
      };
    });

    // 8. Informações complementares
    const infCpl = extractTag(xmlString, 'infCpl');
    const infAdFisco = extractTag(xmlString, 'infAdFisco');
    const notes = [infCpl, infAdFisco].filter(Boolean).join(' | ');

    if (!invoiceNumber && !accessKey) {
      return { ...emptyResult, error: 'Não foi possível encontrar número da nota ou chave de acesso no XML.' };
    }

    return {
      success: true,
      rawXml: xmlString,
      accessKey,
      invoiceNumber: invoiceNumber || (accessKey ? accessKey.slice(25, 34).replace(/^0+/, '') : ''),
      series: series || (accessKey ? accessKey.slice(22, 25).replace(/^0+/, '') : '1'),
      issueDate,
      entryDate,
      operationNature,
      model,
      emitter: {
        cnpj: emitterCnpj,
        corporateName: emitterName,
        tradeName: emitterFant,
        stateRegistration: emitterIE,
        phone,
        email: '',
        address: fullAddress,
        neighborhood,
        city,
        uf,
        cep,
      },
      recipient: {
        cnpj: recipientCnpj,
        corporateName: recipientName,
        uf: recipientUf,
      },
      totals: {
        productsAmount,
        freightAmount,
        insuranceAmount,
        discountAmount,
        otherExpenses,
        icmsBase,
        icmsAmount,
        ipiAmount,
        pisAmount,
        cofinsAmount,
        totalAmount,
      },
      items,
      installments,
      notes,
    };
  } catch (err: any) {
    return {
      ...emptyResult,
      error: `Erro ao processar arquivo XML: ${err.message || 'Formato inválido'}`,
    };
  }
}
