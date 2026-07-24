'use client'

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatTonCompact } from '@/lib/format'

type Row = { name: string; omzetTotal: number }

export function TopSalesBar({ data }: { data: Row[] }) {
  const chartData = data.map((d) => ({
    name: d.name.split(' ')[0],
    fullName: d.name,
    omzet: d.omzetTotal,
  }))

  return (
    <ChartContainer
      config={{
        omzet: { label: 'Tonase', color: 'var(--chart-1)' },
      }}
      className="h-[340px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ left: 8, right: 56 }}
      >
        <XAxis type="number" dataKey="omzet" hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={70}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) => formatTonCompact(Number(v))}
              labelKey="fullName"
            />
          }
        />
        <Bar dataKey="omzet" radius={4}>
          {chartData.map((_, i) => (
            <Cell
              key={i}
              fill={i < 3 ? 'var(--chart-1)' : 'var(--chart-2)'}
            />
          ))}
          <LabelList
            dataKey="omzet"
            position="right"
            className="fill-muted-foreground"
            fontSize={11}
            formatter={(v: number) => formatTonCompact(v)}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
