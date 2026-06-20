import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatPageView } from "./chat-page-view";
import { DocumentDetailPageView } from "@/features/documents/document-detail-page-view";
import { DocumentsPageView } from "@/features/documents/documents-page-view";
import { SettingsPageView } from "@/features/settings/settings-page-view";

describe("Stitch-backed pages", () => {
  it("renders the chat shell landmarks", () => {
    render(<ChatPageView />);

    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Q3 Earnings Analysis")).toBeInTheDocument();
    expect(screen.getByText("Gemini 1.5 Pro")).toBeInTheDocument();
    expect(screen.getByText("Reasoning Process (4.2s)")).toBeInTheDocument();
    expect(screen.getByText("Tool Call:")).toBeInTheDocument();
    expect(screen.getByText("Mnemosyne can make mistakes. Verify critical operational data.")).toBeInTheDocument();
  });

  it("renders the documents table and ingestion activity", () => {
    render(<DocumentsPageView />);

    expect(screen.getByText("Documents Management")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload document/i })).toBeInTheDocument();
    expect(screen.getByText("Q3_Financial_Review_vFINAL.pdf")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(screen.getByText("Ingestion Engine Activity")).toBeInTheDocument();
  });

  it("renders document detail inspection landmarks", () => {
    render(<DocumentDetailPageView />);

    expect(screen.getByText("Q3_Earnings_Report_v2.pdf")).toBeInTheDocument();
    expect(screen.getByText("Parsed Markdown")).toBeInTheDocument();
    expect(screen.getByText("Searchable Chunks")).toBeInTheDocument();
    expect(screen.getByText("idx: 001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /source/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("renders settings provider and MCP landmarks", () => {
    render(<SettingsPageView />);

    expect(screen.getByText("Environment Configuration")).toBeInTheDocument();
    expect(screen.getByText("Google Gemini API Key")).toBeInTheDocument();
    expect(screen.getByText("Vector Storage (Pinecone)")).toBeInTheDocument();
    expect(screen.getByText("Observability (LangSmith)")).toBeInTheDocument();

    const mcpSection = screen.getByText("MCP Servers").closest("section");
    expect(mcpSection).not.toBeNull();
    expect(within(mcpSection as HTMLElement).getByText("Jira Cloud")).toBeInTheDocument();
    expect(within(mcpSection as HTMLElement).getByText("Confluence")).toBeInTheDocument();
    expect(within(mcpSection as HTMLElement).getByText("GitHub Repo")).toBeInTheDocument();
  });
});
