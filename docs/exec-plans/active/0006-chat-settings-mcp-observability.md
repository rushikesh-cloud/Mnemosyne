# 0006 Chat Settings MCP Observability

## Context

This task implements Milestone 4 and Milestone 5 together because persisted chat, streaming agent responses, per-session model settings, encrypted user settings, LangSmith trace metadata, and MCP tool availability all meet in one backend chat runtime.

## Domains Touched

- Supabase schema, RLS, and migration contract for chat/settings tables.
- Tenant-scoped chat session and message persistence.
- Streaming chat API and transparent reasoning/tool-call events.
- Pinecone RAG retrieval scoped to the authenticated user namespace.
- Settings persistence with encrypted API keys and MCP credentials.
- Runtime provider configuration from saved settings.
- LangSmith trace metadata and MCP tool mapping.
- Tailwind chat and settings UI updates.
- Documentation and task tracking.

## Implementation Notes

- Derive `user_id` from the authenticated Supabase session in all API routes.
- Store chat sessions with `model` and `thinking_level` fields; reject unsupported values before persistence.
- Store messages with monotonically increasing sequence numbers and roles limited to `user`, `assistant`, `system`, and `tool`.
- Stream newline-delimited JSON events so the UI can parse thinking, tool, token, final, and error events.
- Keep user messages persisted even when assistant generation fails; persist a recoverable assistant error message.
- Query Pinecone using namespace equal to `user_id`; never accept namespace from the client.
- Persist settings in `user_settings` and MCP server rows in `mcp_servers`; encrypt secrets before database writes.
- Return only masked secret metadata to the browser after save/load.
- Allow LangSmith and MCP failures to degrade the affected chat operation without corrupting stored chat messages.

## Test Plan

- Migration/static tests:
  - Verify migrations define chat sessions, messages, user settings, MCP servers, encryption-related columns, and RLS policies.
  - Verify schema docs match migration-owned chat/settings tables and tenant fields.
- Settings tests:
  - Save settings with encrypted sensitive values and reload with masked secret values.
  - Reject missing required non-secret settings for dependent flows.
  - Verify decrypt is only used by backend runtime helpers.
  - Verify MCP credentials are not exposed in list/load responses.
- Chat repository tests:
  - Create, list, update, and resume tenant-scoped sessions.
  - Persist ordered messages and reject invalid roles/models/thinking levels.
  - Delete sessions without orphaning visible messages.
- Agent runtime tests:
  - Persist user messages before streaming assistant events.
  - Stream thinking, RAG tool-call, MCP tool-list, token, final, and error events.
  - Query Pinecone only with the authenticated user namespace.
  - Use saved user model, thinking level, Gemini key, Pinecone settings, LangSmith key, and MCP server configuration.
  - Preserve user messages and store recoverable assistant failure state when provider calls fail.
- UI/data tests:
  - `/chat` renders session data props, empty states, selected model/thinking controls, thinking events, and tool-call logs.
  - `/settings` renders saved settings, masks saved secrets, validates required fields, and lists configured MCP servers.

## Status

`completed`

## Verification

- Confirmed RED state before implementation: `pnpm test` failed on missing chat/settings runtime modules and mock-only chat/settings UI behavior.
- Confirmed GREEN state after implementation: `pnpm test` passed with 36 tests across auth, route guards, Stitch landmarks, ingestion, migration contracts, chat runtime, settings encryption, and data-driven chat/settings UI.
- Confirmed coverage: `pnpm test:coverage` passed with global coverage above configured thresholds.
- Confirmed static gates: `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed.
- Confirmed route output includes `/api/chat`, `/api/settings`, `/chat`, and `/settings`.
- Confirmed rendered chat/settings QA with Playwright fallback against `next start` on `http://localhost:3004` with `MNEMOSYNE_AUTH_BYPASS=1`: `/chat` and `/settings` rendered expected landmarks, produced no console warnings/errors, and screenshots were captured at `/tmp/mnemosyne-chat-m45.png` and `/tmp/mnemosyne-settings-m45.png`.
- Added `@modelcontextprotocol/sdk` and `langsmith` dependencies for Milestone 5 backend integration.
- Added Supabase migration `20260620102200_chat_settings_mcp.sql` for chat sessions, messages, encrypted settings columns, MCP servers, and RLS policies.

## Completion Criteria

- Database migration and schema docs are synchronized.
- Chat persistence, streaming API service, RAG retrieval, settings persistence, encryption, LangSmith metadata, and MCP tool mapping are implemented.
- Chat and settings UI use real tenant-scoped data access with tested fallback states.
- Tests, coverage, lint, typecheck, build, and any feasible rendered checks pass or documented blockers are recorded.
