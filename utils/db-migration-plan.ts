/**
 * Database Migration Plan: Shared Users Database
 *
 * PHASE 1: Database Setup
 * - Create FLASHAPPS_USERS_KV in Deno Deploy
 * - Keep BOOKWORM_KV for platform-specific data
 *
 * PHASE 2: User Model Enhancement
 */

export interface SharedUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  username: string;
  verified: boolean;
  createdAt: string;

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
      // sightwords specific fields
    };
    // Future platforms...
  };

  // Shared parent data
  children?: Student[];
}

export interface Student {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string;
  grade: string;

  // Current classroom assignments per platform
  classrooms: {
    bookworm?: {
      teacherId: string;
      teacherName: string;
      joinedAt: string;
    };
    sightwords?: {
      teacherId: string;
      teacherName: string;
      level: string;
    };
  };

  // School-provided ID for verification
  studentId?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

/**
 * PHASE 3: Migration Steps
 *
 * 1. Export existing users from BOOKWORM_KV
 * 2. Transform to SharedUser format
 * 3. Import to FLASHAPPS_USERS_KV
 * 4. Update app to use dual KV connections
 * 5. Test authentication flows
 * 6. Deploy and monitor
 */

export async function migrateUsers() {
  // This will be implemented to:
  // 1. Connect to old KV
  // 2. Read all users
  // 3. Transform to new format
  // 4. Write to shared KV
  // 5. Keep platform-specific data in BOOKWORM_KV
}