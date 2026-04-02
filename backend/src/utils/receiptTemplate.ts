export interface MealReceiptData {
  type: "MEAL";
  studentName: string;
  studentEmail: string;
  rollNumber: string;
  hall: string;
  paymentId: string;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  totalQuantity: number;
  mealType?: string;
  mealDate?: string;
  paymentDate: Date;
}

export interface DueReceiptData {
  type: "DUE";
  studentName: string;
  studentEmail: string;
  rollNumber: string;
  hall: string;
  paymentId: string;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  dueType: string;
  dueId: string;
  paidAt: Date;
}

export type ReceiptData = MealReceiptData | DueReceiptData;

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  }).format(d);
}

function formatHall(hall: string): string {
  return hall.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateReceiptHTML(data: ReceiptData): string {
  const isMeal = data.type === "MEAL";
  const date = isMeal ? data.paymentDate : data.paidAt;
  const accentColor = isMeal ? "#10b981" : "#6366f1";
  const accentLight = isMeal ? "#d1fae5" : "#e0e7ff";
  const typeLabel = isMeal
    ? "Meal Token Payment"
    : `Hall Due Payment (${data.dueType})`;
  const receiptNo =
    data.transactionId || data.paymentId.slice(0, 12).toUpperCase();

  let itemsHTML = "";

  if (isMeal) {
    itemsHTML = `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;">Meal Type</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111827;font-weight:600;text-align:right;">
          ${data.mealType || "N/A"}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;">Meal Date</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111827;font-weight:600;text-align:right;">
          ${data.mealDate || "N/A"}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;">Tokens Purchased</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111827;font-weight:600;text-align:right;">
          ${data.totalQuantity}
        </td>
      </tr>`;
  } else {
    itemsHTML = `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;">Due Type</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111827;font-weight:600;text-align:right;">
          ${data.dueType}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;">Due Reference</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111827;font-weight:600;text-align:right;font-family:monospace;">
          #${data.dueId.slice(0, 8)}
        </td>
      </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Payment Receipt – RUET Hall Management</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr>
      <td align="center">
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
                  <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#374151;">Receipt No.</td>
                  <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#111827;font-weight:700;text-align:right;font-family:monospace;font-size:13px;">
                    ${receiptNo}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#374151;">Date & Time</td>
                  <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#111827;font-weight:600;text-align:right;">
                    ${formatDate(date)}
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

          <!-- Student info -->
          <tr>
            <td style="padding:0 32px 8px;">
              <p style="margin:0 0 12px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">
                Student Details
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;">Name</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111827;font-weight:600;text-align:right;">
                    ${data.studentName}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;">Roll</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111827;font-weight:600;text-align:right;">
                    ${data.rollNumber}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;">Hall</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111827;font-weight:600;text-align:right;">
                    ${formatHall(data.hall)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment-specific info -->
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
}
