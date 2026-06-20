import type { SupabaseClient } from "@supabase/supabase-js";

import type { DocumentChunkView, DocumentDetail } from "@/features/documents/document-detail-page-view";
import type { DocumentListItem } from "@/features/documents/documents-page-view";

type ListDocumentRow = {
  id: string;
  filename: string;
  file_type: string;
  status: string;
  file_size_bytes: number;
  created_at: string;
  document_jobs: Array<{
    progress_percentage: number;
  }> | null;
};

type DetailDocumentRow = {
  id: string;
  filename: string;
  markdown_content: string | null;
  file_size_bytes: number;
  status: string;
  created_at: string;
};

type ChunkRow = {
  id: string;
  chunk_index: number;
  chunk_text: string;
};

export async function listTenantDocuments(supabase: SupabaseClient): Promise<DocumentListItem[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, filename, file_type, status, file_size_bytes, created_at, document_jobs(progress_percentage)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ListDocumentRow[]).map((document) => ({
    id: document.id,
    filename: document.filename,
    fileType: document.file_type,
    uploadedAt: formatTimestamp(document.created_at),
    status: document.status,
    progressPercentage: document.document_jobs?.[0]?.progress_percentage ?? statusToProgress(document.status)
  }));
}

export async function getTenantDocumentDetail(
  supabase: SupabaseClient,
  documentId: string
): Promise<{ document: DocumentDetail; chunks: DocumentChunkView[] } | null> {
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, filename, markdown_content, file_size_bytes, status, created_at")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    throw new Error(documentError.message);
  }

  if (!document) {
    return null;
  }

  const { data: chunks, error: chunksError } = await supabase
    .from("document_chunks")
    .select("id, chunk_index, chunk_text")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true });

  if (chunksError) {
    throw new Error(chunksError.message);
  }

  const documentRow = document as DetailDocumentRow;

  return {
    document: {
      id: documentRow.id,
      filename: documentRow.filename,
      markdownContent: documentRow.markdown_content || "Parsed Markdown is not available yet.",
      fileSizeLabel: formatBytes(documentRow.file_size_bytes),
      uploadedAt: formatTimestamp(documentRow.created_at),
      status: documentRow.status
    },
    chunks: (chunks as ChunkRow[]).map((chunk) => ({
      id: chunk.id,
      chunkIndex: chunk.chunk_index,
      chunkText: chunk.chunk_text
    }))
  };
}

function statusToProgress(status: string) {
  if (status === "STORED") {
    return 100;
  }
  if (status === "FAILED") {
    return 100;
  }
  if (status === "UPLOADED" || status === "QUEUED") {
    return 0;
  }
  return 50;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
