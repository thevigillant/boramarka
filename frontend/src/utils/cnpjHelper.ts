/**
 * Utilitários para CNPJ: Formatação, Validação e Consulta na BrasilAPI
 */

export function cleanCNPJ(value: string): string {
  return value.replace(/\D/g, '').slice(0, 14);
}

export function formatCNPJ(value: string): string {
  const clean = cleanCNPJ(value);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
}

export function isValidCNPJ(cnpj: string): boolean {
  const clean = cleanCNPJ(cnpj);
  if (clean.length !== 14) return false;

  // Elimina CNPJs inválidos conhecidos (todos dígitos iguais)
  if (/^(\d)\1+$/.test(clean)) return false;

  let tamanho = clean.length - 2;
  let numeros = clean.substring(0, tamanho);
  const digitos = clean.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = clean.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

export interface CnpjLookupResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  ddd_telefone_1: string;
  email: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

export async function lookupCNPJ(cnpj: string): Promise<{
  success: boolean;
  data?: {
    corporateName: string;
    tradeName: string;
    phone: string;
    email: string;
    address: string;
  };
  error?: string;
}> {
  const clean = cleanCNPJ(cnpj);
  if (clean.length !== 14) {
    return { success: false, error: 'O CNPJ deve ter 14 dígitos.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) return { success: false, error: 'CNPJ não encontrado na Receita Federal.' };
      return { success: false, error: 'Não foi possível consultar os dados do CNPJ.' };
    }

    const json = (await res.json()) as CnpjLookupResult;

    const fullAddress = [
      json.logradouro,
      json.numero ? `nº ${json.numero}` : '',
      json.bairro,
      json.municipio ? `${json.municipio} - ${json.uf}` : '',
      json.cep ? `CEP: ${json.cep}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    return {
      success: true,
      data: {
        corporateName: json.razao_social || '',
        tradeName: json.nome_fantasia || json.razao_social || '',
        phone: json.ddd_telefone_1 ? json.ddd_telefone_1.replace(/\s+/g, '') : '',
        email: json.email || '',
        address: fullAddress,
      },
    };
  } catch (err: any) {
    return { success: false, error: 'Tempo limite ou erro ao consultar a base do CNPJ.' };
  }
}
