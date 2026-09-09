import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class SemesterService {
  async create(data: { name: string; startDate?: Date; endDate?: Date }) {
    return prisma.semester.create({ data });
  }
  async getAll() {
    return prisma.semester.findMany({ orderBy: { name: 'asc' } });
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