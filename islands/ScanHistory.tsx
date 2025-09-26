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
    <div class="scan-history">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        class="history-toggle"
        aria-expanded={isExpanded}
        aria-label="Toggle scan history"
      >
        Recent Scans ({history.length})
        <span class="toggle-icon">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {isExpanded && (
        <div class="history-content">
          <div class="history-header">
            <h3>Recent Scans</h3>
            <button onClick={clearHistory} class="btn-clear" aria-label="Clear history">
              Clear All
            </button>
          </div>
          <ul class="history-list">
            {history.map((book) => (
              <li key={book.isbn}>
                <button
                  onClick={() => onSelectBook(book)}
                  class="history-item"
                  aria-label={`View ${book.title}`}
                >
                  {book.thumbnail && (
                    <img
                      src={book.thumbnail}
                      alt=""
                      class="history-thumbnail"
                    />
                  )}
                  <div class="history-info">
                    <div class="history-title">{book.title}</div>
                    <div class="history-authors">{book.authors.join(", ")}</div>
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