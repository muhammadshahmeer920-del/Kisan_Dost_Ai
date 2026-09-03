import { Express } from "express";
import userRoutes from "./user";
import dairyRoutes from "./dairy";

export function registerApiRoutes(app: Express): void {
  app.use("/api/user", userRoutes);
  app.use("/api/dairy", dairyRoutes);
}
