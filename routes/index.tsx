import { Head } from "$fresh/runtime.ts";
import BarcodeScanner from "../islands/BarcodeScanner.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>BookWorm - Barcode Scanner</title>
        <meta name="description" content="Scan book barcodes to get information instantly" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#4a90e2" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div class="app-container">
        <header class="app-header">
          <h1>📚 BookWorm</h1>
          <p class="tagline">Scan barcodes, discover books</p>
        </header>

        <main class="app-main">
          <BarcodeScanner onBookFound={(book) => console.log("Book found:", book)} />
        </main>

        <footer class="app-footer">
          <p>Powered by Google Books API</p>
        </footer>
      </div>
    </>
  );
}