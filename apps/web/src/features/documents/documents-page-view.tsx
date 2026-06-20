import { MaterialIcon } from "@/components/material-icon";
import { AppShell, PrimaryButton, StatusBadge, TopIconButton } from "@/features/app/app-shell";

export type DocumentListItem = {
  id: string;
  filename: string;
  fileType: string;
  uploadedAt: string;
  status: string;
  progressPercentage: number;
};

const fallbackDocuments: DocumentListItem[] = [
  {
    id: "mock-1",
    filename: "Q3_Financial_Review_vFINAL.pdf",
    fileType: "PDF",
    uploadedAt: "2023-10-27 14:32:01",
    status: "Processing",
    progressPercentage: 65
  },
  {
    id: "mock-2",
    filename: "Engineering_Architecture_Specs_2024.docx",
    fileType: "DOCX",
    uploadedAt: "2023-10-27 09:15:44",
    status: "Complete",
    progressPercentage: 100
  },
  {
    id: "mock-3",
    filename: "User_Telemetry_Export_Q2.csv",
    fileType: "CSV",
    uploadedAt: "2023-10-27 15:01:22",
    status: "Queued",
    progressPercentage: 0
  },
  {
    id: "mock-4",
    filename: "Legacy_System_Dump_Corrupted.txt",
    fileType: "TXT",
    uploadedAt: "2023-10-26 18:45:10",
    status: "Failed",
    progressPercentage: 15
  },
  {
    id: "mock-5",
    filename: "Onboarding_Guidelines_HR.pdf",
    fileType: "PDF",
    uploadedAt: "2023-10-26 11:20:05",
    status: "Complete",
    progressPercentage: 100
  }
];

export function DocumentsPageView({ documents = fallbackDocuments }: { documents?: DocumentListItem[] }) {
  return (
    <AppShell active="Ingestion">
      <main className="flex h-full flex-1 flex-col bg-surface-container-lowest">
        <header className="flex h-row-height-md items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-padding-standard">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-headline-sm text-headline-sm text-on-primary">
              M
            </div>
            <nav className="hidden items-center gap-6 font-label-md text-label-md text-on-surface-variant md:flex">
              <span>Workbench</span>
              <span>Graph</span>
              <span className="text-primary">Ingestion</span>
              <span>Logs</span>
              <span>Settings</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <TopIconButton icon="notifications" label="Notifications" />
            <TopIconButton icon="help_outline" label="Help" />
            <button className="h-8 rounded border border-outline-variant px-3 font-label-bold text-label-bold">Save</button>
            <button className="h-8 rounded bg-primary px-3 font-label-bold text-label-bold text-on-primary">Deploy</button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">Documents Management</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Monitor ingestion pipelines and operational corpus integrity.
              </p>
            </div>
            <PrimaryButton icon="upload">Upload Document</PrimaryButton>
          </div>
          <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
            <table className="w-full border-collapse text-left">
              <thead className="bg-surface-container-low font-label-bold text-label-bold text-on-surface-variant">
                <tr>
                  {["Document Name", "Type", "Upload Date", "Ingestion Status", "Progress"].map((heading) => (
                    <th className="h-row-height-sm border-b border-outline-variant px-4" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {documents.map((document) => {
                  const tone = getStatusTone(document.status);
                  const icon = tone === "failed" ? "error" : document.fileType === "CSV" ? "grid_on" : "description";
                  const progress = `${document.progressPercentage}%`;

                  return (
                  <tr className="h-row-height-md border-b border-outline-variant last:border-b-0" key={document.id}>
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <MaterialIcon className={tone === "failed" ? "text-error" : "text-on-surface-variant"} size={20}>
                          {icon}
                        </MaterialIcon>
                        <span>{document.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 text-on-surface-variant">{document.fileType}</td>
                    <td className="px-4 text-on-surface-variant">{document.uploadedAt}</td>
                    <td className="px-4">
                      <StatusBadge tone={tone}>{document.status}</StatusBadge>
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-container-high">
                          <div className="h-full rounded-full bg-primary" style={{ width: progress }} />
                        </div>
                        <span className="font-label-md text-label-md text-on-surface-variant">{progress}</span>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex h-row-height-md items-center justify-between border-t border-outline-variant px-4 font-body-sm text-body-sm text-on-surface-variant">
              <span>Showing 1-5 of 124 documents</span>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 rounded border border-outline-variant px-2 py-1">
                  <MaterialIcon size={16}>chevron_left</MaterialIcon>
                  Prev
                </button>
                <button className="flex items-center gap-1 rounded border border-outline-variant px-2 py-1">
                  Next
                  <MaterialIcon size={16}>chevron_right</MaterialIcon>
                </button>
              </div>
            </div>
          </section>
          <aside className="mt-6 rounded border border-outline-variant bg-surface-container-low p-4">
            <h2 className="mb-3 flex items-center gap-2 font-headline-sm text-headline-sm">
              <MaterialIcon className="text-primary">autorenew</MaterialIcon>
              Ingestion Engine Activity
            </h2>
            <pre className="whitespace-pre-wrap font-mono-code text-mono-code text-on-surface-variant">{`> Running OCR pipeline on Q3_Financial_Review_vFINAL.pdf...
> Extracting metadata and named entities... [65%]
> Validating against corpus schema constraints... Pending`}</pre>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("fail")) {
    return "failed";
  }
  if (normalized.includes("queued") || normalized.includes("upload")) {
    return "queued";
  }
  if (normalized.includes("complete") || normalized.includes("stored")) {
    return "success";
  }
  return "processing";
}
