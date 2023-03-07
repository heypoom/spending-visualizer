import { parseStatement, Transaction } from "@parser"

export const processStatementFile = async (
  file: File
): Promise<Transaction[]> =>
  new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(parseStatement("kasikorn", "credit", r.result))

    r.readAsArrayBuffer(file)
  })
