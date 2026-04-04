import api from "@/lib/api";
import type {
  ApiResponse,
  Asset,
  AssetCondition,
  DamageReport,
  Hall,
  Room,
  RoomStatus,
} from "@/lib/types";

type RawRoom = {
  id: string;
  roomNumber: number;
  hall: Hall;
  capacity: number;
  currentOccupancy: number;
  status: RoomStatus;
  createdAt?: string;
  updatedAt?: string;
};

function mapRoom(raw: RawRoom): Room {
  return {
    id: raw.id,
    roomNumber: raw.roomNumber,
    hall: raw.hall,
    capacity: raw.capacity,
    currentOccupancy: raw.currentOccupancy,
    roomStatus: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// =================== ROOM MANAGEMENT ===================

export async function getRooms(params?: { hall?: Hall; status?: RoomStatus }) {
  const res = await api.get<ApiResponse<RawRoom[]>>("/inventory/rooms", {
    params,
  });

  return {
    ...res.data,
    data: {
      rooms: (res.data.data ?? []).map(mapRoom),
    },
  };
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
