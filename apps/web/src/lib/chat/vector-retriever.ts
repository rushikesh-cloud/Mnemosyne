import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

export function createQueryEmbeddingClientFromEnv() {
  return {
    async embedQuery(query: string) {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("Google API key is required for RAG retrieval.");
      }

      const modelName = process.env.MNEMOSYNE_EMBEDDING_MODEL || "text-embedding-004";
      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName });
      const result = await model.embedContent(query);
      return result.embedding.values;
    }
  };
}

export function createQueryVectorStoreFromEnv() {
  return {
    async query(input: { namespace: string; vector: number[]; topK: number }) {
      const apiKey = process.env.PINECONE_API_KEY;
      const indexName = process.env.PINECONE_INDEX_NAME;
      if (!apiKey || !indexName) {
        throw new Error("Pinecone API key and index name are required for RAG retrieval.");
      }

      const index = new Pinecone({ apiKey }).index(indexName);
      const response = await index.query({
        namespace: input.namespace,
        vector: input.vector,
        topK: input.topK,
        includeMetadata: true
      });

      return response.matches.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata as {
          document_id?: string;
          chunk_id?: string;
          chunk_index?: number;
          filename?: string;
          text?: string;
        }
      }));
    }
  };
}
