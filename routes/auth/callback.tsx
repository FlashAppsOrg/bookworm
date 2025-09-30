import { Handlers, PageProps } from "$fresh/server.ts";
import { setCookie } from "$std/http/cookie.ts";
import { getUserByEmail } from "../../utils/db-helpers.ts";
import { getKv } from "../../utils/db.ts";

interface CallbackData {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export const handler: Handlers<CallbackData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return ctx.render({
        success: false,
        error: "No authorization code provided"
      });
    }

    try {
      // Exchange code for tokens with auth service
      const authServiceUrl = Deno.env.get("AUTH_SERVICE_URL") || "https://auth.flashapps.org";
      const response = await fetch(`${authServiceUrl}/api/auth/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Exchange failed:", errorData);

        // Include debug info in error display if available
        const debugInfo = errorData.debug ?
          ` (Debug: requested=${errorData.debug.requestedCode}, existing=${errorData.debug.existingCodes?.join(', ') || 'none'})` : '';

        return ctx.render({
          success: false,
          error: errorData.error + debugInfo || "Failed to exchange authorization code"
        });
      }

      const { tokens, user } = await response.json();

      // Check if user has BookWorm access
      if (!user.platforms?.bookworm) {
        // For now, skip this check since migrated users might not have it set
      }

      // Get or sync local user data
      let localUser = await getUserByEmail(user.email);

      if (!localUser) {
        // Create a minimal local user record for auth service users
        const kv = await getKv();
        const userId = crypto.randomUUID();
        localUser = {
          id: userId,
          email: user.email.toLowerCase(),
          displayName: user.displayName || user.email.split('@')[0],
          role: user.platforms?.bookworm?.role || "teacher",
          schoolId: user.platforms?.bookworm?.schoolId || "",
          passwordHash: "", // No local password, using auth service
          verified: user.verified || true,
          createdAt: new Date().toISOString(),
        };

        // Store in KV
        await kv.set(["users:id", userId], localUser);
        await kv.set(["users:email", user.email.toLowerCase()], localUser);
      }

      const sessionData = {
        userId: localUser.id,
        email: localUser.email,
        role: localUser.role,
        authToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };

      const headers = new Headers();
      setCookie(headers, {
        name: "session",
        value: btoa(JSON.stringify(sessionData)),
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      });

      // Redirect based on user role and setup status
      let redirectTo = "/dashboard";
      if (localUser.role === "parent") {
        redirectTo = "/parent-dashboard";
      } else if (!localUser.schoolId) {
        redirectTo = "/setup";
      }

      return new Response("", {
        status: 302,
        headers: {
          ...headers,
          "Location": redirectTo,
        },
      });

    } catch (error) {
      console.error("Auth callback error:", error);
      return ctx.render({
        success: false,
        error: "Authentication failed. Please try again."
      });
    }
  },
};

export default function AuthCallback({ data }: PageProps<CallbackData>) {
  if (!data.success) {
    return (
      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div class="text-center">
              <h2 class="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
              <p class="text-gray-600 mb-6">{data.error}</p>
              <a
                href="/login"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Try Again
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div class="text-center">
            <h2 class="text-2xl font-bold text-green-600 mb-4">Authentication Successful</h2>
            <p class="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    </div>
  );
}