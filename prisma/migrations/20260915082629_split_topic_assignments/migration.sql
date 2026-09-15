/*
  Warnings:

  - You are about to drop the column `scheduledDate` on the `TopicIdea` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TopicIdea` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TopicIdea` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('Scheduled', 'Published');

-- DropIndex
DROP INDEX "TopicIdea_status_idx";

-- AlterTable
ALTER TABLE "TopicIdea" DROP COLUMN "scheduledDate",
DROP COLUMN "status",
DROP COLUMN "updatedAt";

-- DropEnum
DROP TYPE "TopicStatus";

-- CreateTable
CREATE TABLE "TopicAssignment" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicAssignment_date_key" ON "TopicAssignment"("date");

-- CreateIndex
CREATE INDEX "TopicAssignment_topicId_idx" ON "TopicAssignment"("topicId");

-- AddForeignKey
ALTER TABLE "TopicAssignment" ADD CONSTRAINT "TopicAssignment_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "TopicIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
