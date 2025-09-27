import { useState, useEffect } from "preact/hooks";

interface ClassroomBook {
  id: string;
  userId: string;
  isbn: string | null;
  title: string;
  authors: string[];
  thumbnail: string | null;
  quantity: number;
  imported: boolean;
  dateAdded: string;
  teacherName: string;
  teacherEmail: string;
  teacherUsername: string;
  schoolName: string;
  schoolSlug: string;
  isPlaceholder: boolean;
}

export default function ClassroomBrowser() {
  const [books, setBooks] = useState<ClassroomBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [importedFilter, setImportedFilter] = useState("all");
  const [message, setMessage] = useState("");

  async function loadBooks() {
    try {
      const response = await fetch("/api/admin/classrooms");
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error("Failed to load classrooms:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  async function deleteBook(bookId: string, userId: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/classrooms?bookId=${bookId}&userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBooks(books.filter((b) => b.id !== bookId));
        setMessage("✓ Book deleted successfully");
      } else {
        const data = await response.json();
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to delete book");
    }
  }

  const schools = Array.from(new Set(books.map((b) => b.schoolName))).sort();

  const filteredBooks = books.filter((book) => {
    if (schoolFilter !== "all" && book.schoolName !== schoolFilter) return false;

    if (importedFilter === "imported" && !book.imported) return false;
    if (importedFilter === "manual" && book.imported) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.authors.some((a) => a.toLowerCase().includes(query)) ||
      book.teacherName.toLowerCase().includes(query) ||
      book.schoolName.toLowerCase().includes(query) ||
      book.isbn?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div class="text-center py-12">
        <div class="text-2xl">Loading classrooms...</div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div class="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              placeholder="Search by title, author, teacher, ISBN..."
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              School
            </label>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter((e.target as HTMLSelectElement).value)}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Schools</option>
              {schools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Source
            </label>
            <select
              value={importedFilter}
              onChange={(e) => setImportedFilter((e.target as HTMLSelectElement).value)}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Sources</option>
              <option value="imported">Imported Only</option>
              <option value="manual">Manually Added Only</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredBooks.length} of {books.length} books
          </p>
          {message && (
            <p class={`text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <p class="text-gray-500 dark:text-gray-400">No books found</p>
        </div>
      ) : (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    School
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Teacher
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    ISBN
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Title
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Authors
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Qty
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Source
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBooks.map((book) => (
                  <tr key={`${book.userId}-${book.id}`} class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {book.schoolName}
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <div>
                        <div class="font-medium text-gray-900 dark:text-white">
                          {book.teacherName}
                        </div>
                        {book.isPlaceholder && (
                          <span class="text-xs text-yellow-600 dark:text-yellow-400">
                            (placeholder)
                          </span>
                        )}
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          <a
                            href={`/${book.schoolSlug}/${book.teacherUsername}`}
                            target="_blank"
                            class="hover:text-primary"
                          >
                            View classroom →
                          </a>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {book.isbn || "-"}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs">
                      {book.title}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {book.authors.join(", ") || "-"}
                    </td>
                    <td class="px-4 py-3 text-sm font-semibold text-primary dark:text-primary-light">
                      {book.quantity}
                    </td>
                    <td class="px-4 py-3 text-sm">
                      {book.imported ? (
                        <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
                          Imported
                        </span>
                      ) : (
                        <span class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded">
                          Manual
                        </span>
                      )}
                    </td>
                    <td class="px-4 py-3 text-sm text-right">
                      <button
                        onClick={() => deleteBook(book.id, book.userId, book.title)}
                        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}