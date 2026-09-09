import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class UnitService {
  async create(data: {
    code: string;
    name: string;
    programmeId: string;
    studyYearId: string;
    semesterId: string;
    departmentId: string;
    universityId: string;
  }) {
    return prisma.unit.create({
      data: {
        code: data.code,
        name: data.name,
        programId: data.programmeId,
        studyYearId: data.studyYearId,
        semesterId: data.semesterId,
        departmentId: data.departmentId,
        universityId: data.universityId,
      },
    });
  }

  async getByUniversity(universityId: string) {
    return prisma.unit.findMany({
      where: { universityId },
      include: {
        program: true, // Changed from programme to program
        studyYear: true,
        semester: true,
        department: true,
      },
    });
  }

  async getById(id: string) {
    return prisma.unit.findUnique({
      where: { id },
      include: {
        program: true, // Changed from programme to program
        studyYear: true,
        semester: true,
        department: true,
      },
    });
  }

  async update(id: string, data: any) {
    // If the client payload sends programmeId, remap it smoothly to programId
    if (data.programmeId) {
      data.programId = data.programmeId;
      delete data.programmeId;
    }
    return prisma.unit.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.unit.delete({ where: { id } });
  }
}
