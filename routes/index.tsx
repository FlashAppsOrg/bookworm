import { Head } from "$fresh/runtime.ts";
import App from "../islands/App.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>BookWorm - Barcode Scanner</title>
        <meta name="description" content="Scan book barcodes to get information instantly" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#00D4FF" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <App />
    </>
  );
}