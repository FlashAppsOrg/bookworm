import { useState } from "preact/hooks";
import { SchoolBookWithTeacher } from "../utils/db-helpers.ts";

interface Props {
  books: SchoolBookWithTeacher[];
  schoolSlug: string;
}

export default function SchoolCatalog({ books, schoolSlug }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = books.filter((book) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const titleMatch = book.title.toLowerCase().includes(query);
    const authorMatch = book.authors.some(author => author.toLowerCase().includes(query));
    const teacherMatch = book.teacherName.toLowerCase().includes(query);

    return titleMatch || authorMatch || teacherMatch;
  });

  return (
    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-colors">
        <div class="relative">
          <input
            type="text"
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            placeholder="Search by title, author, or teacher..."
            class="w-full px-4 py-3 pl-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white text-base"
            aria-label="Search books"
          />
          <svg
            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchQuery.trim() && (
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Showing {filteredBooks.length} of {books.length} book{books.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {filteredBooks.length > 0 ? (
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-all hover:shadow-xl"
            >
              {book.thumbnail && (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  class="w-full h-48 object-contain mb-3"
                />
              )}
              <h3 class="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {book.title}
              </h3>
              {book.authors && book.authors.length > 0 && (
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                  by {book.authors.join(", ")}
                </p>
              )}
              {book.publisher && (
                <p class="text-xs text-gray-500 dark:text-gray-500 mb-1">
                  {book.publisher}
                </p>
              )}
              {book.publishedDate && (
                <p class="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  {book.publishedDate}
                </p>
              )}
              <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
                <a
                  href={`/${schoolSlug}/${book.teacherUsername}`}
                  class="text-sm text-primary hover:text-primary-dark dark:text-primary-light font-semibold flex items-center gap-1 group"
                >
                  <span class="line-clamp-1">{book.teacherName}'s classroom</span>
                  <svg
                    class="w-4 h-4 transform transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <div class="text-6xl mb-4">🔍</div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No books found
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Try a different search term
          </p>
        </div>
      )}
    </div>
  );
}