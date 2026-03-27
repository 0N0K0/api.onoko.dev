// Middleware CORS pour Express
import { Request, Response, NextFunction } from "express";

export function corsDynamicOrigin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const origin = process.env.CORS_ORIGIN || "http://localhost:5173";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
}
