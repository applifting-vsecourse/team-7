# ADR 0001: Private media storage with backend-managed access

- **Status:** Accepted
- **Date:** 2026-10-09

## Context

The application needs to store images and videos and allow multiple users to
access the same files. PostgreSQL stores general application data. The existing
stack uses NestJS, Prisma, and BetterAuth for backend services, database access,
and authentication.

Media access may depend on project or team membership, or on explicit sharing
with individual users. These permissions should use the application's existing
user identities and authorization rules.

Supabase Storage supports private buckets and storage access policies through
Row Level Security (RLS). Using those policies directly would require integrating
our authentication with Supabase and making relevant permission data available
in Supabase's database. Storage RLS cannot directly query membership tables in
our separate application PostgreSQL database.

## Decision

Use **private Supabase Storage buckets for media files**, with **access permissions
managed in application PostgreSQL and enforced by the NestJS backend**.

Keep BetterAuth as the authentication provider. The backend issues temporary
signed download and upload URLs after authenticating the user and checking the
requested operation's permissions. Browsers transfer media directly to and from
Supabase Storage.

### Data ownership

- Supabase Storage holds image and video file contents.
- Application PostgreSQL holds media metadata, including the bucket, storage
  path, uploader, content type, size, and associated project or team.
- Project or team membership determines shared access where applicable. Explicit
  per-file grants can support individual sharing when required.
- A bucket is not created for each user. Multiple authorized users can access
  the same stored object.
- Store stable bucket and object identifiers in PostgreSQL, not signed URLs.

### Download flow

1. The browser requests access using an application media ID.
2. The backend validates the BetterAuth session.
3. The backend loads the media record and checks the user's current read access.
4. The backend generates a short-lived signed URL for the stored object.
5. The browser retrieves the media directly from Supabase Storage.

The backend resolves storage paths from authorized media records rather than
signing arbitrary client-supplied paths.

### Upload flow

1. The browser requests an upload for a project or other authorized destination.
2. The backend validates the session and checks upload permission.
3. The backend allocates a unique storage path and creates a pending media record.
4. The backend issues a signed upload URL for that path.
5. The browser uploads directly to Supabase Storage.
6. The backend checks permission again, verifies the uploaded object's existence
   and required metadata, and marks the media record as ready.

Use resumable uploads where appropriate for large videos. Define file-size and
content-type limits and enforce them through storage configuration and backend
validation. Replacement and deletion also require backend authorization.

### Credentials and URL lifetime

Privileged storage credentials remain exclusively on the backend. They bypass
storage RLS, so application authorization must happen before privileged storage
operations or URL issuance.

Signed URLs are bearer credentials: anyone possessing a valid URL can use it
until it expires. Removing membership or a sharing grant prevents issuance of
new URLs but does not immediately invalidate existing ones. Use short download
lifetimes appropriate to the media's sensitivity and playback requirements,
and refresh access through the backend when necessary. Do not log signed URLs.

## Alternatives considered

### Supabase Auth and storage RLS

This enables direct authenticated storage access with database-enforced policies
based on ownership, membership, or sharing. It is attractive when authentication
and permission data already live in Supabase.

It is not selected because the application already uses BetterAuth and its own
PostgreSQL database. Integrating these with storage RLS would add complexity and
potentially duplicate authorization data or rules.

### Another object storage provider with signed URLs

An S3-compatible provider could support the same backend authorization pattern.
Supabase Storage is selected for its private buckets and signed upload/download
support. Keeping provider-specific operations behind a backend storage service
will limit the cost of a future migration.

### Public buckets

Public file URLs do not enforce application membership or sharing permissions
for retrieval. They are unsuitable for media intended only for authorized users.

### File contents stored in PostgreSQL

Storing large media objects in the application database would increase database
storage, backup, and serving load. Object storage better fits direct uploads and
downloads; PostgreSQL remains responsible for metadata and permissions.

## Consequences

### Benefits

- Authentication and authorization remain in the existing application stack.
- Shared access supports multiple users without duplicating files.
- Media transfers do not consume backend bandwidth.
- Permission changes govern subsequent access requests immediately.
- Storage-specific details remain isolated from application access rules.

### Costs and limitations

- The backend must implement and verify authorization for every media operation.
- Existing signed URLs remain usable until expiry after access is removed.
- Database changes and storage operations are not one transaction. Upload
  finalization, deletion retries, and cleanup of abandoned uploads or orphaned
  objects must account for partial failures.
- Storage capacity, transfer costs, and upload limits need to match expected
  image and video usage.
- Object storage does not itself provide video transcoding or adaptive streaming.
  Those capabilities require a separate processing pipeline if needed.

## Revisit when

- The application adopts Supabase Auth and stores authorization data in Supabase.
- Access revocation must take effect before existing signed URLs expire.
- Video processing, delivery scale, or storage costs justify a different provider
  or a dedicated video platform.

## References

- [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Serving assets and signed URLs](https://supabase.com/docs/guides/storage/serving)
- [Signed resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
