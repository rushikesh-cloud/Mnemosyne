import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DocumentDetailPageView } from "@/features/documents/document-detail-page-view";
import { DocumentsPageView } from "@/features/documents/documents-page-view";

describe("document management data views", () => {
  it("renders tenant-scoped documents and upload progress from data props", () => {
    render(
      <DocumentsPageView
        documents={[
          {
            id: "doc-1",
            filename: "Tenant_Source.pdf",
            fileType: "PDF",
            uploadedAt: "2026-06-20 10:01",
            status: "PROCESSING",
            progressPercentage: 55
          }
        ]}
      />
    );

    expect(screen.getByText("Tenant_Source.pdf")).toBeInTheDocument();
    expect(screen.getByText("PROCESSING")).toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
    expect(screen.queryByText("Q3_Financial_Review_vFINAL.pdf")).not.toBeInTheDocument();
  });

  it("filters displayed chunks without mutating parsed Markdown", () => {
    render(
      <DocumentDetailPageView
        document={{
          id: "doc-1",
          filename: "Tenant_Source.pdf",
          markdownContent: "# Tenant Source\n\nAlpha roadmap\n\nBeta incident notes",
          fileSizeLabel: "2 KB",
          uploadedAt: "2026-06-20 10:01",
          status: "STORED"
        }}
        chunks={[
          { id: "chunk-1", chunkIndex: 0, chunkText: "Alpha roadmap" },
          { id: "chunk-2", chunkIndex: 1, chunkText: "Beta incident notes" }
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText("Search chunks"), { target: { value: "incident" } });

    const chunkPanel = screen.getByRole("complementary", { name: "Searchable Chunks" });
    expect(within(chunkPanel).queryByText("Alpha roadmap")).not.toBeInTheDocument();
    expect(within(chunkPanel).getByText("Beta incident notes")).toBeInTheDocument();
    expect(screen.getByText("Alpha roadmap")).toBeInTheDocument();
  });
});
