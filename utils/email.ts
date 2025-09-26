import { Resend } from "resend";
import { getKv } from "./db.ts";

const MONTHLY_LIMIT = 2950;
const WARNING_THRESHOLD = 2400;

interface EmailStats {
  monthly: number;
  daily: number;
  lastReset: string;
}

async function getEmailStats(): Promise<EmailStats> {
  const kv = await getKv();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dayKey = `${monthKey}-${String(now.getDate()).padStart(2, "0")}`;

  const monthlyResult = await kv.get<number>(["email_stats", "monthly", monthKey]);
  const dailyResult = await kv.get<number>(["email_stats", "daily", dayKey]);

  return {
    monthly: monthlyResult.value ?? 0,
    daily: dailyResult.value ?? 0,
    lastReset: monthKey,
  };
}

async function incrementEmailCount(): Promise<void> {
  const kv = await getKv();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dayKey = `${monthKey}-${String(now.getDate()).padStart(2, "0")}`;

  const monthlyResult = await kv.get<number>(["email_stats", "monthly", monthKey]);
  const dailyResult = await kv.get<number>(["email_stats", "daily", dayKey]);

  const newMonthly = (monthlyResult.value ?? 0) + 1;
  const newDaily = (dailyResult.value ?? 0) + 1;

  await kv.set(["email_stats", "monthly", monthKey], newMonthly);
  await kv.set(["email_stats", "daily", dayKey], newDaily);
}

export async function checkEmailLimit(): Promise<{ allowed: boolean; message?: string }> {
  const stats = await getEmailStats();

  if (stats.monthly >= MONTHLY_LIMIT) {
    return {
      allowed: false,
      message: `Monthly email limit reached (${MONTHLY_LIMIT}). Service will resume next month.`,
    };
  }

  if (stats.monthly >= WARNING_THRESHOLD) {
    console.warn(
      `⚠️  Email limit warning: ${stats.monthly}/${MONTHLY_LIMIT} emails sent this month`
    );
  }

  return { allowed: true };
}

export async function getEmailUsage(): Promise<EmailStats> {
  return await getEmailStats();
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const limitCheck = await checkEmailLimit();
  if (!limitCheck.allowed) {
    console.error("Email limit reached:", limitCheck.message);
    return { success: false, error: limitCheck.message };
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY not configured");
    return {
      success: false,
      error: "Email service not configured. Please contact support.",
    };
  }

  const resend = new Resend(apiKey);
  const verifyUrl = `${Deno.env.get("APP_URL") || "http://localhost:8000"}/verify?token=${token}`;

  try {
    await resend.emails.send({
      from: "BookWorm <noreply@flashapps.dev>",
      to: email,
      subject: "Verify your BookWorm account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 30px 0;">
              <h1 style="color: #0D9488; margin: 0;">📚 BookWorm</h1>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #111827;">Verify Your Email</h2>
              <p style="color: #4b5563; font-size: 16px;">
                Thanks for signing up! Click the button below to verify your email address and start cataloging your classroom books.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}"
                   style="display: inline-block; background: #0D9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:<br>
                <a href="${verifyUrl}" style="color: #0D9488; word-break: break-all;">${verifyUrl}</a>
              </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create a BookWorm account, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    });

    await incrementEmailCount();
    console.log(`✅ Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return {
      success: false,
      error: "Failed to send verification email. Please try again later.",
    };
  }
}