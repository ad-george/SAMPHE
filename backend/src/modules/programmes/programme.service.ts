import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class ProgrammeService {
  async create(data: { name: string; duration: number; departmentId: string; universityId: string }) {
    return prisma.programme.create({ data });
  }
  async getByUniversity(universityId: string) {
    return prisma.programme.findMany({ where: { universityId }, include: { department: true } });
  }
  async getById(id: string) {
    return prisma.programme.findUnique({ where: { id }, include: { department: true, students: true } });
  }
  async update(id: string, data: any) {
    return prisma.programme.update({ where: { id }, data });
  }
  async delete(id: string) {
    return prisma.programme.delete({ where: { id } });
  }
}