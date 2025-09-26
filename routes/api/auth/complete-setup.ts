import { Handlers } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { getUserById, updateUser, getSchoolById, createSchool, isUsernameAvailable, reserveUsername, slugify } from "../../../utils/db-helpers.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const cookies = getCookies(req.headers);
      const sessionCookie = cookies.session;

      if (!sessionCookie) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      let session;
      try {
        session = JSON.parse(atob(sessionCookie));
      } catch {
        return new Response(JSON.stringify({ error: "Invalid session" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const user = await getUserById(session.userId);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { schoolId, newSchoolName, username } = body;

      if (!username || !/^[a-z0-9-]+$/.test(username)) {
        return new Response(JSON.stringify({ error: "Invalid username format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      let finalSchoolId = schoolId;

      if (!schoolId && newSchoolName) {
        const schoolSlug = slugify(newSchoolName);
        const newSchool = await createSchool(newSchoolName, schoolSlug);
        finalSchoolId = newSchool.id;
      }

      if (!finalSchoolId) {
        return new Response(JSON.stringify({ error: "School is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const school = await getSchoolById(finalSchoolId);
      if (!school) {
        return new Response(JSON.stringify({ error: "School not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const usernameAvailable = await isUsernameAvailable(finalSchoolId, username);
      if (!usernameAvailable) {
        return new Response(JSON.stringify({ error: "Username already taken at this school" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await reserveUsername(finalSchoolId, username, user.id);

      user.schoolId = finalSchoolId;
      user.username = username.toLowerCase();
      await updateUser(user);

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          username: user.username,
          schoolId: user.schoolId,
          role: user.role,
        },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Setup error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};