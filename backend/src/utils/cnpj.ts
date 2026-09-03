/**
 * Utilitários para CNPJ no Backend: Limpeza, Formatação e Validação Oficial
 * (Regra da Receita Federal com dígitos verificadores)
 */

export function cleanCNPJ(value: string | undefined | null): string {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(0, 14);
}

export function formatCNPJ(value: string | undefined | null): string {
  const clean = cleanCNPJ(value);
  if (clean.length !== 14) return clean;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
}

export function isValidCNPJ(cnpj: string | undefined | null): boolean {
  const clean = cleanCNPJ(cnpj);
  if (clean.length !== 14) return false;

  // Elimina sequências inválidas conhecidas (todos dígitos iguais)
  if (/^(\d)\1+$/.test(clean)) return false;

  // Validação do primeiro dígito verificador
  let tamanho = clean.length - 2;
  let numeros = clean.substring(0, tamanho);
  const digitos = clean.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

  // Validação do segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = clean.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

  return true;
}
