import { Handlers } from "$fresh/server.ts";
import { getKv, BookChallenge, User } from "../../../utils/db.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSchoolAdmin, isSuperAdmin } from "../../../utils/auth-helpers.ts";

export const handler: Handlers = {
  async GET(req) {
    const user = await getUserFromSession(req);
    if (!user || (!isSchoolAdmin(user) && !isSuperAdmin(user))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") || "all";
    const schoolFilter = isSuperAdmin(user) ? url.searchParams.get("school") || "all" : user.schoolId!;

    const challenges: BookChallenge[] = [];

    if (statusFilter !== "all") {
      const iter = kv.list<true>({ prefix: ["challenges", "status", statusFilter] });
      for await (const entry of iter) {
        const challengeId = entry.key[3] as string;
        const challengeResult = await kv.get<BookChallenge>(["challenges", "id", challengeId]);
        if (challengeResult.value) {
          if (schoolFilter === "all" || challengeResult.value.schoolId === schoolFilter) {
            challenges.push(challengeResult.value);
          }
        }
      }
    } else {
      const prefix = schoolFilter === "all"
        ? ["challenges", "id"]
        : ["challenges", "school", schoolFilter];

      if (schoolFilter === "all") {
        const iter = kv.list<BookChallenge>({ prefix });
        for await (const entry of iter) {
          challenges.push(entry.value);
        }
      } else {
        const iter = kv.list<true>({ prefix });
        for await (const entry of iter) {
          const challengeId = entry.key[3] as string;
          const challengeResult = await kv.get<BookChallenge>(["challenges", "id", challengeId]);
          if (challengeResult.value) {
            challenges.push(challengeResult.value);
          }
        }
      }
    }

    challenges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return new Response(JSON.stringify(challenges), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },

  async PATCH(req) {
    const user = await getUserFromSession(req);
    if (!user || (!isSchoolAdmin(user) && !isSuperAdmin(user))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { challengeId, status, reviewNotes } = body;

      if (!challengeId || !status) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const validStatuses = ["pending", "under_review", "approved", "denied"];
      if (!validStatuses.includes(status)) {
        return new Response(JSON.stringify({ error: "Invalid status" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      const challengeResult = await kv.get<BookChallenge>(["challenges", "id", challengeId]);

      if (!challengeResult.value) {
        return new Response(JSON.stringify({ error: "Challenge not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const challenge = challengeResult.value;

      if (!isSuperAdmin(user) && challenge.schoolId !== user.schoolId) {
        return new Response(JSON.stringify({ error: "Unauthorized to review this challenge" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const oldStatus = challenge.status;
      const updatedChallenge: BookChallenge = {
        ...challenge,
        status,
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reviewNotes ? reviewNotes.trim() : challenge.reviewNotes,
      };

      await kv.set(["challenges", "id", challengeId], updatedChallenge);

      if (oldStatus !== status) {
        await kv.delete(["challenges", "status", oldStatus, challengeId]);
        await kv.set(["challenges", "status", status, challengeId], true);
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Challenge updated successfully",
        challenge: updatedChallenge,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Challenge update error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};