import { parseStatement, Transaction } from "@parser"
import {
  ENTER_PASSWORD,
  TOO_MANY_PASSWORD_ATTEMPTS,
} from "../constant/password"

const handleRequestPassword = (updatePassword: (password: string) => void) => {
  const password = prompt(ENTER_PASSWORD)
  updatePassword(password)
}

const handleMaxPasswordTries = () => {
  alert(TOO_MANY_PASSWORD_ATTEMPTS)
}

export const processStatementFile = async (
  file: File
): Promise<Transaction[]> =>
  new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () =>
      resolve(
        parseStatement(r.result, {
          handleRequestPassword,
          handleMaxPasswordTries,
        })
      )

    r.readAsArrayBuffer(file)
  })
