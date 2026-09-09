import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class FacultyService {
  async create(data: { name: string; universityId: string }) {
    return prisma.faculty.create({ data });
  }
  async getByUniversity(universityId: string) {
    return prisma.faculty.findMany({ where: { universityId }, include: { departments: true } });
  }
  async getById(id: string) {
    return prisma.faculty.findUnique({ where: { id }, include: { departments: true } });
  }
  async update(id: string, data: any) {
    return prisma.faculty.update({ where: { id }, data });
  }
  async delete(id: string) {
    return prisma.faculty.delete({ where: { id } });
  }
}