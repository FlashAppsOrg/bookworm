#!/usr/bin/env -S deno run -A --unstable-kv

/**
 * Migration script to move BookWorm users to FlashApps Auth Service
 * Run this once to migrate existing users
 */

import { getKv } from "../utils/db.ts";
import { User as BookwormUser } from "../utils/db.ts";

// Auth service database connection
const AUTH_SERVICE_URL = "https://auth.flashapps.org";
const AUTH_DB_ID = Deno.env.get("AUTH_DATABASE_ID"); // If using remote KV

interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  username: string;
  verified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
  authProvider: "email" | "google";
  googleId?: string;
  platforms: {
    bookworm?: {
      role: string;
      schoolId: string | null;
      delegatedToUserIds: string[];
      googleBooksApiKey: string | null;
      googleSheetUrl: string | null;
      isPlaceholder: boolean;
    };
    [key: string]: unknown;
  };
  children: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

async function migrateUsers() {
  console.log("Starting BookWorm user migration to Auth Service...");

  try {
    // Connect to BookWorm database
    const bookwormKv = await getKv();

    // Connect to Auth Service database
    let authKv: Deno.Kv;
    if (AUTH_DB_ID) {
      // Remote KV database
      authKv = await Deno.openKv(`https://api.deno.com/databases/${AUTH_DB_ID}/connect`);
    } else {
      // Local KV database for auth service
      authKv = await Deno.openKv("./auth.db");
    }

    // Get all BookWorm users
    const userEntries = bookwormKv.list<BookwormUser>({ prefix: ["users:id"] });

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for await (const entry of userEntries) {
      const bookwormUser = entry.value;
      const userId = entry.key[1] as string;

      try {
        // Check if user already exists in auth service
        const existingAuthUser = await authKv.get(["users", bookwormUser.id]);
        if (existingAuthUser.value) {
          console.log(`User ${bookwormUser.email} already exists in auth service, skipping...`);
          skipped++;
          continue;
        }

        // Create auth user from BookWorm user
        const authUser: AuthUser = {
          id: bookwormUser.id,
          email: bookwormUser.email.toLowerCase(),
          passwordHash: bookwormUser.passwordHash || "",
          displayName: bookwormUser.displayName || bookwormUser.name || "",
          username: bookwormUser.username || "",
          verified: bookwormUser.verified || false,
          verificationToken: bookwormUser.verificationToken,
          resetToken: bookwormUser.resetToken,
          resetTokenExpiry: bookwormUser.resetTokenExpiry,
          authProvider: bookwormUser.googleId ? "google" : "email",
          googleId: bookwormUser.googleId,
          platforms: {
            bookworm: {
              role: bookwormUser.role || "parent",
              schoolId: bookwormUser.schoolId || null,
              delegatedToUserIds: bookwormUser.delegatedToUserIds || [],
              googleBooksApiKey: bookwormUser.googleBooksApiKey || null,
              googleSheetUrl: bookwormUser.googleSheetUrl || null,
              isPlaceholder: bookwormUser.isPlaceholder || false,
            }
          },
          children: [], // BookWorm doesn't track this yet
          createdAt: bookwormUser.createdAt || new Date().toISOString(),
          updatedAt: bookwormUser.updatedAt || new Date().toISOString(),
          lastLogin: bookwormUser.lastLogin,
        };

        // Save user to auth service database
        const result = await authKv.atomic()
          .set(["users", authUser.id], authUser)
          .set(["users_by_email", authUser.email], authUser)
          .commit();

        if (authUser.googleId) {
          await authKv.set(["users_by_google", authUser.googleId], authUser);
        }

        if (result.ok) {
          console.log(`✓ Migrated user: ${authUser.email}`);
          migrated++;
        } else {
          console.error(`✗ Failed to migrate user: ${authUser.email}`);
          failed++;
        }

      } catch (error) {
        console.error(`✗ Error migrating user ${bookwormUser.email}:`, error);
        failed++;
      }
    }

    console.log("\n=== Migration Complete ===");
    console.log(`Migrated: ${migrated} users`);
    console.log(`Skipped: ${skipped} users (already existed)`);
    console.log(`Failed: ${failed} users`);

    // Close connections
    bookwormKv.close();
    authKv.close();

  } catch (error) {
    console.error("Migration failed:", error);
    Deno.exit(1);
  }
}

// Run migration
if (import.meta.main) {
  await migrateUsers();
}