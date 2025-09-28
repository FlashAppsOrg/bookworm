import { useEffect, useRef, useState } from "preact/hooks";
import { extractISBNFromBarcode } from "../utils/isbn.ts";
import type { BookInfo } from "../routes/api/lookup.ts";

interface Props {
  onBookFound: (book: BookInfo) => void;
  initialMode: 'camera' | 'manual';
}

declare global {
  interface Window {
    Quagga: any;
  }
}

export default function BarcodeScanner({ onBookFound, initialMode }: Props) {
  console.log("BarcodeScanner component rendering");
  const videoRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [searchResults, setSearchResults] = useState<BookInfo[]>([]);
  const [quaggaReady, setQuaggaReady] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>("");
  const lastScanTime = useRef<number>(0);
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    console.log("BarcodeScanner mounted");

    const checkQuagga = () => {
      if (typeof window !== 'undefined' && window.Quagga) {
        console.log("Quagga loaded from window");
        setQuaggaReady(true);
      } else {
        console.log("Quagga not ready, checking again...");
        setTimeout(checkQuagga, 100);
      }
    };

    checkQuagga();

    // Auto-start based on initialMode
    if (initialMode === 'manual') {
      setShowManualInput(true);
    }
  }, [initialMode]);

  const startCamera = () => {
    console.log("startCamera clicked, quaggaReady:", quaggaReady);
    if (!quaggaReady || !window.Quagga) {
      setError("Barcode scanner not ready");
      return;
    }

    setError(null);
    setLastScanned("");
    processingRef.current = false;
    lastScanTime.current = 0;
    setIsScanning(true);
  };

  useEffect(() => {
    if (initialMode === 'camera' && quaggaReady && !isScanning) {
      startCamera();
    }
  }, [quaggaReady, initialMode]);

  useEffect(() => {
    if (!isScanning || !quaggaReady || !window.Quagga || !videoRef.current) {
      return;
    }

    console.log("Initializing Quagga with video container:", videoRef.current);

    try {
      window.Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment",
            focusMode: "continuous",
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 4,
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"],
        },
        locate: true
      }, (err: any) => {
        console.log("Quagga init callback, err:", err);
        if (err) {
          console.error("Quagga init error:", err);
          setError(`Failed to start camera: ${err.message || err}`);
          setIsScanning(false);
          return;
        }

        console.log("Quagga initialized successfully, starting...");
        window.Quagga.onDetected(handleDetection);
        window.Quagga.start();
        console.log("Quagga started");
      });
    } catch (err) {
      console.error("Exception starting camera:", err);
      setError("Camera access denied. Please enable camera permissions.");
      setIsScanning(false);
    }
  }, [isScanning, quaggaReady]);

  const handleDetection = (result: any) => {
    if (processingRef.current) {
      return;
    }

    if (result && result.codeResult && result.codeResult.code) {
      const code = result.codeResult.code;
      const now = Date.now();

      if (now - lastScanTime.current < 2000) {
        return;
      }

      lastScanTime.current = now;
      setLastScanned(code);

      if (code.length >= 10 && code.length <= 13 && /^\d+$/.test(code)) {
        processingRef.current = true;
        stopCamera();
        lookupBook(code, true, true);
      }
    }
  };

  const stopCamera = () => {
    console.log("Stopping camera");
    if (window.Quagga && isScanning) {
      window.Quagga.stop();
      window.Quagga.offDetected(handleDetection);
    }
    setIsScanning(false);
  };

  const lookupBook = async (searchValue: string, isISBN: boolean = true, fromScanner: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const queryParam = isISBN ? `isbn=${searchValue}` : `query=${encodeURIComponent(searchValue)}`;
      const response = await fetch(`/api/lookup?${queryParam}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Book not found");
      }

      // Check if we got multiple results (text search) or single result (ISBN)
      if (data.results) {
        setSearchResults(data.results);
      } else {
        onBookFound(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Book not found";

      // If this was from scanner and book wasn't found, show special error with retry options
      if (fromScanner && errorMessage.includes("not found")) {
        setError(`scanError:${searchValue}`);
      } else {
        setError(errorMessage);
      }

      processingRef.current = false;

      // Don't stop scanning if it was a scan error - let user retry
      if (!fromScanner) {
        setIsScanning(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("Component unmounting, stopping camera");
      if (window.Quagga) {
        window.Quagga.stop();
        window.Quagga.offDetected(handleDetection);
      }
    };
  }, []);

  // Cleanup when isScanning changes to false
  useEffect(() => {
    if (!isScanning && window.Quagga) {
      console.log("isScanning changed to false, stopping Quagga");
      window.Quagga.stop();
      window.Quagga.offDetected(handleDetection);
    }
  }, [isScanning]);

  const handleManualSubmit = (e: Event) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    if (trimmed) {
      const isISBN = /^\d{10,13}$/.test(trimmed);
      lookupBook(trimmed, isISBN);
    }
  };

  const retryScan = () => {
    setError(null);
    setLastScanned("");
    processingRef.current = false;
    lastScanTime.current = 0;
    if (!isScanning) {
      startCamera();
    }
  };

  const switchToManualSearch = () => {
    setError(null);
    setLastScanned("");
    processingRef.current = false;
    stopCamera();
    setShowManualInput(true);
  };

  // Show start scan button if nothing is active
  const showStartButton = !isScanning && !showManualInput && !searchResults.length && !isLoading;

  return (
    <div class="max-w-2xl mx-auto">
      {showStartButton && (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 animate-fade-in text-center">
          <h3 class="text-2xl font-bold text-primary mb-4">Ready to Scan</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Position the book's barcode in front of your camera
          </p>
          <button
            onClick={startCamera}
            class="py-3 px-8 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
          >
            📷 Start Scanning
          </button>
        </div>
      )}

      {showManualInput && !isScanning && !searchResults.length && (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 animate-fade-in">
          <h3 class="text-2xl font-bold text-primary mb-4">Search for a Book</h3>
          <form onSubmit={handleManualSubmit} class="space-y-4">
            <input
              type="text"
              value={searchText}
              onInput={(e) => setSearchText((e.target as HTMLInputElement).value)}
              placeholder="ISBN, title, or author (e.g., 'Harry Potter')"
              class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white text-lg"
              aria-label="Search for book by ISBN, title, or author"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Enter an ISBN (10 or 13 digits), book title, or author name
            </p>
            <div class="flex gap-3">
              <button type="submit" class="flex-1 py-3 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualInput(false);
                  setSearchText("");
                  setError(null);
                }}
                class="flex-1 py-3 px-6 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold shadow-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {searchResults.length > 0 && (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 animate-fade-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-2xl font-bold text-primary">Select a Book</h3>
            <button
              onClick={() => {
                setSearchResults([]);
                setSearchText("");
              }}
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
            </p>
            <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Powered by</span>
              <svg class="h-3.5" viewBox="0 0 272 92" fill="currentColor">
                <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
                <path d="M225 3v65h-9.5V3h9.5z"/>
                <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
                <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.10-11.65l-22.49.01z"/>
              </svg>
            </div>
          </div>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            {searchResults.map((book, index) => (
              <button
                key={index}
                onClick={() => {
                  onBookFound(book);
                  setSearchResults([]);
                  setSearchText("");
                  setShowManualInput(false);
                }}
                class="w-full text-left p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <div class="flex gap-3">
                  {book.thumbnail && (
                    <img
                      src={book.thumbnail}
                      alt={book.title}
                      class="w-16 h-24 object-contain"
                    />
                  )}
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {book.title}
                    </h4>
                    {book.authors && book.authors.length > 0 && (
                      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
                        by {book.authors.join(", ")}
                      </p>
                    )}
                    {book.publishedDate && (
                      <p class="text-xs text-gray-500 dark:text-gray-500">
                        {book.publishedDate}
                      </p>
                    )}
                    {book.isbn && (
                      <p class="text-xs text-gray-500 dark:text-gray-500">
                        ISBN: {book.isbn}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isScanning && (
        <div class="relative rounded-lg overflow-hidden shadow-2xl bg-black h-[50vh] min-h-[400px] max-h-[600px]">
          <div ref={videoRef} class="w-full h-full" />
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute inset-0 border-4 border-primary opacity-50"></div>
            <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-primary animate-pulse"></div>
          </div>
          <div class="absolute top-3 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm text-center max-w-[90%]">
            {lastScanned ? `Last: ${lastScanned}` : 'Scan the ISBN barcode (starts with 978 or 979)'}
          </div>
          <button
            onClick={() => {
              console.log("Stop button clicked!");
              stopCamera();
            }}
            class="absolute bottom-4 left-1/2 transform -translate-x-1/2 py-3 px-8 rounded-lg bg-error hover:bg-red-600 text-white font-semibold shadow-lg transition-all"
            aria-label="Stop camera"
          >
            ⏹️ Stop Scanning
          </button>
        </div>
      )}

      {isLoading && (
        <div class="mt-4 text-center py-4 px-6 bg-primary/10 text-primary rounded-lg font-semibold animate-pulse">
          🔍 Looking up book...
        </div>
      )}

      {error && (
        <div class="mt-4 animate-fade-in">
          {error.startsWith('scanError:') ? (
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 dark:border-yellow-600 rounded-lg p-4 space-y-3">
              <div class="flex items-start gap-3">
                <span class="text-2xl">📚</span>
                <div class="flex-1">
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Book Not Found
                  </h4>
                  <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    ISBN: {error.split(':')[1]}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    This often happens with older books or damaged barcodes. Try:
                  </p>
                  <ul class="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-4 space-y-1">
                    <li>• Clean the barcode and scan again</li>
                    <li>• Ensure good lighting and steady hands</li>
                    <li>• Search by title or author instead</li>
                  </ul>
                </div>
              </div>
              <div class="flex gap-3">
                <button
                  onClick={retryScan}
                  class="flex-1 py-2 px-4 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold shadow-lg transition-all"
                >
                  📷 Try Scanning Again
                </button>
                <button
                  onClick={switchToManualSearch}
                  class="flex-1 py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold shadow-lg transition-all"
                >
                  🔍 Search Manually
                </button>
              </div>
            </div>
          ) : (
            <div class="bg-error/10 border-2 border-error text-error px-4 py-3 rounded-lg" role="alert">
              ⚠️ {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}