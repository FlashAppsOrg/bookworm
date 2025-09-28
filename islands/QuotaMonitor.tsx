import { useEffect, useState } from "preact/hooks";

interface QuotaStats {
  date: string;
  callsUsed: number;
  limit: number;
  remaining: number;
}

interface CacheStats {
  total: number;
  validated: number;
  unvalidated: number;
}

interface UnvalidatedBook {
  isbn: string;
  data: any;
}

interface Stats {
  quota: QuotaStats;
  cache: CacheStats;
  unvalidatedBooks?: UnvalidatedBook[];
}

export default function QuotaMonitor() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [showUnvalidated, setShowUnvalidated] = useState(false);

  const fetchStats = async (includeBooks = false) => {
    try {
      setLoading(true);
      const url = includeBooks ? "/api/admin/quota-stats?includeBooks=true" : "/api/admin/quota-stats";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch quota stats");
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const triggerValidation = async () => {
    try {
      setValidating(true);
      setValidationMessage(null);
      const response = await fetch("/api/admin/validate-cache", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Validation failed");
      }

      if (data.validated === 0 && data.failed > 0) {
        setValidationMessage(`⚠️ Validation failed for all ${data.failed} books. Check server logs for details.`);
      } else {
        setValidationMessage(`✓ Validated ${data.validated} books${data.failed > 0 ? `, ${data.failed} failed` : ''}`);
      }
      fetchStats(showUnvalidated); // Refresh stats after validation
    } catch (err) {
      setValidationMessage(`❌ ${err instanceof Error ? err.message : "Validation error"}`);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    fetchStats(showUnvalidated);
  }, [showUnvalidated]);

  useEffect(() => {
    const interval = setInterval(() => fetchStats(showUnvalidated), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [showUnvalidated]);

  if (loading && !stats) {
    return (
      <div class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const quotaPercentage = (stats.quota.callsUsed / stats.quota.limit) * 100;
  const cacheValidatedPercentage = stats.cache.total > 0
    ? (stats.cache.validated / stats.cache.total) * 100
    : 0;

  return (
    <div class="space-y-6">
      {/* Quota Usage Card */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            Daily API Quota
          </h2>
          <button
            onClick={fetchStats}
            class="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Refresh
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-600 dark:text-gray-400">
                {stats.quota.callsUsed.toLocaleString()} / {stats.quota.limit.toLocaleString()} calls used
              </span>
              <span class="font-semibold text-gray-900 dark:text-white">
                {quotaPercentage.toFixed(1)}%
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                class={`h-4 rounded-full transition-all ${
                  quotaPercentage < 50
                    ? "bg-green-500"
                    : quotaPercentage < 80
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">
                {stats.quota.callsUsed.toLocaleString()}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Used Today</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.quota.remaining.toLocaleString()}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.quota.limit.toLocaleString()}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Daily Limit</div>
            </div>
          </div>

          <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
            Date: {stats.quota.date}
          </div>
        </div>
      </div>

      {/* Cache Stats Card */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Book Cache Statistics
        </h2>

        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-600 dark:text-gray-400">
                {stats.cache.validated.toLocaleString()} / {stats.cache.total.toLocaleString()} books validated
              </span>
              <span class="font-semibold text-gray-900 dark:text-white">
                {cacheValidatedPercentage.toFixed(1)}%
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                class="h-4 rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(cacheValidatedPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.cache.total.toLocaleString()}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Total Cached</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.cache.validated.toLocaleString()}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Validated</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.cache.unvalidated.toLocaleString()}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Control */}
      {stats.cache.unvalidated > 0 && (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Unvalidated Books Queue
          </h2>

          {validationMessage && (
            <div class={`mb-4 p-3 rounded ${
              validationMessage.includes("error") || validationMessage.includes("failed")
                ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            }`}>
              {validationMessage}
            </div>
          )}

          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {stats.cache.unvalidated} unvalidated book{stats.cache.unvalidated === 1 ? '' : 's'} from bulk imports pending validation.
          </p>

          <div class="flex gap-4 mb-4">
            <button
              onClick={triggerValidation}
              disabled={validating || stats.quota.remaining < 10}
              class={`px-6 py-2 rounded font-semibold transition-colors ${
                validating || stats.quota.remaining < 10
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark text-white"
              }`}
            >
              {validating ? "Validating..." : "Validate Now"}
            </button>

            <button
              onClick={() => setShowUnvalidated(!showUnvalidated)}
              class="px-6 py-2 rounded font-semibold bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {showUnvalidated ? "Hide Queue" : "Show Queue"}
            </button>
          </div>

          {stats.quota.remaining < 10 && (
            <p class="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ Insufficient quota remaining (need at least 10 calls)
            </p>
          )}

          {/* Unvalidated Books Grid */}
          {showUnvalidated && stats.unvalidatedBooks && (
            <div class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Validation Queue ({stats.unvalidatedBooks.length} books shown)
              </h3>

              {stats.unvalidatedBooks.length === 0 ? (
                <p class="text-gray-600 dark:text-gray-400 text-center py-4">
                  No unvalidated books found
                </p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">ISBN</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Title</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Authors</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Publisher</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {stats.unvalidatedBooks.map((book) => (
                        <tr key={book.isbn} class="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td class="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">
                            {book.isbn}
                          </td>
                          <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {book.data?.title || "Unknown"}
                          </td>
                          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {book.data?.authors?.join(", ") || "Unknown"}
                          </td>
                          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {book.data?.publisher || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          How it works
        </h3>
        <ul class="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• API calls are tracked daily and reset at midnight UTC</li>
          <li>• Cached books avoid API calls on subsequent scans</li>
          <li>• Unvalidated books can be validated with leftover quota</li>
          <li>• Click "Validate Now" to use remaining quota on pending books</li>
        </ul>
      </div>
    </div>
  );
}