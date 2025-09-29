import { useState } from "preact/hooks";
import { School } from "../utils/db.ts";

interface Props {
  parentId: string;
  parentEmail: string;
  schools: School[];
  existingStudents: Array<{
    id: string;
    name: string;
    schoolName: string;
    grade: string;
    verified: boolean;
  }>;
}

export default function StudentClaimForm({
  parentId,
  parentEmail,
  schools,
  existingStudents
}: Props) {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [schoolId, setSchoolId] = useState(schools[0]?.id || "");
  const [grade, setGrade] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState<Array<{id: string; name: string}>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load teachers when school changes
  async function loadTeachers(schoolId: string) {
    try {
      const res = await fetch(`/api/schools/${schoolId}/teachers`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers);
        setTeacherId(data.teachers[0]?.id || "");
      }
    } catch (err) {
      console.error("Failed to load teachers:", err);
    }
  }

  // Load teachers on mount and when school changes
  if (schoolId && teachers.length === 0) {
    loadTeachers(schoolId);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/students/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          studentName,
          studentId: studentId || undefined,
          schoolId,
          grade,
          teacherId: teacherId || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(`Successfully claimed ${studentName}. The teacher will be notified to verify.`);
        setStudentName("");
        setStudentId("");
        setGrade("");

        // Reload page after 2 seconds to show updated list
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to claim student");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div class="space-y-6">
      {/* Existing Students */}
      {existingStudents.length > 0 && (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Children
          </h3>
          <div class="space-y-3">
            {existingStudents.map(student => (
              <div key={student.id} class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {student.name}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {student.schoolName} • Grade {student.grade}
                  </div>
                </div>
                <div>
                  {student.verified ? (
                    <span class="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full">
                      ✓ Verified
                    </span>
                  ) : (
                    <span class="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Student */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add a Child
        </h3>

        {success && (
          <div class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Child's Name <span class="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={studentName}
              onInput={(e) => setStudentName((e.target as HTMLInputElement).value)}
              required
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="Full name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              School <span class="text-red-600">*</span>
            </label>
            <select
              value={schoolId}
              onChange={(e) => {
                const newSchoolId = (e.target as HTMLSelectElement).value;
                setSchoolId(newSchoolId);
                loadTeachers(newSchoolId);
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
              Grade <span class="text-red-600">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade((e.target as HTMLSelectElement).value)}
              required
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select grade</option>
              <option value="K">Kindergarten</option>
              <option value="1">1st Grade</option>
              <option value="2">2nd Grade</option>
              <option value="3">3rd Grade</option>
              <option value="4">4th Grade</option>
              <option value="5">5th Grade</option>
              <option value="6">6th Grade</option>
              <option value="7">7th Grade</option>
              <option value="8">8th Grade</option>
              <option value="9">9th Grade</option>
              <option value="10">10th Grade</option>
              <option value="11">11th Grade</option>
              <option value="12">12th Grade</option>
            </select>
          </div>

          {teachers.length > 0 && (
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teacher/Classroom
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId((e.target as HTMLSelectElement).value)}
                class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                <option value="">Not sure / Multiple teachers</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                If you know the specific teacher, it helps with verification
              </p>
            </div>
          )}

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student ID (Optional)
            </label>
            <input
              type="text"
              value={studentId}
              onInput={(e) => setStudentId((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="School-provided student ID"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              If you know your child's student ID, it helps verify faster
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            class="w-full py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding..." : "Add Child"}
          </button>
        </form>
      </div>

      <div class="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          After adding your children, their teachers will be notified to verify the relationship.
          Once verified, you'll be able to:
        </p>
        <ul class="mt-2 space-y-1">
          <li>• View classroom book catalogs</li>
          <li>• Challenge books if needed</li>
          <li>• Subscribe to classroom updates</li>
        </ul>
      </div>
    </div>
  );
}