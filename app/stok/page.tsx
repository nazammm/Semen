import { PageHeader } from '@/components/page-header'
import { StockMatrix } from '@/components/stock/stock-matrix'
import { DistributionProvinceChart } from '@/components/charts/distribution-province-chart'
import { StatCard } from '@/components/stat-card'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getStockMatrix,
  getStockByProduct,
  getLowStock,
  getDistributionByProvince,
} from '@/lib/queries'
import { Boxes, PackageX, Warehouse } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Stok & Sebaran Barang',
}

export default async function StokPage() {
  const [matrix, byProduct, lowStock, distribution] = await Promise.all([
    getStockMatrix(),
    getStockByProduct(),
    getLowStock(600),
    getDistributionByProvince(),
  ])

  const totalStock = byProduct.reduce((a, p) => a + p.quantity, 0)
  const maxProduct = Math.max(...byProduct.map((p) => p.quantity), 1)

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Stok & Sebaran Barang"
        description="Posisi stok per cabang dan distribusi barang ke wilayah."
      />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Stok Gudang"
            value={`${totalStock.toLocaleString('id-ID')} sak`}
            icon={Warehouse}
            sub={`Tersebar di ${matrix.branches.length} cabang`}
          />
          <StatCard
            label="Jenis Produk"
            value={matrix.products.length.toString()}
            icon={Boxes}
            sub="Varian semen aktif"
          />
          <StatCard
            label="Stok Menipis"
            value={lowStock.length.toString()}
            icon={PackageX}
            sub="Item di bawah ambang 600 sak"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Stok per Jenis Produk</CardTitle>
              <CardDescription>
                Total stok di seluruh cabang per varian.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {byProduct.map((p) => (
                <div key={p.product} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.product}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {p.quantity.toLocaleString('id-ID')} {p.unit}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(p.quantity / maxProduct) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sebaran Barang per Provinsi</CardTitle>
              <CardDescription>
                Volume barang yang telah tersalur ke toko.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionProvinceChart data={distribution} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Matriks Stok per Cabang</CardTitle>
            <CardDescription>
              Angka merah menandakan stok kritis, kuning perlu perhatian.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockMatrix
              products={matrix.products}
              branches={matrix.branches}
            />
          </CardContent>
        </Card>

        {lowStock.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Peringatan Stok Menipis</CardTitle>
              <CardDescription>
                Item yang perlu segera direstock.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStock.map((item, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="gap-1.5 border-amber-500/40 py-1.5 text-amber-300"
                  >
                    <span className="font-medium">{item.branch}</span>
                    <span className="text-muted-foreground">
                      &middot; {item.product}
                    </span>
                    <span className="font-semibold">
                      {item.quantity} {item.unit}
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
