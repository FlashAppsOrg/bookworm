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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <div class="flex items-center justify-between h-16">
            <span class="text-2xl font-bold text-primary">BookWorm</span>
            <div class="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                class="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
                aria-label="Menu"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              {isMenuOpen && (
                <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-fade-in z-50">
                  <a
                    href="/settings"
                    class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div class="flex items-center space-x-3">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </div>
                  </a>
                </div>
              )}
            </div>
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
            <div class="text-2xl font-bold text-primary dark:text-primary-light absolute top-0 left-1/2 transform -translate-x-1/2 z-10">BookWorm by</div>
            <img src="/flash-apps-horizontal.svg" alt="FlashApps" class="w-full" />
          </div>
        </div>
      </footer>
    </div>
  );
}