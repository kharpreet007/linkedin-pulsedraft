-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "category" "KanbanCategory",
ALTER COLUMN "theme" DROP NOT NULL;
