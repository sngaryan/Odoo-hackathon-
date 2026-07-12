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
