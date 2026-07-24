import { PageHeader } from "@/components/page-header"
import { ImportView } from "@/components/import/import-view"

export const metadata = {
  title: "Import Data | SemenTrack",
  description: "Unggah data cabang, sales, toko, stok, dan transaksi dari file Excel.",
}

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Import Data"
        description="Unggah data asli Anda dari file Excel. Unduh template, isi sesuai format, lalu import untuk mengganti data contoh."
      />
      <ImportView />
    </div>
  )
}
