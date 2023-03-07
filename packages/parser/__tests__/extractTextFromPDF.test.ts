import * as fs from 'fs/promises'
import {describe, it, expect} from 'vitest'

import {extractTextChunksFromPDF} from '../utils/extractTextChunksFromPDF'

describe('pdf text extractor', () => {
  it('extracts chunks of texts from PDF documents', async () => {
    // TODO: this test takes 117ms to run. can we avoid using readFile to speed up tests.
    const b = await fs.readFile('./__tests__/fixtures/extraction-sample.pdf')
    const source = new Uint8Array(b.buffer, b.byteOffset, b.byteLength)

    const text = await extractTextChunksFromPDF(source)
    const firstText = text[0]?.[0]

    expect(firstText).toBe('A Simple PDF File')
  })
})
