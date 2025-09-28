import { getKv } from "./db.ts";

export interface QuotaStats {
  date: string;
  callsUsed: number;
  limit: number;
  remaining: number;
}

const DAILY_QUOTA_LIMIT = 1000;

export function getTodayKey(): string {
  const today = new Date().toISOString().split('T')[0];
  return today;
}

export async function incrementQuotaCounter(): Promise<void> {
  const kv = await getKv();
  const today = getTodayKey();
  const key = ["quota", "google-books", today];

  await kv.atomic()
    .sum(key, 1n)
    .commit();
}

export async function getQuotaStats(): Promise<QuotaStats> {
  const kv = await getKv();
  const today = getTodayKey();
  const key = ["quota", "google-books", today];

  const result = await kv.get<Deno.KvU64>(key);
  const callsUsed = result.value ? Number(result.value.value) : 0;

  return {
    date: today,
    callsUsed,
    limit: DAILY_QUOTA_LIMIT,
    remaining: Math.max(0, DAILY_QUOTA_LIMIT - callsUsed),
  };
}

export async function getCacheStats(): Promise<{
  total: number;
  validated: number;
  unvalidated: number;
}> {
  const kv = await getKv();
  let total = 0;
  let validated = 0;
  let unvalidated = 0;

  const entries = kv.list<any>({ prefix: ["books:isbn"] });

  for await (const entry of entries) {
    total++;
    if (entry.value?.validated) {
      validated++;
    } else {
      unvalidated++;
    }
  }

  return { total, validated, unvalidated };
}

export async function getUnvalidatedBooks(limit: number = 100): Promise<Array<{
  isbn: string;
  data: any;
}>> {
  const kv = await getKv();
  const unvalidated: Array<{ isbn: string; data: any }> = [];

  const entries = kv.list<any>({ prefix: ["books:isbn"] });

  for await (const entry of entries) {
    if (!entry.value?.validated && unvalidated.length < limit) {
      const isbn = entry.key[1] as string; // Key structure is ["books:isbn", isbn]
      unvalidated.push({
        isbn,
        data: entry.value?.data,
      });
    }

    if (unvalidated.length >= limit) {
      break;
    }
  }

  return unvalidated;
}