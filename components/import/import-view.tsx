"use client"

import { useRef, useState } from "react"
import * as XLSX from "xlsx"
import { importData, type ImportPayload, type ImportResult } from "@/app/actions/import"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  ArrowRight,
} from "lucide-react"

/* Sheet definitions: template name + expected headers + example row. */
const SHEETS: {
  key: keyof ImportPayload
  sheet: string
  headers: string[]
  example: (string | number)[]
  aliases: string[]
}[] = [
  {
    key: "branches",
    sheet: "Distributor",
    headers: ["Dist Code", "Dist Name", "Target TA Jul", "TA Jul", "Target Tonase Jul", "Tonase Jul"],
    example: ["NC", "PT NIAGAPRATAMA CEMERLANG", 20, 18, 1000, 900],
    aliases: ["distributor", "dist", "branches", "cabang"],
  },
  {
    key: "products",
    sheet: "Produk",
    headers: ["nama", "Kode", "Jenis"],
    example: ["PCC@50KG", "CMT002", "STR"],
    aliases: ["produk", "product", "products", "barang"],
  },
  {
    key: "salesmen",
    sheet: "Sales",
    headers: ["Kode Sales", "Nama", "Dist Code", "Target Toko Aktif", "Toko Aktif (MTD)"],
    example: ["BKP015", "HASYIM ROIS", "BKP", 9, 12],
    aliases: ["sales", "salesman", "salesmen", "salesperson"],
  },
  {
    key: "stores",
    sheet: "Toko",
    headers: ["Kode Toko", "nama", "alamat", "Distributor", "kota", "lat", "lng", "status", "MTD sales Code", "tanggal_order_terakhir"],
    example: ["13723", "SETIA BANGUNAN", "JL. BRIGJEND KATAMSO", "KTP", "KETAPANG", -1.8161993, 109.9792225, "aktif", "KTP035", "2026-07-20"],
    aliases: ["toko", "store", "stores", "outlet"],
  },
  {
    key: "stock",
    sheet: "Gudang",
    headers: ["Gudang", "produk", "Lat", "long", "Stock"],
    example: ["Way-Lunik", "Semen PCC 40kg", -6.2088, 106.8456, 1000],
    aliases: ["gudang", "stock", "inventory", "persediaan"],
  },
  {
    key: "sales",
    sheet: "Transaksi",
    headers: ["Dist Code", "Distributor Name", "DO Date", "DO No.", "Payment", "Customer Code", "Delivery Type", "Product Code", "Tonase", "tdSalesmanCode"],
    example: ["KTP", "PT. PRIMA TERANG KENCANA", "2026-06-02", 2600628, "KREDIT 30 HARI", "7298", "FRANCO FLOOR", "RJW003", 2, "KTP035"],
    aliases: ["transaksi", "penjualan", "sale", "sales", "transactions"],
  },
]

function normalizeKey(k: string) {
  return k.trim().toLowerCase().replace(/\s+/g, "_")
}

