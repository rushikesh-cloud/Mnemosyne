# Design

## Product Design Direction

Mnemosyne is an operational enterprise tool. Screens should prioritize scanning, trust, and repeated workflows over marketing-style presentation.

## Core Experience

- Users authenticate, upload documents, observe ingestion progress, inspect parsed output and chunks, then chat with a transparent agent.
- Trust is built through visible ingestion states, split document/chunk inspection, and clear tool-call/thinking events in chat.
- The UI should avoid decorative complexity and focus on dense, legible information surfaces.

## Technical Design Choices

- Use asynchronous ingestion with BullMQ and Redis to keep upload APIs responsive.
- Flatten parsed files to Markdown to keep document processing robust across supported formats.
- Persist Markdown and chunks in PostgreSQL for UI inspection.
- Use Pinecone only for vector retrieval, strictly isolated by `user_id` namespace.
- Use Supabase Realtime for ingestion progress events stored in `document_jobs`.

