import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class AcademicYearService {
  async create(data: { name: string; startDate?: Date; endDate?: Date }) {
    return prisma.academicYear.create({ data: data as any });
  }
  async getAll() {
    return prisma.academicYear.findMany({ orderBy: { name: "desc" } });
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
