import { describe, expect, it, vi } from "vitest";

import { handleDocumentUpload } from "@/lib/documents/upload-api";

function file(name: string, type: string, size = 128) {
  return new File([new Uint8Array(size)], name, { type });
}

function formDataWithUpload(upload: File) {
  const formData = new FormData();
  formData.set("file", upload);
  return formData;
}

describe("document upload API service", () => {
  it("rejects unauthenticated uploads", async () => {
    const result = await handleDocumentUpload({
      formData: formDataWithUpload(file("source.pdf", "application/pdf")),
      user: null,
      repository: {} as never,
      queue: {} as never
    });

    expect(result).toEqual({
      status: 401,
      body: { error: "Authentication required." }
    });
  });

  it("rejects unsupported file types before storage writes", async () => {
    const repository = {
      uploadSourceFile: vi.fn()
    };

    const result = await handleDocumentUpload({
      formData: formDataWithUpload(file("notes.txt", "text/plain")),
      user: { id: "user-1" },
      repository: repository as never,
      queue: {} as never
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Only PDF, DOCX, PPTX, and HTML files are supported.");
    expect(repository.uploadSourceFile).not.toHaveBeenCalled();
  });

  it("stores allowed files in tenant-scoped paths and enqueues ingestion", async () => {
    const repository = {
      createDocumentRecord: vi.fn().mockResolvedValue({ id: "doc-1" }),
      createDocumentJob: vi.fn().mockResolvedValue({ id: "job-1" }),
      uploadSourceFile: vi.fn().mockResolvedValue({ path: "private/user-1/doc-1/source.pdf" }),
      markJobQueued: vi.fn().mockResolvedValue(undefined),
      markJobFailed: vi.fn().mockResolvedValue(undefined)
    };
    const queue = {
      enqueueIngestion: vi.fn().mockResolvedValue({ id: "bull-job-1" })
    };

    const result = await handleDocumentUpload({
      formData: formDataWithUpload(file("source.pdf", "application/pdf")),
      user: { id: "user-1" },
      repository: repository as never,
      queue: queue as never
    });

    expect(result).toEqual({
      status: 202,
      body: { document_id: "doc-1", job_id: "job-1" }
    });
    expect(repository.uploadSourceFile).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        documentId: "doc-1",
        storagePath: "private/user-1/doc-1/source.pdf"
      })
    );
    expect(queue.enqueueIngestion).toHaveBeenCalledWith({
      userId: "user-1",
      documentId: "doc-1",
      jobId: "job-1",
      storagePath: "private/user-1/doc-1/source.pdf",
      filename: "source.pdf",
      mimeType: "application/pdf"
    });
    expect(repository.markJobQueued).toHaveBeenCalledWith("job-1");
  });

  it("marks persisted records failed if queue enqueue fails", async () => {
    const repository = {
      createDocumentRecord: vi.fn().mockResolvedValue({ id: "doc-1" }),
      createDocumentJob: vi.fn().mockResolvedValue({ id: "job-1" }),
      uploadSourceFile: vi.fn().mockResolvedValue({ path: "private/user-1/doc-1/source.pdf" }),
      markJobQueued: vi.fn(),
      markJobFailed: vi.fn().mockResolvedValue(undefined)
    };
    const queue = {
      enqueueIngestion: vi.fn().mockRejectedValue(new Error("Redis unavailable"))
    };

    const result = await handleDocumentUpload({
      formData: formDataWithUpload(file("source.pdf", "application/pdf")),
      user: { id: "user-1" },
      repository: repository as never,
      queue: queue as never
    });

    expect(result.status).toBe(503);
    expect(result.body.error).toBe("Upload saved, but ingestion could not be queued.");
    expect(repository.markJobFailed).toHaveBeenCalledWith(
      "job-1",
      "Ingestion queue is unavailable. Try again shortly."
    );
  });
});
