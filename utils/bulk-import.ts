import { getKv, User, School, ClassroomBook } from "./db.ts";
import { generateId } from "./password.ts";
import { getSchoolBySlug, getUserByEmail, getSchoolById } from "./db-helpers.ts";

export interface BulkImportRow {
  schoolName?: string;
  schoolSlug?: string;
  teacherName: string;
  teacherEmail?: string;
  teacherUsername?: string;
  isbn?: string;
  title: string;
  authors?: string;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  categories?: string;
  pageCount?: string;
  quantity?: string;
}

export interface ImportResult {
  success: boolean;
  errors: string[];
  stats: {
    schoolsCreated: number;
    teachersCreated: number;
    booksCreated: number;
    rowsProcessed: number;
  };
}

export function parseCSV(csvText: string): BulkImportRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: BulkImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};

    headers.forEach((header, index) => {
      if (values[index]) {
        row[header] = values[index].trim();
      }
    });

    if (row.teacherName || row.teachername) {
      rows.push({
        schoolName: row.schoolname || row.school_name,
        schoolSlug: row.schoolslug || row.school_slug,
        teacherName: row.teachername || row.teacher_name,
        teacherEmail: row.teacheremail || row.teacher_email,
        teacherUsername: row.teacherusername || row.teacher_username,
        isbn: row.isbn,
        title: row.title || row.booktitle || row.book_title,
        authors: row.authors || row.author,
        publisher: row.publisher,
        publishedDate: row.publisheddate || row.published_date,
        description: row.description,
        categories: row.categories || row.category,
        pageCount: row.pagecount || row.page_count || row.pages,
        quantity: row.quantity || row.qty,
      });
    }
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function processBulkImport(rows: BulkImportRow[]): Promise<ImportResult> {
  const kv = await getKv();
  const errors: string[] = [];
  const stats = {
    schoolsCreated: 0,
    teachersCreated: 0,
    booksCreated: 0,
    rowsProcessed: 0,
  };

  const schoolCache = new Map<string, School>();
  const teacherCache = new Map<string, User>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    stats.rowsProcessed++;

    try {
      let school: School | null = null;

      if (row.schoolSlug) {
        const cacheKey = `slug:${row.schoolSlug}`;
        if (schoolCache.has(cacheKey)) {
          school = schoolCache.get(cacheKey)!;
        } else {
          const schoolIdResult = await kv.get<string>(["schools:slug", row.schoolSlug]);
          if (schoolIdResult.value) {
            const schoolResult = await kv.get<School>(["schools:id", schoolIdResult.value]);
            school = schoolResult.value;
            if (school) schoolCache.set(cacheKey, school);
          }
        }
      }

      if (!school && row.schoolName) {
        const slug = slugify(row.schoolName);
        const cacheKey = `slug:${slug}`;

        if (schoolCache.has(cacheKey)) {
          school = schoolCache.get(cacheKey)!;
        } else {
          const schoolIdResult = await kv.get<string>(["schools:slug", slug]);
          if (schoolIdResult.value) {
            const schoolResult = await kv.get<School>(["schools:id", schoolIdResult.value]);
            school = schoolResult.value;
            if (school) schoolCache.set(cacheKey, school);
          } else {
            const schoolId = generateId();
            school = {
              id: schoolId,
              name: row.schoolName,
              slug,
              domain: null,
              createdAt: new Date().toISOString(),
            };
            await kv.set(["schools:id", schoolId], school);
            await kv.set(["schools:slug", slug], schoolId);
            schoolCache.set(cacheKey, school);
            stats.schoolsCreated++;
          }
        }
      }

      const teacherKey = row.teacherEmail || `${school?.id || "none"}:${row.teacherName}`;
      let teacher: User | null = null;

      if (teacherCache.has(teacherKey)) {
        teacher = teacherCache.get(teacherKey)!;
      } else if (row.teacherEmail) {
        const userResult = await kv.get<User>(["users:email", row.teacherEmail.toLowerCase()]);
        teacher = userResult.value;
      }

      if (!teacher) {
        const teacherId = generateId();
        const username = row.teacherUsername || slugify(row.teacherName);
        const email = row.teacherEmail || `${username}@placeholder.local`;

        teacher = {
          id: teacherId,
          email: email.toLowerCase(),
          passwordHash: "",
          displayName: row.teacherName,
          username,
          schoolId: school?.id || null,
          verified: false,
          role: "teacher",
          delegatedToUserIds: [],
          googleBooksApiKey: null,
          googleSheetUrl: null,
          isPlaceholder: true,
          createdAt: new Date().toISOString(),
        };

        await kv.set(["users:id", teacherId], teacher);
        await kv.set(["users:email", email.toLowerCase()], teacher);
        if (school && username) {
          await kv.set(["users:username", school.id, username.toLowerCase()], teacherId);
        }

        teacherCache.set(teacherKey, teacher);
        stats.teachersCreated++;
      }

      if (row.title) {
        const bookId = generateId();
        const authors = row.authors ? row.authors.split(";").map((a) => a.trim()) : [];
        const categories = row.categories ? row.categories.split(";").map((c) => c.trim()) : [];

        const book: ClassroomBook = {
          id: bookId,
          userId: teacher.id,
          isbn: row.isbn || null,
          title: row.title,
          authors,
          thumbnail: null,
          publisher: row.publisher || null,
          publishedDate: row.publishedDate || null,
          description: row.description,
          categories: categories.length > 0 ? categories : undefined,
          maturityRating: undefined,
          pageCount: row.pageCount ? parseInt(row.pageCount) : undefined,
          language: undefined,
          quantity: row.quantity ? parseInt(row.quantity) : 1,
          imported: true,
          dateAdded: new Date().toISOString(),
        };

        await kv.set(["classroomBooks", teacher.id, bookId], book);
        stats.booksCreated++;
      }
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    stats,
  };
}