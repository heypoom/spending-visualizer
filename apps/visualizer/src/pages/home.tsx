import type { Transaction } from "@parser"

import { createEffect, createSignal } from "solid-js"
import { cache } from "../utils/cache"
import { formatNumber } from "../utils/format"
import { processStatementFile } from "../utils/readFile"
import cx from "clsx"

interface Column {
  title: string
  class?: string
  accessor(tx: Transaction): string | number
}

export default function Home() {
  const [statementList, setStatementList] = createSignal<string[]>([])
  const [selectedStatement, setSelectedStatement] = createSignal<{
    txs: Transaction[]
    name: string
  } | null>(null)
  createEffect(() => {
    const cacheTxs = cache.getStatements()
    if (!selectedStatement() && cacheTxs) {
      setStatementList(Object.keys(cacheTxs))
    }
  })

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
      accessor: (tx) => formatNumber(tx?.amount),
    },
    {
      title: "Description",
      accessor: (tx) => tx?.description,
    },
    {
      title: "Location/ID",
      accessor: (tx) => tx?.description2,
    },
    {
      title: "Type",
      accessor: (tx) => tx?.type,
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
    let newCacheTxs = {}
    await Promise.all(
      files.map(async (file) => {
        const transactions = (await processStatementFile(file)).sort(
          (txa, txb) => +txb.paymentDate - +txa.paymentDate
        )

        const billName = file.name
        newCacheTxs = cache.addStatement(billName, transactions)
      })
    )

    setStatementList(Object.keys(newCacheTxs))
    setSelectedStatement({
      name: Object.keys(newCacheTxs)[0],
      txs: newCacheTxs[Object.keys(newCacheTxs)[0]] as Transaction[],
    })
  }

  const handleSelectBill = (billName: string) => {
    const cacheTxs = cache.getStatements()
    setSelectedStatement({
      name: billName,
      txs: cacheTxs[billName] as Transaction[],
    })
  }
  const handleRemoveBill = (billName: string) => {
    const newCacheTxs = cache.removeStatement(billName)

    setStatementList(Object.keys(newCacheTxs))
    setSelectedStatement(null)
  }

  function generateExports(format: "json" | "csv") {
    if (format === "json")
      return JSON.stringify(selectedStatement().txs, null, 2)

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

      const values = selectedStatement()
        ?.txs.map((t) =>
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

      {!selectedStatement()?.txs && (
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
      <div class="fixed left-2 top-2 grid gap-2">
        <button
          class="px-4 py-2 shadow-md text-sm bg-gray-700 hover:bg-gray-800 active:bg-gray-600 text-white rounded-md"
          onClick={handleClickUploadFile}
        >
          Add new Statement
        </button>

        {statementList()
          .sort()
          .map((name) => (
            <div class="flex gap-2">
              <button
                class={cx("px-4 py-2 shadow-md text-sm rounded-md", {
                  "bg-gray-700 active:bg-gray-600 text-white hover:bg-gray-800":
                    name === selectedStatement()?.name,
                  "bg-white active:bg-gray-600 text-gray-700 hover:bg-gray-800 hover:text-white":
                    name !== selectedStatement()?.name,
                })}
                onClick={() => handleSelectBill(name)}
              >
                {name}
              </button>
              <button
                class="px-4 py-2 shadow-md text-sm bg-gray-700 hover:bg-gray-800 active:bg-gray-600 text-white rounded-md"
                onClick={() => handleRemoveBill(name)}
              >
                CLEAR
              </button>
            </div>
          ))}
      </div>

      {selectedStatement()?.txs && (
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
                  {selectedStatement()?.txs?.map((tx) => (
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
                        selectedStatement()?.txs?.reduce(
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
