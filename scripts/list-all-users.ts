import { getKv } from "../utils/db.ts";

const kv = await getKv();

console.log("=== All Users in BookWorm Database ===\n");

// List all users by ID
const userEntries = kv.list({ prefix: ["users:id"] });
let count = 0;

for await (const entry of userEntries) {
  const user = entry.value as any;
  count++;
  console.log(`User ${count}:`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Display Name: ${user.displayName}`);
  console.log(`  Role: ${user.role}`);
  console.log("");
}

console.log(`Total users found: ${count}`);

// Check email indexes
console.log("\n=== Email Indexes ===\n");
const emailEntries = kv.list({ prefix: ["users:email"] });
let emailCount = 0;

for await (const entry of emailEntries) {
  emailCount++;
  console.log(`Email index ${emailCount}: ${entry.key[1]}`);
}

console.log(`\nTotal email indexes: ${emailCount}`);

if (count !== emailCount) {
  console.log(`\n⚠️  MISMATCH: ${count} users but only ${emailCount} email indexes!`);
  console.log("This is why login is failing - email lookups won't work.");
}

kv.close();