import { getCookies } from "$std/http/cookie.ts";
import { getUserById } from "./db-helpers.ts";
import { User } from "./db.ts";

export interface Session {
  userId: string;
  email: string;
  role: "teacher" | "delegate";
}

export async function getSession(req: Request): Promise<Session | null> {
  const cookies = getCookies(req.headers);
  const sessionCookie = cookies.session;

  if (!sessionCookie) return null;

  try {
    return JSON.parse(atob(sessionCookie));
  } catch {
    return null;
  }
}

export async function getUserFromSession(req: Request): Promise<User | null> {
  const session = await getSession(req);
  if (!session) return null;

  return await getUserById(session.userId);
}