"use client";

import { useMemo, useState } from "react";

import { MaterialIcon } from "@/components/material-icon";
import { AppShell, SecondaryButton, StatusBadge } from "@/features/app/app-shell";

export type DocumentDetail = {
  id: string;
  filename: string;
  markdownContent: string;
  fileSizeLabel: string;
  uploadedAt: string;
  status: string;
};

export type DocumentChunkView = {
  id: string;
  chunkIndex: number;
  chunkText: string;
};

const fallbackDocument: DocumentDetail = {
  id: "mock-detail",
  filename: "Q3_Earnings_Report_v2.pdf",
  markdownContent: [
    "# Q3 2023 Earnings Report",
    "This document outlines the financial performance and strategic highlights for the third quarter ending September 30, 2023. We are pleased to report strong revenue growth driven by our enterprise software division.",
    "## Financial Highlights",
    "- Total revenue increased by 15% year-over-year to $45.2 million.",
    "- Operating margin improved to 22%, up from 18% in the previous quarter.",
    "- Cash flow from operations reached a record $12.5 million.",
    "## Operational Metrics",
    "| Metric | Q3 2023 | Q3 2022 | % Change |",
    "|---|---|---|---|",
    "| Active Users | 125,000 | 105,000 | +19.0% |",
    "| Churn Rate | 1.2% | 1.5% | -0.3% |",
    "| ARPU | $350 | $310 | +12.9% |",
    "The increase in ARPU is primarily attributed to successful upsell campaigns and the introduction of the new Advanced Analytics tier in late Q2."
  ].join("\n\n"),
  fileSizeLabel: "4.2 MB",
  uploadedAt: "Oct 24, 2023 14:32",
  status: "Indexed"
};

const fallbackChunks: DocumentChunkView[] = [
  {
    id: "mock-chunk-1",
    chunkIndex: 0,
    chunkText:
      "This document outlines the financial performance and strategic highlights for the third quarter ending September 30, 2023. We are pleased to report strong revenue growth driven by our enterprise software division."
  },
  {
    id: "mock-chunk-2",
    chunkIndex: 1,
    chunkText:
      "Total revenue increased by 15% year-over-year to $45.2 million. Operating margin improved to 22%, up from 18% in the previous quarter. Cash flow from operations reached a record $12.5 million."
  },
  {
    id: "mock-chunk-3",
    chunkIndex: 2,
    chunkText:
      "| Metric | Q3 2023 | Q3 2022 | % Change |\n|---|---|---|---|\n| Active Users | 125,000 | 105,000 | +19.0% |"
  },
  {
    id: "mock-chunk-4",
    chunkIndex: 3,
    chunkText:
      "The increase in ARPU is primarily attributed to successful upsell campaigns and the introduction of the new Advanced Analytics tier in late Q2. We expect this trend to continue."
  }
];

export function DocumentDetailPageView({
  document = fallbackDocument,
  chunks = fallbackChunks
}: {
  document?: DocumentDetail;
  chunks?: DocumentChunkView[];
}) {
  const [query, setQuery] = useState("");
  const filteredChunks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return chunks;
    }
    return chunks.filter((chunk) => chunk.chunkText.toLowerCase().includes(normalized));
  }, [chunks, query]);

  return (
    <AppShell active="Ingestion">
      <main className="flex h-full flex-1 flex-col bg-surface-container-lowest">
        <header className="flex h-row-height-md items-center justify-between border-b border-outline-variant px-padding-standard">
          <div className="flex items-center gap-3">
            <button aria-label="Back to documents" className="text-on-surface-variant" type="button">
              <MaterialIcon>arrow_back</MaterialIcon>
            </button>
            <h1 className="font-headline-sm text-headline-sm">{document.filename}</h1>
          </div>
          <div className="flex items-center gap-2">
            <SecondaryButton icon="download">Source</SecondaryButton>
            <SecondaryButton icon="delete">Delete</SecondaryButton>
          </div>
        </header>
        <section className="flex h-row-height-md items-center gap-5 border-b border-outline-variant px-padding-standard font-body-sm text-body-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <MaterialIcon size={16}>calendar_today</MaterialIcon>
            Uploaded: {document.uploadedAt}
          </span>
          <span className="flex items-center gap-1">
            <MaterialIcon size={16}>file_present</MaterialIcon>
            {document.fileSizeLabel}
          </span>
          <StatusBadge tone={document.status.toLowerCase().includes("fail") ? "failed" : "success"}>
            {document.status}
          </StatusBadge>
        </section>
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_400px]">
          <section className="overflow-y-auto border-r border-outline-variant p-6">
            <h2 className="mb-4 font-headline-md text-headline-md">Parsed Markdown</h2>
            <article className="max-w-3xl space-y-4 font-body-md text-body-md">
              <MarkdownPreview markdown={document.markdownContent} />
            </article>
          </section>
          <aside aria-label="Searchable Chunks" className="min-h-0 overflow-y-auto bg-surface-container-low p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm">Searchable Chunks</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Total: {chunks.length}</p>
              </div>
            </div>
            <label className="mb-3 block">
              <span className="sr-only">Search chunks</span>
              <input
                aria-label="Search chunks"
                className="h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-sm text-body-sm outline-none focus:border-primary"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search chunks"
                type="search"
                value={query}
              />
            </label>
            <div className="space-y-3">
              {filteredChunks.map((chunk) => (
                <article className="rounded border border-outline-variant bg-surface-container-lowest p-3" key={chunk.id}>
                  <div className="mb-2 flex items-center justify-between font-label-bold text-label-bold text-on-surface-variant">
                    <span>idx: {String(chunk.chunkIndex + 1).padStart(3, "0")}</span>
                    <MaterialIcon size={16}>content_copy</MaterialIcon>
                  </div>
                  <p className="whitespace-pre-line font-body-sm text-body-sm">{chunk.chunkText}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  return (
    <>
      {markdown.split(/\n{2,}/).map((block) => {
        if (block.startsWith("# ")) {
          return <h3 className="font-headline-lg text-headline-lg" key={block}>{block.slice(2)}</h3>;
        }
        if (block.startsWith("## ")) {
          return <h4 className="font-headline-sm text-headline-sm" key={block}>{block.slice(3)}</h4>;
        }
        if (block.startsWith("- ")) {
          return (
            <ul className="list-disc space-y-1 pl-5" key={block}>
              {block.split("\n").map((item) => (
                <li key={item}>{item.replace(/^- /, "")}</li>
              ))}
            </ul>
          );
        }
        if (block.startsWith("|")) {
          return <pre className="overflow-x-auto rounded border border-outline-variant bg-surface-container-low p-3 font-mono-code text-mono-code" key={block}>{block}</pre>;
        }
        return <p key={block}>{block}</p>;
      })}
    </>
  );
}
