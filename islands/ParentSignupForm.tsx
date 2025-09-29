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
  step?: string;
}

export default function ParentSignupForm({ bookId, userId, schoolId, step: initialStep }: Props) {
  const [step, setStep] = useState(initialStep === "student" ? 2 : 1); // 1: Account, 2: Student Info
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignup = () => {
    const params = new URLSearchParams();
    if (bookId) params.set("bookId", bookId);
    if (userId) params.set("userId", userId);
    if (schoolId) params.set("schoolId", schoolId);

    const redirectUrl = `/api/auth/google/login?${params.toString()}`;
    window.location.href = redirectUrl;
  };

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

    if (initialStep !== "student" && !studentId.trim()) {
      setError("Student ID is required for verification");
      setLoading(false);
      return;
    }

    try {
      let signupRes: Response;
      let signupData: any;

      if (initialStep === "student") {
        // Google Auth user completing student verification
        signupRes = await fetch("/api/auth/parent-student-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentName,
            studentId,
            grade,
            teacherId: selectedTeacher,
            schoolId: selectedSchool,
          }),
        });
      } else {
        // Regular form signup
        signupRes = await fetch("/api/auth/parent-signup", {
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
      }

      signupData = await signupRes.json();

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
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Step 1: Create Your Account
          </h2>

          {/* Google Auth Option */}
          <div class="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignup}
              class="w-full flex items-center justify-center gap-3 py-3 px-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or create account with email
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleAccountSubmit} class="space-y-6">
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
        </div>
      ) : (
        <form onSubmit={handleFinalSubmit} class="space-y-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {initialStep === "student" ? "Complete Your Profile" : "Step 2: Student Information"}
          </h2>

          {initialStep === "student" ? (
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <p class="text-green-800 dark:text-green-400">
                ✓ Welcome! Your Google account has been created. Please provide your child's information below for teacher verification.
              </p>
            </div>
          ) : (
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              This information will be verified by your child's teacher before you can review classroom materials.
            </p>
          )}

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
              Student ID Number {initialStep !== "student" && <span class="text-red-600">*</span>}
              {initialStep === "student" && <span class="text-gray-500">(Optional)</span>}
            </label>
            <input
              type="text"
              value={studentId}
              onInput={(e) => setStudentId((e.target as HTMLInputElement).value)}
              required={initialStep !== "student"}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="School-provided student ID"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {initialStep === "student"
                ? "If you know your child's student ID, it helps speed up verification. You can also provide this later."
                : "This is required for verification. Contact your school if you don't know your child's ID."
              }
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