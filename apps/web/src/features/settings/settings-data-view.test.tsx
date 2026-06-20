import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsPageView } from "@/features/settings/settings-page-view";

describe("settings data view", () => {
  it("renders persisted settings while keeping saved secrets masked", () => {
    render(
      <SettingsPageView
        settings={{
          googleApiKey: "••••••••",
          embeddingModelName: "gemini-embedding-001",
          pineconeApiKey: "••••••••",
          pineconeIndexName: "mnemosyne-prod",
          pineconeHost: "us-east-1",
          langsmithApiKey: "",
          mcpServers: [
            {
              id: "mcp-1",
              name: "Jira",
              endpointUrl: "https://jira.example.test/mcp",
              headersJson: "••••••••",
              status: "configured"
            }
          ]
        }}
      />
    );

    expect(screen.getByDisplayValue("••••••••")).toBeInTheDocument();
    expect(screen.getByDisplayValue("mnemosyne-prod")).toBeInTheDocument();
    expect(screen.getByDisplayValue("us-east-1")).toBeInTheDocument();

    const mcpSection = screen.getByText("MCP Servers").closest("section");
    expect(mcpSection).not.toBeNull();
    expect(within(mcpSection as HTMLElement).getByText("Jira")).toBeInTheDocument();
    expect(within(mcpSection as HTMLElement).queryByText(/jira-secret/i)).not.toBeInTheDocument();
  });
});
