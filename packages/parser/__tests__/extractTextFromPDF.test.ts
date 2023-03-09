import * as fs from "fs/promises"
import {describe, it, expect, vi, beforeEach} from "vitest"

import {extractTextChunksFromPDF} from "../utils/extractTextChunksFromPDF"

const readPDFFile = async (filePath: string) => {
  const b = await fs.readFile(filePath)
  return new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
}
describe("pdf text extractor", () => {
  const handleMaxPasswordTries = vi.fn()
  const handleRequestPassword = vi.fn()
  const CORRECT_PASSWORD = "123456"
  const WRONG_PASSWORD = "12345678"
  beforeEach(() => {
    handleMaxPasswordTries.mockClear()
    handleRequestPassword.mockClear()
  })
  it("extracts chunks of texts from PDF documents", async () => {
    // TODO: this test takes 117ms to run. can we avoid using readFile to speed up tests.

    const source = await readPDFFile(
      "./__tests__/fixtures/extraction-sample.pdf"
    )
    const text = await extractTextChunksFromPDF(source, {
      handleMaxPasswordTries,
      handleRequestPassword,
    })
    const firstText = text[0]?.[0]

    expect(firstText).toBe("A Simple PDF File")
    expect(handleRequestPassword).not.toHaveBeenCalled()
    expect(handleMaxPasswordTries).not.toHaveBeenCalled()
  })
  it("handles password-protected PDF documents (correct password)", async () => {
    handleRequestPassword.mockImplementationOnce(
      (updatePassword: (password: string) => void) =>
        updatePassword(CORRECT_PASSWORD)
    )
    const source = await readPDFFile(
      "./__tests__/fixtures/protected-sample.pdf"
    )

    const text = await extractTextChunksFromPDF(source, {
      handleMaxPasswordTries,
      handleRequestPassword,
    })
    const firstText = text[0]?.[0]

    expect(firstText).toBe("A Simple PDF File")
    expect(handleRequestPassword).toHaveBeenCalled()
    expect(handleMaxPasswordTries).not.toHaveBeenCalled()
  })
  it("handles password-protected PDF documents (wrong password)", async () => {
    handleMaxPasswordTries.mockImplementationOnce(() => {
      throw new Error("Max password tries reached")
    })
    handleRequestPassword.mockImplementation(
      (updatePassword: (password: string) => void) => {
        updatePassword(WRONG_PASSWORD)
      }
    )
    const source = await readPDFFile(
      "./__tests__/fixtures/protected-sample.pdf"
    )

    try {
      await extractTextChunksFromPDF(source, {
        handleMaxPasswordTries,
        handleRequestPassword,
      })
    } catch (e) {}
    expect(handleRequestPassword).toHaveBeenCalledTimes(3)
    expect(handleMaxPasswordTries).toHaveBeenCalled()
  })
})
