import type { PaymentMethod } from "../../types/enums";

type CreateMealPaymentParams = {
  studentId: string;
  amount: number;
  totalQuantity: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
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