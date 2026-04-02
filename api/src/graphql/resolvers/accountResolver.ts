import {
  hashPassword,
  isStrongPassword,
  verifyPassword,
} from "../../utils/passwordUtils";
import crypto from "crypto";
import nodemailer from "nodemailer";

const accountResolver = {
  account: async (_args: any, context: { user: any; settingsRepo: any }) => {
    if (!context.user) throw new Error("Unauthorized");

    const login = await context.settingsRepo.get("login");
    const email = await context.settingsRepo.get("email");

    return { login, email };
  },

  updateAccount: async (
    _args: {
      login?: string;
      email?: string;
      oldPassword: string;
      newPassword?: string;
    },
    context: { user: any; settingsRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");

    const storedHash = await context.settingsRepo.get("password_hash");
    if (!storedHash || !(await verifyPassword(_args.oldPassword, storedHash))) {
      throw new Error("Invalid old password");
    }
    if (_args.login) await context.settingsRepo.set("login", _args.login);
    if (_args.email) await context.settingsRepo.set("email", _args.email);
    if (_args.newPassword) {
      if (!isStrongPassword(_args.newPassword)) {
        throw new Error(
          "Password too weak (min 20 chars, maj, min, chiffre, spécial)",
        );
      }
      const hash = await hashPassword(_args.newPassword);
      await context.settingsRepo.set("password_hash", hash);
    }
    const newLogin = await context.settingsRepo.get("login");
    const newEmail = await context.settingsRepo.get("email");

    return { login: newLogin, email: newEmail };
  },

  // Demande de reset password
  requestResetPassword: async (
    _args: { email: string },
    context: { settingsRepo: any },
  ) => {
    const storedEmail = await context.settingsRepo.get("email");
    if (!storedEmail || storedEmail !== _args.email) return true; // Ne pas révéler l'existence
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 min
    const pool = context.settingsRepo["pool"];
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        "INSERT INTO password_reset_tokens (token, email, expires) VALUES (?, ?, ?)",
        [token, _args.email, expires],
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
      to: _args.email,
      subject: "Réinitialisation de mot de passe",
      text: `Pour réinitialiser votre mot de passe, cliquez ici : ${resetUrl}`,
    });
    return true;
  },

  // Confirmation du reset password
  resetPassword: async (
    _args: {
      token: string;
      newPassword: string;
    },
    context: { settingsRepo: any },
  ) => {
    const { token, newPassword } = _args;
    if (!token || !newPassword)
      throw new Error("Token and newPassword required");
    const pool = context.settingsRepo["pool"];
    let conn;
    let entry;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT email, expires FROM password_reset_tokens WHERE token = ?",
        [token],
      );
      if (!rows.length) throw new Error("Invalid or expired token");
      entry = rows[0];
      if (new Date(entry.expires).getTime() < Date.now()) {
        throw new Error("Invalid or expired token");
      }
    } finally {
      if (conn) conn.release();
    }
    if (!isStrongPassword(newPassword)) {
      throw new Error(
        "Password too weak (min 20 chars, maj, min, chiffre, spécial)",
      );
    }
    const hash = await hashPassword(newPassword);
    await context.settingsRepo.set("password_hash", hash);
    // Supprime le token en base
    try {
      conn = await pool.getConnection();
      await conn.query("DELETE FROM password_reset_tokens WHERE token = ?", [
        token,
      ]);
    } finally {
      if (conn) conn.release();
    }
    return true;
  },
};

export default accountResolver;
