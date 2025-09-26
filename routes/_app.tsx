import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>BookWorm - Barcode Scanner</title>
        <link rel="stylesheet" href="/styles.css" />
        <script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js"></script>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}