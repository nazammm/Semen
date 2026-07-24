import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  doublePrecision,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core"

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  province: text("province").notNull(),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const salesmen = pgTable("salesmen", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  branchId: integer("branch_id").notNull(),
  phone: text("phone"),
  joinDate: date("join_date"),
  active: boolean("active").default(true),
})

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull().default("sak"),
  price: integer("price").notNull().default(0),
})

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  owner: text("owner"),
  address: text("address"),
  province: text("province").notNull(),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  status: text("status").notNull().default("aktif"),
  salesmanId: integer("salesman_id"),
  branchId: integer("branch_id"),
  lastOrderDate: date("last_order_date"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const stock = pgTable("stock", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  salesmanId: integer("salesman_id").notNull(),
  storeId: integer("store_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  saleDate: date("sale_date").notNull(),
})
