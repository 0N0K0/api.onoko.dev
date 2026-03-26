import { Router, Request, Response, NextFunction } from "express";
import { SettingsRepository } from "../../repositories/SettingsRepository";
import { jwtAuthMiddleware } from "../../middlewares/jwtAuthMiddleware";
import {
  verifyPassword,
  hashPassword,
  isStrongPassword,
} from "../../utils/passwordUtils";

export function createAccountRoutes(settingsRepo: SettingsRepository) {
  const router = Router();
  router.use("/account", jwtAuthMiddleware);

  router.get("/account", async (req: Request, res: Response) => {
    const login = await settingsRepo.get("login");
    const email = await settingsRepo.get("email");
    res.json({ login, email });
  });

  router.put("/account", async (req: Request, res: Response) => {
    const { login, email, oldPassword, newPassword } = req.body;
    if (!oldPassword) {
      return res.status(400).json({ error: "Old password required" });
    }
    const storedHash = await settingsRepo.get("password_hash");
    if (!storedHash || !(await verifyPassword(oldPassword, storedHash))) {
      return res.status(401).json({ error: "Invalid old password" });
    }
    if (login) {
      await settingsRepo.set("login", login);
    }
    if (email) {
      await settingsRepo.set("email", email);
    }
    if (newPassword) {
      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({
          error: "Password too weak (min 20 chars, maj, min, chiffre, spécial)",
        });
      }
      const hash = await hashPassword(newPassword);
      await settingsRepo.set("password_hash", hash);
    }
    res.json({ success: true });
  });

  return router;
}
