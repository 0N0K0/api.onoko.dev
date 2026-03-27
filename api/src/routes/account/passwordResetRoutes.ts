import { Router, Request, Response } from "express";
import { SettingsRepository } from "../../repositories/SettingsRepository";
import { hashPassword, isStrongPassword } from "../../utils/passwordUtils";
import crypto from "crypto";
import nodemailer from "nodemailer";

export function createPasswordResetRoutes(settingsRepo: SettingsRepository) {
  const router = Router();

  router.post("/auth/reset", async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    const storedEmail = await settingsRepo.get("email");
    if (!storedEmail || storedEmail !== email) {
      return res.json({ success: true });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 min
    // Stocke le token en base
    const pool = settingsRepo["pool"];
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        "INSERT INTO password_reset_tokens (token, email, expires) VALUES (?, ?, ?)",
        [token, email, expires],
      );
    } finally {
      if (conn) conn.release();
    }
    const resetUrl = `${process.env.RESET_URL || "http://localhost:4000"}?token=${token}`;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@example.com",
      to: email,
      subject: "Réinitialisation de mot de passe",
      text: `Pour réinitialiser votre mot de passe, cliquez ici : ${resetUrl}`,
    });
    res.json({ success: true });
  });

  router.post("/auth/reset/confirm", async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ error: "Token and newPassword required" });
    // Vérifie le token en base
    const pool = settingsRepo["pool"];
    let conn;
    let entry;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT email, expires FROM password_reset_tokens WHERE token = ?",
        [token],
      );
      if (!rows.length) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      entry = rows[0];
      if (new Date(entry.expires).getTime() < Date.now()) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
    } finally {
      if (conn) conn.release();
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: "Password too weak (min 20 chars, maj, min, chiffre, spécial)",
      });
    }
    const hash = await hashPassword(newPassword);
    await settingsRepo.set("password_hash", hash);
    // Supprime le token en base
    try {
      conn = await pool.getConnection();
      await conn.query("DELETE FROM password_reset_tokens WHERE token = ?", [
        token,
      ]);
    } finally {
      if (conn) conn.release();
    }
    res.json({ success: true });
  });

  return router;
}
