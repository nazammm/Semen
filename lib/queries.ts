import { pool } from "./db"

const fallbackKpis: Kpi = {
  omzetThisMonth: 4120000000,
  omzetPrevMonth: 3580000000,
  volumeThisMonth: 24500,
  totalStores: 128,
  activeStores: 118,
  inactiveStores: 10,
  activeSalesmen: 32,
  totalBranches: 9,
  totalStockUnits: 8400,
}

const fallbackMonthlyOmzet = [
  { month: "Jan 24", omzet: 3200000000, volume: 19000 },
  { month: "Feb 24", omzet: 3550000000, volume: 20500 },
  { month: "Mar 24", omzet: 3620000000, volume: 21200 },
  { month: "Apr 24", omzet: 3880000000, volume: 22100 },
  { month: "Mei 24", omzet: 4020000000, volume: 23200 },
  { month: "Jun 24", omzet: 4120000000, volume: 24500 },
]

const fallbackBranches = [
  { branch: "Bandung", province: "Jawa Barat", omzet: 910000000, volume: 5300 },
  { branch: "Jakarta", province: "DKI Jakarta", omzet: 880000000, volume: 5100 },
  { branch: "Surabaya", province: "Jawa Timur", omzet: 760000000, volume: 4500 },
  { branch: "Semarang", province: "Jawa Tengah", omzet: 690000000, volume: 4100 },
]

const fallbackCategories = [
  { category: "Tipe 1", omzet: 1820000000, volume: 10100 },
  { category: "Tipe 2", omzet: 1400000000, volume: 8900 },
  { category: "Tipe 3", omzet: 910000000, volume: 5200 },
]

const fallbackSalesmen = [
  { id: 1, name: "Ahmad Rahman", branch: "Bandung", province: "Jawa Barat", phone: "0812-0000-0001", omzetTotal: 420000000, omzetThisMonth: 122000000, volumeTotal: 2510, transactions: 53, storesHandled: 14, target: 200000000 },
  { id: 2, name: "Budi Santoso", branch: "Jakarta", province: "DKI Jakarta", phone: "0812-0000-0002", omzetTotal: 405000000, omzetThisMonth: 118000000, volumeTotal: 2440, transactions: 51, storesHandled: 13, target: 200000000 },
  { id: 3, name: "Citra Dewi", branch: "Surabaya", province: "Jawa Timur", phone: "0812-0000-0003", omzetTotal: 389000000, omzetThisMonth: 114000000, volumeTotal: 2310, transactions: 48, storesHandled: 12, target: 200000000 },
]

const fallbackStores = [
  { id: 1, name: "Toko Cempaka", owner: "Bapak Arif", address: "Jl. Merdeka 12", province: "Jawa Barat", city: "Bandung", lat: -6.9175, lng: 107.6191, status: "aktif", branch: "Bandung", salesman: "Ahmad Rahman", lastOrderDate: "2026-07-20", omzetTotal: 120000000 },
  { id: 2, name: "Toko Sentosa", owner: "Ibu Lina", address: "Jl. Sudirman 56", province: "DKI Jakarta", city: "Jakarta", lat: -6.2088, lng: 106.8456, status: "aktif", branch: "Jakarta", salesman: "Budi Santoso", lastOrderDate: "2026-07-18", omzetTotal: 91000000 },
  { id: 3, name: "Toko Mandiri", owner: "Bapak Dony", address: "Jl. Diponegoro 77", province: "Jawa Timur", city: "Surabaya", lat: -7.2575, lng: 112.7521, status: "non-aktif", branch: "Surabaya", salesman: "Citra Dewi", lastOrderDate: "2026-06-28", omzetTotal: 68000000 },
]

