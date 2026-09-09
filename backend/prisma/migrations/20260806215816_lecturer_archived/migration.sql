/*
  Warnings:

  - Added the required column `departmentId` to the `AttendanceSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN     "departmentId" TEXT NOT NULL;
