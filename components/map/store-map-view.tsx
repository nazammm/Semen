"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { MapPin, Search } from "lucide-react"
import type { StoreRow, BranchPoint } from "@/lib/queries"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDate, formatTonCompact } from "@/lib/format"

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
      Memuat peta...
    </div>
  ),
})

type StatusFilter = "semua" | "aktif" | "non-aktif"

export function StoreMapView({
  stores,
  branches,
  provinces,
}: {
  stores: StoreRow[]
  branches: BranchPoint[]
  provinces: string[]
}) {
  const [status, setStatus] = useState<StatusFilter>("semua")
  const [province, setProvince] = useState<string>("semua")
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      if (status !== "semua" && s.status !== status) return false
      if (province !== "semua" && s.province !== province) return false
      if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [stores, status, province, q])

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: "semua", label: "Semua" },
    { key: "aktif", label: "Aktif" },
    { key: "non-aktif", label: "Non-aktif" },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="flex rounded-md border border-border p-0.5">
            {statusOptions.map((o) => (
              <button
                key={o.key}
                onClick={() => setStatus(o.key)}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                  status === o.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
          >
            <option value="semua">Semua Provinsi</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3fb27f" }} />
              Aktif
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e5484d" }} />
              Non-aktif
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e8a838" }} />
              Cabang
            </span>
          </div>
        </div>
        <div className="h-[560px] w-full">
          <LeafletMap stores={filtered} branches={branches} />
        </div>
      </Card>

      <Card className="flex max-h-[620px] flex-col gap-0 p-0">
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari toko..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {filtered.length} toko ditampilkan
          </p>
        </div>
        <div className="flex-1 divide-y divide-border overflow-y-auto">
          {filtered.map((s) => {
            const aktif = s.status === "aktif"
            return (
              <div key={s.id} className="flex items-start gap-3 p-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    aktif ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                  )}
                >
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px] capitalize",
                        aktif
                          ? "border-success/40 text-success"
                          : "border-destructive/40 text-destructive",
                      )}
                    >
                      {s.status}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.city}, {s.province}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Sales: {s.salesman ?? "-"} · Order terakhir: {formatDate(s.lastOrderDate)}
                  </p>
                  <p className="text-xs font-medium text-foreground/80">
                    {formatTonCompact(s.omzetTotal)}
                  </p>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Tidak ada toko yang cocok dengan filter.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
