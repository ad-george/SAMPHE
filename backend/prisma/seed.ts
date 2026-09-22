import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
// import process from "process";

const prisma = new PrismaClient();

async function main() {
  // ============================================================
  // 1. PLATFORM ADMIN (REQUIRED)
  // ============================================================
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.platformAdmin.upsert({
    where: { email: "admin@suamp.com" },
    update: {},
    create: {
      fullName: "System Administrator",
      email: "admin@suamp.com",
      password: adminPassword,
    },
  });

  console.log("✅ Seed completed successfully");
  console.log("================================================");
  console.log("📋 Platform Admin Credentials:");
  console.log({ email: "admin@suamp.com", password: "admin123" });
  console.log("================================================");
  console.log("ℹ️  Study Years and Semesters will be auto-created");
  console.log("   when the first university registers.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
