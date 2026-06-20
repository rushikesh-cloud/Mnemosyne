# Reliability

## Requirements

- Long-running document processing must execute in BullMQ workers, not synchronously in request handlers.
- Every ingestion job must expose a durable status through `document_jobs`.
- Failures must include a user-safe explanation and enough internal detail for debugging.
- Worker retries must avoid duplicate vectors, chunks, or messages.
- Provider and MCP failures must degrade the affected operation without corrupting stored state.

## Observability

- Use structured logs for API, worker, and agent flows.
- Use LangSmith for agent reasoning traces, token usage, and tool latency when configured.
- Include correlation identifiers for document jobs and chat sessions.

## Recovery

- Failed ingestion jobs should be retryable.
- Chat streaming failures should preserve user messages and expose retry affordances.
- Settings validation should block dependent flows with actionable remediation.

