import { useState } from "preact/hooks";
import { ClassroomBook } from "../utils/db.ts";

interface BookWithTeacher extends ClassroomBook {
  teacherName: string;
  teacherId: string;
}

interface Props {
  books: BookWithTeacher[];
  schoolName: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
}

export default function MultipleChallengeForm({
  books,
  schoolName,
  parentId: propParentId,
  parentName: propParentName,
  parentEmail: propParentEmail
}: Props) {
  const [parentName, setParentName] = useState(propParentName || "");
  const [parentEmail, setParentEmail] = useState(propParentEmail || "");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Submit a challenge for each book
      const promises = books.map(book =>
        fetch("/api/challenges/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: book.id,
            userId: book.teacherId,
            parentId: propParentId || null,
            parentName,
            parentEmail,
            studentName,
            studentId,
            reason,
            isPartOfBulkChallenge: true,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const allSuccessful = responses.every(r => r.ok);

      if (allSuccessful) {
        setSubmitted(true);
      } else {
        setError("Failed to submit some challenges. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
        <div class="text-6xl mb-4">✓</div>
        <h2 class="text-2xl font-bold text-green-900 dark:text-green-300 mb-2">
          Challenges Submitted
        </h2>
        <p class="text-green-800 dark:text-green-400 mb-4">
          Your challenges for {books.length} book{books.length !== 1 ? "s" : ""} have been submitted
          and will be reviewed by the school administration. You will be contacted at the email address you provided.
        </p>
        <button
          onClick={() => window.history.back()}
          class="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  // Group books by teacher
  const booksByTeacher = books.reduce((acc, book) => {
    if (!acc[book.teacherName]) {
      acc[book.teacherName] = [];
    }
    acc[book.teacherName].push(book);
    return acc;
  }, {} as Record<string, BookWithTeacher[]>);

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Challenge Multiple Books
        </h1>

        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            About Book Challenges
          </h3>
          <p class="text-sm text-blue-800 dark:text-blue-400">
            Per North Carolina HB 805, parents have the right to challenge books in their child's classroom.
            This form will be reviewed by school administration and you will be contacted regarding the outcome.
          </p>
        </div>

        {error && (
          <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-red-800 dark:text-red-300 mb-6">
            {error}
          </div>
        )}

        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
            Books to Challenge ({books.length})
          </h4>
          {Object.entries(booksByTeacher).map(([teacherName, teacherBooks]) => (
            <div key={teacherName} class="mb-4">
              <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {teacherName}'s Classroom:
              </h5>
              <ul class="space-y-2">
                {teacherBooks.map(book => (
                  <li key={book.id} class="flex items-start">
                    <span class="text-primary mr-2">•</span>
                    <div>
                      <span class="font-medium text-gray-900 dark:text-white">
                        {book.title}
                      </span>
                      {book.authors?.length > 0 && (
                        <span class="text-gray-600 dark:text-gray-400">
                          {" "}by {book.authors.join(", ")}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div class="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">School: </span>
            <span class="text-sm text-gray-900 dark:text-white">{schoolName}</span>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Name <span class="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={parentName}
              onInput={(e) => setParentName((e.target as HTMLInputElement).value)}
              required
              disabled={!!propParentId}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Email <span class="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={parentEmail}
              onInput={(e) => setParentEmail((e.target as HTMLInputElement).value)}
              required
              disabled={!!propParentId}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              You will be contacted at this email regarding your challenges
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student Name <span class="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={studentName}
              onInput={(e) => setStudentName((e.target as HTMLInputElement).value)}
              required
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="Your child's full name"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Name of your child in these classrooms
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student ID (Optional)
            </label>
            <input
              type="text"
              value={studentId}
              onInput={(e) => setStudentId((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="School-provided student ID (if known)"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              If you know your child's student ID, it helps verify the relationship faster.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Challenge (Optional)
            </label>
            <textarea
              value={reason}
              onInput={(e) => setReason((e.target as HTMLTextAreaElement).value)}
              rows={6}
              placeholder="You may explain your concerns about these books (optional)..."
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This reason will apply to all selected books. While optional, providing specific concerns helps administrators review your challenges more effectively
            </p>
          </div>
        </div>

        <div class="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={submitting}
            class="flex-1 py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : `Submit ${books.length} Challenge${books.length !== 1 ? "s" : ""}`}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}