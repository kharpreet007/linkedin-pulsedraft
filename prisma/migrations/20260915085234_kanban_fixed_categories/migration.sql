/*
  Warnings:

  - You are about to drop the column `topicId` on the `TopicAssignment` table. All the data in the column will be lost.
  - You are about to drop the `TopicIdea` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `TopicAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KanbanCategory" AS ENUM ('Business', 'Logistics', 'SupplyChain', 'Transportation', 'ProjectManagement', 'ProductManagement', 'GenAI', 'Psychology', 'Finance');

-- DropForeignKey
ALTER TABLE "TopicAssignment" DROP CONSTRAINT "TopicAssignment_topicId_fkey";

-- DropIndex
DROP INDEX "TopicAssignment_topicId_idx";

-- AlterTable
ALTER TABLE "TopicAssignment" DROP COLUMN "topicId",
ADD COLUMN     "category" "KanbanCategory" NOT NULL;

-- DropTable
DROP TABLE "TopicIdea";
