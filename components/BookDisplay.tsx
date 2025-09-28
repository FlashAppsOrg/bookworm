import type { BookInfo } from "../routes/api/lookup.ts";

interface Props {
  book: BookInfo;
  onScanAnother: () => void;
}

export default function BookDisplay({ book, onScanAnother }: Props) {
  return (
    <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div class="flex justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
          {book.thumbnail ? (
            <img
              src={book.thumbnail}
              alt={`Cover of ${book.title}`}
              class="max-w-xs rounded-lg shadow-lg"
            />
          ) : (
            <div class="w-48 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg shadow-lg">
              <svg class="w-24 h-24 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>
        <div class="p-6 space-y-4">
          <h2 class="text-3xl font-bold text-primary dark:text-primary-light">{book.title}</h2>
          <p class="text-xl text-gray-700 dark:text-gray-300 font-semibold">by {book.authors.join(", ")}</p>

          {book.publisher && (
            <p class="text-gray-600 dark:text-gray-400">
              <strong class="text-gray-900 dark:text-white">Publisher:</strong> {book.publisher}
            </p>
          )}

          {book.publishedDate && (
            <p class="text-gray-600 dark:text-gray-400">
              <strong class="text-gray-900 dark:text-white">Published:</strong> {book.publishedDate}
            </p>
          )}

          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
            <p class="text-gray-600 dark:text-gray-400">
              <strong class="text-gray-900 dark:text-white">ISBN:</strong> {book.isbn}
            </p>
            {book.industryIdentifiers && book.industryIdentifiers.length > 0 && (
              <div class="flex flex-wrap gap-2 mt-2">
                {book.industryIdentifiers.map((id) => (
                  <span key={id.identifier} class="inline-block px-3 py-1 bg-primary/10 text-primary dark:text-primary-light rounded-full text-sm font-medium">
                    {id.type}: {id.identifier}
                  </span>
                ))}
              </div>
            )}
          </div>

          {book.description && (
            <details class="group">
              <summary class="cursor-pointer font-semibold text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary transition-colors list-none flex items-center gap-2">
                <span class="transform transition-transform group-open:rotate-90">▶</span>
                Description
              </summary>
              <p class="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">{book.description}</p>
            </details>
          )}

          {book.infoLink && (
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <a
                href={book.infoLink}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on Google Books
              </a>
            </div>
          )}

          <div class="pt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Book information from</span>
              <svg class="h-4" viewBox="0 0 272 92" fill="currentColor">
                <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
                <path d="M225 3v65h-9.5V3h9.5z"/>
                <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
                <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}