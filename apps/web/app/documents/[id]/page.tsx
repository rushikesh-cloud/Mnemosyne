import { notFound } from "next/navigation";

import { DocumentDetailPageView } from "@/features/documents/document-detail-page-view";
import { getTenantDocumentDetail } from "@/lib/documents/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await loadDocumentDetail(id);

  if (detail === null) {
    notFound();
  }

  if (detail === undefined) {
    return <DocumentDetailPageView />;
  }

  return <DocumentDetailPageView document={detail.document} chunks={detail.chunks} />;
}

async function loadDocumentDetail(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    return await getTenantDocumentDetail(supabase, id);
  } catch {
    return undefined;
  }
}
