import { useState, useEffect } from "preact/hooks";

interface UsageData {
  today: {
    reads: number;
    writes: number;
  };
  monthly: {
    reads: number;
    writes: number;
  };
  limits: {
    freeReads: number;
    freeWrites: number;
    proReads: number;
    proWrites: number;
  };
  users: {
    total: number;
    teachers: number;
    delegates: number;
  };
  books: {
    uniqueTitles: number;
    totalCopies: number;
  };
}

export default function UsageStats() {
  const [stats, setStats] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/usage");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError("Failed to load usage stats");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h3 class="text-2xl font-semibold mb-4 dark:text-white">System Usage</h3>
        <p class="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h3 class="text-2xl font-semibold mb-4 dark:text-white">System Usage</h3>
        <p class="text-red-600">{error || "No data available"}</p>
      </div>
    );
  }

  const readsPercent = (stats.monthly.reads / stats.limits.freeReads) * 100;
  const writesPercent = (stats.monthly.writes / stats.limits.freeWrites) * 100;

  const getStatusColor = (percent: number) => {
    if (percent < 50) return "text-green-600 dark:text-green-400";
    if (percent < 80) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBarColor = (percent: number) => {
    if (percent < 50) return "bg-green-600";
    if (percent < 80) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
      <h3 class="text-2xl font-semibold mb-4 dark:text-white">System Usage</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Monitor Deno KV database usage and system stats
      </p>

      <div class="grid gap-6 md:grid-cols-2">
        <div>
          <h4 class="text-lg font-semibold dark:text-white mb-3">Database Operations</h4>

          <div class="space-y-4">
            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Reads</span>
                <span class={`text-sm font-bold ${getStatusColor(readsPercent)}`}>
                  {stats.monthly.reads.toLocaleString()} / {stats.limits.freeReads.toLocaleString()}
                </span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class={`h-2 rounded-full transition-all ${getBarColor(readsPercent)}`}
                  style={{ width: `${Math.min(readsPercent, 100)}%` }}
                />
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {readsPercent.toFixed(1)}% of free tier limit
              </p>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Writes</span>
                <span class={`text-sm font-bold ${getStatusColor(writesPercent)}`}>
                  {stats.monthly.writes.toLocaleString()} / {stats.limits.freeWrites.toLocaleString()}
                </span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class={`h-2 rounded-full transition-all ${getBarColor(writesPercent)}`}
                  style={{ width: `${Math.min(writesPercent, 100)}%` }}
                />
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {writesPercent.toFixed(1)}% of free tier limit
              </p>
            </div>

            <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Today's Reads:</span>
                <span class="font-medium dark:text-white">{stats.today.reads.toLocaleString()}</span>
              </div>
              <div class="flex justify-between text-sm mt-1">
                <span class="text-gray-600 dark:text-gray-400">Today's Writes:</span>
                <span class="font-medium dark:text-white">{stats.today.writes.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-lg font-semibold dark:text-white mb-3">Platform Stats</h4>

          <div class="space-y-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-blue-900 dark:text-blue-100">Total Users</span>
                <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.users.total}</span>
              </div>
              <div class="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                <span>Teachers: {stats.users.teachers}</span>
                <span>Helpers: {stats.users.delegates}</span>
              </div>
            </div>

            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-green-900 dark:text-green-100">Books Cataloged</span>
                <span class="text-2xl font-bold text-green-600 dark:text-green-400">{stats.books.totalCopies.toLocaleString()}</span>
              </div>
              <div class="text-xs text-green-700 dark:text-green-300">
                {stats.books.uniqueTitles.toLocaleString()} unique titles
              </div>
            </div>

            {(readsPercent > 80 || writesPercent > 80) && (
              <div class="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                <p class="text-sm text-red-900 dark:text-red-100 font-semibold mb-1">
                  ⚠️ Approaching Limits
                </p>
                <p class="text-xs text-red-700 dark:text-red-300">
                  Consider upgrading to Pro tier ($20/month) for 3x capacity
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={fetchStats}
          class="text-sm text-primary hover:text-primary-dark dark:text-primary-light font-medium"
        >
          🔄 Refresh Stats
        </button>
      </div>
    </div>
  );
}