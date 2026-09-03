import { ShoppingListData, ShoppingListItemData } from '../types/dashboard'

/**
 * Calcula o progresso de conclusão da lista de compras
 */
export function calculateShoppingProgress(items: Array<{ checked: boolean }> = []) {
  const total = items.length
  const checked = items.filter((i) => i.checked).length
  const percentage = total > 0 ? Math.round((checked / total) * 100) : 0
  return { total, checked, percentage }
}

/**
 * Formata a lista de compras para envio amigável no WhatsApp ou compartilhamento
 */
export function formatShoppingListForWhatsApp(list: Partial<ShoppingListData>): string {
  const title = list.title || 'Lista de Compras'
  const items = list.items || []
  const { total, checked, percentage } = calculateShoppingProgress(items)

  const dateStr = list.targetDate
    ? new Date(list.targetDate).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')

  let msg = `🛒 *${title.toUpperCase()}*\n`
  msg += `📅 Data: ${dateStr}\n`
  msg += `📊 Progresso: ${checked}/${total} pegos (${percentage}%)\n`
  if (list.description) {
    msg += `📝 Obs: ${list.description}\n`
  }
  msg += `\n─────────────────────\n`

  // Agrupar por categoria
  const groups = new Map<string, ShoppingListItemData[]>()
  for (const item of items) {
    const cat = item.category || 'Geral'
    const curr = groups.get(cat) || []
    curr.push(item)
    groups.set(cat, curr)
  }

  for (const [category, catItems] of groups.entries()) {
    msg += `\n📌 *${category.toUpperCase()}*\n`
    for (const it of catItems) {
      const checkMark = it.checked ? '✅' : '⬜'
      const qtyStr = `${it.quantity} ${it.unit}`
      msg += `${checkMark} *${it.name}* (${qtyStr})`
      if (it.notes) {
        msg += ` _(${it.notes})_`
      }
      msg += `\n`
    }
  }

  msg += `\n─────────────────────\n`
  msg += `✨ Gerado pelo *BoraMarka · BoraEnkomenda*`

  return msg
}

/**
 * Faz o parser inteligente de texto multilinha para inserção rápida de ingredientes
 * Exemplo de linhas aceitas:
 * - "4 latas de Leite condensado" -> { quantity: 4, unit: 'latas', name: 'Leite condensado' }
 * - "2 kg Farinha de trigo" -> { quantity: 2, unit: 'kg', name: 'Farinha de trigo' }
 * - "Morangos frescos" -> { quantity: 1, unit: 'un', name: 'Morangos frescos' }
 * - "3x Barra de chocolate 1kg" -> { quantity: 3, unit: 'un', name: 'Barra de chocolate 1kg' }
 */
export function parseQuickShoppingItemsText(text: string): Array<{
  name: string
  quantity: number
  unit: string
  category: string
}> {
  if (!text || !text.trim()) return []

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'))

  const unitRegex = /^(un|unidade|unidades|kg|quilo|quilos|g|grama|gramas|l|litro|litros|ml|pct|pacote|pacotes|cx|caixa|caixas|lata|latas|garrafa|garrafas|dz|duzia|duzias)$/i

  return lines.map((line) => {
    // Remove marcadores comuns como "-", "*", "[ ]", "•"
    let clean = line.replace(/^[-*•]\s*/, '').replace(/^\[\s*\]\s*/, '').trim()

    // Tenta capturar padrão: "3x Produto" ou "3 x Produto"
    const timesMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*[xX]\s+(.+)$/)
    if (timesMatch) {
      return {
        quantity: parseFloat(timesMatch[1].replace(',', '.')),
        unit: 'un',
        name: timesMatch[2].trim(),
        category: categorizeIngredient(timesMatch[2].trim()),
      }
    }

    // Tenta capturar: "4 latas de Leite condensado" ou "2 kg Farinha"
    const match = clean.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?(?:\s+(?:de\s+)?)?(.+)$/)

    if (match) {
      const qty = parseFloat(match[1].replace(',', '.'))
      const possibleUnit = match[2] ? match[2].toLowerCase() : ''
      const remainder = match[3] ? match[3].trim() : ''

      if (possibleUnit && unitRegex.test(possibleUnit)) {
        return {
          quantity: qty,
          unit: normalizeUnit(possibleUnit),
          name: remainder.replace(/^de\s+/i, '').trim(),
          category: categorizeIngredient(remainder),
        }
      } else {
        // Se a segunda palavra não for unidade reconhecida, faz parte do nome
        const fullName = (match[2] ? `${match[2]} ` : '') + remainder
        return {
          quantity: qty,
          unit: 'un',
          name: fullName.trim(),
          category: categorizeIngredient(fullName),
        }
      }
    }

    return {
      quantity: 1,
      unit: 'un',
      name: clean,
      category: categorizeIngredient(clean),
    }
  })
}

function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase()
  if (['kg', 'quilo', 'quilos'].includes(u)) return 'kg'
  if (['g', 'grama', 'gramas'].includes(u)) return 'g'
  if (['l', 'litro', 'litros'].includes(u)) return 'l'
  if (['ml'].includes(u)) return 'ml'
  if (['pct', 'pacote', 'pacotes'].includes(u)) return 'pct'
  if (['cx', 'caixa', 'caixas'].includes(u)) return 'cx'
  if (['lata', 'latas'].includes(u)) return 'lata'
  return 'un'
}

/**
 * Atribui uma categoria automática inteligente para ingredientes comuns
 */
export function categorizeIngredient(name: string): string {
  const n = name.toLowerCase()

  if (
    n.includes('pano') ||
    n.includes('esponja') ||
    n.includes('detergente') ||
    n.includes('papel toalha')
  ) {
    return 'Geral'
  }

  if (
    n.includes('leite') ||
    n.includes('queijo') ||
    n.includes('manteiga') ||
    n.includes('creme de leite') ||
    n.includes('iogurte') ||
    n.includes('ovo') ||
    n.includes('requeijão') ||
    n.includes('chantilly')
  ) {
    return 'Laticínios & Ovos'
  }

  if (
    n.includes('farinha') ||
    n.includes('açúcar') ||
    n.includes('acucar') ||
    n.includes('fermento') ||
    n.includes('amido') ||
    n.includes('maizena') ||
    n.includes('aveia') ||
    n.includes('fubá') ||
    n.includes('polvilho')
  ) {
    return 'Secos & Farinhas'
  }

  if (
    n.includes('chocolate') ||
    n.includes('cacau') ||
    n.includes('nutella') ||
    n.includes('granulado') ||
    n.includes('confeito') ||
    n.includes('brigadeiro') ||
    n.includes('doce de leite')
  ) {
    return 'Doces & Chocolates'
  }

  if (
    n.includes('caixa') ||
    n.includes('embalagem') ||
    n.includes('sacola') ||
    n.includes('fita') ||
    n.includes('forminha') ||
    n.includes('prato') ||
    n.includes('copo') ||
    n.includes('laço')
  ) {
    return 'Embalagens'
  }

  if (
    n.includes('morango') ||
    n.includes('banana') ||
    n.includes('limão') ||
    n.includes('laranja') ||
    n.includes('maçã') ||
    n.includes('fruta') ||
    n.includes('cenoura')
  ) {
    return 'Hortifruti'
  }

  return 'Geral'
}
