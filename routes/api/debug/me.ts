import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";

export const handler: Handlers = {
  async GET(req) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(JSON.stringify({
        authenticated: false,
        message: "Not logged in"
      }, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        schoolId: user.schoolId,
        verified: user.verified,
        isPlaceholder: user.isPlaceholder,
      }
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};