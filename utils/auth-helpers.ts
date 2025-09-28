import { User } from "./db.ts";

export function isSuperAdmin(user: User): boolean {
  return user.role === "super_admin";
}

export function isSchoolAdmin(user: User): boolean {
  return user.role === "school_admin";
}

export function isTeacher(user: User): boolean {
  return user.role === "teacher";
}

export function isDelegate(user: User): boolean {
  return user.role === "delegate";
}

export function canManageSchools(user: User): boolean {
  return isSuperAdmin(user);
}

export function canManageSchool(user: User, schoolId: string): boolean {
  if (isSuperAdmin(user)) return true;
  if (isSchoolAdmin(user) && user.schoolId === schoolId) return true;
  return false;
}

export function canManageUsers(user: User): boolean {
  return isSuperAdmin(user) || isSchoolAdmin(user);
}

export function canManageUser(actor: User, targetUser: User): boolean {
  if (isSuperAdmin(actor)) return true;

  if (isSchoolAdmin(actor)) {
    if (!actor.schoolId) return false;
    return targetUser.schoolId === actor.schoolId;
  }

  return false;
}

export function canViewAllClassrooms(user: User): boolean {
  return isSuperAdmin(user);
}

export function canViewSchoolClassrooms(user: User, schoolId: string): boolean {
  if (isSuperAdmin(user)) return true;
  if (isSchoolAdmin(user) && user.schoolId === schoolId) return true;
  return false;
}

export function canDeleteClassroomBook(user: User, bookUserId: string): boolean {
  if (isSuperAdmin(user)) return true;
  if (user.id === bookUserId) return true;
  if (isDelegate(user) && user.delegatedToUserIds.includes(bookUserId)) return true;
  return false;
}

export function canManageClassroom(user: User, teacherId: string): boolean {
  // Super admin can manage any classroom
  if (isSuperAdmin(user)) return true;

  // Teacher can manage their own classroom
  if (user.id === teacherId) return true;

  // Delegate can manage classrooms they're delegated to
  if (isDelegate(user) && user.delegatedToUserIds.includes(teacherId)) return true;

  return false;
}

export function getTargetTeacherId(user: User, requestedTeacherId?: string): { teacherId: string; error?: string } {
  // Super admin can act on any teacher's behalf
  if (isSuperAdmin(user)) {
    if (!requestedTeacherId) {
      return { teacherId: user.id }; // Default to their own
    }
    return { teacherId: requestedTeacherId };
  }

  // Regular teacher acts on their own classroom
  if (isTeacher(user)) {
    return { teacherId: user.id };
  }

  // Delegate must specify and be authorized for the teacher
  if (isDelegate(user)) {
    const delegateToIds = user.delegatedToUserIds || [];

    if (!requestedTeacherId) {
      return { teacherId: "", error: "Teacher ID required for delegates" };
    }

    if (!delegateToIds.includes(requestedTeacherId)) {
      return { teacherId: "", error: "Not authorized for this classroom" };
    }

    return { teacherId: requestedTeacherId };
  }

  return { teacherId: "", error: "Not authorized" };
}