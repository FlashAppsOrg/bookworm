export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  username: string;
  schoolId: string | null;
  verified: boolean;
  role: "teacher" | "delegate";
  delegatedToUserId: string | null; // If delegate, which teacher's classroom they help with
  googleBooksApiKey: string | null; // Optional per-teacher API key
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  slug: string;
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
  dateAdded: string;
}

export interface VerificationToken {
  token: string;
  email: string;
  expiresAt: string;
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
}

// Key patterns:
// users:email:{email} -> User
// users:id:{id} -> User
// users:username:{schoolId}:{username} -> userId
// users:delegates:{teacherId}:{delegateId} -> true (index for finding delegates)
// schools:id:{id} -> School
// schools:slug:{slug} -> schoolId
// classroomBooks:{userId}:{bookId} -> ClassroomBook (userId is the teacher, not delegate)
// verificationTokens:{token} -> VerificationToken
// invitations:token:{token} -> Invitation
// invitations:teacher:{teacherId}:{invitationId} -> true (index for listing teacher's invitations)
// books:isbn:{isbn} -> CachedBook (cached Google Books API responses)