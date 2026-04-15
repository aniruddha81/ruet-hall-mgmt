import api from "@/lib/api";
import type { ApiResponse, Hall } from "@/lib/types";

export type DamageComplaintResponse = {
  id: string;
  hall: Hall;
  locationDescription: string;
  assetDetails: string;
  imageUrl: string | null;
  status: "REPORTED";
};

export async function reportDamage(data: {
  locationDescription: string;
  assetDetails: string;
  image: File;
}) {
  const formData = new FormData();
  formData.append("locationDescription", data.locationDescription);
  formData.append("assetDetails", data.assetDetails);
  formData.append("image", data.image);

  const res = await api.post<ApiResponse<DamageComplaintResponse>>(
    "/inventory/damage",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data;
}
