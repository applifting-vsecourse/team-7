ALTER TABLE "video_jobs" RENAME TO "video";

ALTER TABLE "video" RENAME CONSTRAINT "video_jobs_pkey" TO "video_pkey";
ALTER TABLE "video" RENAME CONSTRAINT "video_jobs_dogId_fkey" TO "video_dogId_fkey";
ALTER TABLE "video" RENAME CONSTRAINT "video_jobs_exerciseId_fkey" TO "video_exerciseId_fkey";

ALTER INDEX "video_jobs_file_path_key" RENAME TO "video_file_path_key";
ALTER INDEX "video_jobs_output_path_key" RENAME TO "video_output_path_key";
ALTER INDEX "video_jobs_status_created_at_idx" RENAME TO "video_status_created_at_idx";
ALTER INDEX "video_jobs_dogId_exerciseId_created_at_idx" RENAME TO "video_dogId_exerciseId_created_at_idx";
