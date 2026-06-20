import { NextResponse } from "next/server";

import { handleDocumentUpload } from "@/lib/documents/upload-api";
import { createDocumentIngestionQueue } from "@/lib/documents/queue";
import { SupabaseDocumentRepository } from "@/lib/documents/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const result = await handleDocumentUpload({
      formData: await request.formData(),
      user: user ? { id: user.id } : null,
      repository: new SupabaseDocumentRepository(supabase),
      queue: createDocumentIngestionQueue()
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document upload failed.";
    if (message.includes("Supabase environment")) {
      return NextResponse.json({ error: "Supabase environment is not configured." }, { status: 503 });
    }

    console.error("document upload failed", { error });
    return NextResponse.json({ error: "Document upload failed." }, { status: 500 });
  }
}
