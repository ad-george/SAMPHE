import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const cleanupExpiredAttendanceLinks = async () => {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5); // 5 years ago

  // Get count of sessions to delete
  const sessionsToDelete = await prisma.attendanceSession.findMany({
    where: {
      createdAt: { lt: fiveYearsAgo },
      status: { not: "ACTIVE" },
    },
    select: { id: true },
  });

  if (sessionsToDelete.length === 0) {
    console.log("✅ No old sessions to delete");
    return 0;
  }

  // Delete all attendance records linked to these sessions first
  const sessionIds = sessionsToDelete.map((s) => s.id);

  await prisma.attendanceRecord.deleteMany({
    where: {
      sessionId: { in: sessionIds },
    },
  });

  // Delete the sessions
  const deleted = await prisma.attendanceSession.deleteMany({
    where: {
      id: { in: sessionIds },
    },
  });

  console.log(
    `✅ Deleted ${deleted.count} expired sessions (older than 5 years)`,
  );
  return deleted.count;
};
