export type ContactSubject = "project" | "rdv" | "other";

export type ContactPayload = {
  company?: string;
  name?: string;
  email: string;
  phone?: string;
  subject: ContactSubject;
  customSubject?: string;
  message: string;
};
