#!/usr/bin/env -S deno run -A --unstable-kv

/**
 * Export BookWorm users for migration to Auth Service
 * This script exports users and sends them to the auth service migration endpoint
 */

import { getKv } from "../utils/db.ts";
import { User as BookwormUser } from "../utils/db.ts";

const AUTH_SERVICE_URL = Deno.env.get("AUTH_SERVICE_URL") || "https://auth.flashapps.org";
const MIGRATION_TOKEN = Deno.env.get("MIGRATION_TOKEN"); // You'll need to set this

async function exportAndMigrateUsers() {
  if (!MIGRATION_TOKEN) {
    console.error("❌ MIGRATION_TOKEN environment variable is required");
    console.log("Set it to match the token configured in the auth service");
    Deno.exit(1);
  }

  console.log("Starting BookWorm user export and migration...");

  try {
    // Connect to BookWorm database
    const kv = await getKv();

    // Get all BookWorm users
    const userEntries = kv.list<BookwormUser>({ prefix: ["users:id"] });
    const users = [];

    console.log("Collecting users from BookWorm database...");

    for await (const entry of userEntries) {
      const user = entry.value;
      users.push(user);
      console.log(`  - ${user.email} (${user.role || 'parent'})`);
    }

    console.log(`\nFound ${users.length} users to migrate`);

    if (users.length === 0) {
      console.log("No users to migrate");
      kv.close();
      return;
    }

    // Send users to auth service migration endpoint
    console.log(`\nSending users to ${AUTH_SERVICE_URL}/api/migrate/bookworm-users...`);

    const response = await fetch(`${AUTH_SERVICE_URL}/api/migrate/bookworm-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Migration-Token": MIGRATION_TOKEN,
      },
      body: JSON.stringify({ users }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Migration failed: ${response.status} - ${error}`);
    }

    const result = await response.json();

    console.log("\n=== Migration Complete ===");
    console.log(`✓ Migrated: ${result.migrated} users`);
    console.log(`⊙ Updated: ${result.skipped} existing users`);
    console.log(`✗ Failed: ${result.failed} users`);

    if (result.errors && result.errors.length > 0) {
      console.log("\nErrors:");
      result.errors.forEach((error: string) => console.log(`  - ${error}`));
    }

    // Close connection
    kv.close();

  } catch (error) {
    console.error("Migration failed:", error);
    Deno.exit(1);
  }
}

// Run migration
if (import.meta.main) {
  console.log("=== BookWorm to Auth Service User Migration ===\n");
  console.log("This will export all BookWorm users and migrate them to the");
  console.log("centralized FlashApps Auth Service.\n");
  console.log("Make sure you have set the MIGRATION_TOKEN environment variable");
  console.log("to match the token configured in the auth service.\n");

  const proceed = confirm("Do you want to proceed with the migration?");

  if (proceed) {
    await exportAndMigrateUsers();
  } else {
    console.log("Migration cancelled");
  }
}