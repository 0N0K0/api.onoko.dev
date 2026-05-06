import nodemailer from "nodemailer";
import { ContactPayload } from "../../types/contactTypes";
import validator from "validator";
import { sanitizeString } from "../../utils/stringUtils";
import { isEmpty } from "../../utils/validationUtils";
import { redis } from "../../constants/abfConstants";

type ContactContext = {
  ip?: string;
};

const CONTACT_ATTEMPT_PREFIX = "contact:";
const CONTACT_ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 heure
const CONTACT_MAX_ATTEMPTS = 5;

async function assertContactRateLimit(ip: string): Promise<void> {
  const key = CONTACT_ATTEMPT_PREFIX + ip;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.pexpire(key, CONTACT_ATTEMPT_WINDOW_MS);
  }

  if (count > CONTACT_MAX_ATTEMPTS) {
    throw new Error(
      "Vous avez atteint la limite de messages. Reessayez plus tard.",
    );
  }
}

function normalizeContactInput(args: ContactPayload): ContactPayload {
  const company = args.company ? sanitizeString(args.company) : undefined;
  const name = args.name ? sanitizeString(args.name) : undefined;
  const rawEmail = args.email.trim().normalize("NFC");
  if (!validator.isEmail(rawEmail)) {
    throw new Error("Email invalide");
  }
  const email = validator.normalizeEmail(rawEmail, {
    all_lowercase: true,
  });
  const phone = args.phone ? sanitizeString(args.phone) : undefined;
  const customSubject = args.customSubject
    ? sanitizeString(args.customSubject)
    : undefined;
  const message = sanitizeString(args.message);

  if (!email) throw new Error("Email invalide");
  if (company && company.length > 120) {
    throw new Error("Société invalide");
  }
  if (name && (name.length < 2 || name.length > 120)) {
    throw new Error("Nom invalide");
  }
  if (
    phone &&
    (!validator.matches(phone, /^[+0-9().\s-]{6,30}$/) || phone.length > 30)
  ) {
    throw new Error("Téléphone invalide");
  }
  if (!args.subject || !["project", "rdv", "other"].includes(args.subject)) {
    throw new Error("Sujet invalide");
  }
  if (customSubject && customSubject.length > 120) {
    throw new Error("Sujet personnalisé trop long");
  }
  if (isEmpty(message) || message.length < 10 || message.length > 3000) {
    throw new Error("Message invalide");
  }

  return {
    company,
    name,
    email,
    phone,
    subject: args.subject,
    customSubject,
    message,
  };
}

const contactResolver = {
  sendContact: async (_args: ContactPayload, context: ContactContext) => {
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_PORT ||
      !process.env.CONTACT_RECIPIENT_EMAIL
    ) {
      throw new Error(
        "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and CONTACT_RECIPIENT_EMAIL must be defined in environment variables",
      );
    }

    const ip = context?.ip ?? "unknown";
    await assertContactRateLimit(ip);

    const args = normalizeContactInput(_args);

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
      replyTo: args.email,
      to: process.env.CONTACT_RECIPIENT_EMAIL,
      subject:
        "[Contact] " +
        (args.subject === "project"
          ? "Demande de collaboration"
          : args.subject === "rdv"
            ? "Demande de rendez-vous"
            : args.customSubject
              ? args.customSubject
              : ""),
      text: `${args.company ? "Société : " + args.company + "\n" : ""}${args.name ? "Nom : " + args.name + "\n" : ""}Email : ${args.email}\n${args.phone ? "Téléphone : " + args.phone + "\n" : ""}\n---\n\n${args.message}`,
    });
    return true;
  },
};

export default contactResolver;
