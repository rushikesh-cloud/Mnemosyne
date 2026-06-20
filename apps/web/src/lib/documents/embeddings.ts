import { GoogleGenerativeAI } from "@google/generative-ai";

import type { EmbeddingClient } from "./ingestion";

export function createEmbeddingClientFromEnv(): EmbeddingClient {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  const modelName = process.env.MNEMOSYNE_EMBEDDING_MODEL || "text-embedding-004";

  if (!apiKey) {
    throw new Error("Google API key is required for document embeddings.");
  }

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName });

  return {
    async embedDocuments(texts) {
      const embeddings = await Promise.all(
        texts.map(async (text) => {
          const result = await model.embedContent(text);
          return result.embedding.values;
        })
      );

      return embeddings;
    }
  };
}
