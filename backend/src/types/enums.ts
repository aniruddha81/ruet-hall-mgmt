// =================== ENUM GROUP ===================
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

export const STAFF_ROLES = [
  "PROVOST",
  "ASST_FINANCE",
  "FINANCE_SECTION_OFFICER",
  "ASST_DINING",
  "DINING_MANAGER",
  "ASST_INVENTORY",
  "INVENTORY_SECTION_OFFICER",
] as const;

export const OPERATIONAL_UNITS = [
  "FINANCE",
  "DINING",
  "INVENTORY",
  "ALL",
] as const;

export const STUDENT_STATUSES = [
  "ACTIVE",
  "ALUMNI",
  "SUSPENDED",
  "EXPELLED",
] as const;

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

export const HALLS = [
  "ZIA_HALL",
  "SELIM_HALL",
  "HAMID_HALL",
  "SHAHIDUL_HALL",
  "TIN_SHED_HALL",
  "FAZLUL_HUQ_HALL",
] as const;

export const ROOM_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "RESERVED",
] as const;

// for dining module
export const MEAL_TYPES = ["LUNCH", "DINNER"] as const;
export const TOKEN_STATUSES = ["ACTIVE", "CANCELLED", "CONSUMED"] as const;
export const PAYMENT_METHODS = [
  "BKASH",
  "NAGAD",
  "ROCKET",
  "BANK",
  "CASH",
] as const;

// for admission module
export const SEAT_APPLICATION_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export const HALL_ADMIN_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

// for inventory module
export const DAMAGE_REPORT_STATUSES = [
  "REPORTED",
  "VERIFIED",
  "FIXED",
] as const;

// for finance module
export const DUE_TYPES = ["RENT", "FINE", "OTHER"] as const;
export const DUE_STATUSES = ["UNPAID", "PAID"] as const;
export const FINANCE_PAYMENT_METHODS = ["CASH", "BANK", "ONLINE"] as const;

// =================== TYPE GROUP ===================
export type Role = (typeof ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type OperationalUnit = (typeof OPERATIONAL_UNITS)[number];
export type StudentStatus = (typeof STUDENT_STATUSES)[number];
export type AcademicDepartment = (typeof ACADEMIC_DEPARTMENTS)[number];
export type Hall = (typeof HALLS)[number];
export type RoomStatus = (typeof ROOM_STATUSES)[number];
export type SeatApplicationStatus = (typeof SEAT_APPLICATION_STATUSES)[number];
export type DamageReportStatus = (typeof DAMAGE_REPORT_STATUSES)[number];
export type DueType = (typeof DUE_TYPES)[number];
export type DueStatus = (typeof DUE_STATUSES)[number];
export type FinancePaymentMethod = (typeof FINANCE_PAYMENT_METHODS)[number];
export type MealType = (typeof MEAL_TYPES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type HallAdminStatus = (typeof HALL_ADMIN_STATUSES)[number];
