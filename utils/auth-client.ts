/**
 * Auth client for communicating with FlashApps Auth Service
 */

// Get auth service URL based on environment
const getAuthServiceUrl = () => {
  if (typeof window !== "undefined") {
    // Client-side: check hostname
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8001";
    }
    return "https://auth.flashapps.org";
  } else {
    // Server-side: check Deno env
    const env = Deno.env.get("DENO_ENV");
    if (env === "development") {
      return "http://localhost:8001";
    }
    return "https://auth.flashapps.org";
  }
};

export const AUTH_SERVICE_URL = getAuthServiceUrl();

/**
 * Redirect to auth service for login
 */
export function redirectToLogin(redirect?: string) {
  const loginUrl = new URL(`${AUTH_SERVICE_URL}/login`);
  loginUrl.searchParams.set("app", "bookworm");

  if (redirect) {
    const currentUrl = typeof window !== "undefined"
      ? window.location.origin
      : "https://bookworm.flashapps.org";
    loginUrl.searchParams.set("redirect", `${currentUrl}${redirect}`);
  } else {
    const currentUrl = typeof window !== "undefined"
      ? window.location.origin
      : "https://bookworm.flashapps.org";
    loginUrl.searchParams.set("redirect", `${currentUrl}/auth/callback`);
  }

  if (typeof window !== "undefined") {
    window.location.href = loginUrl.toString();
  }

  return loginUrl.toString();
}

/**
 * Redirect to auth service for signup
 */
export function redirectToSignup(redirect?: string) {
  const signupUrl = new URL(`${AUTH_SERVICE_URL}/register`);
  signupUrl.searchParams.set("app", "bookworm");

  if (redirect) {
    const currentUrl = typeof window !== "undefined"
      ? window.location.origin
      : "https://bookworm.flashapps.org";
    signupUrl.searchParams.set("redirect", `${currentUrl}${redirect}`);
  } else {
    const currentUrl = typeof window !== "undefined"
      ? window.location.origin
      : "https://bookworm.flashapps.org";
    signupUrl.searchParams.set("redirect", `${currentUrl}/auth/callback`);
  }

  if (typeof window !== "undefined") {
    window.location.href = signupUrl.toString();
  }

  return signupUrl.toString();
}

/**
 * Verify JWT token with auth service
 */
export async function verifyToken(token: string): Promise<{
  valid: boolean;
  user?: {
    id: string;
    email: string;
    displayName: string;
    verified: boolean;
    platforms: Record<string, unknown>;
  };
}> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Token verification error:", error);
    return { valid: false };
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{
  success: boolean;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    return {
      success: true,
      tokens: data.tokens,
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    return { success: false };
  }
}

/**
 * Store tokens in cookies (server-side) or localStorage (client-side)
 */
export function storeTokens(accessToken: string, refreshToken: string) {
  if (typeof window !== "undefined") {
    // Client-side: use localStorage
    localStorage.setItem("auth_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
  }
  // Server-side storage handled by setting cookies in response
}

/**
 * Get stored tokens
 */
export function getStoredTokens(): {
  accessToken?: string;
  refreshToken?: string;
} {
  if (typeof window !== "undefined") {
    // Client-side: get from localStorage
    return {
      accessToken: localStorage.getItem("auth_token") || undefined,
      refreshToken: localStorage.getItem("refresh_token") || undefined,
    };
  }
  // Server-side: tokens should be in cookies (handled by request)
  return {};
}

/**
 * Clear stored tokens
 */
export function clearTokens() {
  if (typeof window !== "undefined") {
    // Client-side: clear localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  }
  // Server-side: clear cookies (handled by response)
}

/**
 * Auth client for login
 */
export const authClient = {
  async login(email: string, password: string, app: string = "bookworm"): Promise<{
    success: boolean;
    error?: string;
    user?: any;
    tokens?: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  }> {
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, app }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Login failed",
        };
      }

      return {
        success: true,
        user: data.user,
        tokens: data.tokens,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Network error",
      };
    }
  },
};

/**
 * Extract BookWorm-specific permissions from user platforms
 */
export function getBookWormPermissions(user: {
  platforms: Record<string, unknown>;
}): {
  role?: string;
  schoolId?: string;
  delegatedToUserIds?: string[];
  googleBooksApiKey?: string;
  googleSheetUrl?: string;
  isPlaceholder?: boolean;
} {
  const bookworm = user.platforms?.bookworm as any;
  if (!bookworm) {
    return {};
  }

  return {
    role: bookworm.role,
    schoolId: bookworm.schoolId,
    delegatedToUserIds: bookworm.delegatedToUserIds,
    googleBooksApiKey: bookworm.googleBooksApiKey,
    googleSheetUrl: bookworm.googleSheetUrl,
    isPlaceholder: bookworm.isPlaceholder,
  };
}