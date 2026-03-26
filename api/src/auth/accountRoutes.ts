
import { Router, Request, Response, NextFunction } from "express";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { verifyToken } from "./jwtUtils";
import { verifyPassword, hashPassword, isStrongPassword } from "./passwordUtils";

// Extension du type Request pour inclure req.user
import type { JwtPayload } from "jsonwebtoken";
declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload;
    }
  }
}


function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  (async () => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }
    try {
      const token = auth.slice(7);
      req.user = verifyToken(token);
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  })().catch(next);
}

export function createAccountRoutes(settingsRepo: SettingsRepository) {
  const router = Router();
  router.use("/account", jwtAuthMiddleware);

  // GET /account : infos actuelles (login, email)
  router.get("/account", async (req: Request, res: Response) => {
    const login = await settingsRepo.get("login");
    const email = await settingsRepo.get("email");
    res.json({ login, email });
  });

  // PUT /account : modif login/email/mdp (ancien mdp requis)
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
