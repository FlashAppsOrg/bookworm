import type { BookInfo } from "../routes/api/lookup.ts";

interface Props {
  book: BookInfo;
  onScanAnother: () => void;
}

export default function BookDisplay({ book, onScanAnother }: Props) {
  return (
    <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {book.thumbnail && (
          <div class="flex justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
            <img
              src={book.thumbnail}
              alt={`Cover of ${book.title}`}
              class="max-w-xs rounded-lg shadow-lg"
            />
          </div>
        )}
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
        </div>
      </div>

      <button onClick={onScanAnother} class="w-full py-4 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95">
        📚 Scan Another Book
      </button>
    </div>
  );
}