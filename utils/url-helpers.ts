/**
 * Get the application URL, with fallback logic:
 * 1. Use CUSTOM_BOOKWORM_DOMAIN environment variable if set
 * 2. Use origin from request if available (and not localhost/deno.dev)
 * 3. Fall back to localhost for development
 * 4. Fall back to hardcoded production domain
 *
 * Set CUSTOM_BOOKWORM_DOMAIN to: bookworm.flashapps.org
 */
export function getAppUrl(req?: Request): string {
  // Check for CUSTOM_BOOKWORM_DOMAIN env var (specific to this app)
  const customBookwormDomain = Deno.env.get("CUSTOM_BOOKWORM_DOMAIN");
  if (customBookwormDomain) {
    return `https://${customBookwormDomain}`;
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

  // If nothing is configured, fall back to production domain
  // (We know this is BookWorm since this file is in the BookWorm app)
  return "https://bookworm.flashapps.org";
}

/**
 * Get the preferred domain for links (for emails, etc)
 * Uses same logic as getAppUrl but without request context
 */
export function getPreferredDomain(): string {
  // Check for CUSTOM_BOOKWORM_DOMAIN env var (specific to this app)
  const customBookwormDomain = Deno.env.get("CUSTOM_BOOKWORM_DOMAIN");
  if (customBookwormDomain) {
    return `https://${customBookwormDomain}`;
  }

  // Development fallback
  if (Deno.env.get("DENO_ENV") === "development") {
    return "http://localhost:8000";
  }

  // If nothing is configured, fall back to production domain
  return "https://bookworm.flashapps.org";
}