import { Router } from "express";
import {
  sslCommerzCancel,
  sslCommerzFail,
  sslCommerzIpn,
  sslCommerzSuccess,
} from "./payment.controller.ts";

const paymentRouter = Router();

paymentRouter.post("/sslcommerz/ipn", sslCommerzIpn);
paymentRouter.post("/sslcommerz/success", sslCommerzSuccess);
paymentRouter.post("/sslcommerz/fail", sslCommerzFail);
paymentRouter.post("/sslcommerz/cancel", sslCommerzCancel);
paymentRouter.get("/sslcommerz/success", sslCommerzSuccess);
paymentRouter.get("/sslcommerz/fail", sslCommerzFail);
paymentRouter.get("/sslcommerz/cancel", sslCommerzCancel);

export default paymentRouter;
