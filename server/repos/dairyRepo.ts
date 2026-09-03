import { getDb, saveDatabase } from "../db";

export interface DairyProductRow {
  id: string;
  owner_id: string | null;
  name_en: string | null;
  name_ur: string | null;
  category: string | null;
  category_en: string | null;
  price_pkr: number;
  unit: string | null;
  unit_ur: string | null;
  stock: number;
  daily_capacity: string | null;
  is_organic: number;
  in_stock: number;
  rating: number;
  description_en: string | null;
  description_ur: string | null;
  image_url: string | null;
  seller_name: string | null;
  seller_phone: string | null;
  seller_city: string | null;
  farm_name: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at: string | null;
}

export interface OrderRow {
  id: string;
  owner_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  total_amount_pkr: number;
  date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string | null;
  quantity: number;
  unit: string | null;
  price_pkr: number;
}

function rowToProduct(row: any[]): DairyProductRow {
  return {
    id: row[0],
    owner_id: row[1],
    name_en: row[2],
    name_ur: row[3],
    category: row[4],
    category_en: row[5],
    price_pkr: row[6],
    unit: row[7],
    unit_ur: row[8],
    stock: row[9],
    daily_capacity: row[10],
    is_organic: row[11],
    in_stock: row[12],
    rating: row[13],
    description_en: row[14],
    description_ur: row[15],
    image_url: row[16],
    seller_name: row[17],
    seller_phone: row[18],
    seller_city: row[19],
    farm_name: row[20],
    created_at: row[21],
    updated_at: row[22],
    version: row[23],
    deleted_at: row[24],
  };
}

function rowToOrder(row: any[]): OrderRow {
  return {
    id: row[0],
    owner_id: row[1],
    customer_name: row[2],
    customer_phone: row[3],
    delivery_address: row[4],
    total_amount_pkr: row[5],
    date: row[6],
    status: row[7],
    notes: row[8],
    created_at: row[9],
    updated_at: row[10],
    version: row[11],
  };
}

export function getProducts(since?: string, includeDeleted: boolean = false): DairyProductRow[] {
  const db = getDb();
  let query = "SELECT * FROM dairy_products WHERE 1=1";
  const params: any[] = [];

  if (!includeDeleted) {
    query += " AND deleted_at IS NULL";
  }

  if (since) {
    query += " AND updated_at > ?";
    params.push(since);
  }

  query += " ORDER BY updated_at DESC";

  const result = db.exec(query, params);
  if (result.length === 0) return [];
  return result[0].values.map(rowToProduct);
}

export function getProductById(id: string): DairyProductRow | null {
  const db = getDb();
  const result = db.exec("SELECT * FROM dairy_products WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  return rowToProduct(result[0].values[0]);
}

export function createProduct(product: Partial<DairyProductRow> & { id: string }): DairyProductRow {
  const db = getDb();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO dairy_products (id, owner_id, name_en, name_ur, category, category_en, price_pkr, unit, unit_ur, stock, daily_capacity, is_organic, in_stock, rating, description_en, description_ur, image_url, seller_name, seller_phone, seller_city, farm_name, created_at, updated_at, version, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.id,
      product.owner_id || null,
      product.name_en || null,
      product.name_ur || null,
      product.category || null,
      product.category_en || null,
      product.price_pkr || 0,
      product.unit || null,
      product.unit_ur || null,
      product.stock || 0,
      product.daily_capacity || null,
      product.is_organic || 0,
      product.in_stock ?? 1,
      product.rating || 0,
      product.description_en || null,
      product.description_ur || null,
      product.image_url || null,
      product.seller_name || null,
      product.seller_phone || null,
      product.seller_city || null,
      product.farm_name || null,
      now,
      now,
      1,
      null,
    ]
  );

  saveDatabase();
  return getProductById(product.id)!;
}

