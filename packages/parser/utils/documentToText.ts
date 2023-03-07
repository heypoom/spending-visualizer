import {getDocument} from 'pdfjs-dist'

import {DocumentInput} from '../@types/Document'

/**
 * Extracts text from PDF.
 *
 * @todo write tests for this - find a sample source we can use in tests.
 **/
export async function extractTextFromPDF(source: DocumentInput) {
  const document = await getDocument(source).promise
  const pages: string[][] = []

  for (let numPage = 1; numPage < document.numPages; numPage++) {
    try {
      const page = await document.getPage(numPage)

      const content = await page.getTextContent()

      const stringObjects = content.items.map((item) => {
        // Text content
        if ('str' in item) return item.str

        return ''
      })

      pages.push(stringObjects)
    } catch (err) {
      // TODO: error happened on page N
    }
  }

  return pages
}
