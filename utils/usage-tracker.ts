import { getKv } from "./db.ts";

export async function trackUsage(type: 'read' | 'write', count: number = 1) {
  try {
    const kv = await getKv();
    const today = new Date().toISOString().split('T')[0];
    const key = ['usage', today, type];

    const current = await kv.get<number>(key);
    const newCount = (current.value || 0) + count;

    await kv.set(key, newCount, { expireIn: 30 * 24 * 60 * 60 * 1000 });

    return newCount;
  } catch (err) {
    console.error('Failed to track usage:', err);
  }
}

export async function getUsageStats() {
  const kv = await getKv();
  const today = new Date().toISOString().split('T')[0];

  const todayReads = await kv.get<number>(['usage', today, 'read']);
  const todayWrites = await kv.get<number>(['usage', today, 'write']);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let monthlyReads = 0;
  let monthlyWrites = 0;

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const reads = await kv.get<number>(['usage', dateStr, 'read']);
    const writes = await kv.get<number>(['usage', dateStr, 'write']);

    monthlyReads += reads.value || 0;
    monthlyWrites += writes.value || 0;
  }

  const allUsers = await kv.list({ prefix: ['users:id'] });
  let totalUsers = 0;
  let totalTeachers = 0;
  let totalDelegates = 0;

  for await (const entry of allUsers) {
    totalUsers++;
    if ((entry.value as any).role === 'teacher') totalTeachers++;
    if ((entry.value as any).role === 'delegate') totalDelegates++;
  }

  const allBooks = await kv.list({ prefix: ['classroomBooks'] });
  let totalBooks = 0;
  let totalBookQuantity = 0;

  for await (const entry of allBooks) {
    totalBooks++;
    totalBookQuantity += (entry.value as any).quantity || 1;
  }

  return {
    today: {
      reads: todayReads.value || 0,
      writes: todayWrites.value || 0,
    },
    monthly: {
      reads: monthlyReads,
      writes: monthlyWrites,
    },
    limits: {
      freeReads: 450000,
      freeWrites: 300000,
      proReads: 1300000,
      proWrites: 900000,
    },
    users: {
      total: totalUsers,
      teachers: totalTeachers,
      delegates: totalDelegates,
    },
    books: {
      uniqueTitles: totalBooks,
      totalCopies: totalBookQuantity,
    }
  };
}