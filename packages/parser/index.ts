import { DocumentSource } from "./@types/DocumentSource";
import { PasswordHandler } from "./@types/PasswordHandler";
import { Transaction } from "./@types/Transaction";
import { parseKasikornCreditStatement } from "./parsers/kasikorn.credit";
import { parseKTCCreditStatement } from "./parsers/ktc.credit";
import { extractTextChunksFromPDF } from "./utils/extractTextChunksFromPDF";

export type Bank = "kasikorn" | "ktc";
export type StatementType = "credit" | "account";

export type { Transaction } from "./@types/Transaction";

export async function parseStatement(
  bank: Bank,
  type: StatementType,
  source: DocumentSource,
  passwordHandler: PasswordHandler
): Promise<Transaction[]> {
  const rawChunks = await extractTextChunksFromPDF(source, passwordHandler);

  if (bank === "kasikorn" && type === "credit")
    return parseKasikornCreditStatement(rawChunks);
  if (bank === "ktc" && type === "credit")
    return parseKTCCreditStatement(rawChunks);

  throw new Error("statement type or bank is not supported");
}
