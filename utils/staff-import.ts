import { getKv, User } from "./db.ts";
import { generateId } from "./password.ts";

export interface StaffImportRow {
  teacherName: string;
  teacherEmail?: string;
  teacherUsername?: string;
}

export interface StaffImportResult {
  success: boolean;
  errors: string[];
  stats: {
    staffCreated: number;
    rowsProcessed: number;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseStaffCSV(csvText: string): StaffImportRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: StaffImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};

    headers.forEach((header, index) => {
      if (values[index]) {
        row[header] = values[index].trim();
      }
    });

    if (row.teachername || row.teacher_name || row.name) {
      rows.push({
        teacherName: row.teachername || row.teacher_name || row.name,
        teacherEmail: row.teacheremail || row.teacher_email || row.email,
        teacherUsername: row.teacherusername || row.teacher_username || row.username,
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

export async function processStaffImport(
  rows: StaffImportRow[],
  schoolId: string
): Promise<StaffImportResult> {
  const kv = await getKv();
  const errors: string[] = [];
  const stats = {
    staffCreated: 0,
    rowsProcessed: 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    stats.rowsProcessed++;

    try {
      if (!row.teacherName) {
        errors.push(`Row ${i + 1}: Teacher name is required`);
        continue;
      }

      let existingUser: User | null = null;

      if (row.teacherEmail) {
        const userResult = await kv.get<User>(["users:email", row.teacherEmail.toLowerCase()]);
        existingUser = userResult.value;
      }

      if (existingUser) {
        errors.push(`Row ${i + 1}: User with email ${row.teacherEmail} already exists`);
        continue;
      }

      const teacherId = generateId();
      const username = row.teacherUsername || slugify(row.teacherName);
      const email = row.teacherEmail || `${username}@placeholder.local`;

      const usernameResult = await kv.get<string>(["users:username", schoolId, username.toLowerCase()]);
      if (usernameResult.value) {
        errors.push(`Row ${i + 1}: Username ${username} already exists in this school`);
        continue;
      }

      const teacher: User = {
        id: teacherId,
        email: email.toLowerCase(),
        passwordHash: "",
        displayName: row.teacherName,
        username,
        schoolId,
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
      await kv.set(["users:username", schoolId, username.toLowerCase()], teacherId);

      stats.staffCreated++;
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