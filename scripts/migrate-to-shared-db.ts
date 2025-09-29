#!/usr/bin/env deno run --allow-env --allow-net --allow-read --allow-write

/**
 * Migration script to move users to shared FlashApps database
 *
 * Run locally:
 * deno run --allow-all scripts/migrate-to-shared-db.ts --dry-run
 *
 * Run for real:
 * deno run --allow-all scripts/migrate-to-shared-db.ts --execute
 */

import { getKv } from "../utils/db.ts";
import { getUsersKv, getBookwormKv } from "../utils/db-shared.ts";

const isDryRun = Deno.args.includes("--dry-run");
const shouldExecute = Deno.args.includes("--execute");

if (!isDryRun && !shouldExecute) {
  console.error("Please specify --dry-run or --execute");
  Deno.exit(1);
}

console.log(`Starting migration in ${isDryRun ? "DRY RUN" : "EXECUTE"} mode...`);

async function migrate() {
  const oldKv = await getKv();
  const usersKv = await getUsersKv();
  const bookwormKv = await getBookwormKv();

  let userCount = 0;
  let schoolCount = 0;
  let errorCount = 0;

  // Migrate schools first (they stay in bookworm-specific DB)
  console.log("\n=== Migrating Schools ===");
  const schools = oldKv.list({ prefix: ["schools:id"] });
  for await (const entry of schools) {
    try {
      if (!isDryRun) {
        await bookwormKv.set(entry.key, entry.value);
      }
      schoolCount++;
      console.log(`✓ Migrated school: ${entry.value.name}`);
    } catch (error) {
      console.error(`✗ Failed to migrate school ${entry.key}:`, error.message);
      errorCount++;
    }
  }

  // Migrate users to shared database
  console.log("\n=== Migrating Users ===");
  const users = oldKv.list({ prefix: ["users:id"] });
  for await (const entry of users) {
    try {
      const oldUser = entry.value;

      // Transform to shared user format
      const sharedUser = {
        id: oldUser.id,
        email: oldUser.email,
        passwordHash: oldUser.passwordHash,
        displayName: oldUser.displayName,
        username: oldUser.username,
        verified: oldUser.verified,
        createdAt: oldUser.createdAt,
        platforms: {
          bookworm: {
            role: oldUser.role,
            schoolId: oldUser.schoolId,
            delegatedToUserIds: oldUser.delegatedToUserIds || [],
            googleBooksApiKey: oldUser.googleBooksApiKey,
            googleSheetUrl: oldUser.googleSheetUrl,
            isPlaceholder: oldUser.isPlaceholder || false,
          }
        }
      };

      if (!isDryRun) {
        // Save to shared users database
        await usersKv.set(["users:id", oldUser.id], sharedUser);
        await usersKv.set(["users:email", oldUser.email.toLowerCase()], sharedUser);

        // Save platform-specific data reference
        await bookwormKv.set(["user_platform_data", oldUser.id], {
          schoolId: oldUser.schoolId,
          role: oldUser.role,
        });
      }

      userCount++;
      console.log(`✓ Migrated user: ${oldUser.displayName} (${oldUser.email})`);
    } catch (error) {
      console.error(`✗ Failed to migrate user ${entry.key}:`, error.message);
      errorCount++;
    }
  }

  // Migrate other bookworm-specific data (stays in bookworm DB)
  console.log("\n=== Migrating Bookworm-Specific Data ===");
  const collections = [
    "classroomBooks",
    "challenges",
    "parent_students",
    "invitations",
    "verification_tokens",
    "password_reset_tokens",
  ];

  for (const collection of collections) {
    console.log(`Migrating ${collection}...`);
    const items = oldKv.list({ prefix: [collection] });
    let count = 0;
    for await (const entry of items) {
      try {
        if (!isDryRun) {
          await bookwormKv.set(entry.key, entry.value);
        }
        count++;
      } catch (error) {
        console.error(`✗ Failed to migrate ${collection} item:`, error.message);
        errorCount++;
      }
    }
    console.log(`✓ Migrated ${count} ${collection} items`);
  }

  console.log("\n=== Migration Summary ===");
  console.log(`Users migrated: ${userCount}`);
  console.log(`Schools migrated: ${schoolCount}`);
  console.log(`Errors: ${errorCount}`);

  if (isDryRun) {
    console.log("\n⚠️  This was a DRY RUN. No data was actually migrated.");
    console.log("Run with --execute to perform the actual migration.");
  } else {
    console.log("\n✓ Migration completed successfully!");
  }

  // Close connections
  await oldKv.close();
  await usersKv.close();
  await bookwormKv.close();
}

// Run migration
await migrate();