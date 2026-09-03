import { getDb, saveDatabase } from "../db";

export interface UserRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  farm_name: string | null;
  location: string | null;
  district: string | null;
  language: string;
  role: string;
  is_premium: number;
  is_verified: number;
  has_completed_onboarding: number;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

function rowToUser(row: any[]): UserRow {
  return {
    id: row[0],
    name: row[1],
    phone: row[2],
    email: row[3],
    farm_name: row[4],
    location: row[5],
    district: row[6],
    language: row[7],
    role: row[8],
    is_premium: row[9],
    is_verified: row[10],
    has_completed_onboarding: row[11],
    password_hash: row[12],
    created_at: row[13],
    updated_at: row[14],
    version: row[15],
  };
}

export function findUserByPhone(phone: string): UserRow | null {
  const db = getDb();
  const result = db.exec("SELECT * FROM users WHERE phone = ?", [phone]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  return rowToUser(result[0].values[0]);
}

export function findUserByEmail(email: string): UserRow | null {
  const db = getDb();
  const result = db.exec("SELECT * FROM users WHERE email = ?", [email]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  return rowToUser(result[0].values[0]);
}

export function findUserById(id: string): UserRow | null {
  const db = getDb();
  const result = db.exec("SELECT * FROM users WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  return rowToUser(result[0].values[0]);
}

export function createUser(user: Partial<UserRow> & { id: string; name: string }): UserRow {
  const db = getDb();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO users (id, name, phone, email, farm_name, location, district, language, role, is_premium, is_verified, has_completed_onboarding, password_hash, created_at, updated_at, version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.name,
      user.phone || null,
      user.email || null,
      user.farm_name || null,
      user.location || null,
      user.district || null,
      user.language || "ur",
      user.role || "user",
      user.is_premium || 0,
      user.is_verified || 0,
      user.has_completed_onboarding || 0,
      user.password_hash || null,
      now,
      now,
      1,
    ]
  );

  saveDatabase();
  return findUserById(user.id)!;
}

export function updateUser(id: string, updates: Partial<UserRow>): UserRow | null {
  const db = getDb();
  const existing = findUserById(id);
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

  db.run(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
  saveDatabase();

  return findUserById(id);
}
