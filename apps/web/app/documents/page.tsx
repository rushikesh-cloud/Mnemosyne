import { DocumentsPageView } from "@/features/documents/documents-page-view";
import { listTenantDocuments } from "@/lib/documents/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DocumentsPage() {
  const documents = await loadDocuments();
  return <DocumentsPageView documents={documents} />;
}

async function loadDocuments() {
  try {
    const supabase = await createServerSupabaseClient();
    return await listTenantDocuments(supabase);
  } catch {
    return undefined;
  }
}
