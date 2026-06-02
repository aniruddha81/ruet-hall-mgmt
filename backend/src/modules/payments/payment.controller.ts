import type { Request, Response } from "express";
import {
  buildStudentPaymentRedirect,
  isAllowedMobilePaymentReturnUrl,
} from "../../utils/sslcommerz.ts";
import {
  getIntentByTranId,
  getReturnUrlFromIntentPayload,
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

function extractSslPayload(req: Request): Record<string, string | undefined> {
  return {
    ...queryAsRecord(req.query),
    ...bodyAsRecord(req.body),
  };
}

export const sslCommerzIpn = async (req: Request, res: Response) => {
  await processSslCommerzNotification(bodyAsRecord(req.body));
  res.status(200).send("OK");
};

async function redirectAfterBrowserReturn(
  req: Request,
  res: Response,
  outcome: "success" | "failed" | "cancelled"
) {
  const payload = extractSslPayload(req);
  const tranId = payload.tran_id;

  try {
    const result = await processSslCommerzBrowserReturn(payload, outcome);
    const intent = await getIntentByTranId(result.tranId);
    const returnUrl = intent
      ? getReturnUrlFromIntentPayload(intent.payload)
      : undefined;
    res.redirect(
      302,
      buildStudentPaymentRedirect(outcome, result.tranId, returnUrl)
    );
    return;
  } catch (err) {
    if (!tranId) {
      throw err;
    }

    const intent = await getIntentByTranId(tranId);
    const returnUrl = intent
      ? getReturnUrlFromIntentPayload(intent.payload)
      : undefined;

    if (!returnUrl || !isAllowedMobilePaymentReturnUrl(returnUrl)) {
      throw err;
    }

    const redirectOutcome =
      intent?.status === "COMPLETED" && outcome === "success"
        ? "success"
        : outcome === "success"
          ? "failed"
          : outcome;

    res.redirect(
      302,
      buildStudentPaymentRedirect(redirectOutcome, tranId, returnUrl)
    );
  }
}

export const sslCommerzSuccess = async (req: Request, res: Response) => {
  await redirectAfterBrowserReturn(req, res, "success");
};

export const sslCommerzFail = async (req: Request, res: Response) => {
  await redirectAfterBrowserReturn(req, res, "failed");
};

export const sslCommerzCancel = async (req: Request, res: Response) => {
  await redirectAfterBrowserReturn(req, res, "cancelled");
};
