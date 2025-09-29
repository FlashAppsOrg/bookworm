/**
 * Shared authentication system for FlashApps ecosystem
 * Handles authentication across multiple platforms with shared users database
 */

import { getUsersKv, getBookwormKv } from "./db-shared.ts";
import { SharedUser, Student } from "./db.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

/**
 * Create a new shared user account
 */
export async function createSharedUser(
  email: string,
  password: string | null,
  displayName: string,
  role: "teacher" | "parent" | "delegate",
  authProvider: "email" | "google" = "email",
  schoolId?: string
): Promise<SharedUser> {
  const usersKv = await getUsersKv();
  const bookwormKv = await getBookwormKv();

  // Check if user already exists
  const existing = await usersKv.get(["users:email", email.toLowerCase()]);
  if (existing.value) {
    throw new Error("User already exists");
  }

  // Create user
  const userId = crypto.randomUUID();
  const user: SharedUser = {
    id: userId,
    email: email.toLowerCase(),
    passwordHash: password ? await bcrypt.hash(password) : "", // Empty for OAuth users
    displayName,
    username: "", // Will be set later if needed
    verified: authProvider === "google", // Google users are pre-verified
    createdAt: new Date().toISOString(),
    authProvider,
    platforms: {
      bookworm: {
        role,
        schoolId: schoolId || null,
        delegatedToUserIds: [],
        googleBooksApiKey: null,
        googleSheetUrl: null,
        isPlaceholder: false,
      }
    },
    children: [],
  };

  // Save to shared users database
  await usersKv.set(["users:id", userId], user);
  await usersKv.set(["users:email", email.toLowerCase()], user);

  // Save platform-specific reference
  await bookwormKv.set(["user_platform_data", userId], {
    role,
    schoolId: schoolId || null,
  });

  return user;
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<SharedUser | null> {
  const usersKv = await getUsersKv();

  const result = await usersKv.get<SharedUser>(["users:email", email.toLowerCase()]);
  if (!result.value) return null;

  const user = result.value;

  // Check if user has bookworm access
  if (!user.platforms?.bookworm) {
    // Add bookworm platform access for existing users
    user.platforms = user.platforms || {};
    user.platforms.bookworm = {
      role: "parent", // Default role for new platform access
      schoolId: null,
      delegatedToUserIds: [],
      googleBooksApiKey: null,
      googleSheetUrl: null,
      isPlaceholder: false,
    };
    await usersKv.set(["users:id", user.id], user);
    await usersKv.set(["users:email", email.toLowerCase()], user);
  }

  // Verify password
  if (!user.passwordHash) return null;
  const isValid = await bcrypt.compare(password, user.passwordHash);

  return isValid ? user : null;
}

/**
 * Get or create user from Google OAuth
 */
export async function getOrCreateGoogleUser(
  googleUser: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  }
): Promise<SharedUser> {
  const usersKv = await getUsersKv();

  // Check if user exists
  const existing = await usersKv.get<SharedUser>(["users:email", googleUser.email.toLowerCase()]);

  if (existing.value) {
    const user = existing.value;

    // Update display name if changed
    if (user.displayName !== googleUser.name) {
      user.displayName = googleUser.name;
      await usersKv.set(["users:id", user.id], user);
      await usersKv.set(["users:email", user.email], user);
    }

    // Ensure bookworm platform access
    if (!user.platforms?.bookworm) {
      user.platforms = user.platforms || {};
      user.platforms.bookworm = {
        role: "parent",
        schoolId: null,
        delegatedToUserIds: [],
        googleBooksApiKey: null,
        googleSheetUrl: null,
        isPlaceholder: false,
      };
      await usersKv.set(["users:id", user.id], user);
      await usersKv.set(["users:email", user.email], user);
    }

    return user;
  }

  // Create new user
  return await createSharedUser(
    googleUser.email,
    null, // No password for Google users
    googleUser.name,
    "parent", // Default role for new Google users
    "google"
  );
}

/**
 * Create or claim a student
 */
export async function createOrClaimStudent(
  parentId: string,
  studentName: string,
  schoolId: string,
  grade: string,
  teacherId?: string,
  studentId?: string
): Promise<Student> {
  const usersKv = await getUsersKv();

  // Check if student exists (by school ID if provided)
  let student: Student | null = null;

  if (studentId) {
    // Try to find existing student by school-provided ID
    const result = await usersKv.get<Student>(["students:school_id", schoolId, studentId]);
    if (result.value) {
      student = result.value;
    }
  }

  if (!student) {
    // Create new student
    const id = crypto.randomUUID();
    student = {
      id,
      name: studentName,
      parentIds: [parentId],
      schoolId,
      grade,
      studentId,
      classrooms: {},
      verified: false,
      createdAt: new Date().toISOString(),
    };

    // Add classroom assignment if teacher provided
    if (teacherId) {
      // Get teacher info
      const teacherResult = await usersKv.get<SharedUser>(["users:id", teacherId]);
      if (teacherResult.value) {
        student.classrooms.bookworm = {
          teacherId,
          teacherName: teacherResult.value.displayName,
          joinedAt: new Date().toISOString(),
          status: "active",
        };
      }
    }

    await usersKv.set(["students:id", id], student);
    if (studentId) {
      await usersKv.set(["students:school_id", schoolId, studentId], student);
    }
  } else {
    // Add parent to existing student
    if (!student.parentIds.includes(parentId)) {
      student.parentIds.push(parentId);
      await usersKv.set(["students:id", student.id], student);
      if (student.studentId) {
        await usersKv.set(["students:school_id", schoolId, student.studentId], student);
      }
    }
  }

  // Update parent's children list
  const parentResult = await usersKv.get<SharedUser>(["users:id", parentId]);
  if (parentResult.value) {
    const parent = parentResult.value;
    parent.children = parent.children || [];
    if (!parent.children.includes(student.id)) {
      parent.children.push(student.id);
      await usersKv.set(["users:id", parentId], parent);
      await usersKv.set(["users:email", parent.email], parent);
    }
  }

  // Create parent-student relationship for tracking
  await usersKv.set(["parent_students", parentId, student.id], {
    parentId,
    studentId: student.id,
    createdAt: new Date().toISOString(),
  });

  return student;
}

