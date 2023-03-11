import type { Transaction } from "@parser"

import { createSignal } from "solid-js"
import { formatNumber } from "../utils/format"
import { processStatementFile } from "../utils/readFile"

export default function Home() {
  const [transactions, setTransactions] = createSignal<Transaction[] | null>(
    null
  )

  const [errorMessage, setError] = createSignal<string | null>(null)

  let passwordInputRef: HTMLInputElement | undefined = undefined

  interface Column {
    title: string
    class?: string
    accessor(tx: Transaction): string | number
  }

  const columns: Column[] = [
    {
      title: "Payment Date",
      accessor: (tx) => tx?.paymentDate?.toLocaleDateString(),
      class: "text-semibold",
    },
    {
      title: "Amount",
      accessor: (tx) => tx?.amount,
    },
    {
      title: "Description",
      accessor: (tx) => tx?.description,
    },
    {
      title: "Location/ID",
      accessor: (tx) => tx?.description2,
    },
  ]

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    processFile(e.dataTransfer?.files || new FileList())
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function handleClickUploadFile(e: MouseEvent) {
    e.preventDefault()
    passwordInputRef?.click()
  }

  function handleFileUpload(e: Event) {
    e.preventDefault()
    processFile((e.target as HTMLInputElement).files || new FileList())
  }

  async function processFile(fileList: FileList) {
    const files = Array.from(fileList)

    const transactions = (await Promise.all(files.map(processStatementFile)))
      .flat()
      .sort((txa, txb) => +txb.paymentDate - +txa.paymentDate)
    setTransactions(transactions)
  }

  function generateExports(format: "json" | "csv") {
    if (format === "json") return JSON.stringify(transactions(), null, 2)

    // TODO: create CSV export function.
    if (format === "csv") {
      const headers = [
        "Payment Date",
        "Transaction Date",
        "Amount",
        "Description",
        "Description 2",
        "Description 3",
        "Foreign Currency Amount",
        "Conversion Rate",
      ].join(", ")

      const values = transactions()
        .map((t) =>
          [
            t.paymentDate,
            t.transactionDate,
            t.amount,
            t.description,
            t.description2,
            t.description3,
            t.foreignCurrencyAmount,
            t.conversionRate,
          ].join(", ")
        )
        .join("\n")

      return `${headers}\n${values}`
    }
  }

  const exportFile = (format: "json" | "csv") => () => {
    const output = generateExports(format)

    const blob = new Blob([output], { type: "text/json" })

    const el = window.document.createElement("a")
    el.href = window.URL.createObjectURL(blob)
    el.download = `statement.${format}`
    document.body.appendChild(el)
    el.click()
    document.body.removeChild(el)
  }

  const formats = ["json", "csv"] as ["json", "csv"]

  return (
    <div>
      <input
        class="hidden"
        type="file"
        onchange={handleFileUpload}
        ref={passwordInputRef}
        multiple
      />

      {!transactions() && (
        <div
          class="flex items-center justify-center min-h-screen"
          ondrop={handleDrop}
          ondragover={handleDragOver}
          onclick={handleClickUploadFile}
        >
          <div class="flex flex-col items-center gap-y-6 bg-red">
            <div class="border border-bg-gray-400 border-width-8 w-28 h-28 rounded-full flex items-center justify-center">
              <i class="fa-solid fa-file-arrow-up fa-3x"></i>
            </div>

            <div class="m-4 text-3xl text-center leading-12">
              อัพโหลดเอกสาร Statement ที่นี่
            </div>
          </div>
        </div>
      )}

      {transactions() && (
        <div>
          <div class="fixed right-2 top-2 space-x-2">
            {formats.map((format) => (
              <button
                class="px-4 py-2 shadow-md text-sm bg-gray-700 hover:bg-gray-800 active:bg-gray-600 text-white rounded-md"
                onClick={exportFile(format)}
              >
                Export {format.toUpperCase()}
              </button>
            ))}
          </div>

          <div class="max-w-[640px] mx-auto">
            <div class="flex flex-col items-center justify-center min-h-screen m-6">
              <table class="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th
                        scope="col"
                        class={`py-3.5 px-3 text-left text-sm font-semibold text-gray-900 ${column.class}`}
                      >
                        {column.title}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody class="divide-y divide-gray-200">
                  {transactions()?.map((tx) => (
                    <tr>
                      {columns.map((column) => (
                        <td
                          class={`whitespace-nowrap py-4 px-3 text-sm text-gray-500 ${column.class}`}
                        >
                          {column.accessor(tx)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td
                      class={`whitespace-nowrap py-4 px-3 text-sm text-gray-500 text-semibold`}
                    >
                      Total
                    </td>
                    <td
                      class={`whitespace-nowrap py-4 px-3 text-sm text-gray-500 text-semibold`}
                    >
                      {formatNumber(
                        transactions()?.reduce(
                          (acc, cur) => acc + cur.amount,
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