export function ImportView() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [payload, setPayload] = useState<ImportPayload | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [clearFirst, setClearFirst] = useState(true)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function downloadTemplate() {
    const wb = XLSX.utils.book_new()

    // Instructions sheet
    const petunjuk = [
      ["PETUNJUK PENGISIAN TEMPLATE IMPORT - SemenTrack"],
      [""],
      ["1. Isi tiap sheet sesuai kolom yang tersedia. Jangan ubah nama kolom (baris pertama)."],
      ["2. Baris contoh boleh dihapus atau ditimpa dengan data asli Anda."],
      ["3. Kolom lat/lng adalah koordinat GPS (desimal). Contoh: -6.2088 dan 106.8456."],
      ["4. Kolom relasi (Distributor, Sales, Produk, Toko, Gudang) diisi dengan nama/kode persis seperti sheet terkait."],
      ["5. Sheet Transaksi memakai kolom tonase dan kode salesman/produk/distributor yang sesuai dengan sheet lain."],
      ["6. Kolom status toko: isi 'aktif' atau 'non-aktif'."],
      ["7. Tanggal format YYYY-MM-DD (contoh 2026-07-20)."],
      ["8. Anda boleh mengisi sebagian sheet saja; sheet kosong akan dilewati."],
      [""],
      ["Urutan yang disarankan: Distributor -> Produk -> Sales -> Toko -> Gudang -> Transaksi"],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(petunjuk), "Petunjuk")

    for (const def of SHEETS) {
      const ws = XLSX.utils.aoa_to_sheet([def.headers, def.example])
      ws["!cols"] = def.headers.map((h) => ({ wch: Math.max(14, h.length + 4) }))
      XLSX.utils.book_append_sheet(wb, ws, def.sheet)
    }

    XLSX.writeFile(wb, "template-import-sementrack.xlsx")
  }

  async function handleFile(file: File) {
    setParseError(null)
    setResult(null)
    setFileName(file.name)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { cellDates: false })
      const parsed: ImportPayload = {}
      const newCounts: Record<string, number> = {}

      for (const def of SHEETS) {
        // find a sheet whose normalized name matches the sheet or an alias
        const match = wb.SheetNames.find((n) => {
          const nn = n.trim().toLowerCase()
          return nn === def.sheet.toLowerCase() || def.aliases.includes(nn)
        })
        if (!match) continue
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[match], { defval: null })
        // normalize keys
        const rows = raw
          .map((r) => {
            const obj: Record<string, unknown> = {}
            for (const [k, v] of Object.entries(r)) obj[normalizeKey(k)] = v
            return obj
          })
          .filter((r) => Object.values(r).some((v) => v !== null && v !== ""))
        if (rows.length) {
          // @ts-expect-error dynamic assignment keyed by known keys
          parsed[def.key] = rows
          newCounts[def.sheet] = rows.length
        }
      }

      if (Object.keys(newCounts).length === 0) {
        setParseError(
          "Tidak ada sheet yang cocok ditemukan. Pastikan nama sheet: Distributor, Produk, Sales, Toko, Gudang, Transaksi.",
        )
        setPayload(null)
        setCounts({})
        return
      }
      setPayload(parsed)
      setCounts(newCounts)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Gagal membaca file Excel.")
      setPayload(null)
      setCounts({})
    }
  }

  async function runImport() {
    if (!payload) return
    setImporting(true)
    setResult(null)
    try {
      const res = await importData(payload, clearFirst)
      setResult(res)
      if (res.ok) {
        setPayload(null)
        setCounts({})
        setFileName(null)
        if (fileRef.current) fileRef.current.value = ""
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: steps */}
      <div className="space-y-6 lg:col-span-2">
        {/* Step 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              Unduh Template Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Template berisi 6 sheet (Distributor, Produk, Sales, Toko, Gudang, Transaksi) lengkap dengan kolom dan contoh
              pengisian. Referensi antar tabel cukup pakai <strong className="text-foreground">kode atau nama</strong>, bukan ID.
            </p>
            <Button onClick={downloadTemplate} variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Unduh Template
            </Button>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              Unggah File yang Sudah Diisi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {fileName ?? "Klik untuk pilih file .xlsx"}
                </p>
                <p className="text-xs text-muted-foreground">Format: Excel (.xlsx atau .xls)</p>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />

            {parseError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {Object.keys(counts).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Data terbaca dari file
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(counts).map(([sheet, n]) => (
                    <Badge key={sheet} variant="secondary" className="gap-1.5 font-normal">
                      <FileSpreadsheet className="h-3 w-3" />
                      {sheet}: <span className="font-semibold">{n}</span> baris
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              Import ke Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
              <input
                type="checkbox"
                checked={clearFirst}
                onChange={(e) => setClearFirst(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="text-sm">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus semua data lama sebelum import
                </span>
                <span className="text-muted-foreground">
                  Direkomendasikan untuk mengganti data contoh dengan data asli Anda. Matikan jika ingin menambahkan
                  data ke yang sudah ada.
                </span>
              </span>
            </label>

            <Button onClick={runImport} disabled={!payload || importing} className="w-full gap-2">
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengimpor data...
                </>
              ) : (
                <>
                  Mulai Import
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {result && (
              <div
                className={`space-y-3 rounded-md border p-4 ${
                  result.ok
                    ? "border-primary/40 bg-primary/5"
                    : "border-destructive/40 bg-destructive/10"
                }`}
              >
                {result.ok ? (
                  <>
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Import berhasil{result.cleared ? " (data lama dihapus)" : ""}!
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.inserted)
                        .filter(([, n]) => n > 0)
                        .map(([k, n]) => (
                          <Badge key={k} variant="secondary" className="font-normal">
                            {k}: <span className="ml-1 font-semibold">{n}</span>
                          </Badge>
                        ))}
                    </div>
                    {result.warnings.length > 0 && (
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {result.warnings.map((w, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    )}
                    <a
                      href="/"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      Lihat dashboard <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </>
                ) : (
                  <div className="flex items-start gap-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Gagal: {result.error}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: reference */}
      <div className="space-y-6">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Struktur Kolom</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {SHEETS.map((def) => (
              <div key={def.sheet}>
                <p className="text-sm font-semibold text-foreground">{def.sheet}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{def.headers.join(", ")}</p>
              </div>
            ))}
            <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              Kolom relasi (cabang, sales, produk, toko) diisi dengan nama persis. Kolom{" "}
              <span className="text-foreground">nilai</span> pada Transaksi opsional — otomatis dihitung dari jumlah x
              harga.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
