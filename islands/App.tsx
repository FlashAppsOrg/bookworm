import { useState } from "preact/hooks";
import BarcodeScanner from "./BarcodeScanner.tsx";
import BookDisplay from "../components/BookDisplay.tsx";
import ScanHistory from "./ScanHistory.tsx";
import type { BookInfo } from "../routes/api/lookup.ts";

const HISTORY_KEY = "bookworm_scan_history";
const MAX_HISTORY = 10;

function saveToHistory(book: BookInfo) {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    const history = stored ? JSON.parse(stored) : [];
    const filtered = history.filter((b: BookInfo) => b.isbn !== book.isbn);
    const newHistory = [book, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (err) {
    console.error("Failed to save history:", err);
  }
}

export default function App() {
  const [currentBook, setCurrentBook] = useState<BookInfo | null>(null);

  const handleBookFound = (book: BookInfo) => {
    setCurrentBook(book);
    saveToHistory(book);
  };

  const handleScanAnother = () => {
    setCurrentBook(null);
  };

  const handleSelectFromHistory = (book: BookInfo) => {
    setCurrentBook(book);
  };

  return (
    <div class="app-container">
      <header class="app-header">
        <h1>📚 BookWorm</h1>
        <p class="tagline">Scan barcodes, discover books</p>
      </header>

      <main class="app-main">
        {currentBook ? (
          <BookDisplay book={currentBook} onScanAnother={handleScanAnother} />
        ) : (
          <>
            <BarcodeScanner onBookFound={handleBookFound} />
            <ScanHistory onSelectBook={handleSelectFromHistory} />
          </>
        )}
      </main>

      <footer class="app-footer">
        <p>Powered by Google Books API</p>
      </footer>
    </div>
  );
}