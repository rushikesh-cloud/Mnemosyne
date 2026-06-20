import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatPageView } from "@/features/app/chat-page-view";

describe("chat data view", () => {
  it("renders persisted sessions, selected messages, and transparent event logs from props", () => {
    render(
      <ChatPageView
        sessions={[
          {
            id: "session-1",
            title: "Tenant Q3 Review",
            summary: "Margin analysis",
            updatedAt: "2026-06-20 10:22",
            selectedModel: "gemini-1.5-pro",
            thinkingLevel: "deep"
          }
        ]}
        activeSessionId="session-1"
        messages={[
          {
            id: "msg-1",
            role: "user",
            content: "Why did margin compress?",
            createdAt: "10:22"
          },
          {
            id: "msg-2",
            role: "assistant",
            content: "Logistics overhead was the primary driver.",
            createdAt: "10:23",
            events: [
              { type: "thinking", message: "Inspecting tenant documents." },
              { type: "tool_call", name: "SearchDocuments", detail: "Q3 margin compression", status: "completed" }
            ]
          }
        ]}
      />
    );

    expect(screen.getByText("Tenant Q3 Review")).toBeInTheDocument();
    expect(screen.getByDisplayValue("gemini-1.5-pro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deep thinking level" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Why did margin compress?")).toBeInTheDocument();
    expect(screen.getByText("Logistics overhead was the primary driver.")).toBeInTheDocument();

    const reasoning = screen.getByRole("region", { name: "Assistant reasoning and tool activity" });
    expect(within(reasoning).getByText("Inspecting tenant documents.")).toBeInTheDocument();
    expect(within(reasoning).getByText("SearchDocuments")).toBeInTheDocument();
  });

  it("supports an actionable empty state and local new chat flow", () => {
    render(<ChatPageView sessions={[]} messages={[]} />);

    expect(screen.getByText("No chat sessions yet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /new session/i }));
    expect(screen.getByText("Untitled analysis session")).toBeInTheDocument();
  });
});
