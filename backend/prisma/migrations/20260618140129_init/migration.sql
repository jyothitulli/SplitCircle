/*
  Warnings:

  - The primary key for the `circles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `expense_participants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `expenses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `splitType` on the `expenses` table. All the data in the column will be lost.
  - The primary key for the `members` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `role` column on the `members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `settlements` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `circles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdById` on the `circles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `expense_participants` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `expense_participants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `expenseId` on the `expense_participants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `expense_participants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `expenses` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `circleId` on the `expenses` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `paidById` on the `expenses` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `members` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `members` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `members` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `circleId` on the `members` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `settlements` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `settlements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `circleId` on the `settlements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `fromUserId` on the `settlements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `toUserId` on the `settlements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "SplitMethod" AS ENUM ('EQUAL', 'PERCENTAGE', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "circles" DROP CONSTRAINT "circles_createdById_fkey";

-- DropForeignKey
ALTER TABLE "expense_participants" DROP CONSTRAINT "expense_participants_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "expense_participants" DROP CONSTRAINT "expense_participants_userId_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_circleId_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_paidById_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_circleId_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_userId_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_circleId_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_toUserId_fkey";

-- AlterTable
ALTER TABLE "circles" DROP CONSTRAINT "circles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "createdById",
ADD COLUMN     "createdById" UUID NOT NULL,
ADD CONSTRAINT "circles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "expense_participants" DROP CONSTRAINT "expense_participants_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "expenseId",
ADD COLUMN     "expenseId" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "expense_participants_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_pkey",
DROP COLUMN "splitType",
ADD COLUMN     "splitMethod" "SplitMethod" NOT NULL DEFAULT 'EQUAL',
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "circleId",
ADD COLUMN     "circleId" UUID NOT NULL,
DROP COLUMN "paidById",
ADD COLUMN     "paidById" UUID NOT NULL,
ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "members" DROP CONSTRAINT "members_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
DROP COLUMN "circleId",
ADD COLUMN     "circleId" UUID NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "circleId",
ADD COLUMN     "circleId" UUID NOT NULL,
DROP COLUMN "fromUserId",
ADD COLUMN     "fromUserId" UUID NOT NULL,
DROP COLUMN "toUserId",
ADD COLUMN     "toUserId" UUID NOT NULL,
ADD CONSTRAINT "settlements_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "SplitType";

-- CreateIndex
CREATE INDEX "circles_createdById_idx" ON "circles"("createdById");

-- CreateIndex
CREATE INDEX "expense_participants_userId_idx" ON "expense_participants"("userId");

-- CreateIndex
CREATE INDEX "expense_participants_expenseId_idx" ON "expense_participants"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_participants_expenseId_userId_key" ON "expense_participants"("expenseId", "userId");

-- CreateIndex
CREATE INDEX "expenses_circleId_idx" ON "expenses"("circleId");

-- CreateIndex
CREATE INDEX "expenses_paidById_idx" ON "expenses"("paidById");

-- CreateIndex
CREATE INDEX "expenses_circleId_expenseDate_idx" ON "expenses"("circleId", "expenseDate");

-- CreateIndex
CREATE INDEX "members_circleId_idx" ON "members"("circleId");

-- CreateIndex
CREATE INDEX "members_userId_idx" ON "members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "members_userId_circleId_key" ON "members"("userId", "circleId");

-- CreateIndex
CREATE INDEX "settlements_circleId_idx" ON "settlements"("circleId");

-- CreateIndex
CREATE INDEX "settlements_fromUserId_idx" ON "settlements"("fromUserId");

-- CreateIndex
CREATE INDEX "settlements_toUserId_idx" ON "settlements"("toUserId");

-- CreateIndex
CREATE INDEX "settlements_circleId_status_idx" ON "settlements"("circleId", "status");

-- AddForeignKey
ALTER TABLE "circles" ADD CONSTRAINT "circles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
