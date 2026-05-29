import type { Request, Response } from "express";
import {
  buildStudentPaymentRedirect,
} from "../../utils/sslcommerz.ts";
import {
  processSslCommerzBrowserReturn,
  processSslCommerzNotification,
} from "./payment.service.ts";

function queryAsRecord(query: Request["query"]): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") {
      result[key] = value;
    } else if (Array.isArray(value) && typeof value[0] === "string") {
      result[key] = value[0];
    }
  }
  return result;
}

function bodyAsRecord(body: Request["body"]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(body ?? {})) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

export const sslCommerzIpn = async (req: Request, res: Response) => {
  await processSslCommerzNotification(bodyAsRecord(req.body));
  res.status(200).send("OK");
};

export const sslCommerzSuccess = async (req: Request, res: Response) => {
  const query = queryAsRecord(req.query);
  const result = await processSslCommerzBrowserReturn(query, "success");
  res.redirect(302, buildStudentPaymentRedirect("success", result.tranId));
};

export const sslCommerzFail = async (req: Request, res: Response) => {
  const query = queryAsRecord(req.query);
  const result = await processSslCommerzBrowserReturn(query, "failed");
  res.redirect(302, buildStudentPaymentRedirect("failed", result.tranId));
};

export const sslCommerzCancel = async (req: Request, res: Response) => {
  const query = queryAsRecord(req.query);
  const result = await processSslCommerzBrowserReturn(query, "cancelled");
  res.redirect(302, buildStudentPaymentRedirect("cancelled", result.tranId));
};
