export interface ParsedNfcePageResult {
  success: boolean
  items: Array<{
    id: string
    itemCode: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
    totalPrice: number
    expenseCategory: string
  }>
  totalAmount: number
  paymentMethod: string
  cnpj?: string
  corporateName?: string
  accessKey?: string
}

export function parseNfcePageText(raw: string): ParsedNfcePageResult {
  if (!raw || !raw.trim()) {
    return { success: false, items: [], totalAmount: 0, paymentMethod: 'BOLETO' }
  }

  const text = raw.replace(/\r/g, '')
  const items: ParsedNfcePageResult['items'] = []

  // Expressão flexível que atende tanto a cópia direta do navegador quanto texto extraído do PDF impresso
  const pattern =
    /([A-Z0-9\s,\.\-\/]+?)\s*\((?:C[oó]digo):\s*(\d+)\)[\s\S]*?(?:[íi]tens:\s*([\d\.,]+))[\s\S]*?(?:Valor total R\$?:?\s*(?:R\$\s*)?([\d\.,]+))/gi

  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    let rawDesc = match[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

    // Limpa prefixos de linhas anteriores
    if (rawDesc.includes('Valor total')) {
      const parts = rawDesc.split('Valor total')
      rawDesc = parts[parts.length - 1]
    }
    rawDesc = rawDesc.replace(/.*?(?:R\$\s*[\d,.]+|UBERABA,\s*MG|\bMG\b|\bSP\b)\s*/i, '').trim()

    const code = match[2].trim()
    const qty = parseFloat(match[3].replace(',', '.')) || 1
    const total = parseFloat(match[4].replace(',', '.')) || 0
    const unitPrice = parseFloat((total / qty).toFixed(2))

    let category = 'INSUMOS'
    const upper = rawDesc.toUpperCase()
    if (
      upper.includes('EMB ') ||
      upper.includes('EMBALAGEM') ||
      upper.includes('CAIXA') ||
      upper.includes('SACO') ||
      upper.includes('FITA')
    ) {
      category = 'EMBALAGENS'
    }

    items.push({
      id: String(Date.now() + items.length),
      itemCode: code,
      description: rawDesc,
      quantity: qty,
      unit: 'UN',
      unitPrice,
      totalPrice: total,
      expenseCategory: category,
    })
  }

  // Se o regex flexível não encontrou (ex: formato linha a linha simples), tenta linha por linha
  if (items.length === 0) {
    const lines = text.split('\n')
    const itemRegex =
      /^(.*?)\s*\(Codigo:\s*([^)]+)\).*?Qtde total de itens:\s*([\d.,]+)\s*UN:\s*(\w+)\s*Valor total R\$?:\s*([\d.,]+)/i

    for (const line of lines) {
      const trimmed = line.trim()
      const lineMatch = trimmed.match(itemRegex)
      if (lineMatch) {
        const desc = lineMatch[1].trim()
        const code = lineMatch[2].trim()
        const qty = parseFloat(lineMatch[3].replace(',', '.')) || 1
        const unit = lineMatch[4].trim().toUpperCase()
        const total = parseFloat(lineMatch[5].replace(',', '.')) || 0
        const unitPrice = parseFloat((total / qty).toFixed(2))

        let category = 'INSUMOS'
        const upperDesc = desc.toUpperCase()
        if (
          upperDesc.includes('EMB ') ||
          upperDesc.includes('EMBALAGEM') ||
          upperDesc.includes('CAIXA')
        ) {
          category = 'EMBALAGENS'
        }

        items.push({
          id: String(Date.now() + items.length),
          itemCode: code,
          description: desc,
          quantity: qty,
          unit: unit,
          unitPrice: unitPrice,
          totalPrice: total,
          expenseCategory: category,
        })
      }
    }
  }

  // Extração do valor total
  let totalAmount = 0
  const totalMatch = text.match(/Valor total R\$?\s*([\d.,]+)/i)
  if (totalMatch) {
    totalAmount = parseFloat(totalMatch[1].replace(',', '.'))
  } else {
    totalAmount = Number(items.reduce((acc, it) => acc + it.totalPrice, 0).toFixed(2))
  }

  // Extração de forma de pagamento
  let paymentMethod = 'BOLETO'
  if (/Cart[aã]o de Cr[eé]dito/i.test(text)) paymentMethod = 'CARTAO_CREDITO'
  else if (/Cart[aã]o de D[eé]bito/i.test(text)) paymentMethod = 'CARTAO_DEBITO'
  else if (/Dinheiro/i.test(text)) paymentMethod = 'DINHEIRO'
  else if (/Pix/i.test(text)) paymentMethod = 'PIX'

  // Extração de CNPJ do emitente
  let cnpj = ''
  const cnpjMatch = text.match(/CNPJ:\s*([\d.\-\/]+)/i)
  if (cnpjMatch) cnpj = cnpjMatch[1].replace(/\D/g, '')

  // Extração da Razão Social
  let corporateName = ''
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('CNPJ:') && i > 0) {
      corporateName = lines[i - 1].trim()
      break
    }
  }

  // Extração da Chave de Acesso (44 dígitos se estiver no texto)
  let accessKey = ''
  const keyMatch = text.match(/\b\d{44}\b/)
  if (keyMatch) accessKey = keyMatch[0]

  return {
    success: items.length > 0 || totalAmount > 0,
    items,
    totalAmount,
    paymentMethod,
    cnpj,
    corporateName,
    accessKey,
  }
}
