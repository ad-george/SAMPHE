import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class SemesterService {
  async create(
    universityId: string,
    data: { name: string; startDate?: Date; endDate?: Date },
  ) {
    // Pick the first study year for this university (matches signup behaviour)
    const firstStudyYear = await prisma.studyYear.findFirst({
      where: { universityId },
      orderBy: { name: "asc" },
    });

    if (!firstStudyYear) {
      throw new Error(
        "No study year found for this university. Please set up study years first.",
      );
    }

    return prisma.semester.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        universityId,
        studyYearId: firstStudyYear.id,
      } as any,
    });
  }

  async getAll(universityId?: string) {
    return prisma.semester.findMany({
      where: universityId ? { universityId } : {},
      orderBy: { name: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.semester.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return prisma.semester.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.semester.delete({ where: { id } });
  }
}
