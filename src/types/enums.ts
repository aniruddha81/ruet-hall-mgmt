export const ROLES = [
  "PROVOST",
  "ASST_FINANCE",
  "FINANCE_SECTION_OFFICER",
  "ASST_DINING",
  "DINING_MANAGER",
  "ASST_INVENTORY",
  "INVENTORY_SECTION_OFFICER",
  "STUDENT",
] as const;

export type Role = (typeof ROLES)[number];

export const STAFF_ROLES = [
  "PROVOST",
  "ASST_FINANCE",
  "FINANCE_SECTION_OFFICER",
  "ASST_DINING",
  "DINING_MANAGER",
  "ASST_INVENTORY",
  "INVENTORY_SECTION_OFFICER",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const OPERATIONAL_UNITS = [
  "FINANCE",
  "DINING",
  "INVENTORY",
  "ALL",
] as const;

export type OperationalUnit = (typeof OPERATIONAL_UNITS)[number];

export const STUDENT_STATUSES = [
  "ACTIVE",
  "ALUMNI",
  "SUSPENDED",
  "EXPELLED",
] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const ACADEMIC_DEPARTMENTS = [
  "CSE",
  "EEE",
  "ME",
  "CE",
  "IPE",
  "ECE",
  "ETE",
  "BME",
  "MTE",
  "URP",
  "ChE",
  "Arch",
] as const;

export type AcademicDepartment = (typeof ACADEMIC_DEPARTMENTS)[number];

export const HALLS = [
  "ZIA_HALL",
  "SHAH_JALAL_HALL",
  "RASHID_HALL",
  "FARUKI_HALL",
] as const;

export type Hall = (typeof HALLS)[number];

export const ROOM_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "RESERVED",
] as const;

export type RoomStatus = (typeof ROOM_STATUSES)[number];
