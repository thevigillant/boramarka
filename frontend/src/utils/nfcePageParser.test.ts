import { describe, it, expect } from 'vitest'
import { parseNfcePageText } from './nfcePageParser'

describe('nfcePageParser', () => {
  it('parses text copied directly from SEFAZ MG portal', () => {
    const text = `
LOJA DOCE LTDA
CNPJ: 11119190001159 -, Inscrição Estadual: 0013882380802
R. SALDANHA MARINHO, 330, NOSSA SENHORA DA ABADIA, 3170107 - UBERABA, MG

BRIGADEIRO GOURMET J (Codigo: 7896523166353) Qtde total de itens: 1.0000 UN: UN Valor total R$: 24,99
BRIGADEIRO BRANCO JU (Codigo: 7896523166285) Qtde total de itens: 1.0000 UN: UN Valor total R$: 24,99
COBERTURA SICAO FACIL LEITE GOTAS 1,01KG SIC (Codigo: 20842098041) Qtde total de itens: 1.0000 UN: UN Valor total R$: 35,99
SICAO FACIL COBERTURA BRANC GOTAS 1,01KG SIC (Codigo: 20842098379) Qtde total de itens: 1.0000 UN: UN Valor total R$: 39,90
EMB PARA TRUFA SAB C (Codigo: 7899440996690) Qtde total de itens: 1.0000 UN: UN Valor total R$: 15,99
FORMA ESPECIAL PAO DE MEL PEQUENO 8 CAVIDADE (Codigo: 7908013114352) Qtde total de itens: 1.0000 UN: UN Valor total R$: 17,99

Qtde total de itens 6
Valor total R$ 159.85
Valor pago R$ 159.85
Forma de Pagamento 03 - Cartão de Crédito
`

    const res = parseNfcePageText(text)
    expect(res.success).toBe(true)
    expect(res.items).toHaveLength(6)
    expect(res.items[0].description).toBe('BRIGADEIRO GOURMET J')
    expect(res.items[0].itemCode).toBe('7896523166353')
    expect(res.items[0].totalPrice).toBe(24.99)
    expect(res.totalAmount).toBe(159.85)
    expect(res.paymentMethod).toBe('CARTAO_CREDITO')
  })

  it('parses text copied from printed PDF layout', () => {
    const text = `
Versão1.2.28
Nota Fiscal de Consumidor Eletrônica (NFC-e)
LOJA DOCE LTDA
CNPJ: 11119190001159 -, Inscrição Estadual: 0013882380802
R SALDANHA MARINHO, 330, NOSSA SENHORA DA ABADIA, 3170107 - UBERABA, MG
BRIGADEIRO GOURMET J (Código: 7896523166353) Qtde total de
ítens: 1.0000
UN:
UN
Valor total R$:
R$ 24,99
BRIGADEIRO BRANCO JU (Código: 7896523166285) Qtde total de
ítens: 1.0000
UN:
UN
Valor total R$:
R$ 24,99
COBERTURA SICAO FACIL LEITE GOTAS 1,01KG SIC
(Código: 20842098041)
Qtde total de
ítens: 1.0000
UN:
UN
Valor total R$:
R$ 35,99
SICAO FACIL COBERTURA BRANC GOTAS 1,01KG SIC
(Código: 20842098379)
Qtde total de
ítens: 1.0000
UN:
UN
Valor total R$:
R$ 39,90
EMB PARA TRUFA SAB C (Código: 7899440996690) Qtde total de
ítens: 1.0000
UN:
UN
Valor total R$:
R$ 15,99
FORMA ESPECIAL PAO DE MEL PEQUENO 8
CAVIDADE (Código: 7908013114352)
Qtde total de
ítens: 1.0000
UN:
UN
Valor total R$:
R$ 17,99
Qtde total de ítens 6
Valor total R$ 159.85
Valor pago R$ 159.85
Forma de Pagamento 03 - Cartão de Crédito
`
    const res = parseNfcePageText(text)
    expect(res.success).toBe(true)
    expect(res.items).toHaveLength(6)
    expect(res.items[0].description).toBe('BRIGADEIRO GOURMET J')
    expect(res.items[0].itemCode).toBe('7896523166353')
    expect(res.items[2].description).toBe('COBERTURA SICAO FACIL LEITE GOTAS 1,01KG SIC')
    expect(res.items[2].totalPrice).toBe(35.99)
    expect(res.items[4].expenseCategory).toBe('EMBALAGENS')
    expect(res.totalAmount).toBe(159.85)
    expect(res.paymentMethod).toBe('CARTAO_CREDITO')
  })
})
