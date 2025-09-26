import { useState, useEffect } from "preact/hooks";

const themes = {
  teal: {
    name: "Ocean Teal",
    primary: "#0D9488",
    secondary: "#F59E0B",
  },
  indigo: {
    name: "Deep Indigo",
    primary: "#4F46E5",
    secondary: "#10B981",
  },
  blue: {
    name: "Ocean Blue",
    primary: "#4F46E5",
    secondary: "#EC4899",
  },
};

export default function SettingsPanel() {
  const [theme, setTheme] = useState<string>("teal");
  const [darkMode, setDarkMode] = useState<boolean>(false);

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

  return (
    <div class="space-y-6">
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

      <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 transition-colors">
        <h3 class="text-lg font-semibold mb-2 dark:text-white">About BookWorm</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          Scan book barcodes to instantly get book information. Made with ❤️ by FlashApps.
        </p>
      </div>
    </div>
  );
}