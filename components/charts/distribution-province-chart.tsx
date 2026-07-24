'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

type Row = { province: string; volume: number; omzet: number }

export function DistributionProvinceChart({ data }: { data: Row[] }) {
  const chartData = data.map((d) => ({
    province: d.province.replace('Sumatera', 'Sumut').replace('Sulawesi Selatan', 'Sulsel'),
    volume: d.volume,
  }))

  return (
    <ChartContainer
      config={{ volume: { label: 'Volume (ton)', color: 'var(--chart-1)' } }}
      className="h-[320px] w-full"
    >
      <BarChart accessibilityLayer data={chartData} margin={{ top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="province"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb ton`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) => `${Number(v).toLocaleString('id-ID')} ton`}
            />
          }
        />
        <Bar dataKey="volume" fill="var(--chart-1)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
