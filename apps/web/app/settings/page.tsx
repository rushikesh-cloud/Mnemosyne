import { SettingsPageView } from "@/features/settings/settings-page-view";
import { SupabaseSettingsRepository } from "@/lib/settings/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const settings = await loadSettings();
  return <SettingsPageView settings={settings} />;
}

async function loadSettings() {
  try {
    const supabase = await createServerSupabaseClient();
    return await new SupabaseSettingsRepository(supabase).loadSafeSettings();
  } catch {
    return undefined;
  }
}
