import { useState, useEffect } from "preact/hooks";

interface BookChallenge {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string | null;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  schoolName: string;
  parentName: string;
  parentEmail: string;
  studentName?: string;
  reason: string;
  status: "pending" | "under_review" | "approved" | "denied";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

interface Props {
  isSuperAdmin: boolean;
}

export default function ChallengeReview({ isSuperAdmin }: Props) {
  const [challenges, setChallenges] = useState<BookChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [selectedChallenge, setSelectedChallenge] = useState<BookChallenge | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, [statusFilter, schoolFilter]);

  async function fetchChallenges() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (isSuperAdmin && schoolFilter !== "all") params.append("school", schoolFilter);

      const response = await fetch(`/api/admin/challenges?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
      }
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateChallenge(e: Event) {
    e.preventDefault();
    if (!selectedChallenge || !newStatus) return;

    setUpdating(true);
    try {
      const response = await fetch("/api/admin/challenges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: selectedChallenge.id,
          status: newStatus,
          reviewNotes,
        }),
      });

      if (response.ok) {
        await fetchChallenges();
        setSelectedChallenge(null);
        setNewStatus("");
        setReviewNotes("");
      } else {
        alert("Failed to update challenge");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  function openReviewModal(challenge: BookChallenge) {
    setSelectedChallenge(challenge);
    setNewStatus(challenge.status);
    setReviewNotes(challenge.reviewNotes || "");
  }

  function closeReviewModal() {
    setSelectedChallenge(null);
    setNewStatus("");
    setReviewNotes("");
  }

  const schools = Array.from(new Set(challenges.map((c) => c.schoolName))).sort();

  const statusColors = {
    pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-300",
    under_review: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300",
    approved: "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300",
    denied: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-300",
  };

  return (
    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value)}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>

          {isSuperAdmin && schools.length > 0 && (
            <div class="flex-1">
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
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <p class="text-gray-600 dark:text-gray-400">Loading challenges...</p>
        </div>
      ) : challenges.length === 0 ? (
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div class="text-6xl mb-4">📋</div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Challenges Found
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            There are no book challenges matching your filters.
          </p>
        </div>
      ) : (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Date</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Book</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Teacher</th>
                  {isSuperAdmin && <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">School</th>}
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Parent</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                {challenges.map((challenge) => (
                  <tr key={challenge.id} class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(challenge.createdAt).toLocaleDateString()}
                    </td>
                    <td class="px-4 py-3">
                      <span class={`text-xs px-2 py-1 rounded font-semibold ${statusColors[challenge.status]}`}>
                        {challenge.status.replace("_", " ")}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs">
                      <div class="font-medium">{challenge.bookTitle}</div>
                      {challenge.bookIsbn && (
                        <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {challenge.bookIsbn}
                        </div>
                      )}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {challenge.teacherName}
                    </td>
                    {isSuperAdmin && (
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {challenge.schoolName}
                      </td>
                    )}
                    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <div>{challenge.parentName}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{challenge.parentEmail}</div>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        onClick={() => openReviewModal(challenge)}
                        class="px-3 py-1.5 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-dark"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedChallenge && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              <div class="flex justify-between items-start mb-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Review Challenge
                </h2>
                <button
                  onClick={closeReviewModal}
                  class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="space-y-4 mb-6">
                <div>
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Book Information</h3>
                  <p class="text-gray-900 dark:text-white font-medium">{selectedChallenge.bookTitle}</p>
                  {selectedChallenge.bookIsbn && (
                    <p class="text-sm text-gray-600 dark:text-gray-400 font-mono">ISBN: {selectedChallenge.bookIsbn}</p>
                  )}
                </div>

                <div>
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Teacher</h3>
                  <p class="text-gray-900 dark:text-white">{selectedChallenge.teacherName}</p>
                </div>

                <div>
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">School</h3>
                  <p class="text-gray-900 dark:text-white">{selectedChallenge.schoolName}</p>
                </div>

                <div>
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Parent Information</h3>
                  <p class="text-gray-900 dark:text-white">{selectedChallenge.parentName}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{selectedChallenge.parentEmail}</p>
                  {selectedChallenge.studentName && (
                    <p class="text-sm text-gray-600 dark:text-gray-400">Student: {selectedChallenge.studentName}</p>
                  )}
                </div>

                <div>
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Reason for Challenge</h3>
                  <p class="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedChallenge.reason}</p>
                </div>

                <div>
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Submitted</h3>
                  <p class="text-gray-900 dark:text-white">
                    {new Date(selectedChallenge.createdAt).toLocaleString()}
                  </p>
                </div>

                {selectedChallenge.reviewedAt && (
                  <div>
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Last Reviewed</h3>
                    <p class="text-gray-900 dark:text-white">
                      {new Date(selectedChallenge.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={updateChallenge} class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status <span class="text-red-600">*</span>
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus((e.target as HTMLSelectElement).value)}
                    required
                    class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onInput={(e) => setReviewNotes((e.target as HTMLTextAreaElement).value)}
                    rows={4}
                    placeholder="Add internal notes about this review..."
                    class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div class="flex gap-4">
                  <button
                    type="submit"
                    disabled={updating}
                    class="flex-1 py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? "Updating..." : "Update Challenge"}
                  </button>
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}