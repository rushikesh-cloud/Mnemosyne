# Mnemosyne Plans

## Roadmap

Mnemosyne is an enterprise Agentic RAG platform for secure document ingestion, tenant-isolated vector retrieval, transparent AI reasoning, and dynamic MCP tool use.

| Milestone | Focus | Outcome |
|---|---|---|
| 0 | Project Bootstrap And Planning | Versioned task tracker, product spec, architecture directives, schema reference, and repo scaffold. |
| 1 | Infrastructure, Auth, UI Foundation, And Database | Next.js TypeScript monorepo, Tailwind CSS foundation, Supabase auth, migrations, and RLS. |
| 2 | Async Document Ingestion | Supabase Storage uploads, BullMQ worker, Markdown parsing, and realtime ingestion tracing. |
| 3 | Vector Storage And Document Management | Chunk persistence, embeddings, Pinecone namespace isolation, document list, and split detail view. |
| 4 | Agentic Chat Core | Persistent chat sessions, streaming Gemini agent, RAG retriever tool, and transparent tool/thinking UI. |
| 5 | Settings, MCP, And Observability | User settings, encrypted secrets, LangSmith tracing, MCP client, and dynamic agent tools. |
| 6 | Hardening And Release Readiness | E2E coverage, reliability hardening, security review, CI, and quality scorecard. |

## Current Priority Queue

1. Complete Milestone 0 bootstrap artifacts.
2. Initialize the Next.js TypeScript monorepo and Tailwind CSS foundation.
3. Establish Supabase schema, auth, and Row Level Security before user data workflows.
4. Build asynchronous ingestion before vector retrieval or chat features.
5. Implement Pinecone namespace isolation before exposing RAG answers in chat.

## Operating Rules

- `tasks.md` is the master task tracker.
- Detailed execution logs live in `docs/exec-plans/active/`.
- Every implementation task must define tests before code changes.
- Tailwind CSS is the required UI component styling foundation.
- No separate UI kit is planned unless a future task explicitly changes that decision.

