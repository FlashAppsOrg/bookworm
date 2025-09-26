import { useEffect, useRef, useState } from "preact/hooks";
import { extractISBNFromBarcode } from "../utils/isbn.ts";
import { detectBarcode } from "../utils/barcode.ts";
import type { BookInfo } from "../routes/api/lookup.ts";

interface Props {
  onBookFound: (book: BookInfo) => void;
}

export default function BarcodeScanner({ onBookFound }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualISBN, setManualISBN] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
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

  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const barcodes = await detectBarcode(canvas);

      if (barcodes.length > 0) {
        const isbn = extractISBNFromBarcode(barcodes[0].rawValue);
        if (isbn) {
          await lookupBook(isbn);
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
    }
  };

  useEffect(() => {
    if (isScanning) {
      scanIntervalRef.current = setInterval(scanFrame, 500);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isScanning]);

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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            class="scanner-video"
            aria-label="Camera feed for barcode scanning"
          />
          <div class="scan-overlay">
            <div class="scan-line"></div>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
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