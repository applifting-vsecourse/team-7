CREATE TYPE "video_job_status" AS ENUM ('uploading', 'pending', 'processing', 'completed', 'failed', 'deleting');
CREATE TABLE "video_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dogId" TEXT,
    "exerciseId" TEXT,
    "file_path" TEXT NOT NULL,
    "output_path" TEXT NOT NULL,
    "status" "video_job_status" NOT NULL DEFAULT 'pending',
    "raw_deleted_at" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "video_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "video_jobs_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dog"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "video_jobs_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "video_jobs_file_path_key" ON "video_jobs"("file_path");
CREATE UNIQUE INDEX "video_jobs_output_path_key" ON "video_jobs"("output_path");
CREATE INDEX "video_jobs_status_created_at_idx" ON "video_jobs"("status", "created_at");
CREATE INDEX "video_jobs_dogId_exerciseId_created_at_idx" ON "video_jobs"("dogId", "exerciseId", "created_at");
