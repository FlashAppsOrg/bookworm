import { useState, useEffect } from "preact/hooks";
import { User, School } from "../utils/db.ts";

interface Props {
  user: User;
  currentSchool: School | null;
  schools: School[];
  serviceAccountEmail: string;
  publicUrl: string;
}

const themes = {
  teal: {
    name: "Ocean Teal",
    primary: "#0D9488",
    secondary: "#FF7F7F",
  },
  indigo: {
    name: "Deep Indigo",
    primary: "#4F46E5",
    secondary: "#10B981",
  },
  green: {
    name: "Forest Green",
    primary: "#059669",
    secondary: "#3B82F6",
  },
};

export default function SettingsPanel({ user, currentSchool, schools, serviceAccountEmail, publicUrl }: Props) {
  const [theme, setTheme] = useState<string>("teal");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sheetUrl, setSheetUrl] = useState<string>(user.googleSheetUrl || "");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(user.schoolId || "");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [schoolSaving, setSchoolSaving] = useState<boolean>(false);
  const [schoolMessage, setSchoolMessage] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("bookworm-theme") || "teal";
    const savedDarkMode = localStorage.getItem("bookworm-dark-mode") === "true";

    setTheme(savedTheme);
    setDarkMode(savedDarkMode);

    applyTheme(savedTheme);
    applyDarkMode(savedDarkMode);
  }, []);

  function applyTheme(newTheme: string) {
    document.body.className = document.body.className.replace(/theme-\w+/g, "");
    document.body.classList.add(`theme-${newTheme}`);
    localStorage.setItem("bookworm-theme", newTheme);
  }

  function applyDarkMode(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("bookworm-dark-mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("bookworm-dark-mode", "false");
    }
  }

  function changeTheme(newTheme: string) {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  function toggleDarkMode() {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    applyDarkMode(newDarkMode);
  }

  async function saveSheetUrl() {
    setSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/settings/update-sheet-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleSheetUrl: sheetUrl }),
      });

      if (response.ok) {
        setSaveMessage("✓ Saved successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("✗ Failed to save");
      }
    } catch (err) {
      setSaveMessage("✗ Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch("/api/classroom/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${user.username}-books.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to export:", err);
    } finally {
      setExporting(false);
    }
  }

  async function updateSchool() {
    if (selectedSchoolId === user.schoolId) return;

    setSchoolSaving(true);
    setSchoolMessage("");

    try {
      const response = await fetch("/api/settings/update-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: selectedSchoolId }),
      });

      if (response.ok) {
        setSchoolMessage("✓ School updated! Refreshing...");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSchoolMessage("✗ Failed to update");
      }
    } catch (err) {
      setSchoolMessage("✗ Network error");
    } finally {
      setSchoolSaving(false);
    }
  }

  function copyPublicUrl() {
    navigator.clipboard.writeText(publicUrl);
    alert("Public classroom URL copied to clipboard!");
  }

  return (
    <div class="space-y-6">
      {user.role === "teacher" && currentSchool && publicUrl && (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
          <h3 class="text-2xl font-semibold mb-4 dark:text-white">Public Classroom Page</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Share this link with parents and students to view your classroom books.
          </p>
          <div class="flex gap-2">
            <input
              type="text"
              value={publicUrl}
              readonly
              class="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={copyPublicUrl}
              class="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all"
            >
              Copy Link
            </button>
            <a
              href={publicUrl}
              target="_blank"
              class="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-dark text-white font-semibold transition-all"
            >
              View →
            </a>
          </div>
        </div>
      )}

      {user.role === "teacher" && currentSchool && (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
          <h3 class="text-2xl font-semibold mb-4 dark:text-white">School</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Your classroom is associated with <strong>{currentSchool.name}</strong>. You can switch schools if needed.
          </p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select School
              </label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId((e.target as HTMLSelectElement).value)}
                class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedSchoolId !== user.schoolId && (
              <div class="flex items-center gap-3">
                <button
                  onClick={updateSchool}
                  disabled={schoolSaving}
                  class="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {schoolSaving ? "Updating..." : "Update School"}
                </button>
                {schoolMessage && (
                  <span class={`text-sm font-medium ${schoolMessage.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                    {schoolMessage}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h3 class="text-2xl font-semibold mb-6 dark:text-white">Color Theme</h3>
        <div class="grid gap-4">
          {Object.entries(themes).map(([key, themeData]) => (
            <button
              key={key}
              onClick={() => changeTheme(key)}
              class={`p-4 rounded-lg border-2 transition-all ${
                theme === key
                  ? "border-primary shadow-lg bg-primary/5"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div class="flex items-center space-x-4">
                <div class="flex space-x-2">
                  <div
                    class="w-8 h-8 rounded-full shadow-md"
                    style={{ backgroundColor: themeData.primary }}
                  ></div>
                  <div
                    class="w-8 h-8 rounded-full shadow-md"
                    style={{ backgroundColor: themeData.secondary }}
                  ></div>
                </div>
                <span class="font-semibold dark:text-white text-lg">
                  {themeData.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h3 class="text-2xl font-semibold mb-6 dark:text-white">Display Settings</h3>
        <div>
          <label class="flex items-center justify-between">
            <div>
              <span class="text-lg text-gray-700 dark:text-gray-300 font-medium">
                Dark Mode
              </span>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Switch between light and dark themes
              </p>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              class={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                darkMode ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <span
                class={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                  darkMode ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {user.role === "teacher" && (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
          <h3 class="text-2xl font-semibold mb-4 dark:text-white">Export & Backup</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Export your classroom books to CSV or backup to Google Sheets for a redundant copy.
          </p>

          <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-lg font-semibold dark:text-white mb-3">Export to CSV</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Download your entire classroom library as a CSV file that you can open in Excel, Google Sheets, or any spreadsheet application.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              class="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-dark text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? "📄 Exporting..." : "📄 Export CSV"}
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Google Sheet URL
              </label>
              <input
                type="url"
                value={sheetUrl}
                onInput={(e) => setSheetUrl((e.target as HTMLInputElement).value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p class="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
                Setup Instructions:
              </p>
              <ol class="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Create a new Google Sheet (or use an existing one)</li>
                <li>Click "Share" in the top-right</li>
                <li>Add this email address: <code class="bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded text-xs">{serviceAccountEmail}</code></li>
                <li>Give it "Editor" permissions</li>
                <li>Copy the sheet URL and paste it above</li>
              </ol>
            </div>

            <div class="flex items-center gap-3">
              <button
                onClick={saveSheetUrl}
                disabled={saving}
                class="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Sheet URL"}
              </button>
              {saveMessage && (
                <span class={`text-sm font-medium ${saveMessage.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                  {saveMessage}
                </span>
              )}
            </div>
            {sheetUrl && (
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                ✓ Sheet URL saved. Use the "Backup" button on your dashboard to sync your books.
              </p>
            )}
          </div>
        </div>
      )}

      <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 transition-colors">
        <h3 class="text-lg font-semibold mb-2 dark:text-white">About BookWorm</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          Scan book barcodes to instantly get book information. Made with ❤️ by FlashApps.
        </p>
      </div>
    </div>
  );
}