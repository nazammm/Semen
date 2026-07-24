import { Store, Users, Warehouse, Coins, Package, Building2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OmzetTrendChart } from "@/components/charts/omzet-trend-chart"
import { BranchBarChart } from "@/components/charts/branch-bar-chart"
import { CategoryDonut } from "@/components/charts/category-donut"
import {
  getKpis,
  getMonthlyOmzet,
  getOmzetByBranch,
  getSalesByCategory,
  getSalesmenRanking,
} from "@/lib/queries"
import { formatNumber, formatRupiahCompact } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function OverviewPage() {
  const [kpi, monthly, byBranch, byCategory, salesmen] = await Promise.all([
    getKpis(),
    getMonthlyOmzet(),
    getOmzetByBranch(),
    getSalesByCategory(),
    getSalesmenRanking(),
  ])

  const growth =
    kpi.omzetPrevMonth > 0
      ? ((kpi.omzetThisMonth - kpi.omzetPrevMonth) / kpi.omzetPrevMonth) * 100
      : undefined

  const topSales = salesmen.slice(0, 5)
  const maxOmzet = topSales[0]?.omzetTotal || 1

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Ringkasan Eksekutif"
        description="Pandangan menyeluruh distribusi semen dari kantor pusat ke seluruh cabang dan toko."
      >
        <Badge variant="outline" className="gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {kpi.totalBranches} Cabang Aktif
        </Badge>
      </PageHeader>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Omzet Bulan Ini"
          value={formatRupiahCompact(kpi.omzetThisMonth)}
          icon={Coins}
          trend={growth}
          sub="vs bulan lalu"
        />
        <StatCard
          label="Volume Terjual (Bln Ini)"
          value={`${formatNumber(kpi.volumeThisMonth)} unit`}
          icon={Package}
          sub="sak + ton"
        />
        <StatCard
          label="Toko Aktif"
          value={`${kpi.activeStores} / ${kpi.totalStores}`}
          icon={Store}
          sub={`${kpi.inactiveStores} toko non-aktif`}
        />
        <StatCard
          label="Total Stok Gudang"
          value={`${formatNumber(kpi.totalStockUnits)} unit`}
          icon={Warehouse}
          sub={`di ${kpi.totalBranches} cabang`}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tren Omzet 6 Bulan Terakhir</CardTitle>
            <CardDescription>Total nilai penjualan seluruh cabang per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <OmzetTrendChart data={monthly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Komposisi per Kategori</CardTitle>
            <CardDescription>Distribusi omzet berdasarkan jenis semen</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={byCategory} />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Omzet per Cabang</CardTitle>
            <CardDescription>Kontribusi masing-masing kantor cabang</CardDescription>
          </CardHeader>
          <CardContent>
            <BranchBarChart data={byBranch} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Top 5 Salesman
            </CardTitle>
            <CardDescription>Berdasarkan total omzet</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {topSales.map((s, i) => (
              <div key={s.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="truncate font-medium">{s.name}</span>
                  </div>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatRupiahCompact(s.omzetTotal)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(s.omzetTotal / maxOmzet) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
