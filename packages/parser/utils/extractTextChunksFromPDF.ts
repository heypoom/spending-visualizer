import {getDocument, GlobalWorkerOptions} from 'pdfjs-dist'

import {DocumentSource} from '../@types/DocumentSource'
import {ENTER_PASSWORD, MAX_NUMBER_OF_TRIES, TOO_MANY_PASSWORD_ATTEMPTS} from '../constant/password'

/**
 * Extracts chunks of texts from PDF.
 *
 * @todo write tests for this - find a sample source we can use in tests.
 **/
export async function extractTextChunksFromPDF(
  source: DocumentSource
): Promise<string[][]> {
  // Initialize PDF.js workers
  if (typeof window !== 'undefined' && !GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = await import(
      'pdfjs-dist/build/pdf.worker.entry'
    )
  }
  
  const documentProvider = getDocument(source);

  let numberOfTries = 0;

  documentProvider.onPassword = (
    updatePassword: (password: string) => void,
    _: any
  ) => {
    if (++numberOfTries > MAX_NUMBER_OF_TRIES) {
      alert(TOO_MANY_PASSWORD_ATTEMPTS)
      return;
    }
    const password = prompt(ENTER_PASSWORD)
    updatePassword(password)
  }

  const document = await documentProvider.promise
  const pages: string[][] = []

  for (let numPage = 1; numPage <= document.numPages; numPage++) {
    try {
      const page = await document.getPage(numPage)
      const textContents = await page.getTextContent()

      const textChunks = textContents.items
        .map((item) => {
          // Text content
          if ('str' in item) return item.str.trim()

          return ''
        })
        .filter((line) => line)

      pages.push(textChunks)
    } catch (err) {
      // TODO: handle possible errors on page N
      throw new Error(`'unable to parse page ${numPage}'`)
    }
  }

  return pages
}
