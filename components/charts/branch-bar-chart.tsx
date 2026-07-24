"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatRupiahCompact } from "@/lib/format"

const config = {
  omzet: { label: "Omzet", color: "var(--chart-1)" },
} satisfies ChartConfig

export function BranchBarChart({
  data,
}: {
  data: { branch: string; omzet: number }[]
}) {
  const chartData = data.map((d) => ({
    ...d,
    short: d.branch.replace("Cabang ", ""),
  }))
  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatRupiahCompact(Number(v)).replace("Rp ", "")}
        />
        <YAxis
          type="category"
          dataKey="short"
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatRupiahCompact(Number(value))}
            />
          }
        />
        <Bar dataKey="omzet" fill="var(--color-omzet)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
