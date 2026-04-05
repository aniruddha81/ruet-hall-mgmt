import api from "@/lib/api";
import type { ApiResponse, Hall } from "@/lib/types";

export type DamageComplaintResponse = {
  id: string;
  hall: Hall;
  locationDescription: string;
  assetDetails: string;
  status: "REPORTED";
};

export async function reportDamage(data: {
  locationDescription: string;
  assetDetails: string;
}) {
  const res = await api.post<ApiResponse<DamageComplaintResponse>>(
    "/inventory/damage",
    data,
  );
  return res.data;
}
