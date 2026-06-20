import { MaterialIcon } from "@/components/material-icon";
import { AppShell, SecondaryButton, TopIconButton } from "./app-shell";

const sessions = [
  ["Today", "Q3 Earnings Analysis", "Exploring margin compression in EMEA", true],
  ["Today", "Data Ingestion Pipeline Debug", "Resolving Kafka topic lag on cluster B", false],
  ["Yesterday", "Vendor Contract Review", "Comparing terms vs historical averages", false],
  ["Yesterday", "System Architecture Planning", "Drafting microservices migration strategy", false],
  ["Previous 7 Days", "Customer Sentiment Report", "Aggregating Q2 feedback tickets", false],
  ["Previous 7 Days", "Security Audit Findings", "Reviewing IAM policy gaps", false],
  ["Previous 7 Days", "Marketing Campaign ROI", "Analyzing spend vs acquisition", false]
] as const;

export function ChatPageView() {
  let lastGroup = "";

  return (
    <AppShell active="Workbench">
      <aside className="hidden h-full w-sidebar-width shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest md:flex">
        <div className="flex h-row-height-md items-center justify-between border-b border-outline-variant px-padding-standard">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Sessions</h2>
          <TopIconButton icon="search" label="Search sessions" />
        </div>
        <div className="p-padding-standard">
          <button className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2 font-label-bold text-label-bold text-on-primary transition-colors hover:bg-surface-tint">
            <MaterialIcon size={18}>add</MaterialIcon>
            New Session
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {sessions.map(([group, title, description, selected]) => {
            const showGroup = group !== lastGroup;
            lastGroup = group;
            return (
              <div key={title}>
                {showGroup ? (
                  <div className="mt-2 px-2 py-2 font-label-bold text-label-bold uppercase tracking-wider text-on-surface-variant">
                    {group}
                  </div>
                ) : null}
                <a
                  className={`block rounded border-l-2 px-3 py-2 font-body-sm text-body-sm transition-colors ${
                    selected
                      ? "border-primary bg-surface-variant text-on-surface"
                      : "border-transparent text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                  href="#"
                >
                  <div className="truncate font-medium">{title}</div>
                  <div className="mt-0.5 truncate text-[11px] text-on-surface-variant">{description}</div>
                </a>
              </div>
            );
          })}
        </div>
      </aside>
      <main className="relative flex h-full flex-1 flex-col bg-surface-container-lowest">
        <header className="sticky top-0 z-40 flex h-row-height-md w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-padding-standard">
          <div className="flex items-center gap-2">
            <TopIconButton icon="menu" label="Open menu" />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="font-label-md text-label-md text-on-surface-variant">Model</span>
              <select className="h-8 rounded border border-outline-variant bg-surface px-2 font-body-sm text-body-sm">
                <option>Gemini 1.5 Pro</option>
                <option>Gemini 1.5 Flash</option>
                <option>Mnemosyne Internal</option>
              </select>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="font-label-md text-label-md text-on-surface-variant">Reasoning</span>
              <div className="flex overflow-hidden rounded border border-outline-variant">
                {["Fast", "Deep", "Extensive"].map((level) => (
                  <button
                    className={`h-8 px-3 font-label-md text-label-md ${
                      level === "Deep" ? "bg-primary text-on-primary" : "bg-surface text-on-surface-variant"
                    }`}
                    key={level}
                    type="button"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TopIconButton icon="download" label="Download session" />
            <TopIconButton icon="delete_sweep" label="Clear session" />
            <TopIconButton icon="info" label="Session info" />
          </div>
        </header>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="rounded border border-outline-variant bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface-variant">
            Session initialized with enterprise context scope.
          </div>
          <section className="ml-auto max-w-3xl rounded border border-outline-variant bg-surface-container-low p-4">
            <p>
              Can you analyze the Q3 earnings report for the EMEA region and break down the primary factors contributing
              to the margin compression? Please cross-reference this with the operational logs from the Frankfurt
              distribution center during that same period.
            </p>
            <div className="mt-3 text-right font-body-sm text-body-sm text-on-surface-variant">10:42 AM • User</div>
          </section>
          <section className="max-w-5xl">
            <div className="mb-3 flex items-center gap-2 font-headline-sm text-headline-sm">
              <MaterialIcon className="text-primary">memory</MaterialIcon>
              Mnemosyne Assistant
              <span className="font-body-sm text-body-sm text-on-surface-variant">10:43 AM</span>
            </div>
            <div className="mb-4 rounded border border-dashed border-outline-variant bg-surface-container-low p-4">
              <div className="mb-3 flex items-center gap-2 font-headline-sm text-headline-sm">
                <MaterialIcon className="text-primary">psychology</MaterialIcon>
                Reasoning Process (4.2s)
              </div>
              <div className="space-y-3 font-mono-code text-mono-code text-on-surface">
                <div className="flex gap-2">
                  <MaterialIcon className="text-primary" size={18}>search</MaterialIcon>
                  <div>
                    <strong>Tool Call:</strong> SearchDocuments
                    <br />
                    Query: &quot;Q3 earnings report EMEA margin compression&quot;
                    <br />✓ Found 3 relevant documents
                  </div>
                </div>
                <div className="flex gap-2">
                  <MaterialIcon className="text-primary" size={18}>manage_search</MaterialIcon>
                  <div>
                    <strong>Tool Call:</strong> QueryOperationalLogs
                    <br />
                    Parameters: {`{ location: "Frankfurt DC", timeframe: "Q3", metrics: ["downtime", "throughput"] }`}
                    <br />✓ Retrieved 4,201 log entries. Aggregating...
                  </div>
                </div>
                <div className="flex gap-2">
                  <MaterialIcon className="text-primary" size={18}>lightbulb</MaterialIcon>
                  <p>
                    Synthesizing data. I see a correlation between the logistics cost spike in the earnings report and a
                    14% increase in unscheduled maintenance events at the Frankfurt DC.
                  </p>
                </div>
              </div>
            </div>
            <p className="mb-4">
              Based on the analysis of the Q3 earnings report and cross-referencing with the Frankfurt distribution
              center operational logs, the margin compression in EMEA (down 2.4% year-over-year) is primarily driven by
              three interacting factors:
            </p>
            <div className="overflow-hidden rounded border border-outline-variant">
              <table className="w-full border-collapse text-left font-body-sm text-body-sm">
                <thead className="bg-surface-container-low font-label-bold text-label-bold text-on-surface-variant">
                  <tr>
                    <th className="border-b border-outline-variant p-3">Primary Factor</th>
                    <th className="border-b border-outline-variant p-3">Analysis & Operational Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Logistics Overhead", "A 14% increase in unscheduled downtime at the Frankfurt DC led to reliance on expedited 3PL routing to meet SLAs."],
                    ["Energy Tariffs", "Utility costs across the DACH region spiked. Spot-market electricity purchases during peak operational hours increased facility OpEx by 8%."],
                    ["Labor Utilization", "Overtime utilization increased by 22% compared to Q2, directly impacting unit economics for the region."]
                  ].map(([factor, analysis]) => (
                    <tr className="border-b border-outline-variant last:border-b-0" key={factor}>
                      <td className="p-3 font-medium">{factor}</td>
                      <td className="p-3">{analysis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <SecondaryButton icon="build">View Maintenance Logs</SecondaryButton>
              <SecondaryButton icon="request_quote">3PL Cost Breakdown</SecondaryButton>
            </div>
          </section>
        </div>
        <footer className="border-t border-outline-variant bg-surface-container-lowest p-4">
          <div className="mx-auto flex max-w-5xl items-center gap-2 rounded border border-outline-variant bg-surface px-3 py-2">
            <MaterialIcon className="text-on-surface-variant">database</MaterialIcon>
            <span className="whitespace-nowrap font-label-md text-label-md text-on-surface-variant">Context: Enterprise All</span>
            <input
              aria-label="Message composer"
              className="h-9 flex-1 border-0 bg-transparent px-2 outline-none"
              placeholder="Mnemosyne Assistant is thinking..."
            />
            <TopIconButton icon="attach_file" label="Attach file" />
            <TopIconButton icon="source" label="Source controls" />
            <TopIconButton icon="code" label="Code controls" />
            <button aria-label="Send message" className="text-primary" type="button">
              <MaterialIcon>send</MaterialIcon>
            </button>
          </div>
          <p className="mt-2 text-center font-body-sm text-body-sm text-on-surface-variant">
            Mnemosyne can make mistakes. Verify critical operational data.
          </p>
        </footer>
      </main>
    </AppShell>
  );
}
