import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../auth/jwt";
import { findUserById } from "../repos/userRepo";
import { getProducts, getOrders, getOrderItems } from "../repos/dairyRepo";
import { toFlutterProduct, toWebProduct } from "../adapters/dairyAdapter";

let io: Server;

export function initRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error("unauthorized"));
    }
    try {
      const payload = verifyToken(token as string);
      socket.data.userId = payload.userId;
      socket.data.phone = payload.phone;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    const clientId = socket.handshake.auth?.clientId || socket.id;

    socket.join("user:" + userId);
    socket.join("dairy:public");

    console.log(`[Socket] connected: userId=${userId} socketId=${socket.id}`);

    const user = findUserById(userId);
    const products = getProducts();
    const orders = getOrders(userId);
    const ordersWithItems = orders.map((o) => ({ ...o, items: getOrderItems(o.id) }));

    socket.emit("sync:snapshot", {
      profile: user,
      products: products.map(toFlutterProduct),
      orders: ordersWithItems,
    });

    socket.on("profile:update", (data, ack) => {
      try {
        const { updateUser } = require("../repos/userRepo");
        const updated = updateUser(userId, data);
        if (!updated) {
          return ack?.({ ok: false, code: "not_found" });
        }
        io.to("user:" + userId).emit("profile:updated", {
          data: updated,
          updatedAt: updated.updated_at,
          version: updated.version,
          origin: { clientId, socketId: socket.id },
        });
        ack?.({ ok: true, data: updated, updatedAt: updated.updated_at });
      } catch (err) {
        console.error("[Socket] profile:update error:", err);
        ack?.({ ok: false, code: "error" });
      }
    });

    socket.on("dairy:product:upsert", (data, ack) => {
      try {
        const { getProductById, createProduct, updateProduct } = require("../repos/dairyRepo");
        const existing = getProductById(data.id);

        if (existing && data.updated_at && existing.updated_at > data.updated_at) {
          return ack?.({ ok: false, code: "conflict", data: existing });
        }

        const result = existing
          ? updateProduct(data.id, data)
          : createProduct({ ...data, owner_id: userId });

        if (!result) {
          return ack?.({ ok: false, code: "error" });
        }

        io.to("dairy:public").emit("dairy:product:updated", {
          data: toFlutterProduct(result),
          updatedAt: result.updated_at,
          version: result.version,
          origin: { clientId, socketId: socket.id },
        });

        ack?.({ ok: true, data: result, updatedAt: result.updated_at });
      } catch (err) {
        console.error("[Socket] dairy:product:upsert error:", err);
        ack?.({ ok: false, code: "error" });
      }
    });

    socket.on("dairy:product:delete", (data, ack) => {
      try {
        const { softDeleteProduct } = require("../repos/dairyRepo");
        const success = softDeleteProduct(data.id);
        if (!success) {
          return ack?.({ ok: false, code: "not_found" });
        }
        io.to("dairy:public").emit("dairy:product:deleted", {
          data: { id: data.id },
          updatedAt: new Date().toISOString(),
          origin: { clientId, socketId: socket.id },
        });
        ack?.({ ok: true });
      } catch (err) {
        console.error("[Socket] dairy:product:delete error:", err);
        ack?.({ ok: false, code: "error" });
      }
    });

    socket.on("dairy:order:create", (data, ack) => {
      try {
        const { createOrder } = require("../repos/dairyRepo");
        const { items, ...orderData } = data;
        const created = createOrder({ ...orderData, owner_id: userId }, items || []);

        io.to("user:" + userId).emit("dairy:order:created", {
          data: created,
          updatedAt: created.updated_at,
          version: created.version,
          origin: { clientId, socketId: socket.id },
        });

        io.to("dairy:public").emit("dairy:product:updated", {
          data: null,
          updatedAt: new Date().toISOString(),
          origin: { clientId, socketId: socket.id },
          hint: "stock_changed",
        });

        ack?.({ ok: true, data: created, updatedAt: created.updated_at });
      } catch (err) {
        console.error("[Socket] dairy:order:create error:", err);
        ack?.({ ok: false, code: "error" });
      }
    });

    socket.on("dairy:order:status", (data, ack) => {
      try {
        const { updateOrder } = require("../repos/dairyRepo");
        const updated = updateOrder(data.id, { status: data.status });
        if (!updated) {
          return ack?.({ ok: false, code: "not_found" });
        }

        io.to("user:" + userId).emit("dairy:order:updated", {
          data: updated,
          updatedAt: updated.updated_at,
          version: updated.version,
          origin: { clientId, socketId: socket.id },
        });

        ack?.({ ok: true, data: updated, updatedAt: updated.updated_at });
      } catch (err) {
        console.error("[Socket] dairy:order:status error:", err);
        ack?.({ ok: false, code: "error" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] disconnected: userId=${userId} socketId=${socket.id}`);
    });
  });

  console.log("[Socket.io] mounted and listening for connections");
  return io;
}

export function emitToUser(userId: string, event: string, payload: any): void {
  if (io) {
    io.to("user:" + userId).emit(event, payload);
  }
}

export function emitDairy(event: string, payload: any): void {
  if (io) {
    io.to("dairy:public").emit(event, payload);
  }
}

export function getIO(): Server {
  return io;
}
