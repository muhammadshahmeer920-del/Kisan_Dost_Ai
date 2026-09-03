import { getDb, saveDatabase } from "./index";

export function seedDatabase(): void {
  const db = getDb();

  const result = db.exec("SELECT COUNT(*) as count FROM users");
  const userCount = result.length > 0 ? (result[0].values[0][0] as number) : 0;

  if (userCount > 0) {
    console.log("[SQLite] seed skipped — users table already has rows");
    return;
  }

  const now = new Date().toISOString();
  const demoUserId = "usr_demo_001";

  db.run(
    `INSERT INTO users (id, name, phone, email, farm_name, location, district, language, role, is_premium, is_verified, has_completed_onboarding, created_at, updated_at, version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      demoUserId,
      "Chaudhry Ahmed Ali",
      "03001234567",
      "ahmed.farm@kisandost.ai",
      "Al-Madina Dairy & Cattle Farm",
      "Chak 88/9-L, Sahiwal, Punjab",
      "Sahiwal",
      "ur",
      "user",
      1,
      1,
      1,
      now,
      now,
      1,
    ]
  );

  const products = [
    {
      id: "prod-1",
      nameEn: "Fresh Pure Cow Milk",
      nameUr: "خالص گائے کا تازہ دودھ",
      category: "دودھ",
      categoryEn: "Milk",
      price: 220,
      unit: "Liter",
      unitUr: "لیٹر",
      stock: 50,
      inStock: 1,
      rating: 4.9,
      descriptionEn: "100% pure organic Sahiwal cow milk, fresh from morning milking.",
      descriptionUr: "خالص ساہیوال گائے کا تازہ آرگینک دودھ۔ بغیر کسی ملاوٹ کے۔",
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "prod-2",
      nameEn: "Pure Thick Buffalo Yogurt",
      nameUr: "خالص نیلی راوی بھینس کا گاڑھا دہی",
      category: "دہی",
      categoryEn: "Yogurt",
      price: 260,
      unit: "Kg",
      unitUr: "کلو",
      stock: 30,
      inStock: 1,
      rating: 4.8,
      descriptionEn: "Traditional clay-pot set thick buffalo milk yogurt.",
      descriptionUr: "روایتی مٹی کی کونڈی میں جما ہوا میٹھا اور گاڑھا دہی۔",
      imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "prod-3",
      nameEn: "Pure Traditional Desi Ghee",
      nameUr: "خالص چاٹی کا دیسی گھی",
      category: "دیسی گھی",
      categoryEn: "Desi Ghee",
      price: 2400,
      unit: "Kg",
      unitUr: "کلو",
      stock: 15,
      inStock: 1,
      rating: 5.0,
      descriptionEn: "Slow-cooked traditional organic butter oil / pure ghee.",
      descriptionUr: "دیسی مکھن کو ہلکی آنچ پر پکا کر تیار کردہ 100% خالص اور خوشبودار دیسی گھی۔",
      imageUrl: "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&q=80&w=800",
    },
  ];

  db.run("BEGIN TRANSACTION");

  try {
    for (const p of products) {
      db.run(
        `INSERT INTO dairy_products (id, owner_id, name_en, name_ur, category, category_en, price_pkr, unit, unit_ur, stock, in_stock, rating, description_en, description_ur, image_url, created_at, updated_at, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          demoUserId,
          p.nameEn,
          p.nameUr,
          p.category,
          p.categoryEn,
          p.price,
          p.unit,
          p.unitUr,
          p.stock,
          p.inStock,
          p.rating,
          p.descriptionEn,
          p.descriptionUr,
          p.imageUrl,
          now,
          now,
          1,
        ]
      );
    }
    db.run("COMMIT");
    saveDatabase();
    console.log(`[SQLite] seeded demo user + ${products.length} dairy products`);
  } catch (err) {
    db.run("ROLLBACK");
    console.error("[SQLite] seed failed:", err);
    throw err;
  }
}
