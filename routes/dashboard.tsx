import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../utils/session.ts";
import { getUserBooks } from "../utils/db-helpers.ts";
import { User, ClassroomBook } from "../utils/db.ts";
import DashboardContent from "../islands/DashboardContent.tsx";

interface DashboardData {
  user: User;
  books: ClassroomBook[];
}

export const handler: Handlers<DashboardData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    if (!user.verified) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/verify" },
      });
    }

    if (!user.schoolId) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/setup" },
      });
    }

    const books = await getUserBooks(user.id);

    return ctx.render({ user, books });
  },
};

export default function DashboardPage({ data }: PageProps<DashboardData>) {
  return (
    <>
      <Head>
        <title>Dashboard - BookWorm</title>
      </Head>
      <DashboardContent user={data.user} initialBooks={data.books} />
    </>
  );
}