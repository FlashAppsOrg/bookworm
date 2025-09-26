import { useState, useEffect } from "preact/hooks";

interface School {
  id: string;
  name: string;
  slug: string;
}

export default function SetupForm() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [newSchoolName, setNewSchoolName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools");
      const data = await response.json();
      if (response.ok) {
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error("Failed to load schools:", err);
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    if (!selectedSchoolId && !newSchoolName.trim()) {
      setError("Please select a school or create a new one");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/complete-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: selectedSchoolId || null,
          newSchoolName: newSchoolName || null,
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Setup failed");
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error && (
        <div class="bg-error/10 border-2 border-error text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Your School
        </label>
        {loadingSchools ? (
          <div class="text-sm text-gray-500 dark:text-gray-400">Loading schools...</div>
        ) : (
          <select
            value={selectedSchoolId}
            onChange={(e) => {
              setSelectedSchoolId((e.target as HTMLSelectElement).value);
              if ((e.target as HTMLSelectElement).value) {
                setNewSchoolName("");
              }
            }}
            class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
          >
            <option value="">-- Select a school --</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div class="text-center text-sm text-gray-500 dark:text-gray-400">
        OR
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Create New School
        </label>
        <input
          type="text"
          value={newSchoolName}
          onInput={(e) => {
            setNewSchoolName((e.target as HTMLInputElement).value);
            if ((e.target as HTMLInputElement).value) {
              setSelectedSchoolId("");
            }
          }}
          placeholder="Underwood Elementary"
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Username
        </label>
        <input
          type="text"
          value={username}
          onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
          placeholder="cburke"
          required
          pattern="[a-z0-9-]+"
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Lowercase letters, numbers, and hyphens only. This will be part of your public URL.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full py-3 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Setting up..." : "Complete Setup"}
      </button>
    </form>
  );
}