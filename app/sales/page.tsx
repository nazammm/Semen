import { PageHeader } from '@/components/page-header'
import { TopPodium } from '@/components/sales/top-podium'
import { SalesRankingTable } from '@/components/sales/sales-ranking-table'
import { TopSalesBar } from '@/components/charts/top-sales-bar'
import { StatCard } from '@/components/stat-card'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getSalesmenRanking } from '@/lib/queries'
import { formatTonCompact } from '@/lib/format'
import { Users, TrendingUp, Store } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Performa Sales',
}

export default async function SalesPage() {
  const ranking = await getSalesmenRanking()

  const totalOmzet = ranking.reduce((a, s) => a + s.omzetTotal, 0)
  const avgOmzet = ranking.length ? totalOmzet / ranking.length : 0
  const topPerformer = ranking[0]
  const totalStores = ranking.reduce((a, s) => a + s.storesHandled, 0)

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Performa Sales"
        description="Ranking salesman berdasarkan kontribusi tonase ke seluruh cabang."
      />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Sales Aktif"
            value={ranking.length.toString()}
            icon={Users}
            sub="Tersebar di seluruh cabang"
          />
          <StatCard
            label="Rata-rata Tonase / Sales"
            value={formatTonCompact(avgOmzet)}
            icon={TrendingUp}
            sub="Kontribusi rata-rata per orang"
          />
          <StatCard
            label="Total Toko Ditangani"
            value={totalStores.toString()}
            icon={Store}
            sub="Akumulasi seluruh sales"
          />
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Top 3 Salesman
          </h2>
          <TopPodium data={ranking} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>10 Sales Teratas</CardTitle>
              <CardDescription>
                Berdasarkan total tonase sepanjang periode.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopSalesBar data={ranking.slice(0, 8)} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Papan Peringkat Lengkap</CardTitle>
              <CardDescription>
                {topPerformer
                  ? `${topPerformer.name} memimpin dengan ${formatTonCompact(topPerformer.omzetTotal)}.`
                  : 'Belum ada data.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesRankingTable data={ranking} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
