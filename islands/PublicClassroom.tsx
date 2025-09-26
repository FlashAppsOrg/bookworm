import { useState } from "preact/hooks";
import { ClassroomBook } from "../utils/db.ts";

interface Props {
  books: ClassroomBook[];
  teacherName: string;
  schoolName: string;
}

export default function PublicClassroom({ books, teacherName, schoolName }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredBooks = books.filter((book) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const titleMatch = book.title.toLowerCase().includes(query);
    const authorMatch = book.authors.some(author => author.toLowerCase().includes(query));
    const isbnMatch = book.isbn?.toLowerCase().includes(query);

    return titleMatch || authorMatch || isbnMatch;
  });

  return (
    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 transition-colors">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {teacherName}'s Classroom
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {schoolName} • {books.length} book{books.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-colors">
        <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div class="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              placeholder="Search by title, author, or ISBN..."
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
          <div class="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              class={`px-4 py-3 rounded-lg font-semibold transition-all ${viewMode === "grid" ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              aria-label="Grid view"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("table")}
              class={`px-4 py-3 rounded-lg font-semibold transition-all ${viewMode === "table" ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              aria-label="Table view"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        {searchQuery.trim() && (
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Showing {filteredBooks.length} of {books.length} book{books.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {filteredBooks.length > 0 ? (
        viewMode === "grid" ? (
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
                <div class="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                  {book.publisher && <p>{book.publisher}</p>}
                  {book.publishedDate && <p>{book.publishedDate}</p>}
                  {book.isbn && (
                    <p class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      ISBN: {book.isbn}
                    </p>
                  )}
                  <p class="text-primary dark:text-primary-light font-semibold">
                    Quantity: {book.quantity || 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">ISBN</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Qty</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Title</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Authors</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Publisher</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Published</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredBooks.map((book) => (
                    <tr key={book.id} class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td class="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                        {book.isbn || "-"}
                      </td>
                      <td class="px-4 py-3 text-sm font-semibold text-primary dark:text-primary-light">
                        {book.quantity || 1}
                      </td>
                      <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {book.title}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {book.authors.join(", ") || "-"}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {book.publisher || "-"}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {book.publishedDate || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <div class="text-6xl mb-4">🔍</div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No books found
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            {searchQuery.trim() ? "Try a different search term" : "This classroom's library is still being built"}
          </p>
        </div>
      )}
    </div>
  );
}