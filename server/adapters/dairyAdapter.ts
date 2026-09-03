import { DairyProductRow } from "../repos/dairyRepo";

export function toFlutterProduct(row: DairyProductRow) {
  return {
    id: row.id,
    name: row.name_en || row.name_ur || "",
    description: row.description_en || row.description_ur || "",
    category: row.category_en || row.category || "",
    pricePkr: row.price_pkr,
    unit: row.unit || "Liter",
    dailyCapacity: row.daily_capacity || "",
    isOrganic: row.is_organic === 1,
    inStock: row.in_stock === 1,
    rating: row.rating,
    imageUrl: row.image_url,
    sellerName: row.seller_name,
    sellerPhone: row.seller_phone,
    sellerCity: row.seller_city,
    farmName: row.farm_name,
    stock: row.stock,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

export function toWebProduct(row: DairyProductRow) {
  const nameEn = row.name_en || "";
  const nameUr = row.name_ur || "";
  const descEn = row.description_en || "";
  const descUr = row.description_ur || "";
  return {
    id: row.id,
    sellerId: row.owner_id || "",
    name: nameEn || nameUr,
    nameEn,
    nameUr,
    category: row.category || "",
    categoryEn: row.category_en || "",
    price: row.price_pkr,
    pricePKR: row.price_pkr,
    unit: row.unit || "Liter",
    unitUr: row.unit_ur || "",
    stock: row.stock,
    dailyCapacity: row.daily_capacity || "",
    isOrganic: row.is_organic === 1,
    inStock: row.in_stock === 1,
    rating: row.rating,
    description: descEn || descUr,
    descriptionEn: descEn,
    descriptionUr: descUr,
    imageUrl: row.image_url || "",
    sellerName: row.seller_name || "",
    sellerPhone: row.seller_phone || "",
    sellerCity: row.seller_city || "",
    farmName: row.farm_name || "",
    updatedAt: row.updated_at,
    version: row.version,
  };
}
