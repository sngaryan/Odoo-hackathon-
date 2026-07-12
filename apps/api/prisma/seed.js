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
    console.log("Seeded EcoSphere departments and demo users.");
    console.table(users.map((user) => ({
        email: user.email,
        password: "Demo@1234",
        role: user.role,
    })));
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map