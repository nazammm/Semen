"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatTonCompact } from "@/lib/format"

const config = {
  omzet: { label: "Tonase", color: "var(--chart-1)" },
} satisfies ChartConfig

export function OmzetTrendChart({
  data,
}: {
  data: { month: string; omzet: number; volume: number }[]
}) {
  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="fillOmzet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-omzet)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-omzet)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={54}
          tickFormatter={(v) => formatTonCompact(Number(v))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatTonCompact(Number(value))}
            />
          }
        />
        <Area
          dataKey="omzet"
          type="monotone"
          fill="url(#fillOmzet)"
          stroke="var(--color-omzet)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
