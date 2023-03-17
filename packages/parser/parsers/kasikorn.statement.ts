import dayjs = require("dayjs");
import { Transaction } from "../@types/Transaction";
var customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

type StatementMetadata = {
  accountNo: string;
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
};

const PATTERN_ACCOUNT_NO = /[X]{3}\-[X]{1}\-[X]{2}[0-9]{3}\-[0-9]{1}/;
const PATTERN_DATE_DASH = /\d{2}\-\d{2}\-\d{2}/;
const PATTERN_DATE_RANGE_SLASH = /\d{2}\/\d{2}\/\d{4}\s\-\s\d{2}\/\d{2}\/\d{4}/;
const PATTERN_TIME = /\d{2}\:\d{2}/;
const PATTERN_DECIMAL_AMOUNT = /[0-9,]+\.\d{2}/;

const isItemDateFormat = (s: string) => PATTERN_DATE_DASH.test(s);

/**
 * Function for extract K Plus transaction statement.
 * @param contents
 * @returns
 */
export function extractTransactionsFromPdf(
  contents: string[][]
): Transaction[] {
  const header = extractHeaderFromPdf(contents[0]);
  const lineChunks = extractTextChunksFromLine(contents);
  const txChunks = extractChunkFromLine(lineChunks);

  const transactions = txChunks.flatMap(
    (txChunk) => extractTransactionChunk(txChunk, header) ?? []
  );

  return transactions;
}

// Get header data.
export function extractHeaderFromPdf(chunk: string[]): StatementMetadata {
  const firstDateIndex: number = chunk.findIndex((item) =>
    item.match(PATTERN_DATE_DASH)
  );
  const headerChunk = chunk.slice(0, firstDateIndex);

  const dateRange = headerChunk
    .find((str) => str.match(PATTERN_DATE_RANGE_SLASH))
    .split(" - ")
    .map((dateStr) => dayjs(dateStr, "DD/MM/YYYY"));

  const accountNo = headerChunk.find((str) => str.match(PATTERN_ACCOUNT_NO));

  return {
    accountNo,
    from: dateRange[0],
    to: dateRange[1],
  };
}

export function extractTextChunksFromLine(contents: string[][]): string[][] {
  const lineChunks = [];
  for (let i = 0; i < contents.length; i++) {
    const chunk: string[] = contents[i];
    const firstDateIndex: number = chunk.findIndex((item) =>
      item.match(PATTERN_DATE_DASH)
    );

    const cutTailChunkLength = i < contents.length - 1 ? 2 : 3;

    const slicedHeadChunk = chunk.slice(firstDateIndex);
    const slicedHeadAndTailChunk = slicedHeadChunk.slice(
      0,
      slicedHeadChunk.length - cutTailChunkLength
    );

    lineChunks.push(slicedHeadAndTailChunk);
  }

  return lineChunks;
}

// Seperate chunk line to transaction block.
export function extractChunkFromLine(lineChunks: string[][]): string[][] {
  let temp: string[] = [];

  const rawTxChunks: string[][] = [];
  lineChunks.forEach((lineChunk) => {
    lineChunk.forEach((item) => {
      const isDate = isItemDateFormat(item);

      if (isDate && temp.length !== 0) {
        rawTxChunks.push(temp);
        temp = [];
      }
      temp.push(item);
    });
  });

  // Push remaining chunk.
  rawTxChunks.push(temp);

  return rawTxChunks;
}

// Extract transction chunk to usable data.
// TODO: Check type of transaction if transaction is expense or income and expose to transaction.
export function extractTransactionChunk(
  txChunk: string[],
  header: StatementMetadata
): Transaction | undefined {
  // Timestamp
  const dateStr = txChunk
    .find((str) => str.match(PATTERN_DATE_DASH))
    .split("-");

  const timeStr = txChunk.find((str) => str.match(PATTERN_TIME))?.split(":");

  let transactionDate = dayjs(header.from).set("date", parseFloat(dateStr[0]));

  if (timeStr !== undefined) {
    transactionDate = transactionDate
      .set("hour", parseFloat(timeStr[0]))
      .set("minute", parseFloat(timeStr[1]));
  }

  // Amount
  let amount: number;
  const isAmountStr = txChunk[txChunk.length - 1].match(PATTERN_DECIMAL_AMOUNT);
  if (isAmountStr !== null)
    amount = parseFloat(txChunk[txChunk.length - 1].replace(",", ""));

  // Channel
  const slicedTimestampChunk = txChunk.slice(2);
  const amountLeftIndex = slicedTimestampChunk.findIndex((str) =>
    str.match(PATTERN_DECIMAL_AMOUNT)
  );
  const channel = slicedTimestampChunk.slice(0, amountLeftIndex).join();

  // Amount
  const description = slicedTimestampChunk
    .slice(amountLeftIndex + 1, slicedTimestampChunk.length - 2)
    .join();

  if (amount && description) {
    return {
      transactionDate: transactionDate.toDate(),
      paymentDate: null,
      amount,
      description,
      description2: channel,
    };
  }
}
