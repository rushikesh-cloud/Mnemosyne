import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getSettingsEncryptionKey,
  prepareSettingsUpsert,
  settingsRowToSafeView,
  type SafeSettingsView,
  type SettingsInput
} from "./security";

export class SupabaseSettingsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async loadSafeSettings(): Promise<SafeSettingsView> {
    const { data: settings, error: settingsError } = await this.supabase
      .from("user_settings")
      .select(
        "user_id, google_api_key_encrypted, embedding_model_name, pinecone_api_key_encrypted, pinecone_index_name, pinecone_host, langsmith_api_key_encrypted"
      )
      .maybeSingle();

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    const { data: servers, error: serversError } = await this.supabase
      .from("mcp_servers")
      .select("id, name, endpoint_url, encrypted_headers, status")
      .order("created_at", { ascending: true });

    if (serversError) {
      throw new Error(serversError.message);
    }

    return settingsRowToSafeView(settings as never, (servers || []) as never);
  }

  async saveSettings(userId: string, input: SettingsInput): Promise<SafeSettingsView> {
    const prepared = prepareSettingsUpsert({
      userId,
      encryptionKey: getSettingsEncryptionKey(),
      input
    });
    const { error: settingsError } = await this.supabase
      .from("user_settings")
      .upsert(prepared.settingsRow, { onConflict: "user_id" });

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    const { error: deleteError } = await this.supabase.from("mcp_servers").delete().eq("user_id", userId);
    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (prepared.mcpServerRows.length) {
      const { error: insertError } = await this.supabase.from("mcp_servers").insert(prepared.mcpServerRows);
      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    return this.loadSafeSettings();
  }
}
