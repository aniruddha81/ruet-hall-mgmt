import type { PaymentMethod } from "../../types/enums.ts";

type CreateMealPaymentParams = {
  studentId: string;
  amount: number;
  totalQuantity: number;
  paymentMethod: PaymentMethod;
};

type MealPaymentResult = {
  id: string;
  studentId: string;
  amount: number;
  totalQuantity: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  paymentDate: Date;
};