import { getKv, User, School, ClassroomBook, Invitation } from "./db.ts";
import { generateId } from "./password.ts";

export async function getUserByEmail(email: string): Promise<User | null> {
  const kv = await getKv();
  const result = await kv.get<User>(["users:email", email.toLowerCase()]);
  return result.value;
}

export async function getUserById(id: string): Promise<User | null> {
  const kv = await getKv();
  const result = await kv.get<User>(["users:id", id]);
  return result.value;
}

export async function createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
  const kv = await getKv();
  const id = generateId();
  const newUser: User = {
    ...user,
    id,
    createdAt: new Date().toISOString(),
  };

  await kv.atomic()
    .set(["users:id", id], newUser)
    .set(["users:email", user.email.toLowerCase()], newUser)
    .commit();

  return newUser;
}

export async function updateUser(user: User): Promise<void> {
  const kv = await getKv();
  await kv.atomic()
    .set(["users:id", user.id], user)
    .set(["users:email", user.email.toLowerCase()], user)
    .commit();
}

export async function getSchoolBySlug(slug: string): Promise<School | null> {
  const kv = await getKv();
  const schoolIdResult = await kv.get<string>(["schools:slug", slug]);
  if (!schoolIdResult.value) return null;

  const schoolResult = await kv.get<School>(["schools:id", schoolIdResult.value]);
  return schoolResult.value;
}

export async function getSchoolById(id: string): Promise<School | null> {
  const kv = await getKv();
  const result = await kv.get<School>(["schools:id", id]);
  return result.value;
}

export async function createSchool(name: string, slug: string): Promise<School> {
  const kv = await getKv();
  const id = generateId();
  const school: School = {
    id,
    name,
    slug,
    createdAt: new Date().toISOString(),
  };

  await kv.atomic()
    .set(["schools:id", id], school)
    .set(["schools:slug", slug], id)
    .commit();

  return school;
}

export async function listSchools(): Promise<School[]> {
  const kv = await getKv();
  const schools: School[] = [];
  const iter = kv.list<School>({ prefix: ["schools:id"] });

  for await (const entry of iter) {
    schools.push(entry.value);
  }

  return schools.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUserBooks(userId: string): Promise<ClassroomBook[]> {
  const kv = await getKv();
  const books: ClassroomBook[] = [];
  const iter = kv.list<ClassroomBook>({ prefix: ["classroomBooks", userId] });

  for await (const entry of iter) {
    books.push(entry.value);
  }

  return books.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
}

export async function addBookToClassroom(userId: string, book: Omit<ClassroomBook, "id" | "userId" | "dateAdded">): Promise<ClassroomBook> {
  const kv = await getKv();
  const id = generateId();
  const newBook: ClassroomBook = {
    ...book,
    id,
    userId,
    dateAdded: new Date().toISOString(),
  };

  await kv.set(["classroomBooks", userId, id], newBook);
  return newBook;
}

export async function removeBookFromClassroom(userId: string, bookId: string): Promise<void> {
  const kv = await getKv();
  await kv.delete(["classroomBooks", userId, bookId]);
}