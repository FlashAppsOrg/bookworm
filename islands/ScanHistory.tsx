import { useEffect, useState } from "preact/hooks";
import type { BookInfo } from "../routes/api/lookup.ts";

interface Props {
  onSelectBook: (book: BookInfo) => void;
}

const HISTORY_KEY = "bookworm_scan_history";

function getHistory(): BookInfo[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function ScanHistory({ onSelectBook }: Props) {
  const [history, setHistory] = useState<BookInfo[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const clearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        class="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 transition-all font-semibold text-gray-900 dark:text-white"
        aria-expanded={isExpanded}
        aria-label="Toggle scan history"
      >
        <span class="text-lg">📖 Recent Scans ({history.length})</span>
        <span class="transform transition-transform duration-200" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
      </button>

      {isExpanded && (
        <div class="animate-slide-up">
          <div class="px-6 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Scans</h3>
            <button onClick={clearHistory} class="px-3 py-1 text-sm text-error hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold transition-colors" aria-label="Clear history">
              🗑️ Clear All
            </button>
          </div>
          <ul class="divide-y divide-gray-200 dark:divide-gray-700">
            {history.map((book) => (
              <li key={book.isbn}>
                <button
                  onClick={() => onSelectBook(book)}
                  class="w-full px-6 py-4 flex items-start gap-4 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-left"
                  aria-label={`View ${book.title}`}
                >
                  {book.thumbnail && (
                    <img
                      src={book.thumbnail}
                      alt=""
                      class="w-12 h-16 object-cover rounded shadow-md flex-shrink-0"
                    />
                  )}
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-gray-900 dark:text-white truncate">{book.title}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 truncate">{book.authors.join(", ")}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}