import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatTon } from '@/lib/format'
import type { SalesmanRow } from '@/lib/queries'

export function SalesRankingTable({ data }: { data: SalesmanRow[] }) {
  const maxOmzet = Math.max(...data.map((d) => d.omzetTotal), 1)

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Nama Sales</TableHead>
            <TableHead>Cabang</TableHead>
            <TableHead className="text-right">Tonase Total</TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Volume (ton)
            </TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Toko
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Pencapaian Target
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((s, i) => {
            const achievement = Math.round((s.omzetThisMonth / s.target) * 100)
            return (
              <TableRow key={s.id}>
                <TableCell>
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                      i < 3
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {s.branch}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatTon(s.omzetTotal)}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                  {s.volumeTotal.toLocaleString('id-ID')} ton
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <Badge variant="secondary">{s.storesHandled}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          achievement >= 100 ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(achievement, 100)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                      {achievement}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
