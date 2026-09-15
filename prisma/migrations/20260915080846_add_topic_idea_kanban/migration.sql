-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('Backlog', 'Scheduled', 'Published');

-- CreateTable
CREATE TABLE "TopicIdea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" "Theme" NOT NULL,
    "status" "TopicStatus" NOT NULL DEFAULT 'Backlog',
    "scheduledDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicIdea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopicIdea_status_idx" ON "TopicIdea"("status");
