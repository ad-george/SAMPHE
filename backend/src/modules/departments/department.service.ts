import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class DepartmentService {
  async create(data: { name: string; facultyId: string; universityId: string }) {
    return prisma.department.create({ data });
  }
  async getByUniversity(universityId: string) {
    return prisma.department.findMany({ where: { universityId }, include: { faculty: true } });
  }
  async getById(id: string) {
    return prisma.department.findUnique({ where: { id }, include: { faculty: true, programmes: true, lecturers: true } });
  }
  async update(id: string, data: any) {
    return prisma.department.update({ where: { id }, data });
  }
  async delete(id: string) {
    return prisma.department.delete({ where: { id } });
  }
}