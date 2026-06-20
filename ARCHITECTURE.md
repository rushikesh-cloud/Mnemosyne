# Architecture

## System Shape

Mnemosyne is planned as a TypeScript monorepo with a Next.js web app, a Node.js worker, and shared packages for database, AI orchestration, and cross-cutting types.

## Domains

- Authentication and tenancy: Supabase Auth provides email/password authentication. Backend code derives `user_id` from the Supabase JWT for every tenant-owned operation.
- Document ingestion: the web/API layer accepts uploads and queues work. The worker parses, chunks, embeds, stores, and reports progress asynchronously.
- Document management: PostgreSQL stores parsed Markdown and raw chunks for inspection. Pinecone stores embeddings for retrieval.
- Agentic chat: LangChain.js or LangGraph.js orchestrates Gemini, RAG retrieval, and MCP-backed tools.
- Settings and observability: user-owned settings configure model providers, Pinecone, LangSmith, and MCP connections.

## Package Boundaries

- `apps/web`: Next.js app router UI and API routes.
- `apps/worker`: BullMQ worker processes and ingestion pipeline.
- `packages/db`: Supabase schema types, query helpers, and migration-adjacent database utilities.
- `packages/ai`: Gemini, embeddings, LangChain/LangGraph, Pinecone, and MCP orchestration helpers.
- `packages/shared`: shared domain types, status enums, validation schemas, and constants.

## Invariants

- Tenant data must be scoped by authenticated user identity.
- Pinecone namespace must always equal the authenticated `user_id`.
- Ingestion must not block the request/response event loop for long-running parsing or embedding work.
- Raw source files, Markdown, chunks, vectors, messages, and settings must be isolated by tenant.
- Secrets must never be sent back to the browser in plaintext after save.

