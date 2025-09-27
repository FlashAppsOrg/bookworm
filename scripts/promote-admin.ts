#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --unstable-kv

import { getKv, User } from "../utils/db.ts";

const email = Deno.args[0];

if (!email) {
  console.error("Usage: deno run --allow-env --allow-read --allow-write scripts/promote-admin.ts <email>");
  Deno.exit(1);
}

const kv = await getKv();

const userResult = await kv.get<User>(["users:email", email.toLowerCase()]);

if (!userResult.value) {
  console.error(`User with email ${email} not found`);
  Deno.exit(1);
}

const user = userResult.value;

if (user.role === "super_admin") {
  console.log(`User ${user.displayName} (${user.email}) is already a super admin`);
  Deno.exit(0);
}

const updatedUser: User = {
  ...user,
  role: "super_admin",
};

await kv.set(["users:id", user.id], updatedUser);
await kv.set(["users:email", user.email], updatedUser);
if (user.username && user.schoolId) {
  await kv.set(["users:username", user.schoolId, user.username], user.id);
}

console.log(`✓ Promoted ${user.displayName} (${user.email}) to super admin`);
console.log(`Role: ${user.role} → super_admin`);