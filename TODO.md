# TODO: Fix Upload Limit 1MB ✅ SELESAI

## Ringkasan Perubahan

### Masalah
Upload file Excel dibatasi 1MB karena Vercel Serverless Functions memiliki limit body size (~4.5MB), dan data JSON hasil parsing Excel bisa melebihi limit.

### Solusi
**Kompresi GZIP** pada payload sebelum dikirim ke Server Action:

| Komponen | Sebelum | Sesudah |
|----------|---------|---------|
| **Client (browser)** | Kirim JSON plain | Kompres JSON → gzip (CompressionStream API) → base64 |
| **Server Action** | Terima JSON langsung | Terima base64 → dekompres (zlib.gunzipSync) → parse JSON |
| **Dependency** | Tidak ada | Tidak ada (pakai API bawaan browser & Node.js) |

### File yang diubah
- ✅ `app/actions/import.ts` — Menambahkan `importDataCompressed()` yang menerima base64+gzip
- ✅ `components/import/import-view.tsx` — Kompresi gzip sebelum kirim ke server
- ✅ `next.config.mjs` — `serverActions.bodySizeLimit: "50mb"` (sudah ada sebelumnya)

### Cara Kerja
1. User pilih file Excel → parsing di browser (seperti biasa)
2. Data dibagi chunk 200 baris → tiap chunk di-JSON.stringify
3. JSON dikompres dengan `CompressionStream("gzip")` → base64
4. Server Action menerima string base64 → dekompres dengan `zlib.gunzipSync` → parse JSON
5. Proses import seperti biasa

