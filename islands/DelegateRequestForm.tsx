import { useState } from "preact/hooks";
import { School } from "../utils/db.ts";

interface Props {
  schools: School[];
}

export default function DelegateRequestForm({ schools }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [schoolId, setSchoolId] = useState(schools[0]?.id || "");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teachers, setTeachers] = useState<Array<{id: string; name: string; email: string}>>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"account" | "teacher">("account");
  const [accountCreated, setAccountCreated] = useState(false);

  // Load teachers when school changes
  async function loadTeachers(schoolId: string) {
    try {
      const res = await fetch(`/api/schools/${schoolId}/teachers`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
        if (data.teachers?.length > 0) {
          setSelectedTeacherId(data.teachers[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load teachers:", err);
    }
  }

  // Load teachers on mount and when school changes
  if (schoolId && teachers.length === 0 && step === "teacher") {
    loadTeachers(schoolId);
  }

  async function handleAccountSubmit(e: Event) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/delegate-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
          schoolId,
        }),
      });

      if (res.ok) {
        setAccountCreated(true);
        setStep("teacher");
        // Load teachers for the selected school
        await loadTeachers(schoolId);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create account");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTeacherRequest(e: Event) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Determine which teacher to request
      const teacherToRequest = selectedTeacherId || teacherEmail;

      if (!teacherToRequest) {
        setError("Please select a teacher or enter their email");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/delegate/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacherId || undefined,
          teacherEmail: teacherEmail || undefined,
          message: `${displayName} would like to help organize your classroom library.`,
        }),
      });

      if (res.ok) {
        // Show success and redirect
        window.location.href = "/delegate-request-sent";
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send request");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "account" && !accountCreated) {
    return (
      <form onSubmit={handleAccountSubmit} class="space-y-4">
        {error && (
          <div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Name <span class="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
            required
            class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address <span class="text-red-600">*</span>
          </label>
          <input
            type="email"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            required
            class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            School <span class="text-red-600">*</span>
          </label>
          <select
            value={schoolId}
            onChange={(e) => {
              setSchoolId((e.target as HTMLSelectElement).value);
              setTeachers([]); // Reset teachers when school changes
            }}
            required
            class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
          >
            {schools.map(school => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password <span class="text-red-600">*</span>
          </label>
          <input
            type="password"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            required
            minLength={8}
            class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password <span class="text-red-600">*</span>
          </label>
          <input
            type="password"
            value={confirmPassword}
            onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
            required
            minLength={8}
            class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          class="w-full py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating Account..." : "Create Account & Continue"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleTeacherRequest} class="space-y-4">
      {error && (
        <div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {accountCreated && (
        <div class="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
          ✓ Account created successfully! Now select the teacher you want to help.
        </div>
      )}

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Teacher to Help
        </label>

        {teachers.length > 0 ? (
          <>
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                setSelectedTeacherId((e.target as HTMLSelectElement).value);
                setTeacherEmail(""); // Clear email if selecting from list
              }}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white mb-3"
            >
              <option value="">Select a teacher...</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>

            <div class="text-center text-gray-500 dark:text-gray-400 text-sm my-2">
              — OR —
            </div>
          </>
        ) : (
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            No teachers found at this school yet. Enter their email below:
          </p>
        )}

        <input
          type="email"
          value={teacherEmail}
          onInput={(e) => {
            setTeacherEmail((e.target as HTMLInputElement).value);
            setSelectedTeacherId(""); // Clear selection if entering email
          }}
          placeholder="teacher@school.edu"
          class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Don't see your teacher? Enter their email address
        </p>
      </div>

      <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
        <p class="text-sm text-yellow-800 dark:text-yellow-400">
          <strong>Note:</strong> The teacher will need to approve your request before you can help manage their library.
          You'll receive an email when they respond.
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting || (!selectedTeacherId && !teacherEmail)}
        class="w-full py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending Request..." : "Send Request to Teacher"}
      </button>
    </form>
  );
}