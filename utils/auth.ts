// Email whitelist for testing/admin accounts
const EMAIL_WHITELIST = [
  "dfkelso@gmail.com",
];

// Allowed email domain for teachers
const ALLOWED_DOMAIN = "wcpss.net";

export function isEmailAllowed(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();

  // Check whitelist first
  if (EMAIL_WHITELIST.includes(normalizedEmail)) {
    return true;
  }

  // Check if email ends with @wcpss.net
  return normalizedEmail.endsWith(`@${ALLOWED_DOMAIN}`);
}

export function validateEmail(email: string, requireDomain = true): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  // Skip domain check for delegates (when requireDomain is false)
  if (requireDomain && !isEmailAllowed(email)) {
    return `Email must be from @${ALLOWED_DOMAIN} domain`;
  }

  return null;
}