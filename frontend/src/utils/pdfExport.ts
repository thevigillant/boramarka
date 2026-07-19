import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Helper to convert an image URL or Data URL to Base64 for jsPDF
 */
async function getBase64ImageFromUrl(url: string): Promise<string | null> {
  if (!url) return null
  if (url.startsWith('data:image/')) return url

  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.warn('Erro ao carregar logotipo para o PDF:', err)
    return null
  }
}

export interface ExportBookingsOptions {
  bookings: any[]
  adminInfo?: {
    businessName?: string
    photoUrl?: string
    phone?: string
  } | null
  includeLogo: boolean
  customLogoUrl?: string
}

/**
 * Generates and downloads a PDF report of Bookings
 */
export async function exportBookingsToPDF({ bookings, adminInfo, includeLogo, customLogoUrl }: ExportBookingsOptions) {
  const doc = new jsPDF()
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR')
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  let textStartX = 14
  const headerY = 15

  // Add logo if requested & available
  const logoUrl = customLogoUrl || adminInfo?.photoUrl
  if (includeLogo && logoUrl) {
    const base64Logo = await getBase64ImageFromUrl(logoUrl)
    if (base64Logo) {
      try {
        const imageFormat = base64Logo.includes('png') ? 'PNG' : 'JPEG'
        doc.addImage(base64Logo, imageFormat, 14, 11, 18, 18)
        textStartX = 36
      } catch (e) {
        console.warn('Falha ao inserir logo no PDF:', e)
      }
    }
  }

  // Header Title & Metadata
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42) // slate-900
  doc.text(adminInfo?.businessName || 'BoraMarka — Agendamentos', textStartX, headerY + 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(100, 116, 139) // slate-500
  doc.text('Relatório Detalhado de Agendamentos', textStartX, headerY + 9)

  // Top Right Stats
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text(`Emitido em: ${dateStr} às ${timeStr}`, 196, headerY + 3, { align: 'right' })
  doc.text(`Total: ${bookings.length} registro(s)`, 196, headerY + 9, { align: 'right' })

  // Divider Line
  const tableStartY = Math.max(headerY + 16, 33)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(14, tableStartY - 3, 196, tableStartY - 3)

  // Format table data
  const tableBody = bookings.map((b) => {
    const serviceName = b.timeSlot?.link?.service?.name || b.timeSlot?.link?.title || 'Serviço'
    const dateFormatted = b.timeSlot?.date
      ? new Date(b.timeSlot.date + 'T00:00:00').toLocaleDateString('pt-BR')
      : '-'
    const priceVal = b.timeSlot?.link?.service?.price
    const priceFormatted = priceVal
      ? `R$ ${Number(priceVal).toFixed(2).replace('.', ',')}`
      : 'R$ 0,00'
    const statusText =
      b.status === 'confirmed' ? 'Confirmado' : b.status === 'cancelled' ? 'Cancelado' : 'Pendente'

    return [
      b.clientName || '-',
      b.clientPhone || '-',
      serviceName,
      dateFormatted,
      b.timeSlot?.time || '-',
      priceFormatted,
      statusText,
    ]
  })

  // Render Table
  autoTable(doc, {
    startY: tableStartY,
    head: [['Cliente', 'Telefone', 'Serviço', 'Data', 'Horário', 'Valor', 'Status']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [249, 115, 22], // orange-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 36 }, // Cliente
      1: { cellWidth: 28 }, // Telefone
      2: { cellWidth: 38 }, // Serviço
      3: { cellWidth: 22 }, // Data
      4: { cellWidth: 18 }, // Horário
      5: { cellWidth: 22, halign: 'right' }, // Valor
      6: { cellWidth: 18, halign: 'center' }, // Status
    },
  })

  // Footer page numbering
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Página ${i} de ${pageCount} — BoraMarka Agendamentos`,
      105,
      doc.internal.pageSize.height - 8,
      { align: 'center' }
    )
  }

  doc.save(`relatorio_agendamentos_${now.toISOString().slice(0, 10)}.pdf`)
}

export interface ExportFinanceOptions {
  transactions: any[]
  financeStats: {
    balance: number
    pendingReceivable: number
    pendingPayable: number
  }
  adminInfo?: {
    businessName?: string
    photoUrl?: string
    phone?: string
  } | null
  includeLogo: boolean
  customLogoUrl?: string
  filterLabels?: string[]
}

/**
 * Generates and downloads a PDF report of Financial transactions
 */
export async function exportFinanceToPDF({
  transactions,
  financeStats,
  adminInfo,
  includeLogo,
  customLogoUrl,
  filterLabels,
}: ExportFinanceOptions) {
  const doc = new jsPDF()
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR')
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  let textStartX = 14
  const headerY = 15

  const logoUrl = customLogoUrl || adminInfo?.photoUrl
  if (includeLogo && logoUrl) {
    const base64Logo = await getBase64ImageFromUrl(logoUrl)
    if (base64Logo) {
      try {
        const imageFormat = base64Logo.includes('png') ? 'PNG' : 'JPEG'
        doc.addImage(base64Logo, imageFormat, 14, 11, 18, 18)
        textStartX = 36
      } catch (e) {
        console.warn('Falha ao inserir logo no PDF:', e)
      }
    }
  }

  // Header Title & Meta
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42)
  doc.text(adminInfo?.businessName || 'BoraMarka — Financeiro', textStartX, headerY + 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Relatório de Fluxo de Caixa e Lançamentos', textStartX, headerY + 9)

  if (filterLabels && filterLabels.length > 0) {
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(`Filtros: ${filterLabels.join(' | ')}`, textStartX, headerY + 13)
  }

  // Top Right Metadata
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Emitido em: ${dateStr} às ${timeStr}`, 196, headerY + 3, { align: 'right' })
  doc.text(`Total Lançamentos: ${transactions.length}`, 196, headerY + 9, { align: 'right' })

  // Summary Cards Box
  const summaryY = Math.max(headerY + (filterLabels && filterLabels.length > 0 ? 19 : 16), 33)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, summaryY, 182, 16, 3, 3, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, summaryY, 182, 16, 3, 3, 'D')

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')

  // Saldo
  doc.setTextColor(16, 185, 129) // emerald-600
  doc.text(`Saldo Atual: R$ ${financeStats.balance.toFixed(2).replace('.', ',')}`, 18, summaryY + 10)

  // Entradas pendentes
  doc.setTextColor(59, 130, 246) // blue-500
  doc.text(`Entradas Pendentes: R$ ${financeStats.pendingReceivable.toFixed(2).replace('.', ',')}`, 78, summaryY + 10)

  // Saídas pendentes
  doc.setTextColor(239, 68, 68) // red-500
  doc.text(`Saídas Pendentes: R$ ${financeStats.pendingPayable.toFixed(2).replace('.', ',')}`, 142, summaryY + 10)

  const tableStartY = summaryY + 22

  const tableBody = transactions.map((t) => {
    const isReceivable = t.type === 'receivable'
    const dateFormatted = t.dueDate
      ? new Date(t.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')
      : '-'
    const amountFormatted = `${isReceivable ? '+ R$ ' : '- R$ '}${Number(t.amount)
      .toFixed(2)
      .replace('.', ',')}`

    return [
      dateFormatted,
      t.description || '-',
      t.category || '-',
      isReceivable ? 'Entrada (+)' : 'Saída (-)',
      amountFormatted,
      t.paid ? 'Pago' : 'Pendente',
    ]
  })

  autoTable(doc, {
    startY: tableStartY,
    head: [['Vencimento', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 24 }, // Vencimento
      1: { cellWidth: 55 }, // Descrição
      2: { cellWidth: 32 }, // Categoria
      3: { cellWidth: 25 }, // Tipo
      4: { cellWidth: 26, halign: 'right' }, // Valor
      5: { cellWidth: 20, halign: 'center' }, // Status
    },
  })

  // Footer page numbering
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Página ${i} de ${pageCount} — BoraMarka Financeiro`,
      105,
      doc.internal.pageSize.height - 8,
      { align: 'center' }
    )
  }

  doc.save(`relatorio_financeiro_${now.toISOString().slice(0, 10)}.pdf`)
}
