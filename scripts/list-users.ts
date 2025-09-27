#!/usr/bin/env -S deno run --allow-env --allow-read --unstable-kv

import { getKv, User } from "../utils/db.ts";

const kv = await getKv();

console.log("\nAll Users:\n");
console.log("Email                          | Name                | Role          | Verified | School ID");
console.log("-".repeat(100));

const users: User[] = [];
const iter = kv.list<User>({ prefix: ["users", "id"] });
for await (const entry of iter) {
  users.push(entry.value);
}

users.sort((a, b) => a.email.localeCompare(b.email));

for (const user of users) {
  const email = user.email.padEnd(30);
  const name = user.displayName.padEnd(20).substring(0, 20);
  const role = user.role.padEnd(14);
  const verified = (user.verified ? "✓" : "✗").padEnd(9);
  const schoolId = (user.schoolId || "-").substring(0, 20);
  console.log(`${email} | ${name} | ${role} | ${verified} | ${schoolId}`);
}

console.log("\n" + "-".repeat(100));
console.log(`Total: ${users.length} users\n`);