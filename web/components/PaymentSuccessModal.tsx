"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, X, Copy, Check } from "lucide-react";
import type { PaymentSuccessProps } from "@/lib/types";

export default function PaymentSuccessModal({
  data,
  onClose,
}: PaymentSuccessProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (data) {
      requestAnimationFrame(() => setAnimateIn(true));
      // Prevent body scroll while modal is open
      document.body.style.overflow = "hidden";
    } else {
      setAnimateIn(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [data]);

  if (!mounted || !data) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  };

  const handleDownload = () => {
    const isMeal = data.type === "MEAL";
    const date = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
    const accentColor = isMeal ? "#10b981" : "#6366f1";
    const accentLight = isMeal ? "#d1fae5" : "#e0e7ff";
    const typeLabel = isMeal ? "Meal Token Payment" : "Hall Due Payment";

    const itemsHTML = Object.entries(data.details)
      .map(
        ([key, value]) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;">${key}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111827;font-weight:600;text-align:right;">
          ${value}
        </td>
      </tr>
    `,
      )
      .join("");

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Receipt-${data.transactionId}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:32px 16px;min-height:100vh;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${accentColor},${accentColor}cc);padding:32px 32px 24px;text-align:center;">
              <div style="width:56px;height:56px;margin:0 auto 16px;background:rgba(255,255,255,0.2);border-radius:50%;line-height:56px;font-size:28px;">
                ${isMeal ? "🍽️" : "🏠"}
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Payment Successful
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                ${typeLabel}
              </p>
            </td>
          </tr>

          <!-- Amount highlight -->
          <tr>
            <td style="padding:28px 32px 0;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">
                Amount Paid
              </p>
              <p style="margin:6px 0 0;color:#111827;font-size:36px;font-weight:800;letter-spacing:-1px;">
                BDT ${data.amount.toLocaleString()}
              </p>
            </td>
          </tr>

          <!-- Receipt details -->
          <tr>
            <td style="padding:24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${accentLight};border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#374151;">Transaction ID</td>
                  <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#111827;font-weight:700;text-align:right;font-family:monospace;font-size:13px;">
                    ${data.transactionId}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#374151;">Date & Time</td>
                  <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#111827;font-weight:600;text-align:right;">
                    ${date}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#374151;">Payment Method</td>
                  <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#111827;font-weight:600;text-align:right;">
                    ${data.paymentMethod}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding:16px 32px 8px;">
              <p style="margin:0 0 12px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">
                Payment Details
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                ${itemsHTML}
                <tr style="background:#f9fafb;">
                  <td style="padding:14px 16px;color:#111827;font-weight:700;">Total Paid</td>
                  <td style="padding:14px 16px;color:${accentColor};font-weight:800;text-align:right;font-size:18px;">
                    BDT ${data.amount.toLocaleString()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px;text-align:center;border-top:1px solid #f0f0f0;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This is an auto-generated receipt from<br />
                <strong style="color:#6b7280;">RUET Hall Management System</strong>
              </p>
              <p style="margin:10px 0 0;color:#d1d5db;font-size:11px;">
                © ${new Date().getFullYear()} RUET Hall Management
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      iframe.srcdoc = htmlContent;
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 250);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  const isMeal = data.type === "MEAL";

  const modal = (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-100 flex items-center justify-center p-4 transition-all duration-300 ${
        animateIn
          ? "bg-black/50 backdrop-blur-sm"
          : "bg-transparent pointer-events-none"
      }`}
    >
      <div
        className={`relative w-full max-w-md transform transition-all duration-500 ease-out ${
          animateIn
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground shadow-lg transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border">
          {/* Success header with animation */}
          <div
            className={`relative overflow-hidden px-6 pb-6 pt-8 text-center ${
              isMeal
                ? "bg-linear-to-br from-emerald-500 to-teal-600"
                : "bg-linear-to-br from-indigo-500 to-purple-600"
            }`}
          >
            {/* Animated circles */}
            <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/10 animate-pulse" />
            <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10 animate-pulse [animation-delay:300ms]" />
            <div className="absolute left-1/2 top-2 h-12 w-12 -translate-x-1/2 rounded-full bg-white/5 animate-pulse [animation-delay:700ms]" />

            <div className="relative">
              {/* Checkmark icon with bounce */}
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 transition-transform duration-700 ${
                  animateIn ? "scale-100" : "scale-0"
                }`}
                style={{ transitionDelay: "200ms" }}
              >
                <CheckCircle2 className="h-9 w-9 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white">
                Payment Successful!
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {isMeal ? "Meal token purchased" : "Hall due paid"}
              </p>
            </div>
          </div>

          {/* Amount */}
          <div className="border-b border-border px-6 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Amount Paid
            </p>
            <p
              className={`mt-1 text-4xl font-extrabold tracking-tight ${
                isMeal
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-indigo-600 dark:text-indigo-400"
              }`}
            >
              BDT {data.amount.toLocaleString()}
            </p>
          </div>

          {/* Transaction ID */}
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Transaction ID
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                  {data.transactionId}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Copy transaction ID"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Payment details */}
          <div className="space-y-0 divide-y divide-border/50 px-6">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">
                Payment Method
              </span>
              <span className="text-sm font-semibold text-foreground">
                {data.paymentMethod}
              </span>
            </div>

            {Object.entries(data.details).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">{key}</span>
                <span className="text-sm font-semibold text-foreground">
                  {value}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm font-semibold text-foreground">
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Receipt notice */}
          <div className="mx-6 mt-3 rounded-lg bg-secondary/50 px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              📧 A receipt has been sent to your registered email address
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6 pt-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              className={`flex-1 ${
                isMeal
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
