import { StatementParser } from '../@types/StatementParser'
import { Transaction } from '../@types/Transaction'

const dateRegex = /^\d{2}$/
const monthRegex = /^JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC$/
const amountRegex = /^(\d?\d?\d,?)+$/
const satangRegex = /^\.\d\d-?$/
const creditCardRegex = /^([\dX]{4}-){3}\d{4}$/

const foriegnCurrencies = [
  'U.S. DOLLAR',
  'YEN',
  'AUSTRALIANDOLLAR',
  'AUSTRALIAN DOLLAR',
  'SINGAPORE DOLLAR',
  'SGD',
]

export function extractTextChunksFromLine(contents: string[]): string[][] {
  type Mode = 'seek' | 'amount' | 'date1' | 'date2' | 'provider' | 'finalize'
  let mode: Mode = 'seek'

  let parsedItems: string[][] = []
  let tempItem: string[] = []
  let tempValue: string = ''

  let yearIdentified: boolean = false
  let tempYearIdent: string[] = []

  // first page is previous balance, prune some of those out before start looping
  for (const content of contents[0] === 'PREVIOUS' && contents[1] === 'BALANCE'
    ? contents.slice(4)
    : contents) {
    /**
     * Year identifier parser
     */
    if (!yearIdentified) {
      if (
        tempYearIdent.length === 0 &&
        content.match(creditCardRegex) !== null
      ) {
        tempYearIdent.push(content)
      } else if (tempYearIdent.length !== 0) {
        if (tempYearIdent.length === 1 && content.match(dateRegex) === null) {
          tempYearIdent = []
        } else if (
          tempYearIdent.length === 3 &&
          content.match(dateRegex) !== null
        ) {
          parsedItems.push([`>>>YEAR:20${content}`])
          yearIdentified = true
          tempYearIdent = []
        } else {
          tempYearIdent.push(content)
        }
      }
    }

    /**
     * Regular parser
     */
    // seek mode: looking for the begining string which is an amount
    if (mode === 'seek' && content.match(amountRegex) !== null) {
      tempValue = content
      mode = 'amount'
    }
    // amount mode: finalize billed amount
    else if (mode === 'amount') {
      // if end with satang, then tx line is valid. else cleanup and revert to seek mode
      if (content.match(satangRegex) !== null) {
        tempItem.push(`${tempValue}${content}`)
        tempValue = ''
        mode = 'date1'
      } else {
        tempValue = ''
        mode = 'seek'
      }
    }
    // date 1 mode: parse posting date, date 2 mode: parse tx date
    else if (mode === 'date1' || mode === 'date2') {
      if (content.match(dateRegex) !== null) {
        tempValue = content
      } else if (content.match(monthRegex) !== null) {
        tempItem.push(`${tempValue} ${content}`)
        tempValue = ''
        mode = mode === 'date1' ? 'date2' : 'provider'
      }
    }
    // provider mode: parse tx provider, keep adding until found amount string
    else if (mode === 'provider') {
      if (content.match(amountRegex) !== null) {
        tempItem.push(tempValue)
        tempValue = content
        mode = 'finalize'
      } else {
        tempValue += ` ${content}`
      }
    }
    // finalize mode: handle special cases
    else if (mode === 'finalize') {
      let lastItemValue = tempItem[tempItem.length - 1]
      // if next value is not a satang, this could be because provider name contains number
      if (content.match(satangRegex) === null) {
        tempValue = `${lastItemValue} ${tempValue} ${content}`
        tempItem.pop()
        mode = 'provider'
      }
      // when when satang found, maybe this could be foriegn currency
      else if (
        foriegnCurrencies.some(currency =>
          lastItemValue.endsWith(` ${currency}`)
        )
      ) {
        tempValue = `${lastItemValue} ${tempValue}${content}`
        tempItem.pop()
        mode = 'provider'
      }
      // otherwise passed!
      else {
        parsedItems.push(tempItem)
        tempItem = [`${tempValue}${content}`]
        tempValue = ''
        mode = 'date1'
      }
    }
  }

  // Poom's kasikorn implementation put transaction date first before posting date
  // final build: [txDate, postDate, provider, amount]
  return parsedItems.map(([amount, postingDate, transactionDate, provider]) =>
    amount.startsWith('>>>')
      ? [amount]
      : [transactionDate, postingDate, provider, amount]
  )
}

const intoAmount = (s: string | null | undefined) => {
  let isMinus = false
  let targetInput = s

  if (typeof s === 'string' && s.endsWith('-')) {
    isMinus = true
    targetInput = targetInput.replace('-', '')
  }

  return parseFloat(targetInput?.replace(/,/g, '') ?? '') * (isMinus ? -1 : 1)
}

export const chunksToTransaction =
  (year: string) =>
  (chunks: string[]): Transaction => {
    const [postingDate, transactionDate, provider, amount] = chunks

    // posting date should be newer than tx date
    const processedPostingDate = new Date(`${postingDate} ${year}`)
    let processedTransactionDate = new Date(`${transactionDate} ${year}`)

    if (
      processedPostingDate.valueOf() - processedTransactionDate.valueOf() <
      0
    ) {
      processedTransactionDate = new Date(
        `${transactionDate} ${Number(year) - 1}`
      )
    }

    return {
      paymentDate: processedPostingDate,
      transactionDate: processedTransactionDate,
      description: provider,
      amount: intoAmount(amount),
    }
  }

export const parseCitibankCreditStatement: StatementParser = pages => {
  const extractedChunks = pages.map(extractTextChunksFromLine).flat()

  const statementYear = extractedChunks
    .find(o => o[0].startsWith('>>>'))[0]
    .split(':')[1]

  return extractedChunks
    .filter(o => !o[0].startsWith('>>>'))
    .map(chunksToTransaction(statementYear))
}
