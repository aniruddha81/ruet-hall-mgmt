import nodemailer from "nodemailer";

const SMTP_HOST = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
const SMTP_PORT = Number(process.env.BREVO_SMTP_PORT || 587);
const SMTP_USER = process.env.BREVO_SMTP_USER || "";
const SMTP_PASS = process.env.BREVO_SMTP_PASS || "";
const SMTP_FROM = process.env.EMAIL_FROM || "noreply@ruet-hall.edu";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn(
        "[Email] BREVO_SMTP_USER / BREVO_SMTP_PASS not configured – emails will be logged to console instead."
      );
      return null;
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(options: SendMailOptions): Promise<boolean> {
  try {
    const t = getTransporter();

    if (!t) {
      console.log(
        `[Email-Preview] To: ${options.to} | Subject: ${options.subject}`
      );
      console.log(options.html.replace(/<[^>]+>/g, " ").substring(0, 300));
      return true;
    }

    await t.sendMail({
      from: `"RUET Hall Management" <${SMTP_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[Email] Sent receipt to ${options.to}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}
