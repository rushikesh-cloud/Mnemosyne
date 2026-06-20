import { MaterialIcon } from "@/components/material-icon";
import { AppShell, SecondaryButton, StatusBadge } from "@/features/app/app-shell";

const chunks = [
  "This document outlines the financial performance and strategic highlights for the third quarter ending September 30, 2023. We are pleased to report strong revenue growth driven by our enterprise software division.",
  "Total revenue increased by 15% year-over-year to $45.2 million. Operating margin improved to 22%, up from 18% in the previous quarter. Cash flow from operations reached a record $12.5 million.",
  "| Metric | Q3 2023 | Q3 2022 | % Change |\n|---|---|---|---|\n| Active Users | 125,000 | 105,000 | +19.0% |",
  "The increase in ARPU is primarily attributed to successful upsell campaigns and the introduction of the new Advanced Analytics tier in late Q2. We expect this trend to continue."
];

export function DocumentDetailPageView() {
  return (
    <AppShell active="Ingestion">
      <main className="flex h-full flex-1 flex-col bg-surface-container-lowest">
        <header className="flex h-row-height-md items-center justify-between border-b border-outline-variant px-padding-standard">
          <div className="flex items-center gap-3">
            <button aria-label="Back to documents" className="text-on-surface-variant" type="button">
              <MaterialIcon>arrow_back</MaterialIcon>
            </button>
            <h1 className="font-headline-sm text-headline-sm">Q3_Earnings_Report_v2.pdf</h1>
          </div>
          <div className="flex items-center gap-2">
            <SecondaryButton icon="download">Source</SecondaryButton>
            <SecondaryButton icon="delete">Delete</SecondaryButton>
          </div>
        </header>
        <section className="flex h-row-height-md items-center gap-5 border-b border-outline-variant px-padding-standard font-body-sm text-body-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <MaterialIcon size={16}>calendar_today</MaterialIcon>
            Uploaded: Oct 24, 2023 14:32
          </span>
          <span className="flex items-center gap-1">
            <MaterialIcon size={16}>file_present</MaterialIcon>
            4.2 MB
          </span>
          <StatusBadge tone="success">Indexed</StatusBadge>
        </section>
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_400px]">
          <section className="overflow-y-auto border-r border-outline-variant p-6">
            <h2 className="mb-4 font-headline-md text-headline-md">Parsed Markdown</h2>
            <article className="max-w-3xl space-y-4 font-body-md text-body-md">
              <h3 className="font-headline-lg text-headline-lg">Q3 2023 Earnings Report</h3>
              <p>
                This document outlines the financial performance and strategic highlights for the third quarter ending
                September 30, 2023. We are pleased to report strong revenue growth driven by our enterprise software
                division.
              </p>
              <h4 className="font-headline-sm text-headline-sm">Financial Highlights</h4>
              <ul className="list-disc space-y-1 pl-5">
                <li>Total revenue increased by 15% year-over-year to $45.2 million.</li>
                <li>Operating margin improved to 22%, up from 18% in the previous quarter.</li>
                <li>Cash flow from operations reached a record $12.5 million.</li>
              </ul>
              <h4 className="font-headline-sm text-headline-sm">Operational Metrics</h4>
              <table className="w-full border-collapse border border-outline-variant text-left">
                <thead className="bg-surface-container-low font-label-bold text-label-bold">
                  <tr>
                    {["Metric", "Q3 2023", "Q3 2022", "% Change"].map((heading) => (
                      <th className="border border-outline-variant p-2" key={heading}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Active Users", "125,000", "105,000", "+19.0%"],
                    ["Churn Rate", "1.2%", "1.5%", "-0.3%"],
                    ["ARPU", "$350", "$310", "+12.9%"]
                  ].map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => (
                        <td className="border border-outline-variant p-2" key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                The increase in ARPU is primarily attributed to successful upsell campaigns and the introduction of the
                new Advanced Analytics tier in late Q2.
              </p>
            </article>
          </section>
          <aside className="min-h-0 overflow-y-auto bg-surface-container-low p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm">Searchable Chunks</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Total: 42</p>
              </div>
              <button aria-label="Search chunks" className="text-on-surface-variant" type="button">
                <MaterialIcon>search</MaterialIcon>
              </button>
            </div>
            <div className="space-y-3">
              {chunks.map((chunk, index) => (
                <article className="rounded border border-outline-variant bg-surface-container-lowest p-3" key={chunk}>
                  <div className="mb-2 flex items-center justify-between font-label-bold text-label-bold text-on-surface-variant">
                    <span>idx: {String(index + 1).padStart(3, "0")}</span>
                    <MaterialIcon size={16}>content_copy</MaterialIcon>
                  </div>
                  <p className="whitespace-pre-line font-body-sm text-body-sm">{chunk}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
