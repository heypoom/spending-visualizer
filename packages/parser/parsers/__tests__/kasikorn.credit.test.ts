import {describe, it, expect, vi} from 'vitest'
import * as fs from 'fs/promises'

import {
  parseKasikornCreditStatement,
  extractTextChunksFromLine,
} from '../kasikorn.credit'

import {extractTextChunksFromPDF} from '../../utils/extractTextChunksFromPDF'

describe('kasikorn credit parser', async () => {
  // TODO: create a mock statement resembling a real world with fake data.
  const sourceFile = await fs.readFile('./parsers/__tests__/fixtures/test.pdf')
  const handleMaxPasswordTries = vi.fn()
  const handleRequestPassword = vi.fn()
  const rawChunks = await extractTextChunksFromPDF(sourceFile, {
    handleMaxPasswordTries,
    handleRequestPassword,
  })

  it('processes each line items into a clean chunk of text', async () => {
    // Sanity check: there should be 5 pages.
    expect(rawChunks.length).toBe(5)
    expect(rawChunks[1].length).toBe(323)

    // Sanity check: the PDF should start with the header.
    expect(rawChunks[0][0]).toBe(
      'ใบแจ้งยอดบัญชีบัตรเครดิต / ใบเสร็จรับเงิน เลขที่'
    )

    const transactions = extractTextChunksFromLine(rawChunks[1])
    expect(transactions.length).toBe(54)

    const [firstTransaction] = transactions
    const [transactionDate, paymentDate, description] = firstTransaction

    expect(transactionDate).toBe('02/12/21')
    expect(paymentDate).toBe('02/12/21')
    expect(description).toBe('WWW.GRAB.COM')
  })

  it('parses generic kasikorn credit statement', async () => {
    const transactions = parseKasikornCreditStatement(rawChunks)
    expect(transactions.length).toBe(152)

    const sample = transactions[1]
    expect(sample.amount).toBe(600)
    expect(sample.description).toBe('OMISETH*gowabi.com')
    expect(sample.paymentDate.toLocaleDateString()).toBe('11/27/2021')
  })
})
