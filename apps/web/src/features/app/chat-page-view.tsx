"use client";

import { useMemo, useState } from "react";

import { MaterialIcon } from "@/components/material-icon";
import { AppShell, SecondaryButton, TopIconButton } from "./app-shell";

export type ChatSessionView = {
  id: string;
  title: string;
  summary: string;
  updatedAt: string;
  selectedModel: string;
  thinkingLevel: "fast" | "deep" | "extensive";
};

export type ChatMessageView = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: string;
  events?: Array<
    | { type: "thinking"; message: string }
    | { type: "tool_call"; name: string; detail: string; status: "started" | "completed" | "failed" }
  >;
};

const fixtureSessions: ChatSessionView[] = [
  {
    id: "fixture-1",
    title: "Q3 Earnings Analysis",
    summary: "Exploring margin compression in EMEA",
    updatedAt: "Today",
    selectedModel: "gemini-1.5-pro",
    thinkingLevel: "deep"
  },
  {
    id: "fixture-2",
    title: "Data Ingestion Pipeline Debug",
    summary: "Resolving Kafka topic lag on cluster B",
    updatedAt: "Today",
    selectedModel: "gemini-1.5-flash",
    thinkingLevel: "fast"
  },
  {
    id: "fixture-3",
    title: "Vendor Contract Review",
    summary: "Comparing terms vs historical averages",
    updatedAt: "Yesterday",
    selectedModel: "gemini-1.5-pro",
    thinkingLevel: "deep"
  },
  {
    id: "fixture-4",
    title: "System Architecture Planning",
    summary: "Drafting microservices migration strategy",
    updatedAt: "Yesterday",
    selectedModel: "gemini-1.5-pro",
    thinkingLevel: "extensive"
  },
  {
    id: "fixture-5",
    title: "Customer Sentiment Report",
    summary: "Aggregating Q2 feedback tickets",
    updatedAt: "Previous 7 Days",
    selectedModel: "gemini-1.5-flash",
    thinkingLevel: "fast"
  }
];

const fixtureMessages: ChatMessageView[] = [
  {
    id: "fixture-message-1",
    role: "user",
    content:
      "Can you analyze the Q3 earnings report for the EMEA region and break down the primary factors contributing to the margin compression? Please cross-reference this with the operational logs from the Frankfurt distribution center during that same period.",
    createdAt: "10:42 AM"
  },
  {
    id: "fixture-message-2",
    role: "assistant",
    content:
      "Based on the analysis of the Q3 earnings report and cross-referencing with the Frankfurt distribution center operational logs, the margin compression in EMEA (down 2.4% year-over-year) is primarily driven by logistics overhead, energy tariffs, and labor utilization.",
    createdAt: "10:43 AM",
    events: [
      {
        type: "tool_call",
        name: "SearchDocuments",
        detail: 'Query: "Q3 earnings report EMEA margin compression" - found 3 relevant documents',
        status: "completed"
      },
      {
        type: "tool_call",
        name: "QueryOperationalLogs",
        detail: 'Parameters: { location: "Frankfurt DC", timeframe: "Q3" } - retrieved 4,201 log entries',
        status: "completed"
      },
      {
        type: "thinking",
        message:
          "Synthesizing data. I see a correlation between the logistics cost spike and a 14% increase in unscheduled maintenance events."
      }
    ]
  }
];

type ChatPageViewProps = {
  sessions?: ChatSessionView[];
  activeSessionId?: string;
  messages?: ChatMessageView[];
};