/**
 * Get all students for a parent
 */
export async function getParentStudents(parentId: string): Promise<Student[]> {
  const usersKv = await getUsersKv();

  const students: Student[] = [];
  const iter = usersKv.list<{ studentId: string }>({ prefix: ["parent_students", parentId] });

  for await (const entry of iter) {
    const studentResult = await usersKv.get<Student>(["students:id", entry.value.studentId]);
    if (studentResult.value) {
      students.push(studentResult.value);
    }
  }

  return students;
}

/**
 * Verify a student (teacher/admin action)
 */
export async function verifyStudent(
  studentId: string,
  verifierId: string
): Promise<void> {
  const usersKv = await getUsersKv();

  const result = await usersKv.get<Student>(["students:id", studentId]);
  if (!result.value) {
    throw new Error("Student not found");
  }

  const student = result.value;
  student.verified = true;
  student.verifiedBy = verifierId;
  student.verifiedAt = new Date().toISOString();

  await usersKv.set(["students:id", studentId], student);
  if (student.studentId && student.schoolId) {
    await usersKv.set(["students:school_id", student.schoolId, student.studentId], student);
  }
}

/**
 * Move student between classrooms
 */
export async function moveStudentClassroom(
  studentId: string,
  newTeacherId: string,
  platform: "bookworm" | "sightwords" = "bookworm"
): Promise<void> {
  const usersKv = await getUsersKv();

  const studentResult = await usersKv.get<Student>(["students:id", studentId]);
  if (!studentResult.value) {
    throw new Error("Student not found");
  }

  const teacherResult = await usersKv.get<SharedUser>(["users:id", newTeacherId]);
  if (!teacherResult.value) {
    throw new Error("Teacher not found");
  }

  const student = studentResult.value;
  const teacher = teacherResult.value;

  // Update classroom assignment
  student.classrooms = student.classrooms || {};

  if (platform === "bookworm") {
    // Deactivate old classroom if exists
    if (student.classrooms.bookworm) {
      student.classrooms.bookworm.status = "inactive";
    }

    // Add new classroom
    student.classrooms.bookworm = {
      teacherId: newTeacherId,
      teacherName: teacher.displayName,
      joinedAt: new Date().toISOString(),
      status: "active",
    };
  }

  await usersKv.set(["students:id", studentId], student);
  if (student.studentId && student.schoolId) {
    await usersKv.set(["students:school_id", student.schoolId, student.studentId], student);
  }
}

/**
 * Check if a user can act as a delegate for another user
 */
export async function canActAsDelegate(
  delegateId: string,
  teacherId: string
): Promise<boolean> {
  const usersKv = await getUsersKv();

  const delegateResult = await usersKv.get<SharedUser>(["users:id", delegateId]);
  if (!delegateResult.value) return false;

  const delegate = delegateResult.value;
  const bookworm = delegate.platforms?.bookworm;

  if (!bookworm) return false;

  // Check if user is a delegate for this teacher
  return bookworm.role === "delegate" && bookworm.delegatedToUserIds.includes(teacherId);
}

/**
 * Convert legacy User to SharedUser
 */
export function legacyToSharedUser(legacyUser: any): SharedUser {
  return {
    id: legacyUser.id,
    email: legacyUser.email,
    passwordHash: legacyUser.passwordHash,
    displayName: legacyUser.displayName,
    username: legacyUser.username,
    verified: legacyUser.verified,
    createdAt: legacyUser.createdAt,
    authProvider: "email",
    platforms: {
      bookworm: {
        role: legacyUser.role,
        schoolId: legacyUser.schoolId,
        delegatedToUserIds: legacyUser.delegatedToUserIds || [],
        googleBooksApiKey: legacyUser.googleBooksApiKey,
        googleSheetUrl: legacyUser.googleSheetUrl,
        isPlaceholder: legacyUser.isPlaceholder || false,
      }
    },
    children: [],
  };
}

/**
 * Convert SharedUser to legacy User format (for backwards compatibility)
 */
export function sharedToLegacyUser(sharedUser: SharedUser): any {
  const bookworm = sharedUser.platforms?.bookworm || {
    role: "parent",
    schoolId: null,
    delegatedToUserIds: [],
    googleBooksApiKey: null,
    googleSheetUrl: null,
    isPlaceholder: false,
  };

  return {
    id: sharedUser.id,
    email: sharedUser.email,
    passwordHash: sharedUser.passwordHash,
    displayName: sharedUser.displayName,
    username: sharedUser.username,
    schoolId: bookworm.schoolId,
    verified: sharedUser.verified,
    role: bookworm.role,
    delegatedToUserIds: bookworm.delegatedToUserIds,
    googleBooksApiKey: bookworm.googleBooksApiKey,
    googleSheetUrl: bookworm.googleSheetUrl,
    isPlaceholder: bookworm.isPlaceholder,
    createdAt: sharedUser.createdAt,
  };
}