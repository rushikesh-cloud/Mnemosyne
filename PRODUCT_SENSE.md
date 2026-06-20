# Product Sense

## Users

Mnemosyne is for enterprise users who need to upload internal knowledge, inspect how it was processed, and ask an AI agent questions with confidence that tenant data is isolated.

## Product Principles

- Trust through transparency: show ingestion progress, parsed Markdown, chunks, thinking states, and tool calls.
- Security by default: tenant isolation and secret handling are core product features, not implementation details.
- Operational clarity: prioritize clear states, recoverable failures, and compact workflows.
- Configurable intelligence: model, embedding, Pinecone, LangSmith, and MCP settings are user controlled.

## Success Criteria

- Users can understand where an answer came from.
- Users can diagnose ingestion failures without developer help.
- Users can configure provider keys and MCP servers without exposing secrets.
- The app never mixes data across users.

