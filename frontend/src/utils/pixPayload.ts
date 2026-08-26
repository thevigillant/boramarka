import QRCode from 'qrcode'

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
}

function calculateCRC16(payload: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF
      } else {
        crc = (crc << 1) & 0xFFFF
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface PixPayloadParams {
  pixKey: string
  merchantName?: string
  merchantCity?: string
  amount?: number
  txid?: string
  description?: string
}

/**
 * Gera a string oficial do PIX Copia e Cola (BR Code) padrão Banco Central (EMVCo)
 */
export function generatePixPayload({
  pixKey,
  merchantName,
  merchantCity = 'BRASIL',
  amount,
  txid,
  description,
}: PixPayloadParams): string {
  if (!pixKey || !pixKey.trim()) return ''

  let cleanKey = pixKey.trim()
  const digitsOnly = cleanKey.replace(/\D/g, '')

  // Se for celular (10 ou 11 dígitos sem letras ou símbolos de email/uuid), o padrão BC exige +55
  if ((digitsOnly.length === 10 || digitsOnly.length === 11) && !cleanKey.includes('@') && cleanKey.length <= 15) {
    cleanKey = `+55${digitsOnly}`
  } else if ((digitsOnly.length === 12 || digitsOnly.length === 13) && digitsOnly.startsWith('55') && !cleanKey.startsWith('+')) {
    cleanKey = `+${digitsOnly}`
  }

  // Tag 26: Merchant Account Information
  let merchantInfo = formatField('00', 'br.gov.bcb.pix')
  merchantInfo += formatField('01', cleanKey)
  if (description) {
    const cleanDesc = removeAccents(description).substring(0, 40)
    if (cleanDesc) merchantInfo += formatField('02', cleanDesc)
  }

  const cleanMerchant = removeAccents(merchantName || 'LOJA').substring(0, 25).toUpperCase() || 'RECEBEDOR'
  const cleanCity = removeAccents(merchantCity || 'BRASIL').substring(0, 15).toUpperCase() || 'BRASIL'
  const cleanTxid = (txid ? txid.replace(/[^a-zA-Z0-9]/g, '') : '***').substring(0, 25) || '***'

  let payload = ''
  payload += formatField('00', '01') // Payload Format Indicator
  payload += formatField('26', merchantInfo) // Merchant Account Information
  payload += formatField('52', '0000') // Merchant Category Code
  payload += formatField('53', '986') // Currency (BRL)

  if (amount && amount > 0) {
    payload += formatField('54', amount.toFixed(2)) // Transaction Amount
  }

  payload += formatField('58', 'BR') // Country Code
  payload += formatField('59', cleanMerchant) // Merchant Name
  payload += formatField('60', cleanCity) // Merchant City

  // Tag 62: Additional Data Field (txid)
  const additionalData = formatField('05', cleanTxid)
  payload += formatField('62', additionalData)

  // Tag 63: CRC16
  payload += '6304'
  const crc = calculateCRC16(payload)

  return `${payload}${crc}`
}

/**
 * Gera Data URL da imagem do QR Code para exibição direta em tag <img>
 */
export async function generatePixQrCodeDataUrl(payload: string): Promise<string> {
  if (!payload) return ''
  try {
    return await QRCode.toDataURL(payload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
  } catch (err) {
    console.error('Erro ao gerar QR Code PIX:', err)
    return ''
  }
}
