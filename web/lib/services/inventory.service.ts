import api from "@/lib/api";
import type { ApiResponse, DamageReport } from "@/lib/types";

// =================== STUDENT INVENTORY ===================

export async function reportDamage(data: {
  assetId: string;
  description: string;
}) {
  const res = await api.post<ApiResponse<{ report: DamageReport }>>(
    "/inventory/damage",
    data,
  );
  return res.data;
}
