import { describe, it, expect, vi } from "vitest";
import * as fs from "fs/promises";
import { extractTextChunksFromPDF } from "../../utils/extractTextChunksFromPDF";
import {
  extractHeaderFromPdf,
  extractTextChunksFromLine,
  parseKasikornBankStatement,
} from "../kasikorn.statement";

describe("kasikorn statment parser", async () => {
  // TODO: Create a mock statement resembling a real world with fake data or anonymized data.
  const sourceFile = await fs.readFile(
    "./parsers/__tests__/fixtures/test-kbank-statement-en.pdf"
  );
  const handleMaxPasswordTries = vi.fn();
  const handleRequestPassword = vi.fn();
  const rawChunk = await extractTextChunksFromPDF(sourceFile, {
    handleMaxPasswordTries,
    handleRequestPassword,
  });

  it("processes each line to clean chunk of text", async () => {
    expect(rawChunk.length).toBe(6);

    const lineChunk = extractTextChunksFromLine(rawChunk);
    expect(lineChunk.length).toBe(rawChunk.length);
  });

  it("processes header from pdf", async () => {
    const headerInfo = extractHeaderFromPdf(rawChunk[0]);

    expect(headerInfo.accountNo).toBeDefined();
    expect(headerInfo.from.toISOString()).toBe("2023-02-01T00:00:00.000Z");
    expect(headerInfo.to.toISOString()).toBe("2023-02-28T00:00:00.000Z");
  });

  it("parses generic kasikorn bank statement", async () => {
    const transactions = parseKasikornBankStatement(rawChunk);
    expect(transactions.length).toBe(123);

    const sampleTransaction = transactions[1];

    expect(sampleTransaction.amount).toBeGreaterThan(0);
    expect(sampleTransaction.description).toBe(
      "เพื่อชําระ Ref XNGNA โทโฮ จิเกียว (ไทยแลนด์)"
    );
    expect(sampleTransaction.description2).toBe("K PLUS");
    expect(sampleTransaction.type).toBe("withdrawal");
  });
});
