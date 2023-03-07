import {DocumentSource} from './@types/DocumentSource'
import {Transaction} from './@types/Transaction'
import {parseKasikornCreditStatement} from './parsers/kasikorn.credit'
import {extractTextChunksFromPDF} from './utils/extractTextChunksFromPDF'

export type Bank = 'kasikorn'
export type StatementType = 'credit' | 'account'

export type {Transaction} from './@types/Transaction'

export async function parseStatement(
  bank: Bank,
  type: StatementType,
  source: DocumentSource
): Promise<Transaction[]> {
  const rawChunks = await extractTextChunksFromPDF(source)

  if (bank === 'kasikorn' && type === 'credit')
    return parseKasikornCreditStatement(rawChunks)

  throw new Error('statement type or bank is not supported')
}
