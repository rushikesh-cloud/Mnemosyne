import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "../../supabase/migrations/20260620100100_document_ingestion.sql"),
  "utf8"
);

describe("document ingestion database migration", () => {
  it("creates tenant-owned document tables, storage bucket, and RLS policies", () => {
    for (const table of ["user_settings", "documents", "document_jobs", "document_chunks"]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }

    expect(migration).toContain("'document_sources'");
    expect(migration).toContain("auth.uid() = user_id");
    expect(migration).toContain("with check (auth.uid() = user_id)");
    expect(migration).toContain("private/{user_id}/{document_id}/{filename}");
  });
});

const chatSettingsMigration = readFileSync(
  join(process.cwd(), "../../supabase/migrations/20260620102200_chat_settings_mcp.sql"),
  "utf8"
);

describe("chat and settings database migration", () => {
  it("creates tenant-owned chat, encrypted settings, and MCP tables with RLS policies", () => {
    for (const table of ["chat_sessions", "messages", "mcp_servers"]) {
      expect(chatSettingsMigration).toContain(`create table if not exists public.${table}`);
      expect(chatSettingsMigration).toContain(`alter table public.${table} enable row level security`);
    }

    expect(chatSettingsMigration).toContain("google_api_key_encrypted");
    expect(chatSettingsMigration).toContain("pinecone_api_key_encrypted");
    expect(chatSettingsMigration).toContain("langsmith_api_key_encrypted");
    expect(chatSettingsMigration).toContain("encrypted_headers");
    expect(chatSettingsMigration).toContain("auth.uid() = user_id");
    expect(chatSettingsMigration).toContain("chat_sessions.user_id = auth.uid()");
  });
});
