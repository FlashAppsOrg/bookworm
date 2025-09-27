import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { getKv, School } from "../../../utils/db.ts";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const handler: Handlers = {
  async GET(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();
    const schools: School[] = [];

    const entries = kv.list<School>({ prefix: ["schools", "id"] });
    for await (const entry of entries) {
      schools.push(entry.value);
    }

    schools.sort((a, b) => a.name.localeCompare(b.name));

    return new Response(JSON.stringify(schools), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },

  async POST(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { name, domain } = await req.json();

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "School name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();
    const slug = generateSlug(name);

    const existingSchool = await kv.get(["schools", "slug", slug]);
    if (existingSchool.value) {
      return new Response(JSON.stringify({ error: "A school with this name already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (domain && domain.trim()) {
      const existingDomain = await kv.get(["schools", "domain", domain.trim().toLowerCase()]);
      if (existingDomain.value) {
        return new Response(JSON.stringify({ error: "A school with this domain already exists" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const schoolId = crypto.randomUUID();
    const school: School = {
      id: schoolId,
      name: name.trim(),
      slug,
      domain: domain && domain.trim() ? domain.trim().toLowerCase() : null,
      createdAt: new Date().toISOString(),
    };

    await kv.set(["schools", "id", schoolId], school);
    await kv.set(["schools", "slug", slug], schoolId);
    if (school.domain) {
      await kv.set(["schools", "domain", school.domain], schoolId);
    }

    return new Response(JSON.stringify(school), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  },

  async DELETE(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const schoolId = url.searchParams.get("id");

    if (!schoolId) {
      return new Response(JSON.stringify({ error: "School ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();
    const schoolResult = await kv.get<School>(["schools", "id", schoolId]);

    if (!schoolResult.value) {
      return new Response(JSON.stringify({ error: "School not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const school = schoolResult.value;

    await kv.delete(["schools", "id", schoolId]);
    await kv.delete(["schools", "slug", school.slug]);
    if (school.domain) {
      await kv.delete(["schools", "domain", school.domain]);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};