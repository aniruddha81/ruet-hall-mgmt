import type {
  DueType,
  FinancePaymentMethod,
  Hall,
  PaymentMethod,
} from "../../types/enums.ts";

export type CreateMealPaymentParams = {
  studentId: string;
  amount: number;
  totalQuantity: number;
  paymentMethod: PaymentMethod;
};

export type MealPaymentResult = {
  id: string;
  studentId: string;
  amount: number;
  totalQuantity: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  paymentDate: Date;
};

export type CreateDuePaymentParams = {
  dueId: string;
  studentId: string;
  hall: Hall;
  amount: number;
  paymentMethod: FinancePaymentMethod;
  dueType: DueType;
  bankReceiptUrl?: string;
};

export type DuePaymentResult = {
  paymentId: string;
  dueId: string;
  amount: number;
  method: FinancePaymentMethod;
  status: "PAID";
  transactionId: string;
  paidAt: Date;
  bankReceiptUrl?: string | null;
  receiptVerifiedAt?: Date | null;
};
