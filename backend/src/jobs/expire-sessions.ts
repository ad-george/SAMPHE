import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const expireOldSessions = async () => {
  const now = new Date();

  // Find all ACTIVE sessions
  const activeSessions = await prisma.attendanceSession.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      createdAt: true,
      duration: true,
    },
  });

  // Filter sessions that have exceeded their duration
  const expiredIds = activeSessions
    .filter((s) => {
      const elapsed = Math.floor(
        (now.getTime() - new Date(s.createdAt).getTime()) / 60000,
      );
      return elapsed > s.duration;
    })
    .map((s) => s.id);

  if (expiredIds.length === 0) {
    return 0;
  }

  // Batch update all expired sessions
  const result = await prisma.attendanceSession.updateMany({
    where: { id: { in: expiredIds } },
    data: { status: "COMPLETED" },
  });

  if (result.count > 0) {
    console.log(`⏰ Auto-completed ${result.count} expired session(s)`);
  }

  return result.count;
};
