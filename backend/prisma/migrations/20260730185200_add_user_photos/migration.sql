-- AlterTable
ALTER TABLE "users" ADD COLUMN     "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
