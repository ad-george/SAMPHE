/*
  Warnings:

  - A unique constraint covering the columns `[lecturerId,unitId]` on the table `LecturerUnitAssignment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LecturerUnitAssignment_lecturerId_unitId_key" ON "LecturerUnitAssignment"("lecturerId", "unitId");
