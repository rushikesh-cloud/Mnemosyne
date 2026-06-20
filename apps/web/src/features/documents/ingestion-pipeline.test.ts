import { describe, expect, it, vi } from "vitest";

import {
  chunkMarkdown,
  createTenantStoragePath,
  runIngestionPipeline,
  validateUploadFile
} from "@/lib/documents/ingestion";

describe("document ingestion primitives", () => {
  it("validates supported upload extensions and MIME types", () => {
    expect(validateUploadFile({ name: "briefing.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1024 })).toEqual({
      ok: true,
      extension: "docx"
    });

    expect(validateUploadFile({ name: "briefing.exe", type: "application/octet-stream", size: 1024 })).toEqual({
      ok: false,
      error: "Only PDF, DOCX, PPTX, and HTML files are supported."
    });
  });

  it("creates tenant-scoped storage paths without trusting filenames as path segments", () => {
    expect(createTenantStoragePath("user-1", "doc-1", "../Board Deck.HTML")).toBe(
      "private/user-1/doc-1/Board_Deck.HTML"
    );
  });

  it("chunks markdown in stable order and rejects empty content", () => {
    const chunks = chunkMarkdown(["# Title", "First paragraph with enough detail.", "Second paragraph."].join("\n\n"), {
      maxCharacters: 42,
      overlapCharacters: 8
    });

    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual([0, 1]);
    expect(chunks[0]?.chunkText).toContain("# Title");
    expect(() => chunkMarkdown("   ")).toThrow("Parsed Markdown is empty.");
  });
});

describe("ingestion pipeline", () => {
  it("updates progress, stores chunks, and upserts vectors to the user namespace", async () => {
    const repository = {
      updateJobProgress: vi.fn().mockResolvedValue(undefined),
      downloadSourceFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      saveParsedMarkdown: vi.fn().mockResolvedValue(undefined),
      replaceDocumentChunks: vi.fn().mockResolvedValue([
        { id: "chunk-1", chunkIndex: 0, chunkText: "Alpha markdown section" },
        { id: "chunk-2", chunkIndex: 1, chunkText: "Beta markdown section" }
      ]),
      markDocumentComplete: vi.fn().mockResolvedValue(undefined),
      markDocumentFailed: vi.fn().mockResolvedValue(undefined)
    };
    const parser = {
      parseToMarkdown: vi.fn().mockResolvedValue("Alpha markdown section\n\nBeta markdown section")
    };
    const embeddings = {
      embedDocuments: vi.fn().mockResolvedValue([
        [0.1, 0.2],
        [0.3, 0.4]
      ])
    };
    const vectorStore = {
      upsert: vi.fn().mockResolvedValue(undefined)
    };

    await runIngestionPipeline(
      {
        userId: "user-1",
        documentId: "doc-1",
        jobId: "job-1",
        storagePath: "private/user-1/doc-1/source.pdf",
        filename: "source.pdf",
        mimeType: "application/pdf"
      },
      {
        repository,
        parser,
        embeddings,
        vectorStore
      }
    );

    expect(repository.updateJobProgress).toHaveBeenNthCalledWith(1, "job-1", {
      status: "PARSING_STARTED",
      progressPercentage: 10,
      currentStepDetails: "Parsing source.pdf into Markdown."
    });
    expect(repository.saveParsedMarkdown).toHaveBeenCalledWith("doc-1", "Alpha markdown section\n\nBeta markdown section");
    expect(repository.replaceDocumentChunks).toHaveBeenCalledWith(
      "doc-1",
      expect.arrayContaining([
        expect.objectContaining({ chunkIndex: 0, chunkText: expect.stringContaining("Alpha") })
      ])
    );
    expect(vectorStore.upsert).toHaveBeenCalledWith({
      namespace: "user-1",
      vectors: [
        {
          id: "chunk-1",
          values: [0.1, 0.2],
          metadata: {
            user_id: "user-1",
            document_id: "doc-1",
            chunk_id: "chunk-1",
            chunk_index: 0,
            filename: "source.pdf"
          }
        },
        {
          id: "chunk-2",
          values: [0.3, 0.4],
          metadata: {
            user_id: "user-1",
            document_id: "doc-1",
            chunk_id: "chunk-2",
            chunk_index: 1,
            filename: "source.pdf"
          }
        }
      ]
    });
    expect(repository.markDocumentComplete).toHaveBeenCalledWith("doc-1", "job-1");
  });

  it("records controlled failures without marking documents complete", async () => {
    const repository = {
      updateJobProgress: vi.fn().mockResolvedValue(undefined),
      downloadSourceFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      saveParsedMarkdown: vi.fn(),
      replaceDocumentChunks: vi.fn(),
      markDocumentComplete: vi.fn(),
      markDocumentFailed: vi.fn().mockResolvedValue(undefined)
    };

    await expect(
      runIngestionPipeline(
        {
          userId: "user-1",
          documentId: "doc-1",
          jobId: "job-1",
          storagePath: "private/user-1/doc-1/source.pdf",
          filename: "source.pdf",
          mimeType: "application/pdf"
        },
        {
          repository,
          parser: { parseToMarkdown: vi.fn().mockResolvedValue("") },
          embeddings: { embedDocuments: vi.fn() },
          vectorStore: { upsert: vi.fn() }
        }
      )
    ).rejects.toThrow("Parsed Markdown is empty.");

    expect(repository.markDocumentFailed).toHaveBeenCalledWith(
      "doc-1",
      "job-1",
      "Parsed Markdown is empty."
    );
    expect(repository.markDocumentComplete).not.toHaveBeenCalled();
  });
});
