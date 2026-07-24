# ✅ DONE: Fix Import Excel Bugs

## ✅ Bug 1: Fix key references di `app/actions/import.ts`
Semua `r["spasi"]` → `r.underscore` sudah di-fix:
- ✅ `r["dist code"]` → `r.dist_code`
- ✅ `r["kode sales"]` → `r.kode_sales`
- ✅ `r["toko aktif (mtd)"]` → `r["toko_aktif_(mtd)"]`
- ✅ `r["mtd sales code"]` → `r.mtd_sales_code`
- ✅ `r["mtd sales"]` → `r.mtd_sales`
- ✅ `r["dist name"]` → `r.dist_name`
- ✅ `r["kode toko"]` → `r.kode_toko`
- ✅ `r["tanggal order terakhir"]` → `r.tanggal_order_terakhir`
- ✅ `r["customer code"]` → `r.customer_code`
- ✅ `r["product code"]` → `r.product_code`
- ✅ `r["do date"]` → `r.do_date`
- ✅ `r["tdsalesmancode"]` → `r.tdsalesmancode`
- ✅ `r["sales code"]` → `r.sales_code`
- ✅ Menghapus `r["customer"]` (gak ada di template)

## ✅ Bug 2: Branch/Distributor gak punya lat, lng, province, city
- ✅ Default lat/lng ke 0 (jangan filter out)
- ✅ Province/city tetap string kosong

## ✅ Deployment
- ✅ Next build sukses (error font Google cuma masalah proxy lokal, di Vercel OK)
- ✅ Push ke git siap deploy
