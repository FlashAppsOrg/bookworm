/**
 * Shared database connections for FlashApps ecosystem
 *
 * Environment Variables Needed in Deno Deploy:
 * - DENO_KV_ACCESS_TOKEN (for remote connections)
 * - FLASHAPPS_USERS_KV_ID (shared users database ID)
 * - BOOKWORM_KV_ID (bookworm-specific database ID)
 */

let usersKv: Deno.Kv | null = null;
let bookwormKv: Deno.Kv | null = null;

/**
 * Get connection to shared users database
 */
export async function getUsersKv(): Promise<Deno.Kv> {
  if (usersKv) return usersKv;

  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID");

  if (isDenoDeploy) {
    // Production: Connect to remote shared users KV
    const kvId = Deno.env.get("FLASHAPPS_USERS_KV_ID");
    if (!kvId) {
      throw new Error("FLASHAPPS_USERS_KV_ID not set");
    }

    const kvUrl = `https://api.deno.com/databases/${kvId}/connect`;
    usersKv = await Deno.openKv(kvUrl);
  } else {
    // Development: Use local KV with namespace
    usersKv = await Deno.openKv("./flashapps_users.db");
  }

  return usersKv;
}

/**
 * Get connection to bookworm-specific database
 */
export async function getBookwormKv(): Promise<Deno.Kv> {
  if (bookwormKv) return bookwormKv;

  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID");

  if (isDenoDeploy) {
    // Production: Connect to bookworm-specific KV
    const kvId = Deno.env.get("BOOKWORM_KV_ID");
    if (!kvId) {
      // Fallback to default KV if not configured
      bookwormKv = await Deno.openKv();
    } else {
      const kvUrl = `https://api.deno.com/databases/${kvId}/connect`;
      bookwormKv = await Deno.openKv(kvUrl);
    }
  } else {
    // Development: Use local KV
    bookwormKv = await Deno.openKv("./bookworm.db");
  }

  return bookwormKv;
}

/**
 * Helper to check if user exists in shared database
 */
export async function findUserByEmail(email: string) {
  const kv = await getUsersKv();
  const result = await kv.get(["users:email", email.toLowerCase()]);
  return result.value;
}

/**
 * Helper to get user's bookworm-specific data
 */
export async function getUserBookwormData(userId: string) {
  const kv = await getBookwormKv();
  const result = await kv.get(["user_platform_data", userId]);
  return result.value;
}

/**
 * Close connections (for cleanup)
 */
export async function closeConnections() {
  if (usersKv) {
    await usersKv.close();
    usersKv = null;
  }
  if (bookwormKv) {
    await bookwormKv.close();
    bookwormKv = null;
  }
}