const fallbackBranchPoints = [
  { id: 1, name: "Bandung", province: "Jawa Barat", city: "Bandung", lat: -6.9175, lng: 107.6191 },
  { id: 2, name: "Jakarta", province: "DKI Jakarta", city: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { id: 3, name: "Surabaya", province: "Jawa Timur", city: "Surabaya", lat: -7.2575, lng: 112.7521 },
]

const fallbackProvinceStats = [
  { province: "Jawa Barat", total: 48, aktif: 44, nonAktif: 4 },
  { province: "DKI Jakarta", total: 36, aktif: 33, nonAktif: 3 },
  { province: "Jawa Timur", total: 29, aktif: 26, nonAktif: 3 },
]

const fallbackStockMatrix = {
  products: [
    { id: 1, name: "Semen Tipe 1", unit: "sak" },
    { id: 2, name: "Semen Tipe 2", unit: "sak" },
    { id: 3, name: "Semen Tipe 3", unit: "ton" },
  ],
  branches: [
    { branch: "Bandung", total: 2200, byProduct: { 1: 720, 2: 800, 3: 680 } },
    { branch: "Jakarta", total: 1900, byProduct: { 1: 620, 2: 710, 3: 570 } },
    { branch: "Surabaya", total: 1750, byProduct: { 1: 510, 2: 660, 3: 580 } },
  ],
}

const fallbackStockByProduct = [
  { product: "Semen Tipe 1", unit: "sak", quantity: 2050 },
  { product: "Semen Tipe 2", unit: "sak", quantity: 1860 },
  { product: "Semen Tipe 3", unit: "ton", quantity: 1040 },
]

const fallbackLowStock = [
  { branch: "Surabaya", product: "Semen Tipe 3", quantity: 320, unit: "ton" },
  { branch: "Jakarta", product: "Semen Tipe 2", quantity: 410, unit: "sak" },
]

const fallbackDistributionByProvince = [
  { province: "Jawa Barat", volume: 9200, omzet: 310000000 },
  { province: "DKI Jakarta", volume: 8600, omzet: 295000000 },
  { province: "Jawa Timur", volume: 7700, omzet: 266000000 },
]

async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  if (!process.env.DATABASE_URL) return [] as T[]

  try {
    const res = await pool.query(text, params)
    return res.rows as T[]
  } catch {
    return [] as T[]
  }
}

// ---------- OVERVIEW ----------

export type Kpi = {
  omzetThisMonth: number
  omzetPrevMonth: number
  volumeThisMonth: number
  totalStores: number
  activeStores: number
  inactiveStores: number
  activeSalesmen: number
  totalBranches: number
  totalStockUnits: number
}

export async function getKpis(): Promise<Kpi> {
  const rows = await query<any>(`
    SELECT
      COALESCE((SELECT SUM(amount) FROM sales WHERE date_trunc('month', sale_date) = date_trunc('month', CURRENT_DATE)), 0) AS omzet_this_month,
      COALESCE((SELECT SUM(amount) FROM sales WHERE date_trunc('month', sale_date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')), 0) AS omzet_prev_month,
      COALESCE((SELECT SUM(quantity) FROM sales WHERE date_trunc('month', sale_date) = date_trunc('month', CURRENT_DATE)), 0) AS volume_this_month,
      (SELECT COUNT(*) FROM stores) AS total_stores,
      (SELECT COUNT(*) FROM stores WHERE status = 'aktif') AS active_stores,
      (SELECT COUNT(*) FROM stores WHERE status = 'non-aktif') AS inactive_stores,
      (SELECT COUNT(*) FROM salesmen WHERE active = true) AS active_salesmen,
      (SELECT COUNT(*) FROM branches) AS total_branches,
      COALESCE((SELECT SUM(quantity) FROM stock), 0) AS total_stock_units
  `)

  if (!rows.length) return fallbackKpis

  const r = rows[0]
  return {
    omzetThisMonth: Number(r.omzet_this_month),
    omzetPrevMonth: Number(r.omzet_prev_month),
    volumeThisMonth: Number(r.volume_this_month),
    totalStores: Number(r.total_stores),
    activeStores: Number(r.active_stores),
    inactiveStores: Number(r.inactive_stores),
    activeSalesmen: Number(r.active_salesmen),
    totalBranches: Number(r.total_branches),
    totalStockUnits: Number(r.total_stock_units),
  }
}

export async function getMonthlyOmzet() {
  const rows = await query<any>(`
    SELECT to_char(date_trunc('month', sale_date), 'YYYY-MM') AS month,
           SUM(amount) AS omzet,
           SUM(quantity) AS volume
    FROM sales
    WHERE sale_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 month'
    GROUP BY 1
    ORDER BY 1
  `)

  if (!rows.length) return fallbackMonthlyOmzet

  const label = (m: string) => {
    const [y, mm] = m.split("-")
    const names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    return `${names[Number(mm) - 1]} ${y.slice(2)}`
  }
  return rows.map((r) => ({
    month: label(r.month),
    omzet: Number(r.omzet),
    volume: Number(r.volume),
  }))
}

