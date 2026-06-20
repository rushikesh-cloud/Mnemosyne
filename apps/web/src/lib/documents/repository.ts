import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChunkInput, IngestionRepository, StoredChunk } from "./ingestion";

export class SupabaseDocumentRepository implements IngestionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createDocumentRecord(input: {
    userId: string;
    filename: string;
    fileType: string;
    mimeType: string;
    fileSizeBytes: number;
  }) {
    const { data, error } = await this.supabase
      .from("documents")
      .insert({
        user_id: input.userId,
        filename: input.filename,
        file_type: input.fileType,
        mime_type: input.mimeType,
        file_size_bytes: input.fileSizeBytes,
        storage_path: "pending",
        status: "UPLOADED"
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { id: data.id as string };
  }

  async createDocumentJob(documentId: string) {
    const { data, error } = await this.supabase
      .from("document_jobs")
      .insert({
        document_id: documentId,
        status: "QUEUED",
        progress_percentage: 0,
        current_step_details: "Queued for ingestion."
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { id: data.id as string };
  }

  async uploadSourceFile(input: { documentId: string; storagePath: string; file: File }) {
    const { error: uploadError } = await this.supabase.storage
      .from("document_sources")
      .upload(input.storagePath, input.file, { upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { error: updateError } = await this.supabase
      .from("documents")
      .update({ storage_path: input.storagePath, updated_at: new Date().toISOString() })
      .eq("id", input.documentId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { path: input.storagePath };
  }

  async markJobQueued(jobId: string) {
    await this.updateJobProgress(jobId, {
      status: "QUEUED",
      progressPercentage: 0,
      currentStepDetails: "Queued for ingestion."
    });
  }

  async markJobFailed(jobId: string, reason: string) {
    const { error } = await this.supabase
      .from("document_jobs")
      .update({
        status: "FAILED",
        progress_percentage: 100,
        current_step_details: reason,
        last_error: reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateJobProgress(
    jobId: string,
    progress: { status: string; progressPercentage: number; currentStepDetails: string }
  ) {
    const { error } = await this.supabase
      .from("document_jobs")
      .update({
        status: progress.status,
        progress_percentage: progress.progressPercentage,
        current_step_details: progress.currentStepDetails,
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async downloadSourceFile(storagePath: string) {
    const { data, error } = await this.supabase.storage.from("document_sources").download(storagePath);
    if (error) {
      throw new Error(error.message);
    }

    return new Uint8Array(await data.arrayBuffer());
  }

  async saveParsedMarkdown(documentId: string, markdown: string) {
    const { error } = await this.supabase
      .from("documents")
      .update({
        markdown_content: markdown,
        status: "CHUNKING",
        updated_at: new Date().toISOString()
      })
      .eq("id", documentId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async replaceDocumentChunks(documentId: string, chunks: ChunkInput[]): Promise<StoredChunk[]> {
    const { error: deleteError } = await this.supabase.from("document_chunks").delete().eq("document_id", documentId);
    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const { data, error } = await this.supabase
      .from("document_chunks")
      .insert(
        chunks.map((chunk) => ({
          document_id: documentId,
          chunk_text: chunk.chunkText,
          chunk_index: chunk.chunkIndex,
          token_estimate: chunk.tokenEstimate
        }))
      )
      .select("id, chunk_index, chunk_text, token_estimate")
      .order("chunk_index", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data.map((chunk) => ({
      id: chunk.id as string,
      chunkIndex: chunk.chunk_index as number,
      chunkText: chunk.chunk_text as string,
      tokenEstimate: chunk.token_estimate as number
    }));
  }

  async markDocumentComplete(documentId: string, jobId: string) {
    const now = new Date().toISOString();
    const { error: documentError } = await this.supabase
      .from("documents")
      .update({ status: "STORED", failure_reason: null, updated_at: now })
      .eq("id", documentId);
    if (documentError) {
      throw new Error(documentError.message);
    }

    const { error: jobError } = await this.supabase
      .from("document_jobs")
      .update({
        status: "STORED",
        progress_percentage: 100,
        current_step_details: "Document indexed and ready for retrieval.",
        updated_at: now
      })
      .eq("id", jobId);
    if (jobError) {
      throw new Error(jobError.message);
    }
  }

  async markDocumentFailed(documentId: string, jobId: string, reason: string) {
    const now = new Date().toISOString();
    const { error: documentError } = await this.supabase
      .from("documents")
      .update({ status: "FAILED", failure_reason: reason, updated_at: now })
      .eq("id", documentId);
    if (documentError) {
      throw new Error(documentError.message);
    }

    await this.markJobFailed(jobId, reason);
  }
}
