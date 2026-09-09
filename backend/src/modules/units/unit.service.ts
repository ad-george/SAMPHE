import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class UnitService {
  async create(data: { code: string; name: string; programmeId: string; studyYearId: string; semesterId: string; departmentId: string; universityId: string }) {
    return prisma.unit.create({ data });
  }
  async getByUniversity(universityId: string) {
    return prisma.unit.findMany({ where: { universityId }, include: { programme: true, studyYear: true, semester: true, department: true } });
  }
  async getById(id: string) {
    return prisma.unit.findUnique({ where: { id }, include: { programme: true, studyYear: true, semester: true, department: true } });
  }
  async update(id: string, data: any) {
    return prisma.unit.update({ where: { id }, data });
  }
  async delete(id: string) {
    return prisma.unit.delete({ where: { id } });
  }
}