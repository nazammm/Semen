"use client"

import { Cell, Label, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatTonCompact } from "@/lib/format"

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function CategoryDonut({
  data,
}: {
  data: { category: string; omzet: number }[]
}) {
  const total = data.reduce((s, d) => s + d.omzet, 0)
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.category, { label: d.category, color: COLORS[i % COLORS.length] }]),
  )

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ChartContainer config={config} className="mx-auto aspect-square h-[200px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-medium">{formatTonCompact(Number(value))}</span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={data}
            dataKey="omzet"
            nameKey="category"
            innerRadius={58}
            outerRadius={88}
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) - 6}
                        className="fill-foreground text-base font-semibold"
                      >
                        {formatTonCompact(total)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 14}
                        className="fill-muted-foreground text-xs"
                      >
                        Total Tonase
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex w-full flex-col gap-2">
        {data.map((d, i) => (
          <li key={d.category} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="flex-1 truncate text-muted-foreground">{d.category}</span>
            <span className="font-medium tabular-nums">
              {total > 0 ? ((d.omzet / total) * 100).toFixed(0) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
