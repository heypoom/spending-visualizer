import { createSignal, createMemo } from "solid-js"
import { SolidApexCharts } from "solid-apexcharts"
import type { Transaction } from "@parser"
import cx from "clsx"
import dayjs from "dayjs"
type CountType = "number" | "amount"

export const TimeBarChart = (props: {
  transactions: Transaction[]
  name: string
}) => {
  const [type, setType] = createSignal<CountType>("number")

  const formatData = createMemo(() =>
    props?.transactions.reduce((acc, cur) => {
      const key = dayjs(cur.transactionDate).format("DD-MMM-YYYY")
      if (!acc[key]) acc[key] = 0

      if (type() === "number") {
        acc[key]++
      } else if (type() === "amount") {
        acc[key] += cur.amount
      }
      return acc
    }, {} as { [s: string]: number })
  )
  const options = createMemo(
    () =>
      ({
        chart: {
          width: 640,
          height: 400,
          id: props?.name,
        },
        yaxis: {
          decimalsInFloat: 2,
        },
        xaxis: {
          tickPlacement: "on",
          type: "datetime",
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

        labels: Object.keys(formatData()),
      } as ApexCharts.ApexOptions)
  )
  const series = createMemo(() => [
    {
      name: type(),
      data: Object.values(formatData()) as number[],
    },
  ])
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
      <SolidApexCharts type="bar" options={options()} series={series()} />
    </div>
  )
}
