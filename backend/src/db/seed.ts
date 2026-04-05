import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { eq, type InferInsertModel } from "drizzle-orm";
import {
  ACADEMIC_DEPARTMENTS,
  HALLS,
  STAFF_ROLES,
  type AcademicDepartment,
  type Hall,
  type StaffRole,
} from "../types/enums.ts";
import { db } from "./index.ts";
import {
  damageReports,
  expenses,
  hallAdmins,
  halls as hallsTable,
  mealMenus,
  mealPayments,
  mealTokens,
  payments,
  refreshTokens,
  rooms,
  seatAllocations,
  seatApplications,
  studentDues,
  uniStudents,
} from "./models/index.ts";

const ADMIN_PASSWORD = "AdminPass123!";
const STUDENT_PASSWORD = "StudentPass123!";
const DEFAULT_SESSION = "2024-2025";
const ROOM_CAPACITY = 4;

const hallDetails: Record<
  Hall,
  { address: string; contactNumber: string; totalRooms: number }
> = {
  ZIA_HALL: {
    address: "Block A, Main Campus",
    contactNumber: "01710000001",
    totalRooms: 8,
  },
  SELIM_HALL: {
    address: "East Residential Zone",
    contactNumber: "01710000002",
    totalRooms: 8,
  },
  HAMID_HALL: {
    address: "South Campus Road",
    contactNumber: "01710000003",
    totalRooms: 7,
  },
  SHAHIDUL_HALL: {
    address: "North Academic Area",
    contactNumber: "01710000004",
    totalRooms: 7,
  },
  TIN_SHED_HALL: {
    address: "West Residential Zone",
    contactNumber: "01710000005",
    totalRooms: 6,
  },
  FAZLUL_HUQ_HALL: {
    address: "East Academic Area",
    contactNumber: "01710000006",
    totalRooms: 6,
  },
};

const roleConfig: Record<
  StaffRole,
  { operationalUnit: "ALL" | "FINANCE" | "DINING" | "INVENTORY" }
