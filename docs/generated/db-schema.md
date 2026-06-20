# Database Schema

Generated-style schema reference based on `project_doc.md`. Update this file whenever migrations change the actual database shape.

## Auth

### `auth.users`

Managed by Supabase Auth.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary user identifier used as tenant `user_id`. |
| `email` | `text` | Managed by Supabase Auth. |

## Public Tables

### `user_settings`

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` | Primary key, references `auth.users.id`. |
| `google_api_key` | `text` | Encrypted at rest. |
| `embedding_model_name` | `text` | Example: `text-embedding-004`. |
| `pinecone_key` | `text` | Encrypted at rest. |
| `pinecone_environment` | `text` | Pinecone environment or deployment target. |
| `pinecone_index_name` | `text` | Pinecone index name. |
| `langsmith_key` | `text` | Encrypted at rest. |
| `mcp_config` | `jsonb` | User MCP server URLs and encrypted credential references. |

Tenant rule: row owner is `user_id`.

### `documents`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | References `auth.users.id`. |
| `filename` | `text` | Original uploaded filename. |
| `status` | `text` | Ingestion lifecycle status. |
| `markdown_content` | `text` | Fully parsed Markdown content. |
| `created_at` | `timestamptz` | Creation timestamp. |

Tenant rule: row owner is `user_id`.

### `document_chunks`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `document_id` | `uuid` | References `documents.id`. |
| `chunk_text` | `text` | Raw chunk content. |
| `chunk_index` | `integer` | Stable chunk order within the document. |

Tenant rule: tenant is inherited through `documents.user_id`.

### `document_jobs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key and job identifier exposed to clients. |
| `document_id` | `uuid` | References `documents.id`. |
| `status` | `text` | Example states: `PARSING_STARTED`, `CHUNKING_COMPLETE`, `EMBEDDING_IN_PROGRESS`, `STORED`, `FAILED`. |
| `progress_percentage` | `integer` | Progress from 0 to 100. |
| `current_step_details` | `text` | User-safe current step or failure detail. |

Tenant rule: tenant is inherited through `documents.user_id`.

### `chat_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | References `auth.users.id`. |
| `title` | `text` | User-visible session title. |
| `selected_model` | `text` | Gemini model selected for this session. |
| `thinking_level` | `text` | Reasoning effort setting where supported. |
| `created_at` | `timestamptz` | Creation timestamp. |

Tenant rule: row owner is `user_id`.

### `messages`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `session_id` | `uuid` | References `chat_sessions.id`. |
| `role` | `text` | `user`, `assistant`, or `tool`. |
| `content` | `text` | Message content. |
| `tool_calls` | `jsonb` | Tool call metadata and traces. |
| `created_at` | `timestamptz` | Creation timestamp. |

Tenant rule: tenant is inherited through `chat_sessions.user_id`.

