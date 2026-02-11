import { eq } from "drizzle-orm";
import { HALLS } from "../types/enums";
import { db } from "./index";
import {
  halls as hallsTable,
  rooms as roomsTable,
} from "./models/halls.models";

/**
 * Seed halls and rooms.
 * - Inserts each hall from `HALLS` if not present
 * - Creates `totalRooms` rooms per hall with globally-unique room numbers
 * - Uses sensible defaults so this is safe to run multiple times
 */
export async function seedHallsAndRooms(opts?: {
  roomsPerHall?: number;
  roomCapacity?: number;
}) {
  const roomsPerHall = opts?.roomsPerHall ?? 50;
  const roomCapacity = opts?.roomCapacity ?? 2;

  let globalRoomNumber = 1;

  for (const hallName of HALLS) {
    // Check if hall exists
    const [existing] = await db
      .select()
      .from(hallsTable)
      .where(eq(hallsTable.name, hallName))
      .limit(1);

    const totalRooms = roomsPerHall;
    const totalCapacity = totalRooms * roomCapacity;

    if (!existing) {
      await db.insert(hallsTable).values({
        name: hallName,
        address: `${hallName.replace(/_/g, " ")} Address`,
        contactNumber: null,
        totalCapacity,
        totalRooms,
        isActive: true,
      });
    } else {
      // Ensure totals are up-to-date
      await db
        .update(hallsTable)
        .set({ totalCapacity, totalRooms })
        .where(eq(hallsTable.name, hallName));
    }

    // Insert rooms for this hall if not already present (based on hall & roomNumber index)
    // We create globally-unique room numbers to satisfy the schema's primary key.
    for (let i = 0; i < roomsPerHall; i++) {
      const roomNumber = globalRoomNumber++;

      const [roomExists] = await db
        .select()
        .from(roomsTable)
        .where(eq(roomsTable.roomNumber, roomNumber))
        .limit(1);

      if (!roomExists) {
        await db.insert(roomsTable).values({
          roomNumber,
          hall: hallName,
          capacity: roomCapacity,
          currentOccupancy: 0,
          status: "AVAILABLE",
        });
      }
    }
  }
}

// Run the seed when invoked directly
if (require.main === module) {
  (async () => {
    try {
      console.log("Seeding halls and rooms...");
      await seedHallsAndRooms();
      console.log("Seed complete");
      process.exit(0);
    } catch (err) {
      console.error("Seed failed:", err);
      process.exit(1);
    }
  })();
}
