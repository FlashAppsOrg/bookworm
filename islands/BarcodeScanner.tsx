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
  const [manualISBN, setManualISBN] = useState("");
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

  const lookupBook = async (isbn: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lookup?isbn=${isbn}`);
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
    if (manualISBN.trim()) {
      lookupBook(manualISBN.trim());
    }
  };

  return (
    <div class="scanner-container">
      {!isScanning && !showManualInput && (
        <div class="scanner-controls">
          <button
            onClick={() => {
              console.log("Start Camera button clicked!");
              startCamera();
            }}
            class="btn btn-primary"
            aria-label="Start camera to scan barcode"
          >
            Start Camera Scanner
          </button>
          <button
            onClick={() => {
              console.log("Manual input button clicked!");
              setShowManualInput(true);
            }}
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
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            textAlign: 'center',
            maxWidth: '90%'
          }}>
            {lastScanned ? `Last: ${lastScanned}` : 'Scan the ISBN barcode (starts with 978 or 979)'}
          </div>
          <button
            onClick={() => {
              console.log("Stop button clicked!");
              stopCamera();
            }}
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