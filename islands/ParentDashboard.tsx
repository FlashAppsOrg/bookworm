import { useState } from "preact/hooks";
import { BookChallenge, User } from "../utils/db.ts";

interface Props {
  user: User;
  challenges: BookChallenge[];
}

export default function ParentDashboard({ user, challenges }: Props) {
  const [filter, setFilter] = useState<"all" | "pending" | "under_review" | "approved" | "denied">("all");

  const filteredChallenges = challenges.filter(challenge =>
    filter === "all" || challenge.status === filter
  );

  const statusCounts = {
    all: challenges.length,
    pending: challenges.filter(c => c.status === "pending").length,
    under_review: challenges.filter(c => c.status === "under_review").length,
    approved: challenges.filter(c => c.status === "approved").length,
    denied: challenges.filter(c => c.status === "denied").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "under_review": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "approved": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "denied": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Parent Dashboard
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {user.displayName}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <a
              href="/"
              class="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Browse Schools
            </a>
            <button
              onClick={handleLogout}
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Book Challenges
        </h2>
        <div class="flex flex-wrap gap-2 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              class={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")} ({count})
            </button>
          ))}
        </div>

        {/* Challenges List */}
        {filteredChallenges.length === 0 ? (
          <div class="text-center py-12">
            <div class="text-6xl mb-4">📚</div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No challenges {filter !== "all" ? `with status "${filter}"` : "yet"}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              {filter === "all"
                ? "You haven't submitted any book challenges yet."
                : `No challenges are currently ${filter.replace("_", " ")}.`}
            </p>
            <a
              href="/parent-signup"
              class="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Browse School Books
            </a>
          </div>
        ) : (
          <div class="space-y-4">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div class="flex-1">
                    <h3 class="font-bold text-lg text-gray-900 dark:text-white">
                      {challenge.bookTitle}
                    </h3>
                    <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                      <p><strong>Teacher:</strong> {challenge.teacherName}</p>
                      <p><strong>School:</strong> {challenge.schoolName}</p>
                      <p><strong>Student:</strong> {challenge.studentName}</p>
                      <p><strong>Submitted:</strong> {new Date(challenge.createdAt).toLocaleDateString()}</p>
                      {challenge.reviewedAt && (
                        <p><strong>Reviewed:</strong> {new Date(challenge.reviewedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    {challenge.reason && (
                      <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your concerns:</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">{challenge.reason}</p>
                      </div>
                    )}
                    {challenge.reviewNotes && (
                      <div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <p class="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">School response:</p>
                        <p class="text-sm text-blue-600 dark:text-blue-400">{challenge.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <span class={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
                      {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1).replace("_", " ")}
                    </span>
                    {challenge.bookIsbn && (
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        ISBN: {challenge.bookIsbn}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          About Book Challenges
        </h3>
        <div class="text-sm text-blue-800 dark:text-blue-400 space-y-2">
          <p>
            <strong>Pending:</strong> Your challenge has been submitted and is waiting for review.
          </p>
          <p>
            <strong>Under Review:</strong> School administrators are actively reviewing your challenge.
          </p>
          <p>
            <strong>Approved:</strong> Your challenge was approved and action has been taken.
          </p>
          <p>
            <strong>Denied:</strong> Your challenge was reviewed but not approved. See school response for details.
          </p>
        </div>
      </div>
    </div>
  );
}