// Helper function to trigger browser CSV file download with UTF-8 BOM for Excel
function downloadCSV(filename: string, csvContent: string) {
  // Adding BOM \uFEFF ensures Excel automatically parses UTF-8 accent characters (ã, ç, é, etc)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 1. Export Bookings to CSV (Agendamentos)
export function exportBookingsToCSV(bookings: any[]): boolean {
  if (!bookings || bookings.length === 0) return false

  const headers = ['ID', 'Cliente', 'Telefone', 'Serviço', 'Data', 'Hora', 'Status', 'Valor (R$)', 'Anotações']
  let csv = headers.join(';') + '\n'

  bookings.forEach(b => {
    const serviceName = b.timeSlot?.link?.service?.name || b.timeSlot?.link?.title || 'Serviço'
    const price = (b.totalAmount || b.timeSlot?.link?.service?.price || 0).toFixed(2).replace('.', ',')
    const statusLabel = b.status === 'CONCLUIDO' ? 'Concluído' : b.status === 'CONFIRMADO' ? 'Confirmado' : b.status === 'cancelled' ? 'Cancelado' : 'Pendente'
    const notes = (b.notes || '').replace(/[\n\r;]/g, ' ')

    const row = [
      b.id,
      `"${b.clientName}"`,
      `"${b.clientPhone}"`,
      `"${serviceName}"`,
      b.timeSlot?.date || '',
      b.timeSlot?.time || '',
      `"${statusLabel}"`,
      `"R$ ${price}"`,
      `"${notes}"`
    ]
    csv += row.join(';') + '\n'
  })

  const dateStr = new Date().toISOString().split('T')[0]
  downloadCSV(`agendamentos_boramarka_${dateStr}.csv`, csv)
  return true
}

// 2. Export Finance Transactions to CSV (Financeiro)
export function exportFinanceToCSV(transactions: any[]): boolean {
  if (!transactions || transactions.length === 0) return false

  const headers = ['ID', 'Tipo', 'Descrição', 'Cliente/Fornecedor', 'Categoria', 'Data Vencimento', 'Status Pagamento', 'Data Pagamento', 'Valor (R$)']
  let csv = headers.join(';') + '\n'

  transactions.forEach(t => {
    const typeLabel = t.type === 'receivable' ? 'Entrada (Receita)' : 'Saída (Despesa)'
    const statusLabel = t.paid ? 'Pago/Recebido' : 'Pendente'
    const amountStr = t.amount.toFixed(2).replace('.', ',')
    const description = (t.description || '').replace(/[\n\r;]/g, ' ')
    const client = (t.clientName || '').replace(/[\n\r;]/g, ' ')
    const category = (t.category || '').replace(/[\n\r;]/g, ' ')

    const row = [
      t.id,
      `"${typeLabel}"`,
      `"${description}"`,
      `"${client}"`,
      `"${category}"`,
      t.dueDate || '',
      `"${statusLabel}"`,
      t.paidAt || '-',
      `"R$ ${amountStr}"`
    ]
    csv += row.join(';') + '\n'
  })

  const dateStr = new Date().toISOString().split('T')[0]
  downloadCSV(`relatorio_financeiro_boramarka_${dateStr}.csv`, csv)
  return true
}
