# Enterprise Agentic RAG Platform

## Summary

Mnemosyne is an enterprise-grade Agentic Retrieval-Augmented Generation platform. Users securely upload documents, the system asynchronously parses and embeds them, and users chat with a Gemini-powered agent that can use tenant-scoped RAG retrieval and user-configured MCP tools.

## Stack

- Frontend: React, Next.js, TypeScript, Tailwind CSS.
- Backend/API: Node.js and TypeScript.
- Database, auth, and storage: Supabase PostgreSQL, Supabase Auth, Supabase Storage.
- Vector database: Pinecone.
- LLM provider: Google Gemini.
- AI orchestration: LangChain.js or LangGraph.js.
- Background jobs: BullMQ backed by Redis.
- Observability: LangSmith.

## Functional Requirements

### Authentication And Multi-Tenancy

- Support standard email/password sign up and sign in through Supabase Auth.
- Extract `user_id` from the Supabase JWT for backend requests.
- Enforce tenant isolation through Supabase RLS and backend ownership checks.
- Use `user_id` as the Pinecone namespace for every vector upsert and query.

### Document Ingestion

- Support PDF, DOCX, PPTX, and HTML uploads.
- Upload raw files to Supabase Storage.
- Create database records and enqueue BullMQ jobs without blocking the request.
- Parse files into one Markdown string with LangChain community document loaders.
- Chunk Markdown, generate embeddings, upsert vectors to Pinecone, and store Markdown/chunks in PostgreSQL.
- Publish granular job progress through `document_jobs` for Supabase Realtime subscriptions.

### Document Management

- Show uploaded documents with status and upload date.
- Provide an upload modal with live ingestion progress.
- Provide a document detail split view with parsed Markdown on the left and vector chunks on the right.
- Support local keyword search over displayed chunks.

### Agentic Chat

- Persist multiple chat sessions and messages.
- Allow per-session Gemini model and thinking-level configuration.
- Stream assistant responses.
- Display transparent thinking states and explicit tool-call logs.
- Provide a RAG retriever tool scoped to the current user's Pinecone namespace.
- Provide MCP tools from user-configured MCP servers through the backend.

### Settings And Observability

- Let users configure Google API key, embedding model, Pinecone config, LangSmith key, and MCP server credentials.
- Store sensitive settings encrypted at rest.
- Initialize Gemini, embeddings, Pinecone, LangSmith, and MCP connections from saved settings.
- Trace agent reasoning, token usage, and tool latency with LangSmith when configured.

## Acceptance Criteria

- No tenant can read, write, retrieve, or infer another tenant's data.
- Ingestion progress is visible and durable.
- Parsed Markdown and chunks are inspectable in the UI.
- Chat history persists across sessions.
- Tool calls and thinking states are visible in the chat UI.
- Missing settings fail with clear remediation instead of generic errors.
- Tailwind CSS is used for frontend styling and reusable UI components.

