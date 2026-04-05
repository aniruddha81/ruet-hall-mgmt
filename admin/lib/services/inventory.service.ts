import api from "@/lib/api";
import type {
  ApiResponse,
  DamageReport,
  DamageReportStatus,
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

// =================== DAMAGE REPORTS ===================

export async function getDamageReports(params?: {
  status?: DamageReportStatus;
}) {
  const res = await api.get<ApiResponse<DamageReport[]>>("/inventory/damage", {
    params,
  });

  return {
    ...res.data,
    data: {
      reports: res.data.data ?? [],
    },
  };
}

export async function verifyDamageReport(
  id: string,
  data: {
    isStudentResponsible: boolean;
    fineAmount?: number;
    damageCost?: number;
    managerNote?: string;
  },
) {
  const res = await api.patch<ApiResponse<{ report: DamageReport }>>(
    `/inventory/damage/${id}/verify`,
    data,
  );
  return res.data;
}

export async function markDamageFixed(id: string) {
  const res = await api.patch<ApiResponse<{ report: DamageReport }>>(
    `/inventory/damage/${id}/fix`,
  );
  return res.data;
}
