"use server"

import { db, pool } from "@/lib/db"
import { branches, salesmen, products, stores, stock, sales } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { gunzipSync } from "zlib"

/** A single row parsed from a sheet, keys already lowercased/trimmed. */
type Row = Record<string, string | number | null | undefined>

export type ImportPayload = {
  branches?: Row[]
  products?: Row[]
  salesmen?: Row[]
  stores?: Row[]
  stock?: Row[]
  sales?: Row[]
}

export type ImportResult = {
  ok: boolean
  cleared: boolean
  inserted: Record<string, number>
  warnings: string[]
  error?: string
}

/* ------------------------------- helpers -------------------------------- */

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === "" ? null : s
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, ""))
  return Number.isFinite(n) ? n : null
}

/** Excel serial date or string date -> ISO yyyy-mm-dd (or null). */
function toDate(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null
  // Excel serial number (days since 1899-12-30)
  if (typeof v === "number") {
    const ms = Math.round((v - 25569) * 86400 * 1000)
    const d = new Date(ms)
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  const d = new Date(String(v))
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

const norm = (v: unknown) => (str(v) ?? "").toLowerCase()

/* ------------------------------ clear all ------------------------------- */

function hasDatabaseConfig(): boolean {
  return Boolean(
    process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NO_SSL,
  )
}

async function ensureDatabaseSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS salesmen (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      phone TEXT,
      join_date DATE,
      active BOOLEAN DEFAULT TRUE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'sak',
      price INTEGER NOT NULL DEFAULT 0
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT,
      address TEXT,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'aktif',
      salesman_id INTEGER,
      branch_id INTEGER,
      last_order_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      salesman_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      amount BIGINT NOT NULL,
      sale_date DATE NOT NULL
    )
  `)
}

export async function clearAllData(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!hasDatabaseConfig()) {
      return { ok: false, error: "DATABASE_URL belum dikonfigurasi. Hubungkan database terlebih dahulu agar import bisa dijalankan." }
    }

    await ensureDatabaseSchema()

    // Delete in FK-safe order (no FKs, but keep it logical).
    await db.delete(sales)
    await db.delete(stock)
    await db.delete(stores)
    await db.delete(salesmen)
    await db.delete(products)
    await db.delete(branches)
    revalidatePath("/", "layout")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menghapus data" }
  }
}

/**
 * Server Action yang menerima payload terkompresi (gzip + base64).
 * Client mengompres payload JSON → gzip → base64 → kirim ke sini.
 */
export async function importDataCompressed(
  compressedBase64: string,
  clearFirst: boolean,
): Promise<ImportResult> {
  try {
    const compressed = Buffer.from(compressedBase64, "base64")
    const decompressed = gunzipSync(compressed)
    const payload: ImportPayload = JSON.parse(decompressed.toString("utf-8"))
    return importData(payload, clearFirst)
  } catch (e) {
    return {
      ok: false,
      cleared: false,
      inserted: { branches: 0, products: 0, salesmen: 0, stores: 0, stock: 0, sales: 0 },
      warnings: [],
      error: e instanceof Error ? e.message : "Gagal mendekompres data",
    }
  }
}

/* ------------------------------- import --------------------------------- */

export async function importData(payload: ImportPayload, clearFirst: boolean): Promise<ImportResult> {
  const warnings: string[] = []
  const inserted: Record<string, number> = {
    branches: 0,
    products: 0,
    salesmen: 0,
    stores: 0,
    stock: 0,
    sales: 0,
  }

  try {
    if (!hasDatabaseConfig()) {
      return {
        ok: false,
        cleared: false,
        inserted,
        warnings,
        error: "DATABASE_URL belum dikonfigurasi. Import hanya bisa dijalankan setelah database terhubung.",
      }
    }

    await ensureDatabaseSchema()

    if (clearFirst) {
      const c = await clearAllData()
      if (!c.ok) return { ok: false, cleared: false, inserted, warnings, error: c.error }
    }

// 1) Branches / distributors
    const branchCodeMap = new Map<string, string>()
    if (payload.branches?.length) {
      const rows = payload.branches
        .map((r) => {
          const name = str(r.dist_name ?? r.nama ?? r.name)
          const code = str(r.dist_code ?? r.code)
          if (code && name) branchCodeMap.set(code.toLowerCase(), name)
          return {
            name,
            province: str(r.provinsi ?? r.province) ?? "",
            city: str(r.kota ?? r.city) ?? "",
            lat: num(r.lat ?? r.latitude) ?? 0,
            lng: num(r.lng ?? r.longitude ?? r.long) ?? 0,
          }
        })
        .filter((r) => r.name) as {
        name: string
        province: string
        city: string
        lat: number
        lng: number
      }[]
      if (rows.length) {
        await db.insert(branches).values(rows)
        inserted.branches = rows.length
      }
      if (rows.length !== payload.branches.length) {
        warnings.push(`Cabang: ${payload.branches.length - rows.length} baris dilewati (nama/koordinat kosong).`)
      }
    }

// 2) Products
    const productCodeMap = new Map<string, string>()
    if (payload.products?.length) {
      const rows = payload.products
        .map((r) => {
          const name = str(r.nama ?? r.name)
          const code = str(r.kode ?? r.product_code)
          if (code && name) productCodeMap.set(code.toLowerCase(), name)
          return {
            name,
            category: str(r.kategori ?? r.category ?? r.jenis) ?? "Umum",
            unit: str(r.satuan ?? r.unit) ?? "sak",
            price: num(r.harga ?? r.price) ?? 0,
          }
        })
        .filter((r) => r.name) as { name: string; category: string; unit: string; price: number }[]
      if (rows.length) {
        await db.insert(products).values(rows)
        inserted.products = rows.length
      }
      if (rows.length !== payload.products.length) {
        warnings.push(`Produk: ${payload.products.length - rows.length} baris dilewati (nama kosong).`)
      }
    }

    // Build lookup maps (include pre-existing rows so partial imports work).
    const branchMap = new Map<string, number>()
    for (const b of await db.select({ id: branches.id, name: branches.name }).from(branches)) {
      branchMap.set(b.name.toLowerCase(), b.id)
    }
    const productMap = new Map<string, number>()
    for (const p of await db.select({ id: products.id, name: products.name }).from(products)) {
      productMap.set(p.name.toLowerCase(), p.id)
    }

    // 3) Salesmen
    const salesmanCodeMap = new Map<string, string>()
    if (payload.salesmen?.length) {
      const rows = payload.salesmen
        .map((r) => {
          const name = str(r.nama ?? r.name)
          const code = str(r.kode_sales ?? r.code)
          const branchCode = str(r.dist_code)
          const branchName = branchCodeMap.get(norm(branchCode ?? "")) ?? str(r.dist_name ?? r.distributor ?? r.cabang ?? r.branch)
          const branchId = branchMap.get(norm(branchName ?? ""))
const aktif = norm(r.aktif ?? r.active ?? r["toko_aktif_(mtd)"])
          if (code && name) salesmanCodeMap.set(code.toLowerCase(), name)
          return {
            name,
            branchId,
            phone: str(code ?? r.telepon ?? r.phone ?? r.hp),
            active: aktif === "" ? true : !["tidak", "non-aktif", "nonaktif", "false", "0", "no"].includes(aktif),
          }
        })
        .filter((r) => r.name && r.branchId) as {
        name: string
        branchId: number
        phone: string | null
        active: boolean
      }[]
      if (rows.length) {
        await db.insert(salesmen).values(rows)
        inserted.salesmen = rows.length
      }
      if (rows.length !== payload.salesmen.length) {
        warnings.push(
          `Sales: ${payload.salesmen.length - rows.length} baris dilewati (nama kosong / cabang tidak ditemukan).`,
        )
      }
    }

    // 4) Stores
    const salesmanMap = new Map<string, number>()
    for (const s of await db.select({ id: salesmen.id, name: salesmen.name, phone: salesmen.phone }).from(salesmen)) {
      salesmanMap.set(s.name.toLowerCase(), s.id)
      if (s.phone) salesmanMap.set(s.phone.toLowerCase(), s.id)
    }
    // Map kode_toko → storeId for later Transaksi lookup
    const storeCodeMap = new Map<string, number>()
    if (payload.stores?.length) {
      // Pertama, collect semua kode_toko dari existing stores
      for (const s of await db.select({ id: stores.id, name: stores.name }).from(stores)) {
        // Will add code mapping after we know which is which
      }
      const processedRows = payload.stores
        .map((r) => {
          const st = norm(r.status)
          const kode_toko = str(r.kode_toko ?? r.customer_code)
          const salesmanCode = str(r.mtd_sales_code ?? r.mtd_sales ?? r.sales ?? r.salesman ?? r.kode_sales)
          const branchRef = str(r.distributor ?? r.dist_name ?? r.dist_code ?? r.cabang ?? r.branch)
          const salesmanName = salesmanCode ? salesmanCodeMap.get(salesmanCode.toLowerCase()) : null
          const branchKey = norm(branchRef ?? "")
          const branchId = branchMap.get(branchKey) ?? branchMap.get(norm(branchCodeMap.get(branchKey) ?? "")) ?? null
          // Toko sheet TIDAK punya kolom province, gunakan kota sebagai fallback
          const city = str(r.kota ?? r.city) ?? ""
          const province = (str(r.provinsi ?? r.province) ?? city) || "Unknown"
          return {
            name: str(r.nama ?? r.name ?? kode_toko),
            code: kode_toko,
            owner: str(r.pemilik ?? r.owner),
            address: str(r.alamat ?? r.address),
            province,
            city,
            lat: num(r.lat ?? r.latitude),
            lng: num(r.lng ?? r.longitude ?? r.long),
            status: ["non-aktif", "nonaktif", "tidak aktif", "tidak", "inactive"].includes(st) ? "non-aktif" : "aktif",
            salesmanId: salesmanMap.get(norm(salesmanName ?? salesmanCode ?? r.sales ?? r.salesman)) ?? null,
            branchId,
            lastOrderDate: toDate(r.tanggal_order_terakhir ?? r.last_order_date ?? r.latest_order_date),
          }
        })
        .filter((r) => r.name && r.lat !== null && r.lng !== null) as {
        name: string
        code: string | null
        owner: string | null
        address: string | null
        province: string
        city: string
        lat: number
        lng: number
        status: string
        salesmanId: number | null
        branchId: number | null
        lastOrderDate: string | null
      }[]
      if (processedRows.length) {
        // Insert and get back IDs via returning
        try {
          const insertedStores = await db.insert(stores).values(processedRows).returning({ id: stores.id, name: stores.name })
          inserted.stores = insertedStores.length
          // Map kode_toko → storeId using the returned IDs + original code from processedRows
          for (const insertedStore of insertedStores) {
            const matchedRow = processedRows.find(r => r.name === insertedStore.name)
            if (matchedRow?.code) {
              const code = matchedRow.code
              storeCodeMap.set(code, insertedStore.id)
              storeCodeMap.set(code.toLowerCase(), insertedStore.id)
              // Also add numeric version if applicable
              const numCode = Number(code)
              if (!isNaN(numCode)) {
                storeCodeMap.set(String(numCode), insertedStore.id)
              }
            }
          }
        } catch (e) {
          // If returning() not supported, fallback to regular insert + re-read
          await db.insert(stores).values(processedRows)
          inserted.stores = processedRows.length
          for (const s of await db.select({ id: stores.id, name: stores.name }).from(stores)) {
            const matchedRow = processedRows.find(r => r.name === s.name)
            if (matchedRow?.code) {
              const code = matchedRow.code
              storeCodeMap.set(code, s.id)
              storeCodeMap.set(code.toLowerCase(), s.id)
              const numCode = Number(code)
              if (!isNaN(numCode)) storeCodeMap.set(String(numCode), s.id)
            }
          }
        }
      }
      if (processedRows.length !== payload.stores.length) {
        warnings.push(`Toko: ${payload.stores.length - processedRows.length} baris dilewati (nama/koordinat kosong).`)
      }
    }

    // 5) Stock / gudang
    if (payload.stock?.length) {
      const rows = payload.stock
        .map((r) => {
          const branchRef = str(r.gudang ?? r.cabang ?? r.branch ?? r.distributor ?? r.dist_name)
          const branchKey = norm(branchRef ?? "")
          const branchId = branchMap.get(branchKey) ?? branchMap.get(norm(branchCodeMap.get(branchKey) ?? "")) ?? null
          const productRef = str(r.produk ?? r.product ?? r.nama)
          const productId = productMap.get(norm(productRef ?? "")) ?? productMap.get(norm(productCodeMap.get(norm(productRef ?? "")) ?? "")) ?? null
          return {
            branchId,
            productId,
            quantity: num(r.stock ?? r.jumlah ?? r.quantity ?? r.stok) ?? 0,
          }
        })
        .filter((r) => r.branchId && r.productId) as {
        branchId: number
        productId: number
        quantity: number
      }[]
      if (rows.length) {
        await db.insert(stock).values(rows)
        inserted.stock = rows.length
      }
      if (rows.length !== payload.stock.length) {
        warnings.push(
          `Stok: ${payload.stock.length - rows.length} baris dilewati (cabang/produk tidak ditemukan).`,
        )
      }
    }

    // 6) Sales / transaksi
    const storeMap = new Map<string, number>()
    for (const s of await db.select({ id: stores.id, name: stores.name }).from(stores)) {
      storeMap.set(s.name.toLowerCase(), s.id)
    }
    const priceMap = new Map<number, number>()
    for (const p of await db.select({ id: products.id, price: products.price }).from(products)) {
      priceMap.set(p.id, p.price)
    }
    if (payload.sales?.length) {
      const rows = payload.sales
        .map((r) => {
          const productRef = str(r.product_code ?? r.produk ?? r.product ?? r.kode)
          const productName = productCodeMap.get(norm(productRef ?? "")) ?? productRef ?? ""
          const productId = productMap.get(norm(productName))
          const quantity = num(r.tonase ?? r.jumlah ?? r.quantity ?? r.qty ?? r.total_tonase) ?? 0
          // Amount: jika ada nilai/omzet explicit, pakai itu. Tapi untuk dataset ini tonase adalah quantity × 1, jadi amount = quantity * 1_000_000 (estimasi)
          // Biarkan default explicitAmount dari tonase, tapi tonase adalah quantity, bukan uang
          const explicitAmount = num(r.nilai ?? r.amount ?? r.omzet)
          const price = productId ? (priceMap.get(productId) ?? 0) : 0
          const salesmanCode = str(r.tdsalesmancode ?? r.sales ?? r.salesman ?? r.sales_code)
          const salesmanId = salesmanMap.get(norm(salesmanCode ?? "")) ?? salesmanMap.get(norm(salesmanCodeMap.get(norm(salesmanCode ?? "")) ?? "")) ?? null
          // Cari store: pertama cek customer_code (numeric) di storeCodeMap
          const customerCode = str(r.customer_code ?? r.kode_toko)
          const storeName = str(r.toko ?? r.store ?? r.nama)
          let storeId: number | null = null
          if (customerCode) {
            // Coba exact match dulu
            storeId = storeCodeMap.get(customerCode) ?? storeCodeMap.get(customerCode.toLowerCase()) ?? null
          }
          if (!storeId && storeName) {
            storeId = storeMap.get(norm(storeName)) ?? null
          }
          if (!storeId && customerCode) {
            // Coba numeric lookup (kalo customer_code numeric string seperti "7513")
            const numericCode = customerCode.replace(/[^0-9]/g, '')
            if (numericCode) storeId = storeCodeMap.get(numericCode) ?? null
          }
          return {
            salesmanId,
            storeId,
            productId,
            quantity,
            // Untuk dataset ini, amount = quantity * 1_000_000 (estimasi harga per ton ~1jt)
            // Tapi prioritaskan explicit amount jika ada
            amount: explicitAmount ?? quantity * (price || 1_000_000),
            saleDate: toDate(r.do_date ?? r.tanggal ?? r.sale_date ?? r.date ?? r.tanggal_order_terakhir) ?? new Date().toISOString().slice(0, 10),
          }
        })
        .filter((r) => r.salesmanId && r.storeId && r.productId && r.quantity > 0) as {
        salesmanId: number
        storeId: number
        productId: number
        quantity: number
        amount: number
        saleDate: string
      }[]
      if (rows.length) {
        // Insert in chunks to stay well under parameter limits.
        const chunk = 500
        for (let i = 0; i < rows.length; i += chunk) {
          await db.insert(sales).values(rows.slice(i, i + chunk))
        }
        inserted.sales = rows.length
      }
      if (rows.length !== payload.sales.length) {
        warnings.push(
          `Transaksi: ${payload.sales.length - rows.length} baris dilewati (sales/toko/produk tidak ditemukan atau jumlah 0).`,
        )
      }
    }

    revalidatePath("/", "layout")
    return { ok: true, cleared: clearFirst, inserted, warnings }
  } catch (e) {
    return {
      ok: false,
      cleared: false,
      inserted,
      warnings,
      error: e instanceof Error ? e.message : "Terjadi kesalahan saat import",
    }
  }
}
