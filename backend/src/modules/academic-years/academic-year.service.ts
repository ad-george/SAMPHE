import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class AcademicYearService {
  async create(
    universityId: string,
    data: { name: string; startDate?: Date; endDate?: Date; status?: string },
  ) {
    return prisma.academicYear.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || "ACTIVE",
        archived: false,
        universityId,
      } as any,
    });
  }

  async getAll(universityId?: string) {
    return prisma.academicYear.findMany({
      where: universityId ? { universityId } : {},
      orderBy: { name: "desc" },
    });
  }

  async getById(id: string) {
    return prisma.academicYear.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return prisma.academicYear.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.academicYear.delete({ where: { id } });
  }
}
