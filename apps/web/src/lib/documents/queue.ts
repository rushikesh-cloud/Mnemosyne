import { Queue } from "bullmq";

import type { IngestionJobPayload } from "./ingestion";

const queueName = "document-ingestion";

export type DocumentIngestionQueue = {
  enqueueIngestion(payload: IngestionJobPayload): Promise<{ id: string }>;
};

export function createDocumentIngestionQueue(): DocumentIngestionQueue {
  const connection = getRedisConnection();
  const queue = new Queue<IngestionJobPayload>(queueName, { connection });

  return {
    async enqueueIngestion(payload) {
      const job = await queue.add("ingest-document", payload, {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000
        },
        removeOnComplete: 100,
        removeOnFail: 500
      });

      return { id: String(job.id) };
    }
  };
}

export function getDocumentIngestionQueueName() {
  return queueName;
}

export function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required to enqueue document ingestion.");
  }

  return {
    url,
    maxRetriesPerRequest: null
  };
}
