import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { getKv, School } from "../../../utils/db.ts";

export const handler: Handlers = {
  async POST(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { schoolId, name, slug, domain } = await req.json();

    if (!schoolId || !name || !slug) {
      return new Response(JSON.stringify({ error: "schoolId, name, and slug required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();

    const school: School = {
      id: schoolId,
      name,
      slug,
      domain: domain || null,
      createdAt: new Date().toISOString(),
    };

    await kv.set(["schools", "id", schoolId], school);
    await kv.set(["schools", "slug", slug], schoolId);
    if (school.domain) {
      await kv.set(["schools", "domain", school.domain], schoolId);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `School "${name}" restored with ID ${schoolId}`,
      school
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};