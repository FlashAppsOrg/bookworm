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
  const videoRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualISBN, setManualISBN] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [quaggaReady, setQuaggaReady] = useState(false);

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

  const startCamera = async () => {
    console.log("startCamera clicked, quaggaReady:", quaggaReady);
    if (!quaggaReady || !window.Quagga) {
      setError("Barcode scanner not ready");
      return;
    }

    try {
      setError(null);

      window.Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            facingMode: "environment",
          },
        },
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"],
        },
      }, (err: any) => {
        if (err) {
          console.error(err);
          setError("Failed to start camera");
          return;
        }

        window.Quagga.onDetected(handleDetection);
        window.Quagga.start();
        setIsScanning(true);
      });
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (window.Quagga && isScanning) {
      window.Quagga.stop();
      window.Quagga.offDetected(handleDetection);
    }
    setIsScanning(false);
  };

  const handleDetection = (result: any) => {
    if (result && result.codeResult && result.codeResult.code) {
      const isbn = extractISBNFromBarcode(result.codeResult.code);
      if (isbn) {
        lookupBook(isbn);
      }
    }
  };

  const lookupBook = async (isbn: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lookup?isbn=${isbn}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch book information");
      }

      onBookFound(data);
      stopCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
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
    if (manualISBN.trim()) {
      lookupBook(manualISBN.trim());
    }
  };

  return (
    <div class="scanner-container">
      {!isScanning && !showManualInput && (
        <div class="scanner-controls">
          <button
            onClick={startCamera}
            class="btn btn-primary"
            aria-label="Start camera to scan barcode"
          >
            Start Camera Scanner
          </button>
          <button
            onClick={() => setShowManualInput(true)}
            class="btn btn-secondary"
            aria-label="Enter ISBN manually"
          >
            Enter ISBN Manually
          </button>
        </div>
      )}

      {showManualInput && !isScanning && (
        <div class="manual-input">
          <h3>Enter ISBN</h3>
          <form onSubmit={handleManualSubmit}>
            <input
              type="text"
              value={manualISBN}
              onInput={(e) => setManualISBN((e.target as HTMLInputElement).value)}
              placeholder="Enter ISBN (10 or 13 digits)"
              pattern="[0-9]{10,13}"
              class="isbn-input"
              aria-label="ISBN number input"
            />
            <div class="button-group">
              <button type="submit" class="btn btn-primary" disabled={isLoading}>
                {isLoading ? "Looking up..." : "Lookup"}
              </button>
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                class="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isScanning && (
        <div class="video-container">
          <div ref={videoRef} class="scanner-video" />
          <div class="scan-overlay">
            <div class="scan-line"></div>
          </div>
          <button
            onClick={stopCamera}
            class="btn btn-stop"
            aria-label="Stop camera"
          >
            Stop Scanning
          </button>
        </div>
      )}

      {isLoading && <div class="loading">Looking up book...</div>}

      {error && (
        <div class="error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}