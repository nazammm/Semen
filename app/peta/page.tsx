import { Store, StoreIcon, CheckCircle2, XCircle, Building2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { StoreMapView } from "@/components/map/store-map-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStores, getBranchPoints, getStoreStatsByProvince, getKpis } from "@/lib/queries"

export const dynamic = "force-dynamic"

export default async function PetaPage() {
  const [stores, branches, provinceStats, kpi] = await Promise.all([
    getStores(),
    getBranchPoints(),
    getStoreStatsByProvince(),
    getKpis(),
  ])

  const provinces = provinceStats.map((p) => p.province)
  const activeRate =
    kpi.totalStores > 0 ? Math.round((kpi.activeStores / kpi.totalStores) * 100) : 0

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Peta Sebaran Toko"
        description="Lokasi seluruh toko mitra dan kantor cabang, beserta status keaktifannya."
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Toko" value={`${kpi.totalStores}`} icon={Store} sub="mitra terdaftar" />
        <StatCard
          label="Toko Aktif"
          value={`${kpi.activeStores}`}
          icon={CheckCircle2}
          sub={`${activeRate}% dari total`}
        />
        <StatCard
          label="Toko Non-aktif"
          value={`${kpi.inactiveStores}`}
          icon={XCircle}
          sub="perlu di-follow up"
        />
        <StatCard label="Kantor Cabang" value={`${kpi.totalBranches}`} icon={Building2} sub="titik distribusi" />
      </section>

      <StoreMapView stores={stores} branches={branches} provinces={provinces} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StoreIcon className="h-4 w-4 text-primary" />
            Sebaran Toko per Provinsi
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {provinceStats.map((p) => {
            const pct = p.total > 0 ? (p.aktif / p.total) * 100 : 0
            return (
              <div key={p.province} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.province}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {p.aktif} aktif · {p.nonAktif} non-aktif
                  </span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-destructive/25">
                  <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
