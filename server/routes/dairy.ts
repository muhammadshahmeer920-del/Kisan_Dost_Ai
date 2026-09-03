import { Router, Request, Response } from "express";
import { requireAuth, optionalAuth } from "../auth/middleware";
import { getProducts, getProductById, createProduct, updateProduct, softDeleteProduct, getOrders, createOrder, updateOrder, getOrderById, getOrderItems } from "../repos/dairyRepo";
import { toFlutterProduct, toWebProduct } from "../adapters/dairyAdapter";
import { emitToUser, emitDairy } from "../realtime/socket";

const router = Router();

router.get("/products", optionalAuth, (req: Request, res: Response) => {
  try {
    const since = req.query.since as string | undefined;
    const client = req.headers["x-client"] as string;
    const products = getProducts(since);

    const adapted = client === "flutter"
      ? products.map(toFlutterProduct)
      : products.map(toWebProduct);

    let deletedIds: string[] = [];
    if (since) {
      const db = require("../db").getDb();
      const result = db.exec("SELECT id FROM dairy_products WHERE updated_at > ? AND deleted_at IS NOT NULL", [since]);
      if (result.length > 0) {
        deletedIds = result[0].values.map((row: any[]) => row[0] as string);
      }
    }

    res.json({ ok: true, data: adapted, deletedIds });
  } catch (err) {
    console.error("[GET /api/dairy/products]", err);
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

router.post("/products", requireAuth, (req: Request, res: Response) => {
  try {
    const product = req.body;
    if (!product.id) {
      res.status(400).json({ ok: false, error: "Product id required", code: "invalid" });
      return;
    }

    const existing = getProductById(product.id);
    if (existing) {
      res.status(409).json({
        ok: false,
        error: "Product already exists",
        code: "conflict",
        data: existing,
      });
      return;
    }

    const created = createProduct({ ...product, owner_id: req.user!.userId });

    emitDairy("dairy:product:created", {
      data: toFlutterProduct(created),
      updatedAt: created.updated_at,
      version: created.version,
      origin: { clientId: req.headers["x-client-id"] || "rest", socketId: "rest" },
    });

    res.json({ ok: true, data: created });
  } catch (err) {
    console.error("[POST /api/dairy/products]", err);
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

router.put("/products/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = getProductById(id);
    if (!existing) {
      res.status(404).json({ ok: false, error: "Product not found", code: "not_found" });
      return;
    }

    if (updates.updated_at && existing.updated_at > updates.updated_at) {
      res.status(409).json({
        ok: false,
        error: "Conflict — server has newer version",
        code: "conflict",
        data: existing,
      });
      return;
    }

    const updated = updateProduct(id, updates);

    emitDairy("dairy:product:updated", {
      data: toFlutterProduct(updated),
      updatedAt: updated.updated_at,
      version: updated.version,
      origin: { clientId: req.headers["x-client-id"] || "rest", socketId: "rest" },
    });

    res.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[PUT /api/dairy/products/:id]", err);
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

router.delete("/products/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = softDeleteProduct(id);
    if (!success) {
      res.status(404).json({ ok: false, error: "Product not found", code: "not_found" });
      return;
    }

    emitDairy("dairy:product:deleted", {
      data: { id },
      updatedAt: new Date().toISOString(),
      origin: { clientId: req.headers["x-client-id"] || "rest", socketId: "rest" },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/dairy/products/:id]", err);
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

router.get("/orders", requireAuth, (req: Request, res: Response) => {
  try {
    const since = req.query.since as string | undefined;
    const orders = getOrders(req.user!.userId, since);
    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: getOrderItems(order.id),
    }));
    res.json({ ok: true, data: ordersWithItems });
  } catch (err) {
    console.error("[GET /api/dairy/orders]", err);
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

router.post("/orders", optionalAuth, (req: Request, res: Response) => {
  try {
    const { id, items, ...orderData } = req.body;
    if (!id) {
      res.status(400).json({ ok: false, error: "Order id required", code: "invalid" });
      return;
    }

    const existing = getOrderById(id);
    if (existing) {
      res.status(409).json({
        ok: false,
        error: "Order already exists",
        code: "conflict",
        data: existing,
      });
      return;
    }

    const created = createOrder(
      { ...orderData, id, owner_id: req.user?.userId || "anonymous" },
      items || []
    );

    const ownerId = req.user?.userId;
    if (ownerId) {
      emitToUser(ownerId, "dairy:order:created", {
        data: created,
        updatedAt: created.updated_at,
        version: created.version,
        origin: { clientId: req.headers["x-client-id"] || "rest", socketId: "rest" },
      });
    }
    emitDairy("dairy:product:updated", {
      data: null,
      updatedAt: new Date().toISOString(),
      origin: { clientId: req.headers["x-client-id"] || "rest", socketId: "rest" },
      hint: "stock_changed",
    });

    res.json({ ok: true, data: created });
  } catch (err) {
    console.error("[POST /api/dairy/orders]", err);
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

router.put("/orders/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = getOrderById(id);
    if (!existing) {
      res.status(404).json({ ok: false, error: "Order not found", code: "not_found" });
      return;
    }

    if (updates.updated_at && existing.updated_at > updates.updated_at) {
      res.status(409).json({
        ok: false,
        error: "Conflict — server has newer version",
        code: "conflict",
        data: existing,
      });
      return;
    }

    const updated = updateOrder(id, updates);

    emitToUser(req.user!.userId, "dairy:order:updated", {
      data: updated,
      updatedAt: updated.updated_at,
      version: updated.version,
      origin: { clientId: req.headers["x-client-id"] || "rest", socketId: "rest" },
    });

    res.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[PUT /api/dairy/orders/:id]", err);
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

export default router;
