-- CreateEnum
CREATE TYPE "ChoreRecurrence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ChoreStatus" AS ENUM ('PENDING', 'COMPLETED', 'MISSED');

-- CreateTable
CREATE TABLE "chores" (
    "id" UUID NOT NULL,
    "circleId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceInterval" "ChoreRecurrence",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_assignments" (
    "id" UUID NOT NULL,
    "choreId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ChoreStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chore_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chores_circleId_idx" ON "chores"("circleId");

-- CreateIndex
CREATE INDEX "chore_assignments_choreId_idx" ON "chore_assignments"("choreId");

-- CreateIndex
CREATE INDEX "chore_assignments_userId_idx" ON "chore_assignments"("userId");

-- CreateIndex
CREATE INDEX "chore_assignments_dueDate_idx" ON "chore_assignments"("dueDate");

-- CreateIndex
CREATE INDEX "chore_assignments_status_idx" ON "chore_assignments"("status");

-- AddForeignKey
ALTER TABLE "chores" ADD CONSTRAINT "chores_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignments" ADD CONSTRAINT "chore_assignments_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "chores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignments" ADD CONSTRAINT "chore_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
