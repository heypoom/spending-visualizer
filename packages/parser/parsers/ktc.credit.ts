import { StatementParser } from "../@types/StatementParser";
import { Transaction } from "../@types/Transaction";
import { parseDate } from "../utils/parseDate";

const PATTERN_DATE = /\d{2}\/\d{2}\/\d{2}/;
const PATTERN_AMOUNT = /^-?\b\d[\d,.]*\b\s?-?$/;

const isDate = (s: string) => PATTERN_DATE.test(s);
const isAmount = (s: string) => PATTERN_AMOUNT.test(s) && s.includes(".");

export function extractTextChunksFromLine(contents: string[]): string[][] {
  // We start at the first date (e.g. 10/02/2023)
  const startIndex = contents.findIndex(isDate);

  const lines = contents.slice(startIndex);
  const textChunks: string[][] = [];

  // The line of transaction we are processing.
  let tx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!textChunks[tx]) textChunks[tx] = [];

    if (textChunks[tx].length === 0) {
      isDate(line) && textChunks[tx].push(line);
    } else {
      textChunks[tx].push(line);
    }

    if (isAmount(line)) tx += 1;
  }

  // Only include line items that starts with 2 dates, the transaction date and the payment date.
  // Also, only include line items that has over 3 chunks.
  // Also, remove "Payment-BAY"
  console.log(textChunks);
  const result = textChunks
    .filter((g) => isDate(g[0]) && isDate(g[1]))
    .filter((g) => g.length > 3)
    .filter((g) => !g.join("").includes("Payment-BAY"));

  return result;
}

const intoAmount = (s: string | null | undefined) => {
  const result = parseFloat(s?.replace(/,/g, "") ?? "");
  return s?.at(-1) === "-" ? -result : result;
};

/**
 * @todo refactor this function to use a better way to detect different chunks
 */
export function chunksToTransaction(chunks: string[]): Transaction | null {
  const [transactionDate, paymentDate, ...rest] = chunks;
  const amount = rest.at(-1);

  const description = rest.slice(0, rest.length - 1).join(" ");
  const description2 = description.split(" ").at(-1);

  return {
    transactionDate: parseDate(transactionDate),
    paymentDate: parseDate(paymentDate),
    description,
    description2,
    amount: intoAmount(amount),
  };

  return null;
}

export const parseKTCCreditStatement: StatementParser = (pages) => {
  const result = pages
    .map(extractTextChunksFromLine)
    .flatMap((page) => page.map(chunksToTransaction));

  return result;
};
