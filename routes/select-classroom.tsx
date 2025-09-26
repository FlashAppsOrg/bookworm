import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../utils/session.ts";
import { getUserById } from "../utils/db-helpers.ts";

interface ClassroomOption {
  id: string;
  name: string;
}

interface SelectClassroomData {
  classrooms: ClassroomOption[];
}

export const handler: Handlers<SelectClassroomData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    if (user.role !== "delegate" || user.delegatedToUserIds.length === 0) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/dashboard" },
      });
    }

    if (user.delegatedToUserIds.length === 1) {
      return new Response(null, {
        status: 302,
        headers: { Location: `/dashboard?teacherId=${user.delegatedToUserIds[0]}` },
      });
    }

    const classrooms: ClassroomOption[] = [];
    for (const teacherId of user.delegatedToUserIds) {
      const teacher = await getUserById(teacherId);
      if (teacher) {
        classrooms.push({
          id: teacher.id,
          name: teacher.displayName,
        });
      }
    }

    return ctx.render({ classrooms });
  },
};

export default function SelectClassroomPage({ data }: PageProps<SelectClassroomData>) {
  return (
    <>
      <Head>
        <title>Select Classroom - BookWorm</title>
      </Head>
      <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
        <header class="bg-white dark:bg-gray-800 shadow-md transition-colors">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
              <a
                href="/api/auth/logout"
                class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                Logout
              </a>
            </div>
          </div>
        </header>

        <main class="flex-1 container mx-auto px-4 py-8">
          <div class="max-w-md mx-auto">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Select Classroom
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mb-8">
              Choose which teacher's classroom you want to work in
            </p>

            <div class="space-y-3">
              {data.classrooms.map((classroom) => (
                <a
                  key={classroom.id}
                  href={`/dashboard?teacherId=${classroom.id}`}
                  class="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all border-2 border-transparent hover:border-primary"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-lg font-semibold text-gray-900 dark:text-white">
                      {classroom.name}'s Classroom
                    </span>
                    <span class="text-primary text-xl">→</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}