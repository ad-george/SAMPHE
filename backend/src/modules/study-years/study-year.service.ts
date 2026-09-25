import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class StudyYearService {
  async create(
    universityId: string,
    data: { name: string; description?: string },
  ) {
    return prisma.studyYear.create({
      data: {
        name: data.name,
        description: data.description,
        universityId,
      } as any,
    });
  }

  async getAll(universityId?: string) {
    return prisma.studyYear.findMany({
      where: universityId ? { universityId } : {},
      orderBy: { name: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.studyYear.findUnique({ where: { id } });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    return prisma.studyYear.update({ where: { id }, data });
  }

  async delete(id: string) {
    const studentsCount = await prisma.student.count({
      where: { studyYearId: id },
    });
    const unitsCount = await prisma.unit.count({
      where: { studyYearId: id },
    });
    if (studentsCount > 0 || unitsCount > 0) {
      throw new Error(
        "Cannot delete: Study year is linked to existing students or units",
      );
    }
    return prisma.studyYear.delete({ where: { id } });
  }
}
