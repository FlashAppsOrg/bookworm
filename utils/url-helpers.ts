/**
 * Get the application URL, with fallback logic:
 * 1. Use CUSTOM_BOOKWORM_DOMAIN environment variable if set
 * 2. Use APP_URL environment variable if set correctly
 * 3. Use origin from request if available
 * 4. Fall back to localhost for development
 *
 * Set CUSTOM_BOOKWORM_DOMAIN to: bookworm.flashapps.org
 * Or set APP_URL to full URL: https://bookworm.flashapps.org
 */
export function getAppUrl(req?: Request): string {
  // Check for CUSTOM_BOOKWORM_DOMAIN env var first (specific to this app)
  const customBookwormDomain = Deno.env.get("CUSTOM_BOOKWORM_DOMAIN");
  if (customBookwormDomain) {
    return `https://${customBookwormDomain}`;
  }

  // Check for APP_URL env var (should be full URL with protocol)
  const appUrl = Deno.env.get("APP_URL");
  if (appUrl) {
    // Fix common mistakes in the URL
    if (appUrl.includes("bookworm.flashapps.deno.net") || appUrl.includes("bookworm.flashapps.deno.dev")) {
      // Replace with the correct custom domain
      return "https://bookworm.flashapps.org";
    }
    if (appUrl.includes(".deno.net")) {
      // Generic fix: .deno.net doesn't exist, use .deno.dev
      return appUrl.replace(".deno.net", ".deno.dev");
    }
    return appUrl;
  }

  // If we have a request, use its origin (for dynamic detection)
  if (req) {
    const url = new URL(req.url);
    // Don't use localhost or .deno.dev origins for production links
    if (!url.host.includes("localhost") && !url.host.includes(".deno.dev")) {
      return `${url.protocol}//${url.host}`;
    }
  }

  // Development fallback
  if (Deno.env.get("DENO_ENV") === "development") {
    return "http://localhost:8000";
  }

  // If nothing is configured, fall back to Deno Deploy URL
  return "https://bookworm-flashapps.deno.dev";
}

/**
 * Get the preferred domain for links (for emails, etc)
 * Uses same logic as getAppUrl but without request context
 */
export function getPreferredDomain(): string {
  // Check for CUSTOM_BOOKWORM_DOMAIN env var first (specific to this app)
  const customBookwormDomain = Deno.env.get("CUSTOM_BOOKWORM_DOMAIN");
  if (customBookwormDomain) {
    return `https://${customBookwormDomain}`;
  }

  // Check for APP_URL env var
  const appUrl = Deno.env.get("APP_URL");
  if (appUrl) {
    // Fix common mistakes in the URL
    if (appUrl.includes("bookworm.flashapps.deno.net") || appUrl.includes("bookworm.flashapps.deno.dev")) {
      // Replace with the correct custom domain
      return "https://bookworm.flashapps.org";
    }
    if (appUrl.includes(".deno.net")) {
      // Generic fix: .deno.net doesn't exist, use .deno.dev
      return appUrl.replace(".deno.net", ".deno.dev");
    }
    return appUrl;
  }

  // Development fallback
  if (Deno.env.get("DENO_ENV") === "development") {
    return "http://localhost:8000";
  }

  // If nothing is configured, fall back to Deno Deploy URL
  return "https://bookworm-flashapps.deno.dev";
}