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
  const [showScanner, setShowScanner] = useState(false);

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
    <div class="min-h-[100dvh] flex flex-col bg-gradient-to-br from-primary/20 via-white to-secondary/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header class="bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <span class="text-2xl font-bold text-primary">📚 BookWorm</span>
            <div class="flex items-center gap-4">
              <a
                href="/login"
                class="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors font-medium"
              >
                Log In
              </a>
              <a
                href="/signup"
                class="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          {!showScanner && !currentBook ? (
            <div class="text-center space-y-8 py-12">
              <div class="space-y-4">
                <h1 class="text-5xl font-bold text-gray-900 dark:text-white">
                  📚 BookWorm
                </h1>
                <p class="text-2xl text-gray-700 dark:text-gray-300 font-semibold">
                  Catalog Your Classroom Library with Ease
                </p>
                <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  BookWorm helps teachers build and manage their classroom book collections. Simply scan book barcodes with your device's camera to instantly get book details, organize your library, and share your catalog with students and parents.
                </p>
              </div>

              <div class="grid md:grid-cols-3 gap-6 mt-12 text-left">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div class="text-3xl mb-3">📱</div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Scan Barcodes
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Use your device camera to scan ISBN barcodes and instantly retrieve book information.
                  </p>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div class="text-3xl mb-3">📚</div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Organize Library
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Build your classroom catalog with quantities, export to CSV, and backup to Google Sheets.
                  </p>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div class="text-3xl mb-3">🌐</div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Share Catalog
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Get a public link to share your classroom books with students, parents, and colleagues.
                  </p>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                <a
                  href="/signup"
                  class="px-8 py-4 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-lg transition-all"
                >
                  Get Started Free
                </a>
                <button
                  onClick={() => setShowScanner(true)}
                  class="px-8 py-4 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-primary dark:text-primary-light border-2 border-primary dark:border-primary-light font-bold text-lg shadow-lg transition-all"
                >
                  Try Scanner Demo
                </button>
              </div>
            </div>
          ) : currentBook ? (
            <BookDisplay book={currentBook} onScanAnother={handleScanAnother} />
          ) : (
            <>
              <div class="mb-4">
                <button
                  onClick={() => setShowScanner(false)}
                  class="text-primary hover:text-primary-dark font-medium"
                >
                  ← Back to Home
                </button>
              </div>
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