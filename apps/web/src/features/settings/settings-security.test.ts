import { describe, expect, it } from "vitest";

import {
  decryptSecret,
  encryptSecret,
  prepareSettingsUpsert,
  settingsRowToSafeView
} from "@/lib/settings/security";

describe("settings security", () => {
  const key = "0123456789abcdef0123456789abcdef";

  it("encrypts sensitive values before persistence and decrypts them for backend use", () => {
    const encrypted = encryptSecret("google-secret", key);

    expect(encrypted).not.toContain("google-secret");
    expect(decryptSecret(encrypted, key)).toBe("google-secret");
  });

  it("builds database rows without plaintext provider or MCP credentials", () => {
    const prepared = prepareSettingsUpsert({
      userId: "user-1",
      encryptionKey: key,
      input: {
        googleApiKey: "google-secret",
        embeddingModelName: "text-embedding-004",
        pineconeApiKey: "pinecone-secret",
        pineconeIndexName: "mnemosyne-prod",
        pineconeHost: "us-east-1",
        langsmithApiKey: "langsmith-secret",
        mcpServers: [
          {
            name: "Jira",
            endpointUrl: "https://jira.example.test/mcp",
            headersJson: "{\"Authorization\":\"Bearer jira-secret\"}"
          }
        ]
      }
    });

    expect(JSON.stringify(prepared)).not.toContain("google-secret");
    expect(JSON.stringify(prepared)).not.toContain("pinecone-secret");
    expect(JSON.stringify(prepared)).not.toContain("langsmith-secret");
    expect(JSON.stringify(prepared)).not.toContain("jira-secret");
    expect(prepared.settingsRow.user_id).toBe("user-1");
    expect(prepared.mcpServerRows[0]).toEqual(
      expect.objectContaining({
        user_id: "user-1",
        name: "Jira",
        endpoint_url: "https://jira.example.test/mcp",
        status: "configured"
      })
    );
  });

  it("returns masked settings views without plaintext secrets", () => {
    const encrypted = encryptSecret("google-secret", key);
    const safe = settingsRowToSafeView(
      {
        user_id: "user-1",
        google_api_key_encrypted: encrypted,
        embedding_model_name: "text-embedding-004",
        pinecone_api_key_encrypted: null,
        pinecone_index_name: "mnemosyne-prod",
        pinecone_host: "us-east-1",
        langsmith_api_key_encrypted: encrypted
      },
      [
        {
          id: "mcp-1",
          name: "Jira",
          endpoint_url: "https://jira.example.test/mcp",
          encrypted_headers: encrypted,
          status: "configured"
        }
      ]
    );

    expect(safe.googleApiKey).toBe("••••••••");
    expect(safe.langsmithApiKey).toBe("••••••••");
    expect(safe.pineconeApiKey).toBe("");
    expect(safe.mcpServers[0]?.headersJson).toBe("••••••••");
    expect(JSON.stringify(safe)).not.toContain("google-secret");
  });
});