export function updateProduct(id: string, updates: Partial<DairyProductRow>): DairyProductRow | null {
  const db = getDb();
  const existing = getProductById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const newVersion = existing.version + 1;

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === "id" || key === "created_at" || key === "version") continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }

  fields.push("updated_at = ?");
  values.push(now);
  fields.push("version = ?");
  values.push(newVersion);
  values.push(id);

  db.run(`UPDATE dairy_products SET ${fields.join(", ")} WHERE id = ?`, values);
  saveDatabase();

  return getProductById(id);
}

export function softDeleteProduct(id: string): boolean {
  const db = getDb();
  const existing = getProductById(id);
  if (!existing) return false;

  const now = new Date().toISOString();
  db.run("UPDATE dairy_products SET deleted_at = ?, updated_at = ? WHERE id = ?", [now, now, id]);
  saveDatabase();
  return true;
}

export function getOrders(ownerId: string, since?: string): OrderRow[] {
  const db = getDb();
  let query = "SELECT * FROM orders WHERE owner_id = ?";
  const params: any[] = [ownerId];

  if (since) {
    query += " AND updated_at > ?";
    params.push(since);
  }

  query += " ORDER BY updated_at DESC";

  const result = db.exec(query, params);
  if (result.length === 0) return [];
  return result[0].values.map(rowToOrder);
}

export function getOrderById(id: string): OrderRow | null {
  const db = getDb();
  const result = db.exec("SELECT * FROM orders WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  return rowToOrder(result[0].values[0]);
}

export function getOrderItems(orderId: string): OrderItemRow[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM order_items WHERE order_id = ?", [orderId]);
  if (result.length === 0) return [];
  return result[0].values.map((row) => ({
    id: row[0],
    order_id: row[1],
    product_id: row[2],
    name: row[3],
    quantity: row[4],
    unit: row[5],
    price_pkr: row[6],
  }));
}

export function createOrder(order: Partial<OrderRow> & { id: string; owner_id: string }, items: Omit<OrderItemRow, "order_id">[]): OrderRow {
  const db = getDb();
  const now = new Date().toISOString();

  db.run("BEGIN TRANSACTION");

  try {
    db.run(
      `INSERT INTO orders (id, owner_id, customer_name, customer_phone, delivery_address, total_amount_pkr, date, status, notes, created_at, updated_at, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.owner_id,
        order.customer_name || null,
        order.customer_phone || null,
        order.delivery_address || null,
        order.total_amount_pkr || 0,
        order.date || now,
        order.status || "new_",
        order.notes || null,
        now,
        now,
        1,
      ]
    );

    for (const item of items) {
      db.run(
        `INSERT INTO order_items (id, order_id, product_id, name, quantity, unit, price_pkr)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          order.id,
          item.product_id || null,
          item.name || null,
          item.quantity || 1,
          item.unit || null,
          item.price_pkr || 0,
        ]
      );

      if (item.product_id) {
        const product = getProductById(item.product_id);
        if (product && product.stock > 0) {
          const newStock = Math.max(0, product.stock - (item.quantity || 1));
          db.run(
            "UPDATE dairy_products SET stock = ?, updated_at = ?, version = version + 1 WHERE id = ?",
            [newStock, now, item.product_id]
          );
        }
      }
    }

    db.run("COMMIT");
    saveDatabase();
    return getOrderById(order.id)!;
  } catch (err) {
    db.run("ROLLBACK");
    throw err;
  }
}

export function updateOrder(id: string, updates: Partial<OrderRow>): OrderRow | null {
  const db = getDb();
  const existing = getOrderById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const newVersion = existing.version + 1;

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === "id" || key === "created_at" || key === "version") continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }

  fields.push("updated_at = ?");
  values.push(now);
  fields.push("version = ?");
  values.push(newVersion);
  values.push(id);

  db.run(`UPDATE orders SET ${fields.join(", ")} WHERE id = ?`, values);
  saveDatabase();

  return getOrderById(id);
}