> = {
  PROVOST: { operationalUnit: "ALL" },
  ASST_FINANCE: { operationalUnit: "FINANCE" },
  FINANCE_SECTION_OFFICER: { operationalUnit: "FINANCE" },
  ASST_DINING: { operationalUnit: "DINING" },
  DINING_MANAGER: { operationalUnit: "DINING" },
  ASST_INVENTORY: { operationalUnit: "INVENTORY" },
  INVENTORY_SECTION_OFFICER: { operationalUnit: "INVENTORY" },
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const must = <T>(value: T | undefined | null, message: string): T => {
  if (value == null) {
    throw new Error(message);
  }
  return value;
};

const pickDepartment = (index: number): AcademicDepartment =>
  must(
    ACADEMIC_DEPARTMENTS[index % ACADEMIC_DEPARTMENTS.length],
    `Missing department for index ${index}`
  );

async function clearDatabase() {
  await db.delete(refreshTokens);
  await db.delete(mealTokens);
  await db.delete(mealPayments);
  await db.delete(mealMenus);
  await db.delete(seatAllocations);
  await db.delete(seatApplications);
  await db.delete(payments);
  await db.delete(studentDues);
  await db.delete(expenses);
  await db.delete(damageReports);
  await db.delete(uniStudents); // must be before rooms (room_id FK)
  await db.delete(rooms);
  await db.delete(hallAdmins); // must be before halls if hall FK exists
  await db.delete(hallsTable);
}

async function seed() {
  await clearDatabase();

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const studentPasswordHash = await bcrypt.hash(STUDENT_PASSWORD, 10);
  const today = new Date();
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);
  const tomorrow = addDays(today, 1);

  const hallsData = HALLS.map((hall) => ({
    name: hall,
    address: hallDetails[hall].address,
    contactNumber: hallDetails[hall].contactNumber,
    totalCapacity: hallDetails[hall].totalRooms * ROOM_CAPACITY,
    totalRooms: hallDetails[hall].totalRooms,
    isActive: true,
  }));
  await db.insert(hallsTable).values(hallsData);

  const roomsData = hallsData.flatMap((hall) =>
    Array.from({ length: hall.totalRooms }, (_, index) => ({
      id: randomUUID(),
      roomNumber: index + 101,
      hall: hall.name,
      capacity: ROOM_CAPACITY,
      currentOccupancy: 0,
      status: "AVAILABLE" as const,
    }))
  );
  await db.insert(rooms).values(roomsData);

  const adminsData = HALLS.flatMap((hall, hallIndex) => {
    const provostId = randomUUID();
    return STAFF_ROLES.map((designation, roleIndex) => ({
      id: designation === "PROVOST" ? provostId : randomUUID(),
      email: `${hall.toLowerCase()}_${designation.toLowerCase()}@ruet.ac.bd`,
      passwordHash: adminPasswordHash,
      name: `${designation.replaceAll("_", " ")} ${hallIndex + 1}`,
      phone: `+8801700${String(hallIndex * 10 + roleIndex + 1).padStart(6, "0")}`,
      academicDepartment: pickDepartment(hallIndex + roleIndex),
      hall,
      designation,
      operationalUnit: roleConfig[designation].operationalUnit,
      reportingToId: designation === "PROVOST" ? null : provostId,
      hallAdminStatus: "APPROVED" as const,
      isActive: true,
      avatarUrl: null,
    }));
  });

  const ziaProvostId = must(
    adminsData.find(
      (admin) => admin.hall === "ZIA_HALL" && admin.designation === "PROVOST"
    )?.id,
    "Missing ZIA_HALL provost"
  );
  const selimProvostId = must(
    adminsData.find(
      (admin) => admin.hall === "SELIM_HALL" && admin.designation === "PROVOST"
    )?.id,
    "Missing SELIM_HALL provost"
  );

  await db.insert(hallAdmins).values([
    ...adminsData,
    {
      id: randomUUID(),
      email: "pending.finance@ruet.ac.bd",
      passwordHash: adminPasswordHash,
      name: "Pending Finance Applicant",
      phone: "+8801700999001",
      academicDepartment: "CSE",
      hall: "ZIA_HALL",
      designation: "ASST_FINANCE",
      operationalUnit: "FINANCE",
      reportingToId: ziaProvostId,
      hallAdminStatus: "PENDING",
      isActive: true,
      avatarUrl: null,
    },
    {
      id: randomUUID(),
      email: "rejected.inventory@ruet.ac.bd",
      passwordHash: adminPasswordHash,
      name: "Rejected Inventory Applicant",
      phone: "+8801700999002",
      academicDepartment: "EEE",
      hall: "SELIM_HALL",
      designation: "ASST_INVENTORY",
      operationalUnit: "INVENTORY",
      reportingToId: selimProvostId,
      hallAdminStatus: "REJECTED",
      isActive: false,
      avatarUrl: null,
    },
  ]);

  const roomByHall = Object.fromEntries(
    HALLS.map((hall) => [hall, roomsData.filter((room) => room.hall === hall)])
  ) as Record<Hall, (typeof roomsData)[number][]>;

  const studentsData: InferInsertModel<typeof uniStudents>[] = Array.from(
    { length: 24 },
    (_, index) => ({
      id: randomUUID(),
      email: `student${index + 1}@ruet.ac.bd`,
      passwordHash: studentPasswordHash,
      name: `Student ${index + 1}`,
      phone: `+8801800${String(index + 1).padStart(6, "0")}`,
      rollNumber: `24${String(index + 1).padStart(4, "0")}`,
      academicDepartment: pickDepartment(index),
      isActive: true,
      avatarUrl: null,
      isAllocated: false,
      session: DEFAULT_SESSION,
      hall: null,
      roomId: null,
      status:
        index === 22
          ? ("ALUMNI" as const)
          : index === 23
            ? ("SUSPENDED" as const)
            : ("ACTIVE" as const),
    })
  );
  await db.insert(uniStudents).values(studentsData);

  const approvedApplications = HALLS.map((hall, hallIndex) => {
    const student = must(
      studentsData[hallIndex],
      `Missing student for ${hall}`
    );
    return {
      id: randomUUID(),
      studentId: student.id,
      rollNumber: student.rollNumber,
      hall,
      academicDepartment: student.academicDepartment,
      session: DEFAULT_SESSION,
      status: "APPROVED" as const,
      reviewedBy: must(
        adminsData.find(
          (admin) => admin.hall === hall && admin.designation === "PROVOST"
        )?.id,
        `Missing provost for ${hall}`
      ),
      reviewedAt: yesterday,
      createdAt: twoDaysAgo,
    };
  });

  const pendingApplicationStudent = must(
    studentsData[6],
    "Missing pending application student"
  );
  const rejectedApplicationStudent = must(
    studentsData[7],
    "Missing rejected application student"
  );

  await db.insert(seatApplications).values([
    ...approvedApplications,
    {
      id: randomUUID(),
      studentId: pendingApplicationStudent.id,
      rollNumber: pendingApplicationStudent.rollNumber,
      hall: "ZIA_HALL",
      academicDepartment: pendingApplicationStudent.academicDepartment,
      session: DEFAULT_SESSION,
      status: "PENDING",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: yesterday,
    },
    {
      id: randomUUID(),
      studentId: rejectedApplicationStudent.id,
      rollNumber: rejectedApplicationStudent.rollNumber,
      hall: "SELIM_HALL",
      academicDepartment: rejectedApplicationStudent.academicDepartment,
      session: DEFAULT_SESSION,
      status: "REJECTED",
      reviewedBy: selimProvostId,
      reviewedAt: today,
      createdAt: yesterday,
    },
  ]);

  const seatAllocationsData = approvedApplications.map((application, index) => {
    const hallRooms = must(
      roomByHall[application.hall],
      `Missing rooms for ${application.hall}`
    );
    const targetRoom = must(
      hallRooms[index % hallRooms.length],
      `Missing target room for ${application.hall}`
    );

    return {
      id: randomUUID(),
      studentId: application.studentId,
      rollNumber: application.rollNumber,
      hall: application.hall,
      roomId: targetRoom.id,
      allocatedAt: today,
      allocatedBy: must(
        adminsData.find(
          (admin) =>
            admin.hall === application.hall && admin.designation === "PROVOST"
        )?.id,
        `Missing allocator for ${application.hall}`
      ),
    };
  });
  await db.insert(seatAllocations).values(seatAllocationsData);

  for (const allocation of seatAllocationsData) {
    const currentRoom = must(
      roomsData.find((room) => room.id === allocation.roomId),
      `Missing room ${allocation.roomId}`
    );

    await db
      .update(uniStudents)
      .set({
        isAllocated: true,
        hall: allocation.hall,
        roomId: allocation.roomId,
      })
      .where(eq(uniStudents.id, allocation.studentId));

    await db
      .update(rooms)
      .set({
        currentOccupancy: currentRoom.currentOccupancy + 1,
        status:
          currentRoom.currentOccupancy + 1 >= currentRoom.capacity
            ? "OCCUPIED"
            : "AVAILABLE",
      })
      .where(eq(rooms.id, allocation.roomId));

    currentRoom.currentOccupancy += 1;
  }

  const ziaInventoryOfficerId = must(
    adminsData.find(
      (admin) =>
        admin.hall === "ZIA_HALL" &&
        admin.designation === "INVENTORY_SECTION_OFFICER"
    )?.id,
    "Missing ZIA inventory officer"
  );
  const firstAllocation = must(
    seatAllocationsData[0],
    "Missing first allocation"
  );
  const secondAllocation = must(
    seatAllocationsData[1],
    "Missing second allocation"
  );

  const damageReportsData = [
    {
      id: randomUUID(),
      studentId: firstAllocation.studentId,
      hall: "ZIA_HALL" as const,
      locationDescription: "Room 203, south wall near the window.",
      assetDetails: "Ceiling fan regulator is burnt and fan speed is unstable.",
      description: "Fan regulator is damaged and needs replacement.",
      fineAmount: 600,
      damageCost: null,
      isStudentResponsible: true,
      managerNote: "Student confirmed accidental damage during cleaning.",
      liableStudentId: firstAllocation.studentId,
      status: "VERIFIED" as const,
      verifiedBy: ziaInventoryOfficerId,
    },
    {
      id: randomUUID(),
      studentId: secondAllocation.studentId,
      hall: "SELIM_HALL" as const,
      locationDescription: "Room 109, beside the study corner.",
      assetDetails: "Study table leg is cracked and the table shakes heavily.",
      description: "Study table leg is loose and unstable.",
      fineAmount: null,
      damageCost: null,
      isStudentResponsible: null,
      managerNote: null,
      liableStudentId: null,
      status: "REPORTED" as const,
      verifiedBy: null,
    },
  ];
  await db.insert(damageReports).values(damageReportsData);

  const expensesData = HALLS.map((hall) => ({
    id: randomUUID(),
    hall,
    title: `${hall.replaceAll("_", " ")} Monthly Utility Bill`,
    amount: 12000 + HALLS.indexOf(hall) * 1000,
    category: "UTILITY",
    approvedBy: must(
      adminsData.find(
        (admin) => admin.hall === hall && admin.designation === "PROVOST"
      )?.id,
      `Missing approvedBy admin for ${hall}`
    ),
    createdAt: yesterday,
  }));
  await db.insert(expenses).values(expensesData);

  const extraPaidStudent = must(studentsData[8], "Missing extra paid student");
  const verifiedDamageReport = must(
    damageReportsData[0],
    "Missing verified damage report"
  );

  const duesData = [
    ...seatAllocationsData.map((allocation, index) => ({
      id: randomUUID(),
      studentId: allocation.studentId,
      hall: allocation.hall,
      type: "RENT" as const,
      amount: 1200 + index * 50,
      status: index < 3 ? ("PAID" as const) : ("UNPAID" as const),
      paidAt: index < 3 ? yesterday : null,
    })),
    {
      id: randomUUID(),
      studentId: verifiedDamageReport.studentId,
      hall: verifiedDamageReport.hall,
      type: "FINE" as const,
      amount: must(verifiedDamageReport.fineAmount, "Missing fine amount"),
      status: "UNPAID" as const,
      paidAt: null,
    },
    {
      id: randomUUID(),
      studentId: extraPaidStudent.id,
      hall: "HAMID_HALL" as const,
      type: "OTHER" as const,
      amount: 450,
      status: "PAID" as const,
      paidAt: today,
    },
  ];
  await db.insert(studentDues).values(duesData);

  const paymentsData = duesData
    .filter((due) => due.status === "PAID")
    .map((due, index) => ({
      id: randomUUID(),
      studentId: due.studentId,
      hall: due.hall,
      dueId: due.id,
      amount: due.amount,
      method: index % 2 === 0 ? ("ONLINE" as const) : ("BANK" as const),
      createdAt: due.paidAt ?? today,
    }));
  await db.insert(payments).values(paymentsData);

  const menusData = HALLS.flatMap((hall) => {
    const diningManagerId = must(
      adminsData.find(
        (admin) => admin.hall === hall && admin.designation === "DINING_MANAGER"
      )?.id,
      `Missing dining manager for ${hall}`
    );

    return [
      {
        id: randomUUID(),
        hall,
        mealDate: tomorrow,
        mealType: "LUNCH" as const,
        menuDescription: "Rice, Chicken Curry, Dal, Vegetable, Salad",
        price: 50,
        totalTokens: 150,
        bookedTokens: 2,
        createdBy: diningManagerId,
      },
      {
        id: randomUUID(),
        hall,
        mealDate: tomorrow,
        mealType: "DINNER" as const,
        menuDescription: "Polao, Beef Bhuna, Dal, Dessert",
        price: 70,
        totalTokens: 120,
        bookedTokens: 1,
        createdBy: diningManagerId,
      },
    ];
  });
  await db.insert(mealMenus).values(menusData);

  const lunchMenuByHall = Object.fromEntries(
    HALLS.map((hall) => [
      hall,
      must(
        menusData.find(
          (menu) => menu.hall === hall && menu.mealType === "LUNCH"
        ),
        `Missing lunch menu for ${hall}`
      ),
    ])
  ) as Record<Hall, (typeof menusData)[number]>;
  const dinnerMenuByHall = Object.fromEntries(
    HALLS.map((hall) => [
      hall,
      must(
        menusData.find(
          (menu) => menu.hall === hall && menu.mealType === "DINNER"
        ),
        `Missing dinner menu for ${hall}`
      ),
    ])
  ) as Record<Hall, (typeof menusData)[number]>;

  const thirdAllocation = must(
    seatAllocationsData[2],
    "Missing third allocation"
  );

  const mealPaymentsData = [
    {
      id: randomUUID(),
      studentId: firstAllocation.studentId,
      amount: 100,
      totalQuantity: 2,
      paymentMethod: "BKASH" as const,
      transactionId: "MEALPAY-1001",
      paymentDate: today,
      refundedAt: null,
      refundAmount: null,
    },
    {
      id: randomUUID(),
      studentId: secondAllocation.studentId,
      amount: 70,
      totalQuantity: 1,
      paymentMethod: "NAGAD" as const,
      transactionId: "MEALPAY-1002",
      paymentDate: today,
      refundedAt: null,
      refundAmount: null,
    },
    {
      id: randomUUID(),
      studentId: thirdAllocation.studentId,
      amount: 50,
      totalQuantity: 1,
      paymentMethod: "CASH" as const,
      transactionId: "MEALPAY-1003",
      paymentDate: today,
      refundedAt: today,
      refundAmount: 50,
    },
  ];
  await db.insert(mealPayments).values(mealPaymentsData);

  const firstMealPayment = must(
    mealPaymentsData[0],
    "Missing first meal payment"
  );
  const secondMealPayment = must(
    mealPaymentsData[1],
    "Missing second meal payment"
  );
  const thirdMealPayment = must(
    mealPaymentsData[2],
    "Missing third meal payment"
  );

  await db.insert(mealTokens).values([
    {
      id: randomUUID(),
      studentId: firstAllocation.studentId,
      menuId: lunchMenuByHall[firstAllocation.hall].id,
      hall: firstAllocation.hall,
      mealDate: tomorrow,
      mealType: "LUNCH",
      quantity: 2,
      totalAmount: 100,
      paymentId: firstMealPayment.id,
      bookingTime: today,
      cancelledAt: null,
    },
    {
      id: randomUUID(),
      studentId: secondAllocation.studentId,
      menuId: dinnerMenuByHall[secondAllocation.hall].id,
      hall: secondAllocation.hall,
      mealDate: tomorrow,
      mealType: "DINNER",
      quantity: 1,
      totalAmount: 70,
      paymentId: secondMealPayment.id,
      bookingTime: today,
      cancelledAt: null,
    },
    {
      id: randomUUID(),
      studentId: thirdAllocation.studentId,
      menuId: lunchMenuByHall[thirdAllocation.hall].id,
      hall: thirdAllocation.hall,
      mealDate: tomorrow,
      mealType: "LUNCH",
      quantity: 1,
      totalAmount: 50,
      paymentId: thirdMealPayment.id,
      bookingTime: today,
      cancelledAt: today,
    },
  ]);

  const adminUser = must(adminsData[0], "Missing admin user for refresh token");
  const studentUser = must(
    studentsData[0],
    "Missing student user for refresh token"
  );

  await db.insert(refreshTokens).values([
    {
      id: randomUUID(),
      userId: adminUser.id,
      tokenHash: "seed-admin-token-hash",
      jti: "seed-admin-jti",
      ip: "127.0.0.1",
      userAgent: "Seed Script Admin Session",
      expiresAt: addDays(today, 7),
    },
    {
      id: randomUUID(),
      userId: studentUser.id,
      tokenHash: "seed-student-token-hash",
      jti: "seed-student-jti",
      ip: "127.0.0.1",
      userAgent: "Seed Script Student Session",
      expiresAt: addDays(today, 7),
    },
  ]);

  console.log(
    `Seed completed successfully.\nAdmin password: ${ADMIN_PASSWORD}\nStudent password: ${STUDENT_PASSWORD}`
  );
}

try {
  await seed();
  process.exit(0);
} catch (error) {
  console.error("Seed failed:", error);
  process.exit(1);
}
