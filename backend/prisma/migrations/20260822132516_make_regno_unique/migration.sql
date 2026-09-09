/*
  Warnings:

  - A unique constraint covering the columns `[regNo]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Student_regNo_key" ON "Student"("regNo");
