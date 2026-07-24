"use server"

import { db } from "@/lib/db"
import { branches, salesmen, products, stores, stock, sales } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"

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

export async function clearAllData(): Promise<{ ok: boolean; error?: string }> {
  try {
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
    if (clearFirst) {
      const c = await clearAllData()
      if (!c.ok) return { ok: false, cleared: false, inserted, warnings, error: c.error }
    }

    // 1) Branches
    if (payload.branches?.length) {
      const rows = payload.branches
        .map((r) => ({
          name: str(r.nama ?? r.name),
          province: str(r.provinsi ?? r.province) ?? "",
          city: str(r.kota ?? r.city) ?? "",
          lat: num(r.lat ?? r.latitude),
          lng: num(r.lng ?? r.longitude ?? r.long),
        }))
        .filter((r) => r.name && r.lat !== null && r.lng !== null) as {
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
    if (payload.products?.length) {
      const rows = payload.products
        .map((r) => ({
          name: str(r.nama ?? r.name),
          category: str(r.kategori ?? r.category) ?? "Umum",
          unit: str(r.satuan ?? r.unit) ?? "sak",
          price: num(r.harga ?? r.price) ?? 0,
        }))
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
    if (payload.salesmen?.length) {
      const rows = payload.salesmen
        .map((r) => {
          const name = str(r.nama ?? r.name)
          const branchId = branchMap.get(norm(r.cabang ?? r.branch))
          const aktif = norm(r.aktif ?? r.active)
          return {
            name,
            branchId,
            phone: str(r.telepon ?? r.phone ?? r.hp),
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
    for (const s of await db.select({ id: salesmen.id, name: salesmen.name }).from(salesmen)) {
      salesmanMap.set(s.name.toLowerCase(), s.id)
    }
    if (payload.stores?.length) {
      const rows = payload.stores
        .map((r) => {
          const st = norm(r.status)
          return {
            name: str(r.nama ?? r.name),
            owner: str(r.pemilik ?? r.owner),
            address: str(r.alamat ?? r.address),
            province: str(r.provinsi ?? r.province) ?? "",
            city: str(r.kota ?? r.city) ?? "",
            lat: num(r.lat ?? r.latitude),
            lng: num(r.lng ?? r.longitude ?? r.long),
            status: ["non-aktif", "nonaktif", "tidak aktif", "tidak", "inactive"].includes(st) ? "non-aktif" : "aktif",
            salesmanId: salesmanMap.get(norm(r.sales ?? r.salesman)) ?? null,
            branchId: branchMap.get(norm(r.cabang ?? r.branch)) ?? null,
            lastOrderDate: toDate(r.tanggal_order_terakhir ?? r.last_order_date ?? r["tanggal order terakhir"]),
          }
        })
        .filter((r) => r.name && r.lat !== null && r.lng !== null) as {
        name: string
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
      if (rows.length) {
        await db.insert(stores).values(rows)
        inserted.stores = rows.length
      }
      if (rows.length !== payload.stores.length) {
        warnings.push(`Toko: ${payload.stores.length - rows.length} baris dilewati (nama/koordinat kosong).`)
      }
    }

    // 5) Stock
    if (payload.stock?.length) {
      const rows = payload.stock
        .map((r) => ({
          branchId: branchMap.get(norm(r.cabang ?? r.branch)),
          productId: productMap.get(norm(r.produk ?? r.product)),
          quantity: num(r.jumlah ?? r.quantity ?? r.stok) ?? 0,
        }))
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

    // 6) Sales
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
          const productId = productMap.get(norm(r.produk ?? r.product))
          const quantity = num(r.jumlah ?? r.quantity ?? r.qty) ?? 0
          const explicitAmount = num(r.nilai ?? r.amount ?? r.omzet)
          const price = productId ? (priceMap.get(productId) ?? 0) : 0
          return {
            salesmanId: salesmanMap.get(norm(r.sales ?? r.salesman)),
            storeId: storeMap.get(norm(r.toko ?? r.store)),
            productId,
            quantity,
            amount: explicitAmount ?? quantity * price,
            saleDate: toDate(r.tanggal ?? r.sale_date ?? r.date) ?? new Date().toISOString().slice(0, 10),
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
