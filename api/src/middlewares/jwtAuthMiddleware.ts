import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth/jwtUtils";

export function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
