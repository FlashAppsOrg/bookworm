import { getKv } from "../utils/db.ts";

const email = "dfkelso@gmail.com";

const kv = await getKv();

// Check by email key
const emailResult = await kv.get(["users:email", email.toLowerCase()]);
console.log("User by email key:", emailResult.value ? "FOUND" : "NOT FOUND");

// List all users by ID to find the user
const userEntries = kv.list({ prefix: ["users:id"] });
let foundUser = null;

for await (const entry of userEntries) {
  const user = entry.value as any;
  if (user.email?.toLowerCase() === email.toLowerCase()) {
    foundUser = user;
    console.log("User found in users:id list:", user);
    break;
  }
}

if (foundUser && !emailResult.value) {
  console.log("\n⚠️  User exists but email index is missing!");
  console.log("This is why login is failing - the email lookup returns null.");

  console.log("\nFix: Adding email index...");
  await kv.set(["users:email", email.toLowerCase()], foundUser);
  console.log("✅ Email index added. Login should work now.");
}

kv.close();