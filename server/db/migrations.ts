import { getDb, saveDatabase } from "./index";

interface Migration {
  version: number;
  up: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE,
        email TEXT UNIQUE,
        farm_name TEXT,
        location TEXT,
        district TEXT,
        language TEXT DEFAULT 'ur',
        role TEXT DEFAULT 'user',
        is_premium INTEGER DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        has_completed_onboarding INTEGER DEFAULT 0,
        password_hash TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        version INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS dairy_products (
        id TEXT PRIMARY KEY,
        owner_id TEXT REFERENCES users(id),
        name_en TEXT,
        name_ur TEXT,
        category TEXT,
        category_en TEXT,
        price_pkr REAL,
        unit TEXT,
        unit_ur TEXT,
        stock INTEGER DEFAULT 0,
        daily_capacity TEXT,
        is_organic INTEGER DEFAULT 0,
        in_stock INTEGER DEFAULT 1,
        rating REAL DEFAULT 0,
        description_en TEXT,
        description_ur TEXT,
        image_url TEXT,
        seller_name TEXT,
        seller_phone TEXT,
        seller_city TEXT,
        farm_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        owner_id TEXT REFERENCES users(id),
        customer_name TEXT,
        customer_phone TEXT,
        delivery_address TEXT,
        total_amount_pkr REAL DEFAULT 0,
        date TEXT,
        status TEXT DEFAULT 'new_',
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        version INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT,
        name TEXT,
        quantity INTEGER DEFAULT 1,
        unit TEXT,
        price_pkr REAL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_dairy_products_owner ON dairy_products(owner_id, updated_at);
      CREATE INDEX IF NOT EXISTS idx_orders_owner ON orders(owner_id, updated_at);
    `,
  },
];

export function runMigrations(): void {
  const db = getDb();

  const versionResult = db.exec("PRAGMA user_version");
  const currentVersion = versionResult.length > 0 ? (versionResult[0].values[0][0] as number) : 0;

  const pending = migrations.filter((m) => m.version > currentVersion);

  if (pending.length === 0) {
    console.log(`[SQLite] migrations at version ${currentVersion}, nothing to do`);
    return;
  }

  db.run("BEGIN TRANSACTION");

  try {
    for (const migration of pending) {
      console.log(`[SQLite] applying migration ${migration.version}...`);
      db.run(migration.up);
      db.run(`PRAGMA user_version = ${migration.version}`);
    }
    db.run("COMMIT");
    saveDatabase();
    console.log(`[SQLite] migrations complete, now at version ${pending[pending.length - 1].version}`);
  } catch (err) {
    db.run("ROLLBACK");
    console.error("[SQLite] migration failed, rolled back:", err);
    throw err;
  }
}
