import { Resend } from "resend";
import { getKv } from "./db.ts";
import { getPreferredDomain } from "./url-helpers.ts";

const MONTHLY_LIMIT = 2950;

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
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthName = nextMonth.toLocaleString('en-US', { month: 'long' });
    const day = nextMonth.getDate();

    return {
      allowed: false,
      message: `We've reached our signup limit for this month. Please check back on ${monthName} ${day}.`,
    };
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
    return { success: false, error: limitCheck.message };
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return {
      success: false,
      error: "Email service not configured. Please contact support.",
    };
  }

  const resend = new Resend(apiKey);
  const verifyUrl = `${getPreferredDomain()}/verify?token=${token}`;

  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

  try {
    await resend.emails.send({
      from: `BookWorm <${fromEmail}>`,
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
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Failed to send verification email. Please try again later.",
    };
  }
}

export async function sendInvitationEmail(
  email: string,
  teacherName: string,
  inviteUrl: string,
  isExistingDelegate: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const limitCheck = await checkEmailLimit();
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.message };
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return {
      success: false,
      error: "Email service not configured. Please contact support.",
    };
  }

  const resend = new Resend(apiKey);
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

  const subject = isExistingDelegate
    ? `${teacherName} added you to their BookWorm classroom`
    : `${teacherName} invited you to help with BookWorm`;

  const bodyText = isExistingDelegate
    ? `<strong>${teacherName}</strong> has added you as a helper for their classroom in BookWorm.`
    : `<strong>${teacherName}</strong> has invited you to help catalog their classroom books using BookWorm.`;

  const additionalText = isExistingDelegate
    ? `You can now scan and add books to their classroom library. Click the button below to access their classroom.`
    : `As a helper, you'll be able to scan and add books to their classroom library. Click the button below to get started.`;

  const buttonText = isExistingDelegate
    ? `Go to Classroom`
    : `Join as Helper`;

  try {
    await resend.emails.send({
      from: `BookWorm <${fromEmail}>`,
      to: email,
      subject,
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
              <h2 style="margin-top: 0; color: #111827;">${isExistingDelegate ? 'New Classroom Added' : "You're Invited!"}</h2>
              <p style="color: #4b5563; font-size: 16px;">
                ${bodyText}
              </p>
              <p style="color: #4b5563; font-size: 16px;">
                ${additionalText}
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}"
                   style="display: inline-block; background: #0D9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  ${buttonText}
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #0D9488; word-break: break-all;">${inviteUrl}</a>
              </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>This invitation will expire in 7 days.</p>
              <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    });

    await incrementEmailCount();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Failed to send invitation email. Please try again later.",
    };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return {
      success: false,
      error: "Email service not configured. Please contact support.",
    };
  }

  const resend = new Resend(apiKey);
  const resetUrl = `${getPreferredDomain()}/reset-password?token=${token}`;

  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

  try {
    await resend.emails.send({
      from: `BookWorm <${fromEmail}>`,
      to: email,
      subject: "Reset your BookWorm password",
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
              <h2 style="margin-top: 0; color: #111827;">Reset Your Password</h2>
              <p style="color: #4b5563; font-size: 16px;">
                We received a request to reset your BookWorm password. Click the button below to create a new password.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="display: inline-block; background: #0D9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #0D9488; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    });

    await incrementEmailCount();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Failed to send password reset email. Please try again later.",
    };
  }
}