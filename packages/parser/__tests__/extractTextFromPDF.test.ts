import * as fs from 'fs/promises'
import {describe, it, expect} from 'vitest'

import {extractTextFromPDF} from '../../parser/utils/documentToText'

describe('pdf text extractor', () => {
  it('extracts the text from PDF documents', async () => {
    // TODO: this test takes 117ms to run. can we avoid using readFile to speed up tests.
    const b = await fs.readFile('./__tests__/assets/extraction-sample.pdf')
    const source = new Uint8Array(b.buffer, b.byteOffset, b.byteLength)

    const text = await extractTextFromPDF(source)
    const firstText = text[0]?.[0]

    expect(firstText).toBe('A Simple PDF File')
  })
})
