// =================== BACKEND ENUM MIRRORS ===================
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

export const OPERATIONAL_UNITS = ["FINANCE", "DINING", "INVENTORY"] as const;

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

export const MEAL_TYPES = ["LUNCH", "DINNER"] as const;
export const TOKEN_STATUSES = ["ACTIVE", "CANCELLED", "CONSUMED"] as const;
export const PAYMENT_METHODS = [
  "BKASH",
  "NAGAD",
  "ROCKET",
  "BANK",
  "CASH",
] as const;
export const SEAT_APPLICATION_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;
export const DAMAGE_REPORT_STATUSES = [
  "REPORTED",
  "VERIFIED",
  "FIXED",
] as const;
export const DUE_TYPES = ["RENT", "FINE", "OTHER"] as const;
export const DUE_STATUSES = ["UNPAID", "PAID"] as const;
export const FINANCE_PAYMENT_METHODS = ["CASH", "BANK", "ONLINE"] as const;
export const ROOM_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "RESERVED",
] as const;

// =================== TYPE ALIASES ===================
export type Role = (typeof ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type OperationalUnit = (typeof OPERATIONAL_UNITS)[number];
export type AcademicDepartment = (typeof ACADEMIC_DEPARTMENTS)[number];
export type Hall = (typeof HALLS)[number];
export type MealType = (typeof MEAL_TYPES)[number];
export type TokenStatus = (typeof TOKEN_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type SeatApplicationStatus = (typeof SEAT_APPLICATION_STATUSES)[number];
export type DamageReportStatus = (typeof DAMAGE_REPORT_STATUSES)[number];
export type DueType = (typeof DUE_TYPES)[number];
export type DueStatus = (typeof DUE_STATUSES)[number];
export type FinancePaymentMethod = (typeof FINANCE_PAYMENT_METHODS)[number];
export type RoomStatus = (typeof ROOM_STATUSES)[number];

// =================== API RESPONSE TYPES ===================
export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
  errors?: unknown[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =================== AUTH TYPES ===================
export interface AdminData {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  academicDepartment: AcademicDepartment | null;
  phone: string;
  hall: Hall;
  designation: StaffRole;
  operationalUnit: OperationalUnit;
  reportingToId: string | null;
  isActive: boolean;
}

export interface AdminLoginResponse {
  user: AdminData;
}

export interface AdminRegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: StaffRole;
  };
}

// =================== DINING TYPES ===================
export interface MealMenu {
  id: string;
  hall: Hall;
  mealDate: string;
  mealType: MealType;
  menuDescription: string;
  price: number;
  totalTokens: number;
  bookedTokens: number;
  availableTokens: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealToken {
  id: string;
  studentId: string;
  menuId: string;
  hall?: Hall;
  mealDate: string;
  mealType: MealType;
  quantity: number;
  totalAmount: number;
  paymentId: string | null;
  bookingTime: string;
  cancelledAt: string | null;
  status: TokenStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface MealPayment {
  id: string;
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  amount: number;
  totalQuantity: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  paymentDate: string;
  refundedAt: string | null;
  refundAmount: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// =================== ADMISSION TYPES ===================
export interface SeatApplication {
  id: string;
  studentId: string;
  rollNumber: string;
  hall: Hall;
  academicDepartment: AcademicDepartment;
  session: string;
  status: SeatApplicationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  studentName?: string;
  studentEmail?: string;
  seatCharge?: StudentDue | null;
  canAllocate?: boolean;
  roomAllocation?: {
    roomId: string;
    allocatedAt: string;
    allocatedByName: string;
  } | null;
}

export interface SeatAllocation {
  id: string;
  studentId: string;
  rollNumber: string;
  hall: Hall;
  roomId: string;
  allocatedAt: string;
  allocatedBy: string;
}

// =================== INVENTORY TYPES ===================
export interface Room {
  id: string;
  roomNumber: number;
  hall: Hall;
  capacity: number;
  currentOccupancy: number;
  roomStatus: RoomStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface DamageReport {
  id: string;
  studentId: string;
  hall: Hall;
  locationDescription?: string | null;
  assetDetails?: string | null;
  description: string;
  fineAmount: number | null;
  damageCost: number | null;
  isStudentResponsible: boolean | null;
  managerNote?: string | null;
  liableStudentId: string | null;
  fineDueId?: string | null;
  status: DamageReportStatus;
  verifiedBy: string | null;
  fixedBy: string | null;
  fixedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporterName?: string | null;
  reporterRollNumber?: string | null;
  studentName?: string;
}

// =================== FINANCE TYPES ===================
export interface StudentDue {
  id: string;
  studentId: string;
  dueType: DueType;
  hall: Hall;
  amount: number;
  dueStatus: DueStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  studentId?: string;
  hall: Hall;
  dueId: string | null;
  amount: number;
  method: FinancePaymentMethod;
  createdAt: string;
}

export interface Expense {
  id: string;
  hall: Hall;
  title: string;
  amount: number;
  category: string;
  approvedBy: string;
  createdAt: string;
}

export interface StudentLedger {
  student?: {
    id: string;
    name: string;
  };
  dues: StudentDue[];
  payments: Payment[];
  mealPayments: MealPayment[];
  summary?: {
    totalDue: number;
    totalPaid: number;
  };
}

// =================== REPORT TYPES ===================
export interface DailyReport {
  date: string;
  menus: MealMenu[];
  totalTokensSold: number;
  totalRevenue: number;
  consumed: number;
  cancelled: number;
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalRevenue: number;
  totalTokensSold: number;
  totalConsumed: number;
  totalCancelled: number;
  dailyBreakdown: DailyReport[];
}
