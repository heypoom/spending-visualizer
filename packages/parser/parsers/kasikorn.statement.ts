import { Transaction } from "../@types/Transaction";

type StatementMetadata = {
  accountNo: string;
  from: Date;
  to: Date;
};

const PATTERN_ACCOUNT_NO = /[X]{3}\-[X]{1}\-[X]{2}[0-9]{3}\-[0-9]{1}/;

const PATTERN_DATE_DASH = /\d{2}\-\d{2}\-\d{2}/;
const PATTERN_FULL_DATE_SLASH = /(\d{2})\/(\d{2})\/(\d{4})/;
const PATTERN_DATE_RANGE_SLASH = /\d{2}\/\d{2}\/\d{4}\s\-\s\d{2}\/\d{2}\/\d{4}/;

const PATTERN_TIME = /\d{2}\:\d{2}/;

const PATTERN_DECIMAL_AMOUNT = /[0-9,]+\.\d{2}/;

const isItemDateFormat = (s: string) => PATTERN_DATE_DASH.test(s);

/**
 * Function for extract K Plus transaction statement.
 * @param contents
 * @returns
 */
export function parseKasikornBankStatement(
  contents: string[][]
): Transaction[] {
  const header = extractHeaderFromPdf(contents[0]);
  const lineChunks = extractTextChunksFromLine(contents);
  const txChunks = extractChunkFromLine(lineChunks);

  // First transaction received is initial balance.
  const initialBalance = getInitialBalance(txChunks[0]);

  // Extract chunk of transactions and label type of transaction [withdrawal | deposit]
  const transactions = txChunks.flatMap<Transaction & { remaining: number }>(
    (txChunk) => extractTransactionChunk(txChunk, header) ?? []
  );
  const labeledTransactions = labelTransactionType(
    transactions,
    initialBalance
  );

  return labeledTransactions;
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
    .map(
      (dateStr) =>
        new Date(
          Date.parse(dateStr.replace(PATTERN_FULL_DATE_SLASH, "$3-$2-$1"))
        )
    );
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
export function extractTransactionChunk(
  txChunk: string[],
  header: StatementMetadata
): (Transaction & { remaining: number }) | undefined {
  // Timestamp
  const dateStr = txChunk
    .find((str) => str.match(PATTERN_DATE_DASH))
    .split("-");

  const timeStr = txChunk.find((str) => str.match(PATTERN_TIME))?.split(":");

  let transactionDateNumber: number;

  if (timeStr !== undefined) {
    transactionDateNumber = header.from.setDate(parseFloat(dateStr[0]));
  }
  transactionDateNumber = header.from.setDate(parseFloat(dateStr[0]));

  if (timeStr !== undefined) {
    const transactionDate = new Date(transactionDateNumber);
    transactionDateNumber = transactionDate.setHours(
      parseFloat(timeStr[0]),
      parseFloat(timeStr[1])
    );
  }

  // Remaining
  let remaining: number;
  const remainingStr = txChunk.find((item) =>
    item.match(PATTERN_DECIMAL_AMOUNT)
  );
  if (remainingStr) remaining = parseFloat(remainingStr.replace(",", ""));

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

  // Description
  const description = slicedTimestampChunk
    .slice(amountLeftIndex + 1, slicedTimestampChunk.length - 2)
    .join();

  if (amount && description) {
    return {
      transactionDate: new Date(transactionDateNumber),
      paymentDate: new Date(transactionDateNumber),
      amount,
      description,
      description2: channel,
      remaining,
    };
  }
}

export function getInitialBalance(txChunk: string[]): number | undefined {
  let remaining: number;
  const remainingStr = txChunk.find((item) =>
    item.match(PATTERN_DECIMAL_AMOUNT)
  );
  if (remainingStr) remaining = parseFloat(remainingStr.replace(",", ""));

  return remaining;
}

export function labelTransactionType(
  transactionWithRemaining: (Transaction & { remaining: number })[],
  initialBalance: number
): Transaction[] {
  return transactionWithRemaining.reduce((accumulator, transaction, index) => {
    let isTxWithdraw: boolean;
    if (index === 0 && initialBalance) {
      isTxWithdraw = initialBalance > transaction.remaining;
    } else {
      isTxWithdraw =
        transactionWithRemaining[index - 1].remaining > transaction.remaining;
    }

    const { transactionDate, paymentDate, amount, description, description2 } =
      transaction;

    return [
      ...accumulator,
      {
        transactionDate,
        paymentDate,
        amount,
        description,
        description2,
        type: isTxWithdraw ? "withdrawal" : "deposit",
      },
    ];
  }, []);
}
