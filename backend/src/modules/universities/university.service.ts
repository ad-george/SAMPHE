import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class UniversityService {
  async create(data: { name: string; email?: string; phone?: string; address?: string; website?: string }) {
    return prisma.university.create({ data });
  }
  async getAll() {
    return prisma.university.findMany({
      include: { _count: { select: { students: true, lecturers: true, departments: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async getById(id: string) {
    return prisma.university.findUnique({
      where: { id },
      include: { faculties: true, departments: true, programmes: true, admins: true, licenses: true },
    });
  }
  async update(id: string, data: any) {
    return prisma.university.update({ where: { id }, data });
  }
  async toggleStatus(id: string, status: string) {
    return prisma.university.update({ where: { id }, data: { status } });
  }
}