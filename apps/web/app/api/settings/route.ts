import { NextResponse } from "next/server";

import { SupabaseSettingsRepository } from "@/lib/settings/repository";
import type { SettingsInput } from "@/lib/settings/security";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const settings = await new SupabaseSettingsRepository(supabase).loadSafeSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as SettingsInput;
  const settings = await new SupabaseSettingsRepository(supabase).saveSettings(user.id, body);
  return NextResponse.json({ settings });
}
