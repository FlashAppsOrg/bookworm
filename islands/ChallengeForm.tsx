import { useState } from "preact/hooks";

interface Props {
  bookId: string;
  userId: string;
  bookTitle: string;
  teacherName: string;
  schoolName: string;
  schoolTeachers: Array<{id: string; name: string;}>;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
}

export default function ChallengeForm({
  bookId,
  userId,
  bookTitle,
  teacherName,
  schoolName,
  schoolTeachers,
  parentId: propParentId,
  parentName: propParentName,
  parentEmail: propParentEmail
}: Props) {
  const [parentName, setParentName] = useState(propParentName || "");
  const [parentEmail, setParentEmail] = useState(propParentEmail || "");
  const [selectedTeacherId, setSelectedTeacherId] = useState(userId);
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
      const response = await fetch("/api/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          userId: selectedTeacherId,
          parentId: propParentId || null,
          parentName,
          parentEmail,
          studentName,
          studentId,
          reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit challenge");
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
          Challenge Submitted
        </h2>
        <p class="text-green-800 dark:text-green-400 mb-4">
          Your challenge has been submitted and will be reviewed by the school administration.
          You will be contacted at the email address you provided.
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

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          About Book Challenges
        </h3>
        <p class="text-sm text-blue-800 dark:text-blue-400">
          Per North Carolina HB 805, parents have the right to challenge books in their child's classroom.
          This form will be reviewed by school administration and you will be contacted regarding the outcome.
        </p>
      </div>

      {error && (
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Book Information</h4>
        <dl class="space-y-1 text-sm">
          <div class="flex">
            <dt class="font-medium text-gray-700 dark:text-gray-300 w-24">Title:</dt>
            <dd class="text-gray-900 dark:text-white">{bookTitle}</dd>
          </div>
          <div class="flex">
            <dt class="font-medium text-gray-700 dark:text-gray-300 w-24">School:</dt>
            <dd class="text-gray-900 dark:text-white">{schoolName}</dd>
          </div>
        </dl>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Child's Teacher <span class="text-red-600">*</span>
        </label>
        <select
          value={selectedTeacherId}
          onChange={(e) => setSelectedTeacherId((e.target as HTMLSelectElement).value)}
          required
          class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        >
          {schoolTeachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Select your child's main teacher or homeroom teacher
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Name <span class="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={parentName}
          onInput={(e) => setParentName((e.target as HTMLInputElement).value)}
          required
          class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
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
          class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          You will be contacted at this email regarding your challenge
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
          Name of your child in this classroom
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
          placeholder="You may explain your concerns about this book (optional)..."
          class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          While optional, providing specific concerns helps administrators review your challenge more effectively
        </p>
      </div>

      <div class="flex gap-4">
        <button
          type="submit"
          disabled={submitting}
          class="flex-1 py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Challenge"}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}