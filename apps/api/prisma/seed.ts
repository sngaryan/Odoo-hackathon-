import "dotenv/config";

import bcrypt from "bcrypt";
import { AuditStatus, IssueSeverity, IssueStatus, PolicyStatus, PrismaClient, Role } from "@prisma/client";

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

  // 1. Seed Departments
  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: department,
      create: department,
    });
  }

  // 2. Seed Users
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
        xp: 0, // reset XP on fresh seed
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash,
        departmentId: department.id,
        xp: 0,
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
  const auditor = await prisma.user.findUniqueOrThrow({ where: { email: "auditor@ecosphere.demo" } });
  const manager = await prisma.user.findUniqueOrThrow({ where: { email: "manager@ecosphere.demo" } });
  const policy = await prisma.policy.upsert({
    where: { title_version: { title: "Environmental Data Integrity", version: "1.0" } },
    update: { summary: "Every ESG record must be traceable, timely, and supported by evidence.", status: PolicyStatus.ACTIVE, publishedAt: new Date("2026-01-15") },
    create: { title: "Environmental Data Integrity", version: "1.0", summary: "Every ESG record must be traceable, timely, and supported by evidence.", status: PolicyStatus.ACTIVE, publishedAt: new Date("2026-01-15") },
  });
  await prisma.policy.upsert({ where: { title_version: { title: "Responsible Workplace", version: "2.1" } }, update: {}, create: { title: "Responsible Workplace", version: "2.1", summary: "Sets expectations for inclusive, safe, and ethical workplace conduct.", status: PolicyStatus.ACTIVE, publishedAt: new Date("2026-02-01") } });
  await prisma.policyAcknowledgement.upsert({ where: { userId_policyId: { userId: manager.id, policyId: policy.id } }, update: {}, create: { userId: manager.id, policyId: policy.id } });
  const audit = await prisma.audit.upsert({ where: { id: "seed-governance-audit" }, update: {}, create: { id: "seed-governance-audit", title: "Q2 ESG Controls Review", scope: "Environmental reporting controls and evidence retention", auditDate: new Date("2026-06-20"), auditorId: auditor.id, status: AuditStatus.COMPLETED } });
  await prisma.complianceIssue.upsert({ where: { id: "seed-evidence-issue" }, update: {}, create: { id: "seed-evidence-issue", auditId: audit.id, title: "Missing supplier emissions evidence", description: "Two supplier submissions are missing source documentation.", severity: IssueSeverity.HIGH, status: IssueStatus.IN_PROGRESS, ownerId: manager.id, openedAt: new Date("2026-06-21") } });

  console.log("Seeded EcoSphere departments and demo users.");

  // Clean up existing gamification/social records
  await prisma.userBadge.deleteMany({});
  await prisma.challengeSubmission.deleteMany({});
  await prisma.csrParticipation.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.csrActivity.deleteMany({});
  await prisma.badge.deleteMany({});

  console.log("Cleaned up existing gamification and social tables.");

  // 3. Seed Badges
  const badgeData = [
    { name: "First Step", description: "Earn 100 XP to take your first step in sustainability.", iconUrl: "first-step", xpThreshold: 100 },
    { name: "Green Commuter", description: "Complete a Green Commute challenge.", iconUrl: "commute", xpThreshold: 0 },
    { name: "Volunteering Star", description: "Participate in an approved CSR volunteering activity.", iconUrl: "volunteering", xpThreshold: 0 },
    { name: "Eco Warrior", description: "Earn 500 XP to become a recognized Eco Warrior.", iconUrl: "warrior", xpThreshold: 500 },
  ];

  for (const badge of badgeData) {
    await prisma.badge.create({
      data: badge,
    });
  }
  console.log("Seeded Badges.");

  const greenCommuterBadge = await prisma.badge.findUniqueOrThrow({ where: { name: "Green Commuter" } });
  const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: "admin@ecosphere.demo" } });
  const managerUser = await prisma.user.findUniqueOrThrow({ where: { email: "manager@ecosphere.demo" } });
  const employeeUser = await prisma.user.findUniqueOrThrow({ where: { email: "employee@ecosphere.demo" } });

  // 4. Seed Challenges
  const challengeData = [
    {
      title: "Car-Free Commute Week",
      description: "Walk, bike, carpool, or use public transit for 5 consecutive days.",
      type: "COMMUTE",
      xpReward: 150,
      badgeRewardId: greenCommuterBadge.id,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Zero Waste Office Lunch",
      description: "Bring a fully waste-free lunch (reusable container, zero single-use plastics) to work.",
      type: "WASTE",
      xpReward: 50,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Lights Out Campaign",
      description: "Turn off all non-essential equipment and lights before leaving the office.",
      type: "ENERGY",
      xpReward: 40,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    }
  ];

  for (const challenge of challengeData) {
    await prisma.challenge.create({
      data: challenge,
    });
  }
  console.log("Seeded Challenges.");

  // 5. Seed CSR Activities
  const activityData = [
    {
      title: "Tree Plantation Drive 2026",
      description: "Join us in planting 100 saplings in the local community park to enhance urban green cover.",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      location: "Sanjay Gandhi National Park, Borivali",
      volunteeringHours: 3.5,
      xpReward: 200,
      creatorId: managerUser.id,
    },
    {
      title: "Beach Clean-up Campaign",
      description: "Volunteer to clean plastic waste and marine debris at Versova Beach.",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      location: "Versova Beach, Mumbai",
      volunteeringHours: 4.0,
      xpReward: 250,
      creatorId: managerUser.id,
    },
    {
      title: "E-Waste Recycling Drive",
      description: "Collect and safely dispose of outdated electronics from office departments.",
      date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      location: "EcoSphere Headquarters Floor 3",
      volunteeringHours: 2.0,
      xpReward: 120,
      creatorId: adminUser.id,
    }
  ];

  for (const act of activityData) {
    await prisma.csrActivity.create({
      data: act,
    });
  }
  console.log("Seeded CSR Activities.");

  // 6. Seed Participations and Submissions (Employee Standings)
  const beachCleanUp = await prisma.csrActivity.findFirstOrThrow({ where: { title: "Beach Clean-up Campaign" } });
  const treePlantation = await prisma.csrActivity.findFirstOrThrow({ where: { title: "Tree Plantation Drive 2026" } });
  const carFreeCommute = await prisma.challenge.findFirstOrThrow({ where: { title: "Car-Free Commute Week" } });

  // Mira completed Beach Clean-up (Approved)
  await prisma.csrParticipation.create({
    data: {
      userId: employeeUser.id,
      activityId: beachCleanUp.id,
      status: "APPROVED",
      proofText: "Cleaned beach with the team for 4 hours. Gathered 3 bags of plastic bottle caps.",
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      approvedById: managerUser.id,
    }
  });

  // Update employee user's XP
  await prisma.user.update({
    where: { id: employeeUser.id },
    data: { xp: 250 }
  });

  // Award the "First Step" badge since Mira has 250 XP (threshold is 100)
  const firstStepBadge = await prisma.badge.findUniqueOrThrow({ where: { name: "First Step" } });
  await prisma.userBadge.create({
    data: {
      userId: employeeUser.id,
      badgeId: firstStepBadge.id,
    }
  });

  // Mira has pending participation for Tree Plantation Drive
  await prisma.csrParticipation.create({
    data: {
      userId: employeeUser.id,
      activityId: treePlantation.id,
      status: "PENDING_APPROVAL",
      proofText: "Planted 5 saplings in sector 4. Photo uploaded to folder.",
      submittedAt: new Date(),
    }
  });

  // Mira has pending submission for Car-Free Commute Week challenge
  await prisma.challengeSubmission.create({
    data: {
      userId: employeeUser.id,
      challengeId: carFreeCommute.id,
      status: "SUBMITTED",
      proofText: "I commuted using my bicycle and local train from Monday to Friday.",
      submittedAt: new Date(),
    }
  });

  console.log("Seeded initial participations, submissions, XP, and badges.");

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
