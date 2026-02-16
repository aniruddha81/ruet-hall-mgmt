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

//for dining module
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
  "WAITLIST",
] as const;
export type SeatApplicationStatus = (typeof SEAT_APPLICATION_STATUSES)[number];

// for inventory module
export const BED_STATUSES = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"] as const;
export type BedStatus = (typeof BED_STATUSES)[number];

export const ASSET_CONDITIONS = ["GOOD", "FAIR", "POOR", "DAMAGED"] as const;
export type AssetCondition = (typeof ASSET_CONDITIONS)[number];

export const DAMAGE_REPORT_STATUSES = ["REPORTED", "VERIFIED"] as const;
export type DamageReportStatus = (typeof DAMAGE_REPORT_STATUSES)[number];

// for finance module
export const DUE_TYPES = ["RENT", "FINE", "OTHER"] as const;
export type DueType = (typeof DUE_TYPES)[number];

export const DUE_STATUSES = ["UNPAID", "PAID"] as const;
export type DueStatus = (typeof DUE_STATUSES)[number];

export const FINANCE_PAYMENT_METHODS = ["CASH", "BANK", "ONLINE"] as const;
export type FinancePaymentMethod = (typeof FINANCE_PAYMENT_METHODS)[number];