export async function getOmzetByBranch() {
  const rows = await query<any>(`
    SELECT b.name AS branch, b.province,
           COALESCE(SUM(s.amount), 0) AS omzet,
           COALESCE(SUM(s.quantity), 0) AS volume
    FROM branches b
    LEFT JOIN salesmen sm ON sm.branch_id = b.id
    LEFT JOIN sales s ON s.salesman_id = sm.id
    GROUP BY b.id, b.name, b.province
    ORDER BY omzet DESC
  `)

  if (!rows.length) return fallbackBranches

  return rows.map((r) => ({
    branch: r.branch,
    province: r.province,
    omzet: Number(r.omzet),
    volume: Number(r.volume),
  }))
}

export async function getSalesByCategory() {
  const rows = await query<any>(`
    SELECT p.category, SUM(s.amount) AS omzet, SUM(s.quantity) AS volume
    FROM sales s
    JOIN products p ON p.id = s.product_id
    GROUP BY p.category
    ORDER BY omzet DESC
  `)

  if (!rows.length) return fallbackCategories

  return rows.map((r) => ({
    category: r.category,
    omzet: Number(r.omzet),
    volume: Number(r.volume),
  }))
}

// ---------- SALESMEN ----------

export type SalesmanRow = {
  id: number
  name: string
  branch: string
  province: string
  phone: string | null
  omzetTotal: number
  omzetThisMonth: number
  volumeTotal: number
  transactions: number
  storesHandled: number
  target: number
}

export async function getSalesmenRanking(): Promise<SalesmanRow[]> {
  const rows = await query<any>(`
    SELECT sm.id, sm.name, sm.phone, b.name AS branch, b.province,
      COALESCE(SUM(s.amount), 0) AS omzet_total,
      COALESCE(SUM(s.amount) FILTER (WHERE date_trunc('month', s.sale_date) = date_trunc('month', CURRENT_DATE)), 0) AS omzet_month,
      COALESCE(SUM(s.quantity), 0) AS volume_total,
      COUNT(s.id) AS transactions,
      COUNT(DISTINCT s.store_id) AS stores_handled
    FROM salesmen sm
    JOIN branches b ON b.id = sm.branch_id
    LEFT JOIN sales s ON s.salesman_id = sm.id
    GROUP BY sm.id, sm.name, sm.phone, b.name, b.province
    ORDER BY omzet_total DESC
  `)

  if (!rows.length) return fallbackSalesmen.map((r) => ({
    id: r.id,
    name: r.name,
    branch: r.branch,
    province: r.province,
    phone: r.phone,
    omzetTotal: r.omzetTotal,
    omzetThisMonth: r.omzetThisMonth,
    volumeTotal: r.volumeTotal,
    transactions: r.transactions,
    storesHandled: r.storesHandled,
    target: r.target,
  }))

  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    branch: r.branch,
    province: r.province,
    phone: r.phone,
    omzetTotal: Number(r.omzet_total),
    omzetThisMonth: Number(r.omzet_month),
    volumeTotal: Number(r.volume_total),
    transactions: Number(r.transactions),
    storesHandled: Number(r.stores_handled),
    target: 200_000_000,
  }))
}

// ---------- STORES / MAP ----------

export type StoreRow = {
  id: number
  name: string
  owner: string | null
  address: string | null
  province: string
  city: string
  lat: number
  lng: number
  status: string
  branch: string | null
  salesman: string | null
  lastOrderDate: string | null
  omzetTotal: number
}

