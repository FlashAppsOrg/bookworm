import { Handlers } from "$fresh/server.ts";
import { validateEmail } from "../../../utils/auth.ts";
import { getUserByEmail, createUser, getSchoolByDomain } from "../../../utils/db-helpers.ts";
import { hashPassword, generateToken } from "../../../utils/password.ts";
import { getKv, VerificationToken } from "../../../utils/db.ts";
import { sendVerificationEmail } from "../../../utils/email.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { email, password, displayName } = body;

      if (!email || !password || !displayName) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const emailError = validateEmail(email);
      if (emailError) {
        return new Response(JSON.stringify({ error: emailError }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (password.length < 8) {
        return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return new Response(JSON.stringify({ error: "Email already registered" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const emailDomain = email.toLowerCase().split("@")[1];
      const school = await getSchoolByDomain(emailDomain);

      const passwordHash = await hashPassword(password);
      const user = await createUser({
        email: email.toLowerCase(),
        passwordHash,
        displayName,
        username: "",
        schoolId: school ? school.id : null,
        verified: false,
        role: "teacher",
        delegatedToUserIds: [],
        googleBooksApiKey: null,
        googleSheetUrl: null,
        isPlaceholder: false,
      });

      const token = generateToken();
      const verificationToken: VerificationToken = {
        token,
        email: user.email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      const kv = await getKv();
      await kv.set(["verificationTokens", token], verificationToken);

      const emailResult = await sendVerificationEmail(user.email, token);

      if (!emailResult.success) {
        return new Response(JSON.stringify({
          error: emailResult.error || "Failed to send verification email. Please try again later.",
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Account created! Please check your email for verification link.",
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Signup error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};