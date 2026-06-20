# Security

## Tenancy

- Supabase JWT identity is the source of `user_id`.
- Row Level Security must protect every tenant-owned PostgreSQL table.
- Pinecone namespace must always equal the authenticated `user_id`.
- API routes must never trust client-provided `user_id` for ownership.

## Secrets

- Google, Pinecone, LangSmith, and MCP credentials must be encrypted at rest.
- Plaintext secrets may be used only inside authorized backend execution paths.
- Saved secrets must not be returned to the browser in full.
- Logs must not include credentials, bearer tokens, or decrypted secret values.

## MCP Boundary

- MCP servers are user configured and must be treated as external systems.
- Connection failures must be isolated to the requesting user/session.
- Tool invocation logs should describe actions without leaking credentials.

