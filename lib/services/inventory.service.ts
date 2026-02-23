import api from "@/lib/api";
import type {
  ApiResponse,
  Asset,
  AssetCondition,
  Bed,
  BedStatus,
  DamageReport,
  Hall,
  Room,
  RoomStatus,
} from "@/lib/types";

// =================== ROOM MANAGEMENT ===================

export async function getRooms(params?: { hall?: Hall; status?: RoomStatus }) {
  const res = await api.get<ApiResponse<{ rooms: Room[] }>>(
    "/inventory/rooms",
    { params },
  );
  return res.data;
}

// =================== BED MANAGEMENT ===================

export async function createBeds(data: {
  roomId: string;
  beds: Array<{ bedLabel: string }>;
}) {
  const res = await api.post<ApiResponse<{ beds: Bed[] }>>(
    "/inventory/beds",
    data,
  );
  return res.data;
}

export async function getBeds(params?: {
  hall?: Hall;
  roomId?: string;
  status?: BedStatus;
}) {
  const res = await api.get<ApiResponse<{ beds: Bed[] }>>("/inventory/beds", {
    params,
  });
  return res.data;
}

// =================== ASSET MANAGEMENT ===================

export async function createAsset(data: {
  name: string;
  quantity: number;
  assetCondition: AssetCondition;
}) {
  const res = await api.post<ApiResponse<{ asset: Asset }>>(
    "/inventory/assets",
    data,
  );
  return res.data;
}

// =================== DAMAGE REPORTS ===================

export async function verifyDamageReport(
  id: string,
  data: { fineAmount: number },
) {
  const res = await api.patch<ApiResponse<{ report: DamageReport }>>(
    `/inventory/damage/${id}/verify`,
    data,
  );
  return res.data;
}
