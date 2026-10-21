-- CreateTable
CREATE TABLE "discipline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criterion" TEXT,
    "disciplineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "procedure" TEXT,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dog_goal" (
    "dogId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dog_goal_pkey" PRIMARY KEY ("dogId","goalId")
);

-- CreateTable
CREATE TABLE "dog_exercise" (
    "dogId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dog_exercise_pkey" PRIMARY KEY ("dogId","exerciseId")
);

-- CreateIndex
CREATE INDEX "discipline_userId_idx" ON "discipline"("userId");

-- CreateIndex
CREATE INDEX "goal_disciplineId_idx" ON "goal"("disciplineId");

-- CreateIndex
CREATE INDEX "exercise_goalId_idx" ON "exercise"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_id_goalId_key" ON "exercise"("id", "goalId");

-- CreateIndex
CREATE INDEX "dog_goal_goalId_idx" ON "dog_goal"("goalId");

-- CreateIndex
CREATE INDEX "dog_exercise_exerciseId_goalId_idx" ON "dog_exercise"("exerciseId", "goalId");

-- AddForeignKey
ALTER TABLE "discipline" ADD CONSTRAINT "discipline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "discipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dog_goal" ADD CONSTRAINT "dog_goal_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dog_goal" ADD CONSTRAINT "dog_goal_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dog_exercise" ADD CONSTRAINT "dog_exercise_dogId_goalId_fkey" FOREIGN KEY ("dogId", "goalId") REFERENCES "dog_goal"("dogId", "goalId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dog_exercise" ADD CONSTRAINT "dog_exercise_exerciseId_goalId_fkey" FOREIGN KEY ("exerciseId", "goalId") REFERENCES "exercise"("id", "goalId") ON DELETE CASCADE ON UPDATE CASCADE;
