import { Router, Request, Response } from "express";
import { requireAuth } from "../auth/middleware";
import { findUserById, updateUser } from "../repos/userRepo";
import { emitToUser } from "../realtime/socket";

const router = Router();

router.get("/profile", requireAuth, (req: Request, res: Response) => {
  try {
    const user = findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ ok: false, error: "User not found", code: "not_found" });
      return;
    }
    res.json({ ok: true, data: user });
  } catch (err) {
    console.error("[GET /api/user/profile]", err);
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

router.put("/profile", requireAuth, (req: Request, res: Response) => {
  try {
    const { name, phone, email, farm_name, location, district, language, updated_at } = req.body;

    const existing = findUserById(req.user!.userId);
    if (!existing) {
      res.status(404).json({ ok: false, error: "User not found", code: "not_found" });
      return;
    }

    if (updated_at && existing.updated_at > updated_at) {
      res.status(409).json({
        ok: false,
        error: "Conflict — server has newer version",
        code: "conflict",
        data: existing,
      });
      return;
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    const normPhone = typeof phone === "string" ? phone.trim() : phone;
    const normEmail = typeof email === "string" ? email.trim() : email;
    if (phone !== undefined) updates.phone = normPhone || null;
    if (email !== undefined) updates.email = normEmail || null;
    if (farm_name !== undefined) updates.farm_name = farm_name;
    if (location !== undefined) updates.location = location;
    if (district !== undefined) updates.district = district;
    if (language !== undefined) updates.language = language;

    const updated = updateUser(req.user!.userId, updates);

    emitToUser(req.user!.userId, "profile:updated", {
      data: updated,
      updatedAt: updated.updated_at,
      version: updated.version,
      origin: { clientId: req.headers["x-client-id"] || "rest", socketId: "rest" },
    });

    res.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[PUT /api/user/profile]", err);
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

export default router;
