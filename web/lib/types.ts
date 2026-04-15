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
export const FINANCE_PAYMENT_METHODS = ["CASH", "BANK", "ONLINE"] as const;
export const NOTIFICATION_AUDIENCES = ["STUDENT", "ADMIN"] as const;
export const SEAT_APPLICATION_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;
export const DUE_TYPES = ["RENT", "FINE", "OTHER"] as const;
export const DUE_STATUSES = ["UNPAID", "PAID"] as const;

// =================== TYPE ALIASES ===================
export type Role = (typeof ROLES)[number];
export type AcademicDepartment = (typeof ACADEMIC_DEPARTMENTS)[number];
export type Hall = (typeof HALLS)[number];
export type MealType = (typeof MEAL_TYPES)[number];
export type TokenStatus = (typeof TOKEN_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type FinancePaymentMethod = (typeof FINANCE_PAYMENT_METHODS)[number];
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];
export type SeatApplicationStatus = (typeof SEAT_APPLICATION_STATUSES)[number];
export type DueType = (typeof DUE_TYPES)[number];
export type DueStatus = (typeof DUE_STATUSES)[number];

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
export interface StudentData {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  academicDepartment: AcademicDepartment;
  rollNumber: string;
  session: string;
  hall: Hall | null;
  roomId: string | null;
  status: string | null;
  isAllocated: boolean;
}

export interface AdminData {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  academicDepartment: AcademicDepartment | null;
  phone: string;
  hall: Hall;
  designation: Role;
  operationalUnit: string;
  reportingToId: string | null;
  isActive: boolean;
}

export interface LoginResponse {
  student_data: StudentData;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
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
  menuDescription?: string;
  price?: number;
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
  bankReceiptUrl?: string | null;
  receiptVerifiedAt?: string | null;
  receiptVerifiedBy?: string | null;
  paymentDate: string;
  refundedAt: string | null;
  refundAmount: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export type RawMealToken = {
  tokenId?: string;
  id?: string;
  studentId?: string;
  menuId?: string;
  hall?: MealToken["hall"];
  quantity: number;
  totalAmount: number;
  mealType: MealToken["mealType"];
  mealDate: string;
  bookingTime?: string;
  cancelledAt?: string | null;
  paymentId?: string | null;
  menuDescription?: string;
  price?: number;
};

export interface MealBookingReceipt {
  tokenId: string;
  paymentId: string;
  quantity: number;
  totalAmount: number;
  mealType: MealType;
  mealDate: string;
  transactionId: string;
  paymentMethod: PaymentMethod;
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
    roomNo: number;
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
  roomStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface DamageReport {
  id: string;
  studentId: string;
  hall: Hall;
  locationDescription?: string | null;
  assetDetails?: string | null;
  imageUrl?: string | null;
  description: string;
  fineAmount: number | null;
  damageCost: number | null;
  isStudentResponsible: boolean | null;
  managerNote?: string | null;
  liableStudentId: string | null;
  fineDueId?: string | null;
  status: string;
  verifiedBy: string | null;
  fixedBy: string | null;
  fixedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  bankReceiptUrl?: string | null;
  receiptVerifiedAt?: string | null;
  receiptVerifiedBy?: string | null;
  createdAt: string;
}

export interface PaymentSuccessData {
  type: "MEAL" | "DUE";
  amount: number;
  transactionId: string;
  /** Payment method label (e.g. BKASH, ONLINE, CASH) */
  paymentMethod: string;
  details: Record<string, string>;
}

export interface PaymentSuccessProps {
  data: PaymentSuccessData | null;
  onClose: () => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  targetAudience: NotificationAudience;
  createdByAdminId: string;
  createdByName: string;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
}

export interface NotificationListData {
  notifications: NotificationItem[];
  unreadCount: number;
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
  dues: StudentDue[];
  payments: Payment[];
  mealPayments: MealPayment[];
  summary: { totalDue: number; totalPaid: number };
}

export interface DuePaymentReceipt {
  paymentId: string;
  dueId: string;
  amount: number;
  method: FinancePaymentMethod;
  status: "PAID";
  transactionId: string;
  paidAt: string;
  bankReceiptUrl?: string | null;
  receiptVerifiedAt?: string | null;
}
