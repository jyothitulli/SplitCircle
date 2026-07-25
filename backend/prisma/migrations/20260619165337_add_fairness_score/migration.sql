-- CreateTable
CREATE TABLE "fairness_scores" (
    "id" UUID NOT NULL,
    "circleId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "expenseScore" DECIMAL(5,2) NOT NULL,
    "choreScore" DECIMAL(5,2) NOT NULL,
    "participationScore" DECIMAL(5,2) NOT NULL,
    "overallScore" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fairness_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fairness_scores_circleId_idx" ON "fairness_scores"("circleId");

-- CreateIndex
CREATE INDEX "fairness_scores_userId_idx" ON "fairness_scores"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fairness_scores_circleId_userId_key" ON "fairness_scores"("circleId", "userId");

-- AddForeignKey
ALTER TABLE "fairness_scores" ADD CONSTRAINT "fairness_scores_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fairness_scores" ADD CONSTRAINT "fairness_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
