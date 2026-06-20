import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";

import { createEmbeddingClientFromEnv } from "../../web/src/lib/documents/embeddings";
import { getDocumentIngestionQueueName, getRedisConnection } from "../../web/src/lib/documents/queue";
import { runIngestionPipeline, type IngestionJobPayload } from "../../web/src/lib/documents/ingestion";
import { SourceFileMarkdownParser } from "../../web/src/lib/documents/parsers";
import { SupabaseDocumentRepository } from "../../web/src/lib/documents/repository";
import { createPineconeVectorStoreFromEnv } from "../../web/src/lib/documents/vector-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});

const worker = new Worker<IngestionJobPayload>(
  getDocumentIngestionQueueName(),
  async (job) => {
    const repository = new SupabaseDocumentRepository(supabase);

    await runIngestionPipeline(job.data, {
      repository,
      parser: new SourceFileMarkdownParser(),
      embeddings: createEmbeddingClientFromEnv(),
      vectorStore: createPineconeVectorStoreFromEnv()
    });
  },
  {
    connection: getRedisConnection(),
    concurrency: Number(process.env.INGESTION_WORKER_CONCURRENCY || 2)
  }
);

worker.on("completed", (job) => {
  console.log("document ingestion completed", { jobId: job.id, documentId: job.data.documentId });
});

worker.on("failed", (job, error) => {
  console.error("document ingestion failed", {
    jobId: job?.id,
    documentId: job?.data.documentId,
    error: error.message
  });
});
