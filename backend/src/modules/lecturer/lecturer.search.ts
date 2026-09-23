import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const globalSearch = async (lecturerId: string, q: string) => {
  if (!q || q.trim().length < 2) {
    return { units: [], students: [], sessions: [] };
  }

  const query = q.trim();

  const lecturer = await prisma.lecturer.findUnique({
    where: { id: lecturerId },
    include: { assignments: { select: { unitId: true } } },
  });
  if (!lecturer) return { units: [], students: [], sessions: [] };

  const unitIds = lecturer.assignments.map((a) => a.unitId);

  const [units, students, sessions] = await Promise.all([
    prisma.unit.findMany({
      where: {
        id: { in: unitIds },
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { code: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, code: true, name: true },
    }),

    prisma.student.findMany({
      where: {
        archived: false,
        registeredUnits: { some: { id: { in: unitIds } } },
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { regNo: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, fullName: true, regNo: true },
    }),

    prisma.attendanceSession.findMany({
      where: {
        lecturerId,
        unit: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
          ],
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        unit: { select: { code: true, name: true } },
      },
    }),
  ]);

  return { units, students, sessions };
};
