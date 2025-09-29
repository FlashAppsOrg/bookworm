// Legacy User interface - kept for compatibility during migration
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  username: string;
  schoolId: string | null;
  verified: boolean;
  role: "teacher" | "delegate" | "school_admin" | "super_admin" | "parent";
  delegatedToUserIds: string[]; // If delegate, list of teacher IDs they help
  googleBooksApiKey: string | null; // Optional per-teacher API key
  googleSheetUrl: string | null; // Optional Google Sheet URL for backups
  isPlaceholder: boolean; // True if imported/created by admin, false if real user account
  createdAt: string;
}

// New shared user model for FlashApps ecosystem
export interface SharedUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  username: string;
  verified: boolean;
  createdAt: string;
  authProvider?: "email" | "google"; // Track how user authenticated

  // Platform-specific roles and permissions
  platforms: {
    bookworm?: {
      role: "teacher" | "delegate" | "school_admin" | "super_admin" | "parent";
      schoolId: string | null;
      delegatedToUserIds: string[];
      googleBooksApiKey: string | null;
      googleSheetUrl: string | null;
      isPlaceholder: boolean;
    };
    sightwords?: {
      role: "teacher" | "parent";
      subscription: "free" | "premium";
    };
  };

  // Parent-specific data
  children?: string[]; // Array of student IDs
}

export interface Student {
  id: string;
  name: string;
  parentIds: string[]; // Can have multiple parents/guardians
  schoolId: string;
  grade: string;
  studentId?: string; // School-provided ID for verification

  // Classroom assignments per platform
  classrooms: {
    bookworm?: {
      teacherId: string;
      teacherName: string;
      joinedAt: string;
      status: "active" | "inactive";
    };
    sightwords?: {
      teacherId: string;
      teacherName: string;
      level: string;
    };
  };

  // Verification status
  verified: boolean;
  verifiedBy?: string; // Teacher/admin who verified
  verifiedAt?: string;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  createdAt: string;
}

export interface ClassroomBook {
  id: string;
  userId: string;
  isbn: string | null;
  title: string;
  authors: string[];
  thumbnail: string | null;
  publisher: string | null;
  publishedDate: string | null;
  description?: string;
  categories?: string[];
  maturityRating?: string;
  pageCount?: number;
  language?: string;
  quantity: number;
  dateAdded: string;
  imported: boolean;
  addedBy?: string; // User ID of who added this book (for delegates)
}

export interface VerificationToken {
  token: string;
  email: string;
  expiresAt: string;
}

export interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: string;
  used: boolean;
}

export interface Invitation {
  id: string;
  token: string;
  teacherId: string;
  teacherName: string; // For display
  email: string | null; // Optional - can be open invite
  expiresAt: string;
  used: boolean;
  usedBy: string | null; // userId who used it
  usedAt: string | null;
  createdAt: string;
  lastSentAt: string; // Track last email send for rate limiting
}

export interface ParentStudent {
  id: string;
  parentId: string;
  parentName: string;
  studentName: string;
  studentId: string; // School-provided student ID
  teacherId: string;
  teacherName: string;
  schoolId: string;
  grade: string;
  status: "pending" | "verified" | "rejected";
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface BookChallenge {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string | null;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  schoolName: string;
  parentId: string | null; // User ID if authenticated parent
  parentName: string;
  parentEmail: string;
  parentStudentId: string | null; // Link to parent_student association
  studentName: string;
  studentId: string | null; // School student ID (optional)
  reason: string | null; // Challenge reason (optional)
  status: "pending" | "under_review" | "approved" | "denied";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

// Deno KV instance
let kv: Deno.Kv;

export async function getKv(): Promise<Deno.Kv> {
  if (!kv) {
    kv = await Deno.openKv();
  }
  return kv;
}

export interface CachedBook {
  isbn: string;
  data: any; // BookInfo structure
  cachedAt: string;
  source: "google_api" | "bulk_import";
  validated: boolean;
}

// Key patterns:
// users:email:{email} -> User
// users:id:{id} -> User
// users:username:{schoolId}:{username} -> userId
// users:delegates:{teacherId}:{delegateId} -> true (index for finding delegates)
// schools:id:{id} -> School
// schools:slug:{slug} -> schoolId
// schools:domain:{domain} -> schoolId (e.g., "wcpss.net" -> schoolId)
// classroomBooks:{userId}:{bookId} -> ClassroomBook (userId is the teacher, not delegate)
// verificationTokens:{token} -> VerificationToken
// invitations:token:{token} -> Invitation
// invitations:teacher:{teacherId}:{invitationId} -> true (index for listing teacher's invitations)
// books:isbn:{isbn} -> CachedBook (cached Google Books API responses)
// challenges:id:{challengeId} -> BookChallenge
// challenges:school:{schoolId}:{challengeId} -> true (index for school challenges)
// challenges:status:{status}:{challengeId} -> true (index for filtering by status)