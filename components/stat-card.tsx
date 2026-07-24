import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  trend?: number
}) {
  const showTrend = typeof trend === "number" && isFinite(trend)
  const positive = (trend ?? 0) >= 0
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-primary">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {showTrend ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
              positive
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend as number).toFixed(1)}%
          </span>
        ) : null}
        {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
      </div>
    </Card>
  )
}
