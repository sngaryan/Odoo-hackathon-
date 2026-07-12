import "dotenv/config";

import bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const departments = [
  { name: "Operations", code: "OPS" },
  { name: "People & CSR", code: "CSR" },
  { name: "Governance", code: "GOV" },
  { name: "Sustainability", code: "SUS" },
];

const users = [
  {
    name: "Asha Mehta",
    email: "admin@ecosphere.demo",
    role: Role.ADMIN,
    departmentCode: "GOV",
  },
  {
    name: "Rohan Iyer",
    email: "manager@ecosphere.demo",
    role: Role.ESG_MANAGER,
    departmentCode: "SUS",
  },
  {
    name: "Mira Shah",
    email: "employee@ecosphere.demo",
    role: Role.EMPLOYEE,
    departmentCode: "OPS",
  },
  {
    name: "Kabir Rao",
    email: "auditor@ecosphere.demo",
    role: Role.AUDITOR,
    departmentCode: "GOV",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("Demo@1234", 10);

  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: department,
      create: department,
    });
  }

  for (const user of users) {
    const department = await prisma.department.findUniqueOrThrow({
      where: { code: user.departmentCode },
    });

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        departmentId: department.id,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash,
        departmentId: department.id,
      },
    });
  }

  // -- Environmental Seed Data --
  const existingFactors = await prisma.emissionFactor.count();
  if (existingFactors === 0) {
    const factors = [
      { name: "Diesel (Stationary)", category: "Fuel", unit: "L", factorKgCo2e: 2.673 },
      { name: "Electricity (Grid)", category: "Energy", unit: "kWh", factorKgCo2e: 0.42 },
      { name: "Flight (Short Haul)", category: "Travel", unit: "km", factorKgCo2e: 0.15 },
    ];
    await prisma.emissionFactor.createMany({ data: factors });
  }

  const allFactors = await prisma.emissionFactor.findMany();
  const susDept = await prisma.department.findUnique({ where: { code: "SUS" } });
  const opsDept = await prisma.department.findUnique({ where: { code: "OPS" } });
  const esgManager = await prisma.user.findUnique({ where: { email: "manager@ecosphere.demo" } });

  const existingGoals = await prisma.environmentalGoal.count();
  if (existingGoals === 0 && susDept && opsDept) {
    await prisma.environmentalGoal.createMany({
      data: [
        { departmentId: susDept.id, name: "Reduce Office Electricity", targetKgCo2e: 5000, currentKgCo2e: 2000, deadline: new Date("2026-12-31"), status: "ON_TRACK" },
        { departmentId: opsDept.id, name: "Lower Fleet Emissions", targetKgCo2e: 10000, currentKgCo2e: 9500, deadline: new Date("2026-09-30"), status: "AT_RISK" },
        { departmentId: susDept.id, name: "Q1 Travel Reduction", targetKgCo2e: 2000, currentKgCo2e: 1800, deadline: new Date("2026-03-31"), status: "COMPLETED" },
      ]
    });
  }

  const existingTx = await prisma.carbonTransaction.count();
  if (existingTx === 0 && allFactors.length > 0 && opsDept && susDept && esgManager) {
    const diesel = allFactors.find((f) => f.name.includes("Diesel"));
    const grid = allFactors.find((f) => f.name.includes("Electricity"));
    
    if (diesel && grid) {
      await prisma.carbonTransaction.createMany({
        data: [
          { departmentId: opsDept.id, factorId: diesel.id, createdById: esgManager.id, source: "Fleet Vehicle A", description: "Monthly fuel", quantity: 500, factorValueSnapshot: diesel.factorKgCo2e, calculatedKgCo2e: 500 * Number(diesel.factorKgCo2e), occurredOn: new Date("2026-06-01") },
          { departmentId: opsDept.id, factorId: diesel.id, createdById: esgManager.id, source: "Fleet Vehicle B", description: "Monthly fuel", quantity: 450, factorValueSnapshot: diesel.factorKgCo2e, calculatedKgCo2e: 450 * Number(diesel.factorKgCo2e), occurredOn: new Date("2026-06-05") },
          { departmentId: susDept.id, factorId: grid.id, createdById: esgManager.id, source: "HQ Building", description: "June Electricity", quantity: 12000, factorValueSnapshot: grid.factorKgCo2e, calculatedKgCo2e: 12000 * Number(grid.factorKgCo2e), occurredOn: new Date("2026-06-30") },
          { departmentId: opsDept.id, factorId: diesel.id, createdById: esgManager.id, source: "Generator Backup", description: "Testing", quantity: 50, factorValueSnapshot: diesel.factorKgCo2e, calculatedKgCo2e: 50 * Number(diesel.factorKgCo2e), occurredOn: new Date("2026-07-02") },
          { departmentId: susDept.id, factorId: grid.id, createdById: esgManager.id, source: "Branch Office", description: "July Electricity", quantity: 4000, factorValueSnapshot: grid.factorKgCo2e, calculatedKgCo2e: 4000 * Number(grid.factorKgCo2e), occurredOn: new Date("2026-07-05") },
          { departmentId: opsDept.id, factorId: diesel.id, createdById: esgManager.id, source: "Fleet Vehicle C", description: "Ad-hoc fuel", quantity: 120, factorValueSnapshot: diesel.factorKgCo2e, calculatedKgCo2e: 120 * Number(diesel.factorKgCo2e), occurredOn: new Date("2026-07-10") },
          { departmentId: susDept.id, factorId: grid.id, createdById: esgManager.id, source: "HQ Building", description: "July partial", quantity: 5000, factorValueSnapshot: grid.factorKgCo2e, calculatedKgCo2e: 5000 * Number(grid.factorKgCo2e), occurredOn: new Date("2026-07-11") },
          { departmentId: opsDept.id, factorId: diesel.id, createdById: esgManager.id, source: "Fleet Vehicle A", description: "Monthly fuel", quantity: 520, factorValueSnapshot: diesel.factorKgCo2e, calculatedKgCo2e: 520 * Number(diesel.factorKgCo2e), occurredOn: new Date("2026-07-12") },
        ]
      });
    }
  }

  console.log("Seeded EcoSphere departments, users, and environmental data.");
  console.table(
    users.map((user) => ({
      email: user.email,
      password: "Demo@1234",
      role: user.role,
    })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
