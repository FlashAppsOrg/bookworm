import { type PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component }: PageProps) {
  return (
    <>
      <Head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>BookWorm by FlashApps</title>
        <link rel="icon" type="image/svg+xml" href="/favicon-32.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const darkMode = localStorage.getItem('bookworm-dark-mode') === 'true';
              if (darkMode) {
                document.documentElement.classList.add('dark');
              }

              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                  const theme = localStorage.getItem('bookworm-theme') || 'teal';
                  document.body.className = document.body.className + ' theme-' + theme;
                });
              } else {
                const theme = localStorage.getItem('bookworm-theme') || 'teal';
                document.body.className = document.body.className + ' theme-' + theme;
              }
            })();
          `
        }} />
      </Head>
      <body class="min-h-screen transition-colors theme-teal">
        <div class="min-h-screen bg-gradient-to-br from-primary/20 via-white to-secondary/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Component />
        </div>
      </body>
    </>
  );
}