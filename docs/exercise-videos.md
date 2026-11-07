# Exercise videos (backend)

Videos belong to a handler's dog and exercise. They remain available after the
exercise is unassigned, like the existing exercise history. Both the dog and the
exercise's discipline must belong to the authenticated, verified handler.

## Setup

1. Apply the checked-in migration with `pnpm backend migrate`.
2. Create a **private** Supabase Storage bucket named `exercise-videos`.
   Set its file size limit to **31,457,280 bytes (30 MiB)** and allowed MIME types
   to `video/mp4`, `video/quicktime`, and `video/webm`. No public access or client
   write policies are needed: the backend uses the secret API key.
3. Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and optionally
   `SUPABASE_VIDEO_BUCKET` in the backend environment. Keep the secret API key
   server-side. Without these settings uploads return 503 and the worker is off;
   other app features continue working.
   `SUPABASE_URL` must be the project root, e.g. `https://<project-ref>.supabase.co`,
   without `/rest/v1` or `/storage/v1`. The service appends `/storage/v1` itself;
   using the REST API URL produces 404 responses.
   Use an `sb_secret_...` key from Supabase Settings → API Keys. Storage requests
   send it in the `apikey` header, without an `Authorization: Bearer` header.
4. Ensure `ffmpeg` (with libx264/AAC) and `ffprobe` are on PATH for native local
   development. Both backend Dockerfiles install FFmpeg, including ffprobe.
   Docker production deployments apply migrations at startup as before.

No additional service, database driver, Redis instance, or paid worker is needed.
The existing NestJS process polls every five seconds while it is running.
A sleeping free-tier backend processes pending work when it wakes up.

## HTTP API

Base: `/api/dogs/:dogId/exercises/:exerciseId/videos`.
All routes require the existing BetterAuth session cookie and verified email.

| Method | Path                | Result                                                                                   |
| ------ | ------------------- | ---------------------------------------------------------------------------------------- |
| POST   | base                | Multipart `file`; 202 `{ id, status: "pending", createdAt }`                             |
| GET    | base                | Latest 100 jobs, newest first: `id`, `status`, `duration` (seconds), `error`, timestamps |
| GET    | `base/:id/playback` | Completed video only; `{ url, expiresIn: 3600 }`                                         |
| DELETE | `base/:id`          | 202; hides the video and queues storage deletion                                         |

Example upload (replace IDs and cookie with your own):

```sh
curl -X POST 'http://localhost:4050/api/dogs/DOG_ID/exercises/EXERCISE_ID/videos' \
  -H 'Cookie: better-auth.session_token=YOUR_SESSION_COOKIE' \
  -F 'file=@clip.mp4;type=video/mp4'
```

Uploads accept MP4, MOV and WebM, at most 30 MiB. Size is enforced by streaming
multipart handling before the service runs. Files are written to disk, not held
as a full Buffer, and streamed to Supabase. At most two uploads run per backend
process, and queue admission is serialized in PostgreSQL with a maximum of ten
active jobs across instances (429 when full). Saturated upload slots return 503.

The worker probes the actual media, independently of the claimed MIME type. It
rejects missing/invalid video, unknown/nonfinite duration, duration above 60
seconds, and dimensions beyond 4K (8,294,400 pixels; neither side above 4096).
Validation happens asynchronously: a successful POST means queued, not playable.

Error codes are `uploadFailed`, `invalidVideo`, and `processingFailed`. They are
stable machine-readable values; future UI should translate them. Failed jobs can
be deleted and uploaded again. There is no automatic retry of invalid media.
Playback URLs expire after one hour and should be requested again as needed.
Possession of a signed URL grants access until it expires, even after deletion
was requested and before the worker removes the object.

## Queue, locking, and cleanup

`video` uses Prisma models and a migration. `file_path` is a **Supabase
object key**, never a machine-local path. Raw objects are kept under `raw/`;
compressed MP4s under `encoded/`. Neither key is supplied by the user.

Jobs transition through `uploading → pending → processing → completed/failed`.
Deletion uses `deleting`. A row is created before storage upload so interrupted
uploads can be found and cleaned. Uploading jobs older than ten minutes fail.

The worker acquires `pg_try_advisory_xact_lock` through Prisma's `$queryRaw` in
an interactive transaction. The transaction remains open for the entire job, so
only one encoder runs across backend replicas. A local guard also prevents
interval ticks from overlapping. Status writes use the ordinary Prisma client
on another connection, making progress visible without committing/releasing
the lock. The connection pool must permit at least two connections. The lock
transaction has a 180-second timeout; an earlier 150-second work deadline aborts
storage requests and kills the child process. A heartbeat checks the lock
connection every second and cancels the encoder if it fails. FFmpeg itself has
a 90-second timeout; ffprobe has a ten-second timeout. Shutdown also kills the
encoder and waits for its exit before releasing the lock. Configure any hosting
or database transaction timeout above 180 seconds.

The raw object is downloaded to a temporary directory only when picked up.
Encoding uses H.264 CRF 24, `veryfast`, 30 fps, a 1280×720 bounding box preserving
aspect ratio without upscaling, AAC 128 kbps stereo, and MP4 faststart. Decoder
and encoder threads are capped at two, filter threads at one; video maxrate and
buffer are both 2500 kbps. Input containers/protocols are restricted so a video
cannot tell FFmpeg to fetch network resources or parse arbitrary playlists.

The local original is unlinked **immediately after encoding succeeds**, before
uploading the compressed file. The entire working directory is removed in a
`finally` block on success or failure. Completed jobs retain their Supabase raw
object until the compressed upload and completed status have succeeded, then
remove it. Failed jobs remove both possible objects. Storage cleanup is retried
on later ticks until successful; cleanup outages do not silently lose tracking.
Restart recovery requeues `processing` jobs only after obtaining the global lock.
Stale local job directories are removed under that same lock, and abandoned
upload files older than one hour are removed as well.

Deleting a dog, exercise, discipline or user nulls the video parent reference
rather than cascading away its job, allowing the worker to delete the remote
objects before removing the row. A concurrent video deletion cannot be
reversed by a processing job completing.

No frontend is implemented here. When added, it must reject files above 30 MiB
or 60 seconds **before** sending the upload, display job status, and poll while
uploading/pending/processing. The server's independent limits remain in place.
