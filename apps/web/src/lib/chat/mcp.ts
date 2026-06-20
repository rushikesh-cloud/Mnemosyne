import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import type { McpServerInput } from "@/lib/settings/security";

export function createMcpToolLister(servers: McpServerInput[]) {
  return {
    async listTools() {
      const results: Array<{ serverName: string; toolName: string }> = [];

      for (const server of servers) {
        try {
          const client = new Client({ name: "mnemosyne", version: "0.1.0" });
          const transport = new StreamableHTTPClientTransport(new URL(server.endpointUrl));
          await client.connect(transport);
          const response = await client.listTools();
          response.tools.forEach((tool) => {
            results.push({ serverName: server.name, toolName: tool.name });
          });
          await client.close();
        } catch {
          results.push({ serverName: server.name, toolName: "connection_unavailable" });
        }
      }

      return results;
    }
  };
}
