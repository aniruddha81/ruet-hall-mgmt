"use client";

import { Button } from "@/components/ui/button";
import type { PaymentSuccessProps } from "@/lib/types";
import jsPDF from "jspdf";
import { Check, CheckCircle2, Copy, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function PaymentSuccessModal({
  data,
  onClose,
}: PaymentSuccessProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

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
    const date = new Date().toLocaleString("en-GB", {
      timeZone: "Asia/Dhaka",
    });
    const typeLabel = isMeal ? "Meal Token Payment" : "Hall Due Payment";

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const width = doc.internal.pageSize.getWidth();
    const accent = isMeal ? [16, 185, 129] : [99, 102, 241];

    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 0, width, 96, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("PAYMENT RECEIPT", 40, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(typeLabel, 40, 62);

    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Amount Paid", 40, 128);
    doc.setFontSize(26);
    doc.text(`BDT ${data.amount.toLocaleString()}`, 40, 156);

    doc.setDrawColor(229, 231, 235);
    doc.line(40, 176, width - 40, 176);

    let y = 206;
    const printRow = (label: string, value: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.text(label, 40, y);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(value, width - 40, y, { align: "right" });
      y += 24;
    };

    printRow("Transaction ID", data.transactionId);
    printRow("Date & Time", date);
    printRow("Payment Method", data.paymentMethod);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text("Details", 40, y);
    y += 18;

    Object.entries(data.details).forEach(([key, value]) => {
      printRow(key, value);
    });

    y += 10;
    doc.setDrawColor(229, 231, 235);
    doc.line(40, y, width - 40, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.setFontSize(13);
    doc.text("Total Paid", 40, y);
    doc.setFontSize(18);
    doc.text(`BDT ${data.amount.toLocaleString()}`, width - 40, y, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.text(
      "This is an auto-generated receipt from RUET Hall Management System.",
      40,
      780,
    );

    const safeTransactionId = data.transactionId.replace(/[^a-zA-Z0-9-_]/g, "");
    doc.save(`receipt-${safeTransactionId || "payment"}.pdf`);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isMeal = data.type === "MEAL";

  const modal = (
    <div
      className={`fixed inset-0 z-100 overflow-y-auto transition-all duration-300 ${
        animateIn
          ? "bg-black/50 backdrop-blur-sm"
          : "bg-transparent pointer-events-none"
      }`}
    >
      <div
        className="flex min-h-full items-center justify-center p-4 py-8"
        onClick={handleBackdropClick}
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
                <div
                  key={key}
                  className="flex items-center justify-between py-3"
                >
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
    </div>
  );

  return createPortal(modal, document.body);
}
