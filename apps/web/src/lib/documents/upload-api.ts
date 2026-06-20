import { createTenantStoragePath, validateUploadFile, type IngestionJobPayload } from "./ingestion";

type AuthenticatedUser = {
  id: string;
};

type UploadRepository = {
  createDocumentRecord(input: {
    userId: string;
    filename: string;
    fileType: string;
    mimeType: string;
    fileSizeBytes: number;
  }): Promise<{ id: string }>;
  createDocumentJob(documentId: string): Promise<{ id: string }>;
  uploadSourceFile(input: {
    userId: string;
    documentId: string;
    storagePath: string;
    file: File;
  }): Promise<{ path: string }>;
  markJobQueued(jobId: string): Promise<void>;
  markJobFailed(jobId: string, reason: string): Promise<void>;
};

type UploadQueue = {
  enqueueIngestion(payload: IngestionJobPayload): Promise<{ id: string }>;
};

export async function handleDocumentUpload(input: {
  formData: FormData;
  user: AuthenticatedUser | null;
  repository: UploadRepository;
  queue: UploadQueue;
}) {
  if (!input.user) {
    return {
      status: 401,
      body: { error: "Authentication required." }
    };
  }

  const upload = input.formData.get("file");
  if (!(upload instanceof File)) {
    return {
      status: 400,
      body: { error: "A document file is required." }
    };
  }

  const validation = validateUploadFile(upload);
  if (!validation.ok) {
    return {
      status: 400,
      body: { error: validation.error }
    };
  }

  const document = await input.repository.createDocumentRecord({
    userId: input.user.id,
    filename: upload.name,
    fileType: validation.extension.toUpperCase(),
    mimeType: upload.type,
    fileSizeBytes: upload.size
  });
  const job = await input.repository.createDocumentJob(document.id);
  const storagePath = createTenantStoragePath(input.user.id, document.id, upload.name);

  const storedFile = await input.repository.uploadSourceFile({
    userId: input.user.id,
    documentId: document.id,
    storagePath,
    file: upload
  });

  try {
    await input.queue.enqueueIngestion({
      userId: input.user.id,
      documentId: document.id,
      jobId: job.id,
      storagePath: storedFile.path,
      filename: upload.name,
      mimeType: upload.type
    });
    await input.repository.markJobQueued(job.id);
  } catch {
    await input.repository.markJobFailed(job.id, "Ingestion queue is unavailable. Try again shortly.");
    return {
      status: 503,
      body: { error: "Upload saved, but ingestion could not be queued." }
    };
  }

  return {
    status: 202,
    body: { document_id: document.id, job_id: job.id }
  };
}
