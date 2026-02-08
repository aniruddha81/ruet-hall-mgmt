import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { db } from "./index";
import { admins, rooms, students, users, halls } from "./models/index";

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    // ===== CREATE HALLS =====
    console.log("📍 Creating halls...");
    const hallData = [
      {
        id: randomUUID(),
        name: "ZIA_HALL" as const,
        address: "Block A, RUET Campus",
        contactNumber: "01711111111",
        totalCapacity: 200,
        totalRooms: 40,
        isActive: true,
      },
      {
        id: randomUUID(),
        name: "SHAH_JALAL_HALL" as const,
        address: "Block B, RUET Campus",
        contactNumber: "01722222222",
        totalCapacity: 180,
        totalRooms: 36,
        isActive: true,
      },
      {
        id: randomUUID(),
        name: "RASHID_HALL" as const,
        address: "Block C, RUET Campus",
        contactNumber: "01733333333",
        totalCapacity: 160,
        totalRooms: 32,
        isActive: true,
      },
      {
        id: randomUUID(),
        name: "FARUKI_HALL" as const,
        address: "Block D, RUET Campus",
        contactNumber: "01744444444",
        totalCapacity: 140,
        totalRooms: 28,
        isActive: true,
      },
    ];

    const insertedHalls: typeof hallData = [];
    for (const hall of hallData) {
      await db.insert(halls).values(hall);
      insertedHalls.push(hall);
    }
    console.log(`✅ Created ${insertedHalls.length} halls`);

    // ===== CREATE ROOMS =====
    console.log("🚪 Creating rooms...");
    let roomCount = 0;
    for (const hall of insertedHalls) {
      const numRooms = parseInt(hall.totalRooms.toString());
      for (let i = 1; i <= numRooms; i++) {
        const floor = Math.ceil(i / 10);
        await db.insert(rooms).values({
          id: randomUUID(),
          hallId: hall.id,
          roomNumber: i,
          floor: floor,
          capacity: 5,
          currentOccupancy: 0,
          status: "AVAILABLE",
        });
        roomCount++;
      }
    }
    console.log(`✅ Created ${roomCount} rooms`);

    // ===== CREATE STUDENT USERS & RECORDS =====
    console.log("👨‍🎓 Creating student users...");

    console.log("🎉 Database seed completed successfully!");
    console.log("\n📝 Default Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nStudents (all with password: Student@123):");
    console.log("\nAdmins (all with password: Admin@123):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
