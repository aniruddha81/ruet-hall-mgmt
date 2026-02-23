import { randomUUID } from "crypto";
import { db } from ".";
import { beds, halls as hallsTable, rooms } from "./models";

async function seed() {
  // hall insertion

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
      name: "SHAH_JALAL_HALL" as const,
      address: "East Residential Zone",
      contactNumber: "01710000002",
      totalCapacity: 120,
      totalRooms: 30,
      isActive: true,
    },
    {
      name: "RASHID_HALL" as const,
      address: "South Campus Road",
      contactNumber: "01710000003",
      totalCapacity: 100,
      totalRooms: 25,
      isActive: true,
    },
    {
      name: "FARUKI_HALL" as const,
      address: "North Academic Area",
      contactNumber: "01710000004",
      totalCapacity: 90,
      totalRooms: 22,
      isActive: true,
    },
  ];

  for (const hallData of hallsData) {
    await db.insert(hallsTable).values(hallData);
  }

  // room insertion

  const hallRoomConfig = [
    { name: "ZIA_HALL" as const, totalRooms: 20, capacity: 4 },
    { name: "SHAH_JALAL_HALL" as const, totalRooms: 30, capacity: 4 },
    { name: "RASHID_HALL" as const, totalRooms: 25, capacity: 4 },
    { name: "FARUKI_HALL" as const, totalRooms: 22, capacity: 4 },
  ] as const;

  const roomsData = [];

  let roomNumberCount = 1;

  for (const hall of hallRoomConfig) {
    for (let i = 0; i < hall.totalRooms; i++) {
      roomsData.push({
        id: randomUUID(),
        roomNumber: roomNumberCount++,
        hall: hall.name,
        capacity: hall.capacity,
        currentOccupancy: 0,
        status: "AVAILABLE" as const,
      });
    }
    roomNumberCount = 1;
  }

  for (const room of roomsData) {
    await db.insert(rooms).values(room);
  }

  // Fetch all rooms already seeded in the DB
  const allRooms = await db
    .select({
      id: rooms.id,
      hall: rooms.hall,
      capacity: rooms.capacity,
      roomNumber: rooms.roomNumber,
    })
    .from(rooms);

  if (allRooms.length === 0) {
    console.warn("No rooms found in DB. Run the main seed script first.");
    process.exit(1);
  }

  console.log(`Found ${allRooms.length} rooms. Seeding beds...`);

  const BED_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

  let totalInserted = 0;

  for (const room of allRooms) {
    const labels = BED_LABELS.slice(0, room.capacity);

    for (const label of labels) {
      await db.insert(beds).values({
        id: randomUUID(),
        hall: room.hall,
        roomId: room.id,
        bedLabel: label,
        status: "AVAILABLE",
      });
      totalInserted++;
    }
  }
}

try {
  await seed();
  console.log("Seed completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("Seed failed:", error);
  process.exit(1);
}