export async function getStores(): Promise<StoreRow[]> {
  const rows = await query<any>(`
    SELECT st.id, st.name, st.owner, st.address, st.province, st.city,
           st.lat, st.lng, st.status, st.last_order_date,
           b.name AS branch, sm.name AS salesman,
           COALESCE((SELECT SUM(amount) FROM sales WHERE store_id = st.id), 0) AS omzet_total
    FROM stores st
    LEFT JOIN branches b ON b.id = st.branch_id
    LEFT JOIN salesmen sm ON sm.id = st.salesman_id
    ORDER BY st.name
  `)

  if (!rows.length) return fallbackStores

  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    owner: r.owner,
    address: r.address,
    province: r.province,
    city: r.city,
    lat: Number(r.lat),
    lng: Number(r.lng),
    status: r.status,
    branch: r.branch,
    salesman: r.salesman,
    lastOrderDate: r.last_order_date,
    omzetTotal: Number(r.omzet_total),
  }))
}

export type BranchPoint = {
  id: number
  name: string
  province: string
  city: string
  lat: number
  lng: number
}

export async function getBranchPoints(): Promise<BranchPoint[]> {
  const rows = await query<any>(`SELECT id, name, province, city, lat, lng FROM branches ORDER BY name`)

  if (!rows.length) return fallbackBranchPoints

  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    province: r.province,
    city: r.city,
    lat: Number(r.lat),
    lng: Number(r.lng),
  }))
}

export async function getStoreStatsByProvince() {
  const rows = await query<any>(`
    SELECT province,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'aktif') AS aktif,
           COUNT(*) FILTER (WHERE status = 'non-aktif') AS non_aktif
    FROM stores
    GROUP BY province
    ORDER BY total DESC
  `)

  if (!rows.length) return fallbackProvinceStats

  return rows.map((r) => ({
    province: r.province,
    total: Number(r.total),
    aktif: Number(r.aktif),
    nonAktif: Number(r.non_aktif),
  }))
}

// ---------- STOCK ----------

export async function getStockMatrix() {
  const products = await query<any>(`SELECT id, name, unit FROM products ORDER BY id`)
  const rows = await query<any>(`
    SELECT b.name AS branch, b.id AS branch_id, st.product_id, st.quantity
    FROM stock st
    JOIN branches b ON b.id = st.branch_id
    ORDER BY b.name
  `)

  if (!rows.length || !products.length) return fallbackStockMatrix

  const branchMap = new Map<string, { branch: string; total: number; byProduct: Record<number, number> }>()
  for (const r of rows) {
    if (!branchMap.has(r.branch)) {
      branchMap.set(r.branch, { branch: r.branch, total: 0, byProduct: {} })
    }
    const entry = branchMap.get(r.branch)!
    entry.byProduct[Number(r.product_id)] = Number(r.quantity)
    entry.total += Number(r.quantity)
  }
  return {
    products: products.map((p) => ({ id: Number(p.id), name: p.name, unit: p.unit })),
    branches: Array.from(branchMap.values()),
  }
}

export async function getStockByProduct() {
  const rows = await query<any>(`
    SELECT p.name AS product, p.unit, SUM(st.quantity) AS quantity
    FROM stock st
    JOIN products p ON p.id = st.product_id
    GROUP BY p.name, p.unit
    ORDER BY quantity DESC
  `)

  if (!rows.length) return fallbackStockByProduct

  return rows.map((r) => ({ product: r.product, unit: r.unit, quantity: Number(r.quantity) }))
}

export type LowStock = {
  branch: string
  product: string
  quantity: number
  unit: string
}

export async function getLowStock(threshold = 600): Promise<LowStock[]> {
  const rows = await query<any>(
    `
    SELECT b.name AS branch, p.name AS product, p.unit, st.quantity
    FROM stock st
    JOIN branches b ON b.id = st.branch_id
    JOIN products p ON p.id = st.product_id
    WHERE st.quantity < $1
    ORDER BY st.quantity ASC
  `,
    [threshold],
  )

  if (!rows.length) return fallbackLowStock

  return rows.map((r) => ({
    branch: r.branch,
    product: r.product,
    quantity: Number(r.quantity),
    unit: r.unit,
  }))
}

export async function getDistributionByProvince() {
  const rows = await query<any>(`
    SELECT st.province, SUM(s.quantity) AS volume, SUM(s.amount) AS omzet
    FROM sales s
    JOIN stores st ON st.id = s.store_id
    GROUP BY st.province
    ORDER BY volume DESC
  `)

  if (!rows.length) return fallbackDistributionByProvince

  return rows.map((r) => ({
    province: r.province,
    volume: Number(r.volume),
    omzet: Number(r.omzet),
  }))
}
