import { Pinecone } from "@pinecone-database/pinecone";

import type { VectorStore } from "./ingestion";

export function createPineconeVectorStoreFromEnv(): VectorStore {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  if (!apiKey || !indexName) {
    throw new Error("Pinecone API key and index name are required for vector storage.");
  }

  const index = new Pinecone({ apiKey }).index(indexName);

  return {
    async upsert(input) {
      await index.upsert({
        namespace: input.namespace,
        records: input.vectors
      });
    }
  };
}
