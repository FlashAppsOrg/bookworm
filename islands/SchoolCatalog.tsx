import { useState } from "preact/hooks";
import { SchoolBookWithTeacher } from "../utils/db-helpers.ts";

interface Props {
  books: SchoolBookWithTeacher[];
  schoolSlug: string;
}

export default function SchoolCatalog({ books, schoolSlug }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const filteredBooks = books.filter((book) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const titleMatch = book.title.toLowerCase().includes(query);
    const authorMatch = book.authors.some(author => author.toLowerCase().includes(query));
    const teacherMatch = book.teacherName.toLowerCase().includes(query);
    const isbnMatch = book.isbn?.toLowerCase().includes(query);
    const descriptionMatch = book.description?.toLowerCase().includes(query);
    const categoryMatch = book.categories?.some(cat => cat.toLowerCase().includes(query));

    return titleMatch || authorMatch || teacherMatch || isbnMatch || descriptionMatch || categoryMatch;
  });

  const toggleBookSelection = (bookId: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBooks(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedBooks.size === filteredBooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(filteredBooks.map(b => b.id)));
    }
  };

  const toggleDescription = (bookId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-colors">
        <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div class="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              placeholder="Search by title, author, teacher, or ISBN..."
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

      {selectedBooks.size > 0 && (
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex flex-wrap items-center gap-4">
          <p class="text-sm font-semibold text-blue-900 dark:text-blue-300">
            {selectedBooks.size} book{selectedBooks.size !== 1 ? "s" : ""} selected
          </p>
          <button
            onClick={toggleAllSelection}
            class="px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-400 dark:border-blue-600 rounded text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700"
          >
            {selectedBooks.size === filteredBooks.length ? "Deselect All" : "Select All"}
          </button>
          <button
            onClick={() => {
              const selectedBookData = filteredBooks
                .filter(b => selectedBooks.has(b.id))
                .map(b => ({
                  bookId: b.id,
                  userId: b.teacherId,
                  title: b.title
                }));

              if (selectedBookData.length === 1) {
                // Single book - use existing route
                const book = selectedBookData[0];
                window.location.href = `/challenge-book?bookId=${book.bookId}&userId=${book.userId}`;
              } else {
                // Multiple books - use new route
                const params = new URLSearchParams();
                selectedBookData.forEach(book => {
                  params.append('bookId', book.bookId);
                  params.append('userId', book.userId);
                });
                window.location.href = `/challenge-books?${params.toString()}`;
              }
            }}
            class="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm font-semibold transition-colors"
          >
            Challenge Selected
          </button>
        </div>
      )}

      {filteredBooks.length > 0 ? (
        viewMode === "grid" ? (
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                class={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-all hover:shadow-xl relative ${
                  selectedBooks.has(book.id) ? "ring-2 ring-primary" : ""
                }`}
              >
                <div class="absolute top-2 right-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedBooks.has(book.id)}
                    onChange={() => toggleBookSelection(book.id)}
                    class="w-5 h-5 text-primary bg-white border-2 border-gray-300 rounded focus:ring-primary cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div class="w-full h-48 mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  {book.thumbnail ? (
                    <img
                      src={book.thumbnail}
                      alt={book.title}
                      class="w-full h-full object-contain"
                    />
                  ) : (
                    <div class="text-center">
                      <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">No cover</p>
                    </div>
                  )}
                </div>

                <h3 class="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {book.title}
                </h3>
                {book.authors && book.authors.length > 0 && (
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                    by {book.authors.join(", ")}
                  </p>
                )}
                {book.categories && book.categories.length > 0 && (
                  <div class="flex flex-wrap gap-1 mb-2">
                    {book.categories.slice(0, 2).map((cat) => (
                      <span key={cat} class="text-xs px-2 py-0.5 bg-primary/10 text-primary dark:text-primary-light rounded">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {book.description && (
                  <div class="mb-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {expandedDescriptions.has(book.id)
                        ? book.description
                        : truncateDescription(book.description)
                      }
                    </p>
                    {book.description.length > 150 && (
                      <button
                        onClick={() => toggleDescription(book.id)}
                        class="text-xs text-primary hover:text-primary-dark dark:text-primary-light font-semibold mt-1"
                      >
                        {expandedDescriptions.has(book.id) ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                )}
                <div class="space-y-1 text-xs text-gray-500 dark:text-gray-500 mb-3">
                  {book.pageCount && <p>{book.pageCount} pages</p>}
                  {book.publisher && <p>{book.publisher}</p>}
                  {book.publishedDate && <p>{book.publishedDate}</p>}
                  {book.isbn && (
                    <p class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      ISBN: {book.isbn}
                    </p>
                  )}
                  <p class="text-primary dark:text-primary-light font-semibold">
                    Qty: {book.quantity || 1}
                  </p>
                </div>
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
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">ISBN</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Qty</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Title</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Authors</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Categories</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Description</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Pages</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Publisher</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Published</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Classroom</th>
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
                      <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white max-w-xs">
                        {book.title}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {book.authors.join(", ") || "-"}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {book.categories && book.categories.length > 0 ? (
                          <div class="flex flex-wrap gap-1">
                            {book.categories.slice(0, 2).map((cat) => (
                              <span key={cat} class="text-xs px-2 py-0.5 bg-primary/10 text-primary dark:text-primary-light rounded whitespace-nowrap">
                                {cat}
                              </span>
                            ))}
                          </div>
                        ) : "-"}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-md">
                        <div class="line-clamp-2">
                          {book.description || "-"}
                        </div>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {book.pageCount || "-"}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {book.publisher || "-"}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {book.publishedDate || "-"}
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <a
                          href={`/${schoolSlug}/${book.teacherUsername}`}
                          class="text-primary hover:text-primary-dark dark:text-primary-light font-semibold"
                        >
                          {book.teacherName}
                        </a>
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
            {searchQuery.trim() ? "Try a different search term" : "No books in this school yet"}
          </p>
        </div>
      )}
    </div>
  );
}