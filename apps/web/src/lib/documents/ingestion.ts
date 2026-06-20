export type UploadValidation =
  | { ok: true; extension: "pdf" | "docx" | "pptx" | "html" }
  | { ok: false; error: string };

export type IngestionJobPayload = {
  userId: string;
  documentId: string;
  jobId: string;
  storagePath: string;
  filename: string;
  mimeType: string;
};

export type ChunkInput = {
  chunkIndex: number;
  chunkText: string;
  tokenEstimate: number;
};

export type StoredChunk = ChunkInput & {
  id: string;
};

export type IngestionRepository = {
  updateJobProgress(
    jobId: string,
    progress: { status: string; progressPercentage: number; currentStepDetails: string }
  ): Promise<void>;
  downloadSourceFile(storagePath: string): Promise<Uint8Array>;
  saveParsedMarkdown(documentId: string, markdown: string): Promise<void>;
  replaceDocumentChunks(documentId: string, chunks: ChunkInput[]): Promise<StoredChunk[]>;
  markDocumentComplete(documentId: string, jobId: string): Promise<void>;
  markDocumentFailed(documentId: string, jobId: string, reason: string): Promise<void>;
};

export type MarkdownParser = {
  parseToMarkdown(input: { bytes: Uint8Array; filename: string; mimeType: string }): Promise<string>;
};

export type EmbeddingClient = {
  embedDocuments(texts: string[]): Promise<number[][]>;
};

export type VectorStore = {
  upsert(input: {
    namespace: string;
    vectors: Array<{
      id: string;
      values: number[];
      metadata: {
        user_id: string;
        document_id: string;
        chunk_id: string;
        chunk_index: number;
        filename: string;
      };
    }>;
  }): Promise<void>;
};

const maxUploadBytes = 50 * 1024 * 1024;

const allowedTypes = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  html: ["text/html", "application/xhtml+xml"]
} as const;

export function validateUploadFile(file: { name: string; type: string; size: number }): UploadValidation {
  if (file.size > maxUploadBytes) {
    return { ok: false, error: "Files must be 50 MB or smaller." };
  }

  const extension = file.name.toLowerCase().split(".").pop();
  if (!extension || !isAllowedExtension(extension)) {
    return { ok: false, error: "Only PDF, DOCX, PPTX, and HTML files are supported." };
  }

  if (!allowedTypes[extension].includes(file.type as never)) {
    return { ok: false, error: "Only PDF, DOCX, PPTX, and HTML files are supported." };
  }

  return { ok: true, extension };
}

export function createTenantStoragePath(userId: string, documentId: string, filename: string) {
  const sanitizedFilename = filename
    .split(/[\\/]/)
    .pop()
    ?.replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+/, "") || "source";

  return `private/${userId}/${documentId}/${sanitizedFilename}`;
}

export function chunkMarkdown(
  markdown: string,
  options: { maxCharacters?: number; overlapCharacters?: number } = {}
): ChunkInput[] {
  const source = markdown.trim();
  if (!source) {
    throw new Error("Parsed Markdown is empty.");
  }

  const maxCharacters = options.maxCharacters ?? 1200;
  const overlapCharacters = options.overlapCharacters ?? 160;
  const paragraphs = source.split(/\n{2,}/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= maxCharacters) {
      current = next;
      continue;
    }
    if (current) {
      chunks.push(current);
    }
    if (paragraph.length <= maxCharacters) {
      current = paragraph;
      continue;
    }
    for (let start = 0; start < paragraph.length; start += maxCharacters - overlapCharacters) {
      chunks.push(paragraph.slice(start, start + maxCharacters));
    }
    current = "";
  }

  if (current) {
    chunks.push(current);
  }

  const finalChunks =
    chunks.length > 1 && chunks[chunks.length - 1].length < maxCharacters / 2
      ? [...chunks.slice(0, -2), `${chunks[chunks.length - 2]}\n\n${chunks[chunks.length - 1]}`]
      : chunks;

  return finalChunks.map((chunkText, chunkIndex) => ({
    chunkIndex,
    chunkText,
    tokenEstimate: Math.ceil(chunkText.length / 4)
  }));
}

export async function runIngestionPipeline(
  payload: IngestionJobPayload,
  dependencies: {
    repository: IngestionRepository;
    parser: MarkdownParser;
    embeddings: EmbeddingClient;
    vectorStore: VectorStore;
  }
) {
  const { repository, parser, embeddings, vectorStore } = dependencies;

  try {
    await repository.updateJobProgress(payload.jobId, {
      status: "PARSING_STARTED",
      progressPercentage: 10,
      currentStepDetails: `Parsing ${payload.filename} into Markdown.`
    });
    const bytes = await repository.downloadSourceFile(payload.storagePath);
    const markdown = await parser.parseToMarkdown({
      bytes,
      filename: payload.filename,
      mimeType: payload.mimeType
    });
    const chunks = chunkMarkdown(markdown);

    await repository.saveParsedMarkdown(payload.documentId, markdown);
    await repository.updateJobProgress(payload.jobId, {
      status: "CHUNKING_COMPLETE",
      progressPercentage: 45,
      currentStepDetails: `Created ${chunks.length} searchable chunks.`
    });
    const storedChunks = await repository.replaceDocumentChunks(payload.documentId, chunks);

    await repository.updateJobProgress(payload.jobId, {
      status: "EMBEDDING_IN_PROGRESS",
      progressPercentage: 65,
      currentStepDetails: "Generating embeddings for document chunks."
    });
    const vectors = await embeddings.embedDocuments(storedChunks.map((chunk) => chunk.chunkText));

    await repository.updateJobProgress(payload.jobId, {
      status: "STORING_VECTORS",
      progressPercentage: 85,
      currentStepDetails: "Storing vectors in tenant namespace."
    });
    await vectorStore.upsert({
      namespace: payload.userId,
      vectors: storedChunks.map((chunk, index) => ({
        id: chunk.id,
        values: vectors[index] ?? [],
        metadata: {
          user_id: payload.userId,
          document_id: payload.documentId,
          chunk_id: chunk.id,
          chunk_index: chunk.chunkIndex,
          filename: payload.filename
        }
      }))
    });

    await repository.markDocumentComplete(payload.documentId, payload.jobId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion failed.";
    await repository.markDocumentFailed(payload.documentId, payload.jobId, message);
    throw error;
  }
}

function isAllowedExtension(extension: string): extension is keyof typeof allowedTypes {
  return extension === "pdf" || extension === "docx" || extension === "pptx" || extension === "html";
}
