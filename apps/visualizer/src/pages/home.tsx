import type { Transaction } from "@parser"

import { createSignal } from "solid-js"
import { processStatementFile } from "../utils/readFile"

export default function Home() {
  const [transactions, setTransactions] = createSignal<Transaction[] | null>(
    null
  )

  const [errorMessage, setError] = createSignal<string | null>(null)

  async function handleDrop(e: DragEvent) {
    e.preventDefault()

    const files = Array.from(e.dataTransfer.files)

    const transactions = (
      await Promise.all(files.map(processStatementFile))
    ).flat()

    setTransactions(transactions)
  }

  async function handleDragOver(e: DragEvent) {
    e.preventDefault()
  }

  const headers = ["Amount", "Payment Date"]

  return (
    <div>
      {!transactions() && (
        <div
          class="flex items-center justify-center min-h-screen"
          ondrop={handleDrop}
          ondragover={handleDragOver}
        >
          <div class="flex flex-col items-center gap-y-6 bg-red">
            <div class="border border-bg-gray-400 border-width-8 w-28 h-28 rounded-full flex items-center justify-center">
              <i class="fa-solid fa-file-arrow-up fa-3x"></i>
            </div>

            <div class="m-4 text-3xl">อัพโหลดเอกสาร Statement ที่นี่</div>
          </div>
        </div>
      )}

      <div class="max-w-[640px] mx-auto">
        <div class="flex flex-col items-center justify-center min-h-screen m-6">
          <table class="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th
                  scope="col"
                  class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                >
                  Description
                </th>

                {headers.map((header) => (
                  <th
                    scope="col"
                    class="py-3.5 px-3 text-left text-sm font-semibold text-gray-900"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-200">
              {transactions()?.map((tx) => (
                <tr>
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                    {tx.description}
                  </td>

                  <td class="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {tx.amount}
                  </td>

                  <td class="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {tx.paymentDate.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
