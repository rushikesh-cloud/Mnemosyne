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
| `google_api_key_encrypted` | `text` | AES-GCM encrypted Gemini API key. |
| `embedding_model_name` | `text` | Defaults to `text-embedding-004`. |
| `pinecone_api_key_encrypted` | `text` | AES-GCM encrypted Pinecone API key. |
| `pinecone_host` | `text` | Pinecone environment, host, or deployment target. |
| `pinecone_index_name` | `text` | Pinecone index name. |
| `langsmith_api_key_encrypted` | `text` | AES-GCM encrypted LangSmith API key. |
| `created_at` | `timestamptz` | Creation timestamp. |
| `updated_at` | `timestamptz` | Last update timestamp. |

Tenant rule: row owner is `user_id`.

### `documents`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | References `auth.users.id`. |
| `filename` | `text` | Original uploaded filename. |
| `file_type` | `text` | One of `PDF`, `DOCX`, `PPTX`, or `HTML`. |
| `mime_type` | `text` | Browser-provided MIME type validated by the upload API and storage bucket. |
| `storage_bucket` | `text` | Defaults to `document_sources`. |
| `storage_path` | `text` | Tenant-scoped path: `private/{user_id}/{document_id}/{filename}`. |
| `file_size_bytes` | `bigint` | Raw source file size. |
| `status` | `text` | `UPLOADED`, `QUEUED`, `PARSING`, `CHUNKING`, `EMBEDDING`, `STORING`, `STORED`, or `FAILED`. |
| `markdown_content` | `text` | Fully parsed Markdown content. |
| `failure_reason` | `text` | User-safe failure detail when ingestion fails. |
| `created_at` | `timestamptz` | Creation timestamp. |
| `updated_at` | `timestamptz` | Last update timestamp. |

Tenant rule: row owner is `user_id`.

### `document_chunks`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `document_id` | `uuid` | References `documents.id`. |
| `chunk_text` | `text` | Raw chunk content. |
| `chunk_index` | `integer` | Stable chunk order within the document. |
| `token_estimate` | `integer` | Approximate token count for inspection and budget planning. |
| `created_at` | `timestamptz` | Creation timestamp. |

Tenant rule: tenant is inherited through `documents.user_id`.

### `document_jobs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key and job identifier exposed to clients. |
| `document_id` | `uuid` | References `documents.id`. |
| `status` | `text` | Example states: `QUEUED`, `PARSING_STARTED`, `CHUNKING_COMPLETE`, `EMBEDDING_IN_PROGRESS`, `STORING_VECTORS`, `STORED`, `FAILED`. |
| `progress_percentage` | `integer` | Progress from 0 to 100. |
| `current_step_details` | `text` | User-safe current step or failure detail. |
| `attempts` | `integer` | Worker attempt count hook for retry reporting. |
| `last_error` | `text` | Last controlled failure detail. |
| `created_at` | `timestamptz` | Creation timestamp. |
| `updated_at` | `timestamptz` | Last update timestamp. |

Tenant rule: tenant is inherited through `documents.user_id`.

## Storage

### `storage.buckets.document_sources`

Private Supabase Storage bucket for raw source files.

| Property | Value |
|---|---|
| `public` | `false` |
| `file_size_limit` | `52428800` bytes |
| `allowed_mime_types` | PDF, DOCX, PPTX, HTML, XHTML |

Tenant rule: object names must follow `private/{user_id}/{document_id}/{filename}` and Storage policies compare the second path segment to `auth.uid()`.

### `chat_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | References `auth.users.id`. |
| `title` | `text` | User-visible session title. |
| `selected_model` | `text` | Gemini model selected for this session. |
| `thinking_level` | `text` | Reasoning effort setting where supported. |
| `created_at` | `timestamptz` | Creation timestamp. |
| `updated_at` | `timestamptz` | Last activity timestamp. |

Tenant rule: row owner is `user_id`.

### `messages`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `session_id` | `uuid` | References `chat_sessions.id`. |
| `role` | `text` | `user`, `assistant`, or `tool`. |
| `content` | `text` | Message content. |
| `tool_calls` | `jsonb` | Tool call metadata and traces. |
| `event_log` | `jsonb` | Structured thinking, tool-call, token, final, and error events. |
| `sequence_number` | `integer` | Stable message order within the session. |
| `status` | `text` | `complete` or `failed`. |
| `created_at` | `timestamptz` | Creation timestamp. |

Tenant rule: tenant is inherited through `chat_sessions.user_id`.

### `mcp_servers`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | References `auth.users.id`. |
| `name` | `text` | User-visible MCP server name. |
| `endpoint_url` | `text` | Streamable HTTP MCP endpoint. |
| `encrypted_headers` | `text` | AES-GCM encrypted connection headers or credentials. |
| `status` | `text` | Current configuration status. |
| `created_at` | `timestamptz` | Creation timestamp. |
| `updated_at` | `timestamptz` | Last update timestamp. |

Tenant rule: row owner is `user_id`.
