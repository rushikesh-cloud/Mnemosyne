# 0007 Supabase Server Key Provisioning

## Context

This task verifies the runtime credentials required by Milestones 1 through 3 after the user supplied keys in untracked local environment files.

## Domains Touched

- Supabase project API key provisioning and connectivity.
- Local runtime secret configuration.
- Worker Supabase initialization.
- Redis queue connectivity.
- Google embedding model connectivity.
- Pinecone vector index connectivity.
- Secret-handling documentation and verification.

## Intended Design

- Prefer Supabase's current `sb_secret_...` server-side key for backend components when compatible with the Supabase JS client.
- Use the legacy `service_role` JWT key only when an integration specifically requires the JWT-based legacy key.
- Store server-side keys only in untracked environment files or deployment secret stores.
- Never expose server-side keys in browser code, source control, logs, chat, URLs, or public artifacts.
- Verify credentials through minimal health probes that do not write tenant data unless the existing application flow requires it.

## Test Plan

- Verify no server-side key is committed to the repository.
- Verify `apps/worker/src/index.ts` can initialize Supabase when a server-side key is present.
- Verify browser-facing code uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Verify `.gitignore` continues excluding `.env` and `.env.*` files.
- Verify Supabase REST/auth reachability using configured URL and keys without printing secrets.
- Verify expected Milestone 1-3 tables and the `document_sources` storage bucket are reachable.
- Verify Redis responds to a ping when `REDIS_URL` is configured.
- Verify Google embeddings return a vector for a short probe string.
- Verify Pinecone can describe the configured index.
- Run repository tests and type checks covering Milestone 1-3 behavior.

## Status

`completed`

## Verification

Live credential verification completed without echoing secret values.

- Confirmed `apps/web/.env` is ignored by `.gitignore` and is not tracked.
- Started local Redis with Docker container `mnemosyne-redis` on `127.0.0.1:6379`.
- Updated untracked `apps/web/.env` to use `REDIS_URL=redis://127.0.0.1:6379`.
- Added missing placeholder keys to `apps/web/.env.example` for settings encryption and LangSmith.
- Confirmed sanitized presence for Supabase URL, anon key, service key, Redis URL, Google key, embedding model, Pinecone key, Pinecone index, and settings encryption key. LangSmith remains optional and empty locally.
- Confirmed no known secret token patterns are tracked by `git grep`.
- Confirmed Supabase tables are reachable: `user_settings`, `documents`, `document_jobs`, `document_chunks`, `chat_sessions`, `messages`, and `mcp_servers`.
- Created and confirmed private Supabase Storage bucket `document_sources`.
- Confirmed Redis responds to `PING`.
- Confirmed BullMQ can create and remove a probe job through `REDIS_URL`.
- Confirmed Google embeddings work with `gemini-embedding-001` and return 3072 dimensions.
- Confirmed Pinecone can describe the configured `mnemosyne-index`.
- Confirmed `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass.

## Completion Criteria

- A valid server-side Supabase key is obtained from Supabase Dashboard or Management API using authorized credentials. Done.
- The key is configured in untracked local/deployment environments only. Done.
- Worker initialization is verified without printing or committing the secret. Done through typecheck and dependency probes.
- Milestone 1-3 external dependencies are verified or blockers are recorded with sanitized error summaries. Done.
