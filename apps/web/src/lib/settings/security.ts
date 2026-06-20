import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const mask = "••••••••";

export type McpServerInput = {
  id?: string;
  name: string;
  endpointUrl: string;
  headersJson?: string;
  status?: string;
};

export type SettingsInput = {
  googleApiKey?: string;
  embeddingModelName: string;
  pineconeApiKey?: string;
  pineconeIndexName?: string;
  pineconeHost?: string;
  langsmithApiKey?: string;
  mcpServers: McpServerInput[];
};

export type SafeSettingsView = {
  googleApiKey: string;
  embeddingModelName: string;
  pineconeApiKey: string;
  pineconeIndexName: string;
  pineconeHost: string;
  langsmithApiKey: string;
  mcpServers: Array<{
    id?: string;
    name: string;
    endpointUrl: string;
    headersJson: string;
    status: string;
  }>;
};

type SettingsRow = {
  user_id: string;
  google_api_key_encrypted: string | null;
  embedding_model_name: string;
  pinecone_api_key_encrypted: string | null;
  pinecone_index_name: string | null;
  pinecone_host: string | null;
  langsmith_api_key_encrypted: string | null;
};

type McpServerRow = {
  id?: string;
  user_id?: string;
  name: string;
  endpoint_url: string;
  encrypted_headers: string | null;
  status: string;
};

export function encryptSecret(value: string, encryptionKey: string) {
  const key = normalizeEncryptionKey(encryptionKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decryptSecret(value: string, encryptionKey: string) {
  const [version, iv, tag, ciphertext] = value.split(":");
  if (version !== "v1" || !iv || !tag || !ciphertext) {
    throw new Error("Unsupported encrypted secret format.");
  }

  const decipher = createDecipheriv("aes-256-gcm", normalizeEncryptionKey(encryptionKey), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

export function prepareSettingsUpsert(input: {
  userId: string;
  encryptionKey: string;
  input: SettingsInput;
}) {
  const encryptOptional = (value?: string) => {
    if (!value || value === mask) {
      return null;
    }
    return encryptSecret(value, input.encryptionKey);
  };

  return {
    settingsRow: {
      user_id: input.userId,
      google_api_key_encrypted: encryptOptional(input.input.googleApiKey),
      embedding_model_name: input.input.embeddingModelName,
      pinecone_api_key_encrypted: encryptOptional(input.input.pineconeApiKey),
      pinecone_index_name: input.input.pineconeIndexName || null,
      pinecone_host: input.input.pineconeHost || null,
      langsmith_api_key_encrypted: encryptOptional(input.input.langsmithApiKey),
      updated_at: new Date().toISOString()
    },
    mcpServerRows: input.input.mcpServers.map((server) => ({
      id: server.id,
      user_id: input.userId,
      name: server.name,
      endpoint_url: server.endpointUrl,
      encrypted_headers: encryptOptional(server.headersJson),
      status: server.status || "configured",
      updated_at: new Date().toISOString()
    }))
  };
}

export function settingsRowToSafeView(settingsRow: SettingsRow | null, mcpRows: McpServerRow[]): SafeSettingsView {
  return {
    googleApiKey: settingsRow?.google_api_key_encrypted ? mask : "",
    embeddingModelName: settingsRow?.embedding_model_name || "gemini-embedding-001",
    pineconeApiKey: settingsRow?.pinecone_api_key_encrypted ? mask : "",
    pineconeIndexName: settingsRow?.pinecone_index_name || "",
    pineconeHost: settingsRow?.pinecone_host || "",
    langsmithApiKey: settingsRow?.langsmith_api_key_encrypted ? mask : "",
    mcpServers: mcpRows.map((server) => ({
      id: server.id,
      name: server.name,
      endpointUrl: server.endpoint_url,
      headersJson: server.encrypted_headers ? mask : "",
      status: server.status
    }))
  };
}

export function getSettingsEncryptionKey() {
  const key = process.env.MNEMOSYNE_SETTINGS_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("MNEMOSYNE_SETTINGS_ENCRYPTION_KEY is required for secret storage.");
  }
  return key;
}

function normalizeEncryptionKey(encryptionKey: string) {
  if (Buffer.byteLength(encryptionKey) === 32) {
    return Buffer.from(encryptionKey);
  }
  return createHash("sha256").update(encryptionKey).digest();
}
