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
    <div class="min-h-screen flex flex-col">
      <header class="bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-center h-16">
            <span class="text-2xl font-bold text-primary">BookWorm</span>
          </div>
        </div>
      </header>

      <main class="flex-1 container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          {currentBook ? (
            <BookDisplay book={currentBook} onScanAnother={handleScanAnother} />
          ) : (
            <>
              <BarcodeScanner onBookFound={handleBookFound} />
              <ScanHistory onSelectBook={handleSelectFromHistory} />
            </>
          )}
        </div>
      </main>

      <footer class="text-center py-8">
        <div class="flex flex-col items-center">
          <div class="relative w-full max-w-md px-4">
            <div class="text-2xl font-bold text-primary dark:text-primary-light absolute top-0 left-1/2 transform -translate-x-1/2 z-10">BookWorm</div>
            <img src="/flash-apps-horizontal.svg" alt="by FlashApps" class="w-full" />
          </div>
        </div>
      </footer>
    </div>
  );
}