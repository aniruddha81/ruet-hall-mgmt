import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { db } from "./index.ts";
import {
  beds,
  hallAdmins,
  halls as hallsTable,
  rooms,
  uniStudents,
} from "./models/index.ts";

async function seed() {
  const pass = await bcrypt.hash("AdminPass123!", 10);

  const hallsData = [
    {
      name: "ZIA_HALL" as const,
      address: "Block A, Main Campus",
      contactNumber: "01710000001",
      totalCapacity: 80,
      totalRooms: 20,
      isActive: true,
    },
    {
      name: "SELIM_HALL" as const,
      address: "East Residential Zone",
      contactNumber: "01710000002",
      totalCapacity: 120,
      totalRooms: 30,
      isActive: true,
    },
    {
      name: "HAMID_HALL" as const,
      address: "South Campus Road",
      contactNumber: "01710000003",
      totalCapacity: 100,
      totalRooms: 25,
      isActive: true,
    },
    {
      name: "SHAHIDUL_HALL" as const,
      address: "North Academic Area",
      contactNumber: "01710000004",
      totalCapacity: 90,
      totalRooms: 22,
      isActive: true,
    },
    {
      name: "TIN_SHED_HALL" as const,
      address: "West Residential Zone",
      contactNumber: "01710000005",
      totalCapacity: 60,
      totalRooms: 15,
      isActive: true,
    },
    {
      name: "FAZLUL_HUQ_HALL" as const,
      address: "East Academic Area",
      contactNumber: "01710000006",
      totalCapacity: 80,
      totalRooms: 20,
      isActive: true,
    },
  ];
  await db.insert(hallsTable).values(hallsData);

  const roomsData = hallsData.flatMap((hall) =>
    Array.from({ length: hall.totalRooms }, (_, i) => ({
      id: randomUUID(),
      roomNumber: i + 1,
      hall: hall.name,
      capacity: 4 as const,
      currentOccupancy: 0,
      status: "AVAILABLE" as const,
    }))
  );
  await db.insert(rooms).values(roomsData);

  const BED_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const bedsData = roomsData.flatMap((room) =>
    BED_LABELS.slice(0, room.capacity).map((label) => ({
      id: randomUUID(),
      hall: room.hall,
      roomId: room.id,
      bedLabel: label,
      status: "AVAILABLE" as const,
    }))
  );
  await db.insert(beds).values(bedsData);

  const admins = [
    {
      email: "admin1@gmail.com",
      name: "kuldip yadav",
      hall: "ZIA_HALL" as const,
    },
    {
      email: "admin2@gmail.com",
      name: "Virat Kohli",
      hall: "SELIM_HALL" as const,
    },
    {
      email: "admin3@gmail.com",
      name: "Rohit Sharma",
      hall: "HAMID_HALL" as const,
    },
    {
      email: "admin4@gmail.com",
      name: "KL Rahul",
      hall: "SHAHIDUL_HALL" as const,
    },
    {
      email: "admin5@gmail.com",
      name: "Suryakumar Yadav",
      hall: "TIN_SHED_HALL" as const,
    },
    {
      email: "admin6@gmail.com",
      name: "Rishabh Pant",
      hall: "FAZLUL_HUQ_HALL" as const,
    },
  ].map((admin) => ({
    id: randomUUID(),
    ...admin,
    passwordHash: pass,
    academicDepartment: "CSE" as const,
    designation: "PROVOST" as const,
    operationalUnit: "ALL" as const,
    phone: "+8801712345678",
    hallAdminStatus: "APPROVED" as const,
    isActive: true,
  }));
  await db.insert(hallAdmins).values(admins);

  const studentPass = "StudentPass123!";
  const studentPassHash = await bcrypt.hash(studentPass, 10);
  const studentsData = Array.from({ length: 50 }, (_, i) => ({
    id: randomUUID(),
    email: `student${i + 1}@gmail.com`,
    passwordHash: studentPassHash,
    name: `Student ${i + 1}`,
    phone: `+880171234567${String(i + 1).padStart(2, "0")}`,
    rollNumber: String(i + 1).padStart(5, "0"),
    academicDepartment: "CSE" as const,
    isActive: true,
    avatarUrl: null,
    isAllocated: false,
    session: "2024-2025",
    hall: null,
    roomId: null,
    status: "ACTIVE" as const,
  }));
  await db.insert(uniStudents).values(studentsData);
}

try {
  await seed();
  console.log("Seed completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("Seed failed:", error);
  process.exit(1);
}
