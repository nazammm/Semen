import { Card } from '@/components/ui/card'
import { formatRupiahCompact } from '@/lib/format'
import { Trophy, Medal, Award } from 'lucide-react'
import type { SalesmanRow } from '@/lib/queries'

const RANK_META = [
  {
    icon: Trophy,
    accent: 'text-amber-500',
    ring: 'ring-amber-500/40',
    bg: 'bg-amber-500/10',
    order: 'md:order-2',
    scale: 'md:-translate-y-4',
    label: '1',
  },
  {
    icon: Medal,
    accent: 'text-slate-300',
    ring: 'ring-slate-400/40',
    bg: 'bg-slate-400/10',
    order: 'md:order-1',
    scale: '',
    label: '2',
  },
  {
    icon: Award,
    accent: 'text-orange-400',
    ring: 'ring-orange-500/40',
    bg: 'bg-orange-500/10',
    order: 'md:order-3',
    scale: '',
    label: '3',
  },
]

export function TopPodium({ data }: { data: SalesmanRow[] }) {
  const top3 = data.slice(0, 3)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {top3.map((s, i) => {
        const meta = RANK_META[i]
        const Icon = meta.icon
        return (
          <Card
            key={s.id}
            className={`flex flex-col items-center gap-3 p-6 text-center ring-1 ${meta.ring} ${meta.order} ${meta.scale}`}
          >
            <div
              className={`flex size-14 items-center justify-center rounded-full ${meta.bg}`}
            >
              <Icon className={`size-7 ${meta.accent}`} aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">
                Peringkat #{meta.label}
              </p>
              <h3 className="text-lg font-semibold text-balance">{s.name}</h3>
              <p className="text-xs text-muted-foreground">{s.branch}</p>
            </div>
            <div className="mt-1 w-full space-y-1 border-t border-border pt-3">
              <p className={`text-xl font-bold ${meta.accent}`}>
                {formatRupiahCompact(s.omzetTotal)}
              </p>
              <p className="text-xs text-muted-foreground">
                {s.volumeTotal.toLocaleString('id-ID')} sak &middot;{' '}
                {s.storesHandled} toko
              </p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
