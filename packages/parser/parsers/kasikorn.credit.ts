import {StatementParser} from '../@types/StatementParser'
import {Transaction} from '../@types/Transaction'
import {parseDate} from '../utils/parseDate'

const PATTERN_DATE = /\d{2}\/\d{2}\/\d{2}/
const PATTERN_AMOUNT = /^-?\b\d[\d,.]*\b$/
const PATTERN_CURRENCY = /^(USD|JPY)/

const isDate = (s: string) => PATTERN_DATE.test(s)
const isAmount = (s: string) => PATTERN_AMOUNT.test(s) && s.includes('.')

export function extractTextChunksFromLine(contents: string[]): string[][] {
  // We start at the first date (e.g. 10/02/2023)
  const startIndex = contents.findIndex(isDate)

  const lines = contents.slice(startIndex)
  const textChunks: string[][] = []

  // The line of transaction we are processing.
  let tx = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!textChunks[tx]) textChunks[tx] = []

    textChunks[tx].push(line)

    if (isAmount(line)) tx += 1
  }

  // Only include line items that starts with 2 dates, the transaction date and the payment date.
  // Also, only include line items that has over 3 chunks.
  return textChunks
    .filter((g) => isDate(g[0]) && isDate(g[1]))
    .filter((g) => g.length > 3)
}

const intoAmount = (s: string | null | undefined) =>
  parseFloat(s?.replace(/,/g, '') ?? '')

/**
 * @todo refactor this function to use a better way to detect different chunks
 */
export function chunksToTransaction(chunks: string[]): Transaction | null {
  // Line item including a single description
  if (chunks.length === 4) {
    const [transactionDate, paymentDate, description, amount] = chunks

    return {
      transactionDate: parseDate(transactionDate),
      paymentDate: parseDate(paymentDate),
      description,
      amount: intoAmount(amount),
    }
  }

  // Line item including 2 descriptions
  if (chunks.length === 5) {
    const [transactionDate, paymentDate, description, description2, amount] =
      chunks

    return {
      transactionDate: parseDate(transactionDate),
      paymentDate: parseDate(paymentDate),
      description,
      description2,
      amount: intoAmount(amount),
    }
  }

  // Line item including amounts in foreign currency (e.g. USD)
  if (chunks.length >= 6) {
    const currencyAmountIndex = chunks.findIndex((x) =>
      PATTERN_CURRENCY.test(x)
    )

    if (currencyAmountIndex > -1) {
      const [
        transactionDate,
        paymentDate,
        description,
        description2,
        _,
        rawAmount,
      ] = chunks

      const amount = intoAmount(rawAmount)
      const foreignCurrencyAmount = intoAmount(
        chunks[currencyAmountIndex].replace(PATTERN_CURRENCY, '').trim()
      )
      const usdRate = amount / foreignCurrencyAmount

      return {
        transactionDate: parseDate(transactionDate),
        paymentDate: parseDate(paymentDate),
        description,
        description2,
        foreignCurrencyAmount,
        amount,
        usdRate,
      }
    }
  }

  // Line item including 3 descriptions
  if (chunks.length === 6) {
    const [
      transactionDate,
      paymentDate,
      description,
      description2,
      description3,
      rawAmount,
    ] = chunks

    return {
      transactionDate: parseDate(transactionDate),
      paymentDate: parseDate(paymentDate),
      description,
      description2,
      description3,
      amount: intoAmount(rawAmount),
    }
  }

  return null
}

export const parseKasikornCreditStatement: StatementParser = (pages) =>
  pages
    .map(extractTextChunksFromLine)
    .flatMap((page) => page.map(chunksToTransaction))
