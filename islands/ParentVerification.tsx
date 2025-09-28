import { useState, useEffect } from "preact/hooks";
import { User, ParentStudent } from "../utils/db.ts";

interface Props {
  user: User;
}

interface ExtendedParentStudent extends ParentStudent {
  parentEmail?: string;
}

export default function ParentVerification({ user }: Props) {
  const [associations, setAssociations] = useState<ExtendedParentStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchAssociations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/parent-associations?filter=${filter}`);
      if (!response.ok) throw new Error("Failed to fetch associations");

      const data = await response.json();
      setAssociations(data.associations || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssociations();
  }, [filter]);

  const handleVerify = async (associationId: string, action: "verify" | "reject", reason?: string) => {
    setProcessing(associationId);

    try {
      const response = await fetch("/api/admin/verify-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          associationId,
          action,
          reason: action === "reject" ? reason : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update association");
      }

      // Refresh the list
      await fetchAssociations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "verified":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (loading && associations.length === 0) {
    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p class="mt-2 text-gray-600 dark:text-gray-400">Loading parent associations...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setFilter("pending")}
            class={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "pending"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Pending ({associations.filter(a => a.status === "pending").length})
          </button>
          <button
            onClick={() => setFilter("verified")}
            class={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "verified"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => setFilter("rejected")}
            class={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "rejected"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter("all")}
            class={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
        </div>

        {error && (
          <div class="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {associations.length === 0 ? (
          <div class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No {filter === "all" ? "" : filter} parent associations
            </h3>
            <p class="mt-1 text-gray-500 dark:text-gray-400">
              Parent associations will appear here when parents register
            </p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Parent
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {associations.map((assoc) => (
                  <tr key={assoc.id} class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {assoc.parentName}
                        </div>
                        {assoc.parentEmail && (
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            {assoc.parentEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {assoc.studentName}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          ID: {assoc.studentId}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          Grade: {assoc.grade}
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-white">
                        {assoc.teacherName}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(assoc.status)}`}>
                        {assoc.status}
                      </span>
                      {assoc.status === "rejected" && assoc.rejectionReason && (
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {assoc.rejectionReason}
                        </p>
                      )}
                      {assoc.status === "verified" && assoc.verifiedAt && (
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(assoc.verifiedAt).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(assoc.createdAt).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {assoc.status === "pending" && (
                        <div class="flex justify-end gap-2">
                          <button
                            onClick={() => handleVerify(assoc.id, "verify")}
                            disabled={processing === assoc.id}
                            class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold disabled:opacity-50"
                          >
                            {processing === assoc.id ? "..." : "Verify"}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Reason for rejection:");
                              if (reason) handleVerify(assoc.id, "reject", reason);
                            }}
                            disabled={processing === assoc.id}
                            class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {assoc.status === "verified" && (
                        <span class="text-green-600 dark:text-green-400">✓ Verified</span>
                      )}
                      {assoc.status === "rejected" && (
                        <button
                          onClick={() => handleVerify(assoc.id, "verify")}
                          disabled={processing === assoc.id}
                          class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-semibold disabled:opacity-50"
                        >
                          Re-verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filter === "pending" && associations.length > 0 && (
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Verification Guidelines
          </h3>
          <ul class="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Verify the student ID matches your school records</li>
            <li>• Confirm the student is in the specified teacher's class</li>
            <li>• Check that the parent name is associated with the student</li>
            <li>• Contact the school office if you need to verify parent identity</li>
          </ul>
        </div>
      )}
    </div>
  );
}