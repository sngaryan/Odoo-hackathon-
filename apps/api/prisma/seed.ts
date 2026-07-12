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
