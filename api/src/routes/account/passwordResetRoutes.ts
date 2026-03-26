import { Router, Request, Response } from "express";
import { SettingsRepository } from "../../repositories/SettingsRepository";
import { hashPassword, isStrongPassword } from "../../utils/passwordUtils";
import crypto from "crypto";
import nodemailer from "nodemailer";

// En mémoire pour la démo, à remplacer par une table si besoin
const resetTokens: Record<string, { email: string; expires: number }> = {};

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
    resetTokens[token] = { email, expires: Date.now() + 1000 * 60 * 15 };
    const resetUrl = `${process.env.RESET_URL || "http://localhost:4000"}/auth/reset/confirm?token=${token}`;
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
    const entry = resetTokens[token];
    if (!entry || entry.expires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: "Password too weak (min 20 chars, maj, min, chiffre, spécial)",
      });
    }
    const hash = await hashPassword(newPassword);
    await settingsRepo.set("password_hash", hash);
    delete resetTokens[token];
    res.json({ success: true });
  });

  return router;
}
