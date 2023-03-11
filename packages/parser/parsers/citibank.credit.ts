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
	type Mode = 'init' | 'seek' | 'amount' | 'date1' | 'date2' | 'provider'
	let mode: Mode = 'seek'

	let parsedItems: string[][] = []
	let tempItem: string[] = []
	let tempValue: string = ''

	let yearIdentified: boolean = false
	let tempYearIdent: string[] = []

	// loop each line
	for (const content of contents) {
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
		// Seek mode: finding begining of the transaction, if find possible then switch to mode date1
		if (mode === 'seek' && content.match(dateRegex) !== null) {
			tempValue = content
			mode = 'date1'
		}
		// Date1 mode: get posting date
		else if (mode === 'date1') {
			// if this value is not a date then reject clear and go back to seek mode
			if (content.match(monthRegex)) {
				tempItem.push(`${tempValue} ${content}`)
				tempValue = ''
				mode = 'date2'
			} else {
				tempValue = ''
				mode = 'seek'
			}
		}
		// Date 2 mode: get transaction date
		else if (mode === 'date2') {
			if (content.match(dateRegex)) {
				tempValue = content
			} else if (content.match(monthRegex)) {
				tempItem.push(`${tempValue} ${content}`)
				tempValue = ''
				mode = 'provider'
			}
		}
		// Provider mode: scan for provider name until hit amount
		else if (mode === 'provider') {
			if (content.match(amountRegex) === null) {
				tempValue += ` ${content}`
			} else if (foriegnCurrencies.some(currency => tempValue.endsWith(' ' + currency))) {
				tempValue += ` ${content}`
			} else {
				tempItem.push(tempValue.trim())
				tempValue = content
				mode = 'amount'
			}
		}
		// Amount mode: get final amount in thb
		else if (mode === 'amount') {
			if (content.match(satangRegex) !== null) {
				tempItem.push(`${tempValue}${content}`)

				// push
				parsedItems.push(tempItem)

				// reset
				tempItem = []
				tempValue = ''
				mode = 'seek'
			} else {
				tempValue = tempItem[tempItem.length - 1] + ` ${tempValue}`
				tempItem.pop()
				mode = 'provider'
			}
		}
	}

	// Poom's kasikorn implementation put transaction date first before posting date
	return parsedItems
		.map(([postingDate, transactionDate, ...rest]) =>
			postingDate.startsWith('>>>')
				? [postingDate]
				: [transactionDate, postingDate, ...rest]
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

		if (processedPostingDate.valueOf() - processedTransactionDate.valueOf() < 0) {
			processedTransactionDate = new Date(`${transactionDate} ${Number(year) - 1}`)
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

		console.log({pages, extractedChunks})

	return extractedChunks
		.filter(o => !o[0].startsWith('>>>'))
		.map(chunksToTransaction(statementYear))
}

// "130"
// ".69"
// "07"
// "FEB"
// "02"
// "FEB"
// "PIXIV"
// "FANBOX"
// "TOKYO"
// "JP"
// "YEN"
// "500"
// ".00"