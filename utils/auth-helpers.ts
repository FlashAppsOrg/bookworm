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