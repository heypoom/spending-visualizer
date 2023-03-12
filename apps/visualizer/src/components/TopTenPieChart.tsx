import { createSignal, createMemo } from "solid-js"
import { SolidApexCharts } from "solid-apexcharts"
import type { Transaction } from "@parser"
import cx from "clsx"

type CountType = "number" | "amount"

export const TopTenPieChart = (props: {
  transactions: Transaction[]
  name: string
}) => {
  const [type, setType] = createSignal<CountType>("number")
  const options = createMemo(
    () =>
      ({
        chart: {
          width: 640,
          height: 600,
          id: props?.name,
        },
        responsive: [
          {
            breakpoint: 600,
            options: {
              chart: {
                width: 600,
              },
            },
          },
        ],
        labels: props?.transactions?.reduce((acc, cur) => {
          if (!acc.includes(cur.description)) return [...acc, cur.description]
          return acc
        }, [] as string[]),
      } as ApexCharts.ApexOptions)
  )
  const series = createMemo(
    () =>
      Object.values(
        props?.transactions.reduce((acc, cur) => {
          if (!acc[cur.description]) acc[cur.description] = 0

          if (type() === "number") {
            acc[cur.description]++
          } else if (type() === "amount") {
            acc[cur.description] += cur.amount
          }
          return acc
        }, {} as { [s: string]: number })
      ) as number[]
  )

  // options and series can be a store or signal
  if (props?.transactions.length === 0) return <p>none</p>
  return (
    <div>
      <div class="flex gap-2">
        {(["number", "amount"] as CountType[]).map((type_name) => (
          <button
            class={cx("px-4 py-2 shadow-md text-sm rounded-md", {
              "bg-gray-700 active:bg-gray-600 text-white hover:bg-gray-800":
                type_name === type(),
              "bg-white active:bg-gray-600 text-gray-700 hover:bg-gray-800 hover:text-white":
                type_name !== type(),
            })}
            onClick={() => setType(type_name)}
          >
            count by {type_name}
          </button>
        ))}
      </div>
      <SolidApexCharts type="pie" options={options()} series={series()} />
    </div>
  )
}
