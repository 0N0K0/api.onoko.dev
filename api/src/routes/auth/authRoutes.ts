import { Router, Request, Response } from "express";
import { SettingsRepository } from "../../repositories/SettingsRepository";
import { verifyPassword } from "../../utils/passwordUtils";
import { generateToken } from "../../utils/auth/jwtUtils";
import {
  isBlocked,
  registerAttempt,
  resetAttempts,
} from "../../utils/auth/antiBruteforce";

export function createAuthRoutes(settingsRepo: SettingsRepository): Router {
  const router = Router();

  // Endpoint POST /auth (non documenté)
  router.post("/auth", async (req: Request, res: Response) => {
    const ip = req.ip;
    if (!ip) return res.status(400).json({ error: "Cannot determine IP." });
    if (isBlocked(ip)) {
      return res.status(429).json({ error: "Too many attempts. Try later." });
    }
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: "Missing login or password." });
    }
    const storedLogin = await settingsRepo.get("login");
    const storedHash = await settingsRepo.get("password_hash");
    if (!storedLogin || !storedHash) {
      return res.status(500).json({ error: "Auth not configured." });
    }
    if (login !== storedLogin) {
      registerAttempt(ip);
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const valid = await verifyPassword(password, storedHash);
    if (!valid) {
      registerAttempt(ip);
      return res.status(401).json({ error: "Invalid credentials." });
    }
    resetAttempts(ip);
    const token = generateToken({ login });
    res.json({ token });
  });

  return router;
}
