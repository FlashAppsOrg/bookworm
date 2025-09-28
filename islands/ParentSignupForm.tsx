import { useState, useEffect } from "preact/hooks";

interface Teacher {
  id: string;
  displayName: string;
  username: string;
}

interface Props {
  bookId?: string;
  userId?: string;
  schoolId?: string;
}

export default function ParentSignupForm({ bookId, userId, schoolId }: Props) {
  const [step, setStep] = useState(1); // 1: Account, 2: Student Info
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Account info
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Student info
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSchool, setSelectedSchool] = useState(schoolId || "");
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // Load schools list
    fetch("/api/schools")
      .then(res => res.json())
      .then(data => setSchools(data.schools || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Load teachers when school is selected
    if (selectedSchool) {
      fetch(`/api/teachers/list?schoolId=${selectedSchool}`)
        .then(res => res.json())
        .then(data => setTeachers(data.teachers || []))
        .catch(console.error);

      // Pre-select teacher if we have userId
      if (userId && !selectedTeacher) {
        setSelectedTeacher(userId);
      }
    }
  }, [selectedSchool, userId]);

  const handleAccountSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // Move to student info step
    setStep(2);
  };

  const handleFinalSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!selectedSchool) {
      setError("Please select a school");
      setLoading(false);
      return;
    }

    if (!selectedTeacher) {
      setError("Please select your child's teacher");
      setLoading(false);
      return;
    }

    if (!studentId.trim()) {
      setError("Student ID is required for verification");
      setLoading(false);
      return;
    }

    try {
      // Create parent account
      const signupRes = await fetch("/api/auth/parent-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          displayName,
          schoolId: selectedSchool,
          studentInfo: {
            studentName,
            studentId,
            grade,
            teacherId: selectedTeacher,
          },
        }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        throw new Error(signupData.error || "Signup failed");
      }

      // Redirect to success page or back to challenge if we came from there
      if (bookId && userId) {
        window.location.href = `/challenge-book?bookId=${bookId}&userId=${userId}&registered=true`;
      } else {
        window.location.href = "/parent-dashboard";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setLoading(false);
    }
  };

  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      {error && (
        <div class="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleAccountSubmit} class="space-y-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Step 1: Create Your Account
          </h2>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Full Name
            </label>
            <input
              type="text"
              value={displayName}
              onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
              required
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              required
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="parent@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              required
              minLength={8}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
              required
              minLength={8}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="Re-enter your password"
            />
          </div>

          <button
            type="submit"
            class="w-full py-3 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold transition-all"
          >
            Continue to Student Information
          </button>
        </form>
      ) : (
        <form onSubmit={handleFinalSubmit} class="space-y-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Step 2: Student Information
          </h2>

          <p class="text-gray-600 dark:text-gray-400 mb-4">
            This information will be verified by your child's teacher before you can review classroom materials.
          </p>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              School
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool((e.target as HTMLSelectElement).value)}
              required
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select your child's school</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student Full Name
            </label>
            <input
              type="text"
              value={studentName}
              onInput={(e) => setStudentName((e.target as HTMLInputElement).value)}
              required
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="As it appears in school records"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student ID Number
            </label>
            <input
              type="text"
              value={studentId}
              onInput={(e) => setStudentId((e.target as HTMLInputElement).value)}
              required
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="School-provided student ID"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This is required for verification. Contact your school if you don't know your child's ID.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grade Level
            </label>
            <input
              type="text"
              value={grade}
              onInput={(e) => setGrade((e.target as HTMLInputElement).value)}
              required
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 3rd, 4th, 5th"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Homeroom Teacher
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher((e.target as HTMLSelectElement).value)}
              required
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              disabled={!selectedSchool}
            >
              <option value="">Select your child's teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.displayName} ({teacher.username})
                </option>
              ))}
            </select>
          </div>

          <div class="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              class="flex-1 py-3 px-6 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              class="flex-1 py-3 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <div class="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p class="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> After creating your account, your child's teacher will need to verify your
              information before you can review or challenge classroom books. You'll receive an email once verified.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}