export function ChatPageView({
  sessions = fixtureSessions,
  activeSessionId,
  messages = fixtureMessages
}: ChatPageViewProps) {
  const [localSessions, setLocalSessions] = useState(sessions);
  const selectedSessionId = activeSessionId || localSessions[0]?.id;
  const selectedSession = localSessions.find((session) => session.id === selectedSessionId) || localSessions[0];
  const visibleMessages = selectedSession ? messages : [];
  const hasProvidedSessions = sessions !== fixtureSessions;

  const groupedSessions = useMemo(
    () =>
      localSessions.reduce<Array<{ group: string; sessions: ChatSessionView[] }>>((groups, session) => {
        const existing = groups.find((group) => group.group === session.updatedAt);
        if (existing) {
          existing.sessions.push(session);
        } else {
          groups.push({ group: session.updatedAt, sessions: [session] });
        }
        return groups;
      }, []),
    [localSessions]
  );

  function handleNewSession() {
    const session: ChatSessionView = {
      id: `local-${Date.now()}`,
      title: "Untitled analysis session",
      summary: "Ready for a tenant-scoped question",
      updatedAt: "Today",
      selectedModel: "gemini-1.5-flash",
      thinkingLevel: "fast"
    };
    setLocalSessions((current) => [session, ...current]);
  }

  return (
    <AppShell active="Workbench">
      <aside className="hidden h-full w-sidebar-width shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest md:flex">
        <div className="flex h-row-height-md items-center justify-between border-b border-outline-variant px-padding-standard">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Sessions</h2>
          <TopIconButton icon="search" label="Search sessions" />
        </div>
        <div className="p-padding-standard">
          <button
            className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2 font-label-bold text-label-bold text-on-primary transition-colors hover:bg-surface-tint"
            onClick={handleNewSession}
            type="button"
          >
            <MaterialIcon size={18}>add</MaterialIcon>
            New Session
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {localSessions.length === 0 ? (
            <div className="rounded border border-dashed border-outline-variant p-3 font-body-sm text-body-sm text-on-surface-variant">
              <div className="font-medium text-on-surface">No chat sessions yet</div>
              <div className="mt-1">Create a session to start a tenant-scoped analysis.</div>
            </div>
          ) : null}
          {groupedSessions.map((group) => (
            <div key={group.group}>
              <div className="mt-2 px-2 py-2 font-label-bold text-label-bold uppercase tracking-wider text-on-surface-variant">
                {group.group}
              </div>
              {group.sessions.map((session) => {
                const selected = session.id === selectedSessionId;
                return (
                  <a
                  className={`block rounded border-l-2 px-3 py-2 font-body-sm text-body-sm transition-colors ${
                    selected
                      ? "border-primary bg-surface-variant text-on-surface"
                      : "border-transparent text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                  href={`/chat?session=${session.id}`}
                  key={session.id}
                >
                  <div className="truncate font-medium">{session.title}</div>
                  <div className="mt-0.5 truncate text-[11px] text-on-surface-variant">{session.summary}</div>
                </a>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
      <main className="relative flex h-full flex-1 flex-col bg-surface-container-lowest">
        <header className="sticky top-0 z-40 flex h-row-height-md w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-padding-standard">
          <div className="flex items-center gap-2">
            <TopIconButton icon="menu" label="Open menu" />
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-label-md text-label-md text-on-surface-variant">Model</span>
              <select
                aria-label="Session model"
                className="h-8 max-w-[150px] rounded border border-outline-variant bg-surface px-2 font-body-sm text-body-sm sm:max-w-none"
                defaultValue={selectedSession?.selectedModel || "gemini-1.5-pro"}
              >
                <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              </select>
              <span className="hidden">Gemini 1.5 Pro</span>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="font-label-md text-label-md text-on-surface-variant">Reasoning</span>
              <div className="flex overflow-hidden rounded border border-outline-variant">
                {["fast", "deep", "extensive"].map((level) => (
                  <button
                    aria-label={`${level[0].toUpperCase()}${level.slice(1)} thinking level`}
                    aria-pressed={selectedSession?.thinkingLevel === level}
                    className={`h-8 px-3 font-label-md text-label-md ${
                      selectedSession?.thinkingLevel === level
                        ? "bg-primary text-on-primary"
                        : "bg-surface text-on-surface-variant"
                    }`}
                    key={level}
                    type="button"
                  >
                    {level[0].toUpperCase()}{level.slice(1)}
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
          {visibleMessages.length === 0 && hasProvidedSessions ? (
            <section className="max-w-3xl rounded border border-dashed border-outline-variant bg-surface-container-low p-5">
              <h2 className="font-headline-md text-headline-md">Ask a question to start analysis</h2>
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                Mnemosyne will use tenant-scoped documents, configured MCP tools, and the selected Gemini model.
              </p>
            </section>
          ) : null}
          {visibleMessages.map((message) =>
            message.role === "user" ? (
              <section className="ml-auto max-w-3xl rounded border border-outline-variant bg-surface-container-low p-4" key={message.id}>
                <p>{message.content}</p>
                <div className="mt-3 text-right font-body-sm text-body-sm text-on-surface-variant">
                  {message.createdAt} • User
                </div>
              </section>
            ) : (
              <section className="max-w-5xl" key={message.id}>
                <div className="mb-3 flex items-center gap-2 font-headline-sm text-headline-sm">
                  <MaterialIcon className="text-primary">memory</MaterialIcon>
                  Mnemosyne Assistant
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{message.createdAt}</span>
                </div>
                {message.events?.length ? (
                  <div
                    aria-label="Assistant reasoning and tool activity"
                    className="mb-4 rounded border border-dashed border-outline-variant bg-surface-container-low p-4"
                    role="region"
                  >
                    <div className="mb-3 flex items-center gap-2 font-headline-sm text-headline-sm">
                      <MaterialIcon className="text-primary">psychology</MaterialIcon>
                      Reasoning Process (4.2s)
                    </div>
                    <div className="space-y-3 font-mono-code text-mono-code text-on-surface">
                      {message.events.map((event, index) =>
                        event.type === "tool_call" ? (
                          <div className="flex gap-2" key={`${event.type}-${index}`}>
                            <MaterialIcon className="text-primary" size={18}>search</MaterialIcon>
                            <div>
                              <strong>Tool Call:</strong> <span>{event.name}</span>
                              <br />
                              {event.detail}
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2" key={`${event.type}-${index}`}>
                            <MaterialIcon className="text-primary" size={18}>lightbulb</MaterialIcon>
                            <p>{event.message}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : null}
                <p className="mb-4">{message.content}</p>
                {message.id === "fixture-message-2" ? (
                  <>
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
                            ["Logistics Overhead", "A 14% increase in unscheduled downtime led to expedited 3PL routing."],
                            ["Energy Tariffs", "Spot-market electricity purchases increased facility OpEx by 8%."],
                            ["Labor Utilization", "Overtime utilization increased by 22% compared to Q2."]
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
                  </>
                ) : null}
              </section>
            )
          )}
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
