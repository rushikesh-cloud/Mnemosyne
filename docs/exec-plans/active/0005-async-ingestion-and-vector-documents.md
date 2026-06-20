# 0005 Async Ingestion And Vector Documents

## Context

This task implements Milestone 2 and Milestone 3 together because the upload, worker, chunking, embedding, vector upsert, and document inspection workflows share one ingestion lifecycle. It also completes the pending database and RLS foundation from `M1-T05`, which is a prerequisite for tenant-owned document data.

## Domains Touched

- Supabase schema, storage bucket, and Row Level Security.
- Authenticated document upload API.
- BullMQ-backed ingestion queue and worker app.
- Markdown parsing, chunking, embedding, and Pinecone vector upsert.
- Document list and document detail data access.
- Tailwind document management UI updates.
- Documentation and task tracking.

## Implementation Notes

- Keep request handlers short: upload validates input, stores the raw file, creates `documents` and `document_jobs`, enqueues a job, and returns `job_id`.
- Derive `user_id` from the authenticated Supabase session; never accept client-provided ownership.
- Store raw files under `private/{user_id}/{document_id}/{filename}` in a private Supabase Storage bucket.
- Persist durable job progress in `document_jobs` with monotonic percentages.
- Flatten supported source formats to one Markdown string before chunking.
- Persist chunks in Postgres for inspection and upsert embeddings to Pinecone with namespace equal to `user_id`.
- Until settings persistence and secret encryption ship in Milestone 5, embedding/Pinecone clients may read server environment variables and must fail ingestion with clear remediation when missing.

## Test Plan

- Migration/static tests:
  - Verify migrations define required tables, storage bucket, RLS enablement, and tenant policies.
  - Verify schema docs match migration-owned tables and columns.
- Upload/API tests:
  - Reject unauthenticated requests.
  - Reject disallowed extensions, MIME types, and oversized files.
  - Upload allowed files to tenant-scoped storage paths.
  - Create document and job records, enqueue BullMQ work, and return `job_id`.
  - Mark document/job failed if queue enqueue fails after persistence.
- Worker/pipeline tests:
  - Consume ingestion job payloads and update statuses through parse, chunk, embed, store, complete/failure states.
  - Parse supported files to non-empty Markdown or controlled failures.
  - Chunk Markdown in stable order and reject empty Markdown.
  - Read embedding settings from server defaults until user settings exist.
  - Upsert Pinecone vectors only to the authenticated `user_id` namespace with document/chunk metadata.
- UI/data tests:
  - `/documents` renders tenant-scoped documents from data access helpers and preserves upload status/progress.
  - `/documents/[id]` denies unauthorized/missing documents, renders Markdown, and filters chunks locally.

## Status

`completed`

## Verification

- Confirmed RED state before implementation: `pnpm test` failed because the ingestion modules, upload API service, migration file, and data-driven document UI behavior did not exist.
- Confirmed GREEN state after implementation: `pnpm test` passed with 25 tests across auth, route guards, Stitch page landmarks, upload validation/API behavior, ingestion pipeline behavior, migration contract, and document UI data behavior.
- Confirmed coverage: `pnpm test:coverage` passed with global coverage above configured thresholds.
- Confirmed static gates: `pnpm typecheck` passed for both `@mnemosyne/web` and `@mnemosyne/worker`; `pnpm lint` passed for `@mnemosyne/web`; `pnpm build` passed for `@mnemosyne/web`.
- Confirmed route output includes dynamic `/api/documents`, `/documents`, and `/documents/[id]`.
- Confirmed rendered document QA with Playwright against `next start` on `http://localhost:3003` with `MNEMOSYNE_AUTH_BYPASS=1`: `/documents` and `/documents/mock-detail` rendered nonblank desktop/mobile states, produced no console warnings/errors, and chunk search filtered the right-side chunk panel.
- Added Supabase migration `20260620100100_document_ingestion.sql` for tenant-owned document tables, private source bucket, and RLS policies.
- Added BullMQ worker entrypoint in `apps/worker` for ingestion jobs.
- Added server environment fallback for Google embeddings and Pinecone until encrypted user settings ship in Milestone 5.

## Completion Criteria

- Database migration and schema docs are synchronized.
- Upload API, queue, worker, parsing, chunking, embedding, Pinecone upsert, and progress persistence are implemented.
- Document list/detail UI uses real tenant-scoped data access with tested fallback states.
- Tests, lint, typecheck, build, and any feasible migration/static checks pass or documented blockers are recorded.
