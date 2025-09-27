import { useState, useEffect } from "preact/hooks";

interface School {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  createdAt: string;
}

export default function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolDomain, setNewSchoolDomain] = useState("");
  const [message, setMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function loadSchools() {
    try {
      const response = await fetch("/api/admin/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error("Failed to load schools:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchools();
  }, []);

  async function addSchool(e: Event) {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    setIsAdding(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSchoolName,
          domain: newSchoolDomain.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSchools([...schools, data]);
        setNewSchoolName("");
        setNewSchoolDomain("");
        setMessage("✓ School created successfully");
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to create school");
    } finally {
      setIsAdding(false);
    }
  }

  async function deleteSchool(schoolId: string, schoolName: string) {
    if (!confirm(`Are you sure you want to delete "${schoolName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/schools?id=${schoolId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSchools(schools.filter((s) => s.id !== schoolId));
        setMessage("✓ School deleted successfully");
      } else {
        const data = await response.json();
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to delete school");
    }
  }

  if (loading) {
    return (
      <div class="text-center py-12">
        <div class="text-2xl">Loading schools...</div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Add New School
        </h2>
        <form onSubmit={addSchool} class="space-y-3">
          <div class="flex gap-3">
            <input
              type="text"
              value={newSchoolName}
              onInput={(e) => setNewSchoolName((e.target as HTMLInputElement).value)}
              placeholder="School name..."
              class="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            />
            <input
              type="text"
              value={newSchoolDomain}
              onInput={(e) => setNewSchoolDomain((e.target as HTMLInputElement).value)}
              placeholder="Email domain (e.g., wcpss.net)..."
              class="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={isAdding || !newSchoolName.trim()}
              class="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isAdding ? "Adding..." : "Add School"}
            </button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Optional: Set email domain to auto-assign teachers during signup (e.g., "wcpss.net")
          </p>
        </form>
        {message && (
          <p class={`mt-2 text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            All Schools ({schools.length})
          </h2>
        </div>
        {schools.length === 0 ? (
          <div class="p-12 text-center text-gray-500 dark:text-gray-400">
            No schools yet. Add one above to get started.
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Name
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Slug
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Domain
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Created
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                {schools.map((school) => (
                  <tr key={school.id} class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {school.name}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {school.slug}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {school.domain || "-"}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(school.createdAt).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() => deleteSchool(school.id, school.name)}
                        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}