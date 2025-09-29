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
    // Production: Connect to named database "users-db"
    try {
      usersKv = await Deno.openKv("users-db");
    } catch (error) {
      console.error("Failed to connect to users-db, falling back to default:", error);
      usersKv = await Deno.openKv();
    }
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
    // Production: Connect to named database "bookworm-db"
    try {
      bookwormKv = await Deno.openKv("bookworm-db");
    } catch (error) {
      console.error("Failed to connect to bookworm-db, falling back to default:", error);
      bookwormKv = await Deno.openKv();
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