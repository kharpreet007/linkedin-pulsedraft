-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('PM', 'AI', 'Psychology');

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "theme" "Theme" NOT NULL,
    "draft" TEXT NOT NULL,
    "rank" INTEGER,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "hook" INTEGER NOT NULL,
    "insight" INTEGER NOT NULL,
    "authenticity" INTEGER NOT NULL,
    "engagement" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostedSelection" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "topicOverride" TEXT,
    "themeOverride" "Theme",
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostedSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Run_date_key" ON "Run"("date");

-- CreateIndex
CREATE INDEX "Candidate_runId_idx" ON "Candidate"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_candidateId_key" ON "Score"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "PostedSelection_runId_key" ON "PostedSelection"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "PostedSelection_candidateId_key" ON "PostedSelection"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_runId_key" ON "Engagement"("runId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostedSelection" ADD CONSTRAINT "PostedSelection_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostedSelection" ADD CONSTRAINT "PostedSelection_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
