/**
 * Get the application URL, with fallback logic:
 * 1. Use custom domain (bookworm.flashapps.org)
 * 2. Use origin from request if available
 * 3. Fall back to localhost for development
 */
export function getAppUrl(req?: Request): string {
  // Use the custom domain in production
  const customDomain = Deno.env.get("CUSTOM_DOMAIN") || "bookworm.flashapps.org";

  // Check for override via APP_URL env var
  const customUrl = Deno.env.get("APP_URL");
  if (customUrl && !customUrl.includes(".deno.net") && !customUrl.includes(".deno.dev")) {
    return customUrl;
  }

  // Development fallback
  if (Deno.env.get("DENO_ENV") === "development") {
    return "http://localhost:8000";
  }

  // Production - always use the custom domain
  return `https://${customDomain}`;
}

/**
 * Get the preferred domain for links (always use custom domain)
 */
export function getPreferredDomain(): string {
  // Use the custom domain in production
  const customDomain = Deno.env.get("CUSTOM_DOMAIN") || "bookworm.flashapps.org";

  // Check for override via APP_URL env var
  const appUrl = Deno.env.get("APP_URL");
  if (appUrl && !appUrl.includes(".deno.net") && !appUrl.includes(".deno.dev")) {
    return appUrl;
  }

  // Development fallback
  if (Deno.env.get("DENO_ENV") === "development") {
    return "http://localhost:8000";
  }

  // Production - always use the custom domain
  return `https://${customDomain}`;
}