import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Product = { id: number; name: string; unit: string }
type BranchStock = {
  branch: string
  total: number
  byProduct: Record<number, number>
}

export function StockMatrix({
  products,
  branches,
}: {
  products: Product[]
  branches: BranchStock[]
}) {
  const cellColor = (qty: number) => {
    if (qty < 600) return 'text-red-400'
    if (qty < 1500) return 'text-amber-400'
    return 'text-foreground'
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card">Cabang</TableHead>
            {products.map((p) => (
              <TableHead key={p.id} className="text-right whitespace-nowrap">
                {p.name}
              </TableHead>
            ))}
            <TableHead className="text-right font-semibold">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((b) => (
            <TableRow key={b.branch}>
              <TableCell className="sticky left-0 bg-card font-medium">
                {b.branch}
              </TableCell>
              {products.map((p) => (
                <TableCell
                  key={p.id}
                  className={`text-right tabular-nums ${cellColor(b.byProduct[p.id] ?? 0)}`}
                >
                  {(b.byProduct[p.id] ?? 0).toLocaleString('id-ID')}
                </TableCell>
              ))}
              <TableCell className="text-right font-semibold tabular-nums">
                {b.total.toLocaleString('id-ID')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
