import { useState, useEffect } from "preact/hooks";

interface Placeholder {
  id: string;
  name: string;
  username: string;
  bookCount: number;
}

export default function ClaimClassroom() {
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPlaceholders() {
    try {
      const response = await fetch("/api/classroom/claim");
      if (response.ok) {
        const data = await response.json();
        setPlaceholders(data.placeholders || []);
      }
    } catch (error) {
      console.error("Failed to load placeholders:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaceholders();
  }, []);

  async function claimClassroom(placeholderId: string, name: string) {
    if (!confirm(`Claim ${name}'s classroom? All their books will be moved to your account.`)) {
      return;
    }

    setClaiming(true);
    setMessage("");

    try {
      const response = await fetch("/api/classroom/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        await loadPlaceholders();
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to claim classroom");
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div class="text-center py-12">
        <div class="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (placeholders.length === 0) {
    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
        <div class="text-4xl mb-4">✅</div>
        <p class="text-gray-600 dark:text-gray-400">
          No placeholder classrooms available to claim in your school
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Claim Your Imported Classroom
        </h3>
        <p class="text-sm text-blue-800 dark:text-blue-400">
          If your classroom was imported by an administrator, you can claim it here.
          All books will be moved to your account and you'll have full control over them.
        </p>
      </div>

      {message && (
        <div class={`rounded-lg p-4 ${message.startsWith("✓") ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"}`}>
          {message}
        </div>
      )}

      <div class="grid md:grid-cols-2 gap-4">
        {placeholders.map((placeholder) => (
          <div
            key={placeholder.id}
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {placeholder.name}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  @{placeholder.username}
                </p>
              </div>
              <span class="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded">
                Placeholder
              </span>
            </div>

            <div class="mb-4">
              <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span class="font-semibold">{placeholder.bookCount}</span>
                <span class="text-sm">book{placeholder.bookCount !== 1 ? "s" : ""}</span>
              </div>
            </div>

            <button
              onClick={() => claimClassroom(placeholder.id, placeholder.name)}
              disabled={claiming}
              class="w-full py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {claiming ? "Claiming..." : "Claim This Classroom"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}