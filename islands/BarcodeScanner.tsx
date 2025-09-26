import { useEffect, useRef, useState } from "preact/hooks";
import { extractISBNFromBarcode } from "../utils/isbn.ts";
import type { BookInfo } from "../routes/api/lookup.ts";

interface Props {
  onBookFound: (book: BookInfo) => void;
}

declare global {
  interface Window {
    Quagga: any;
  }
}

export default function BarcodeScanner({ onBookFound }: Props) {
  console.log("BarcodeScanner component rendering");
  const videoRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
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
  }, []);

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
            width: 640,
            height: 480,
            facingMode: "environment",
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
        lookupBook(code);
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

  const lookupBook = async (searchValue: string, isISBN: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParam = isISBN ? `isbn=${searchValue}` : `query=${encodeURIComponent(searchValue)}`;
      const response = await fetch(`/api/lookup?${queryParam}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Book not found");
      }

      onBookFound(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Book not found");
      processingRef.current = false;
      setIsScanning(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e: Event) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    if (trimmed) {
      const isISBN = /^\d{10,13}$/.test(trimmed);
      lookupBook(trimmed, isISBN);
    }
  };

  return (
    <div class="max-w-2xl mx-auto">
      {!isScanning && !showManualInput && (
        <div class="space-y-4">
          <button
            onClick={() => {
              console.log("Start Camera button clicked!");
              startCamera();
            }}
            class="w-full py-4 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
            aria-label="Start camera to scan barcode"
          >
            📸 Start Camera Scanner
          </button>
          <button
            onClick={() => {
              console.log("Manual search button clicked!");
              setShowManualInput(true);
            }}
            class="w-full py-4 px-6 rounded-lg bg-secondary hover:bg-secondary-dark text-gray-900 font-semibold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
            aria-label="Search by ISBN, title, or author"
          >
            🔍 Search by ISBN, Title, or Author
          </button>
        </div>
      )}

      {showManualInput && !isScanning && (
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
                onClick={() => setShowManualInput(false)}
                class="flex-1 py-3 px-6 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold shadow-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isScanning && (
        <div class="relative rounded-lg overflow-hidden shadow-2xl bg-black">
          <div ref={videoRef} class="w-full aspect-video" />
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
        <div class="mt-4 bg-error/10 border-2 border-error text-error px-4 py-3 rounded-lg animate-fade-in" role="alert">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}