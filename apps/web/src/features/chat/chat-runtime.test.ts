import { describe, expect, it, vi } from "vitest";

import {
  buildStreamingChatEvents,
  createRagRetrieverTool,
  validateChatSessionSettings
} from "@/lib/chat/runtime";

describe("chat runtime", () => {
  it("validates supported Gemini model and thinking settings", () => {
    expect(validateChatSessionSettings({ selectedModel: "gemini-1.5-pro", thinkingLevel: "deep" })).toEqual({
      selectedModel: "gemini-1.5-pro",
      thinkingLevel: "deep"
    });

    expect(() =>
      validateChatSessionSettings({ selectedModel: "untrusted-model", thinkingLevel: "deep" })
    ).toThrow("Unsupported chat model.");
    expect(() =>
      validateChatSessionSettings({ selectedModel: "gemini-1.5-pro", thinkingLevel: "maximum" })
    ).toThrow("Unsupported thinking level.");
  });

  it("queries RAG with only the authenticated user namespace", async () => {
    const embeddings = {
      embedQuery: vi.fn().mockResolvedValue([0.1, 0.2])
    };
    const vectorStore = {
      query: vi.fn().mockResolvedValue([
        {
          id: "chunk-1",
          score: 0.91,
          metadata: {
            document_id: "doc-1",
            chunk_id: "chunk-1",
            chunk_index: 0,
            filename: "source.pdf",
            text: "Tenant scoped answer context"
          }
        }
      ])
    };

    const tool = createRagRetrieverTool({
      userId: "user-1",
      embeddings,
      vectorStore
    });
    const result = await tool.invoke("margin compression");

    expect(embeddings.embedQuery).toHaveBeenCalledWith("margin compression");
    expect(vectorStore.query).toHaveBeenCalledWith({
      namespace: "user-1",
      vector: [0.1, 0.2],
      topK: 5
    });
    expect(result.context).toContain("Tenant scoped answer context");
  });

  it("persists the user message before streaming transparent assistant events", async () => {
    const messages = {
      append: vi
        .fn()
        .mockResolvedValueOnce({ id: "msg-user", sequenceNumber: 1 })
        .mockResolvedValueOnce({ id: "msg-assistant", sequenceNumber: 2 })
    };
    const llm = {
      stream: vi.fn().mockImplementation(async function* () {
        yield "The primary driver";
        yield " was logistics overhead.";
      })
    };
    const ragTool = {
      invoke: vi.fn().mockResolvedValue({ context: "Q3 logistics evidence", citations: ["source.pdf#0"] })
    };
    const mcp = {
      listTools: vi.fn().mockResolvedValue([{ serverName: "Jira", toolName: "search_issues" }])
    };
    const tracer = {
      startRun: vi.fn().mockResolvedValue({ id: "trace-1" }),
      endRun: vi.fn().mockResolvedValue(undefined)
    };

    const events = [];
    for await (const event of buildStreamingChatEvents({
      userId: "user-1",
      sessionId: "session-1",
      prompt: "Why did margin compress?",
      messages,
      llm,
      ragTool,
      mcp,
      tracer,
      settings: {
        selectedModel: "gemini-1.5-pro",
        thinkingLevel: "deep"
      }
    })) {
      events.push(event);
    }

    expect(messages.append).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ sessionId: "session-1", role: "user", content: "Why did margin compress?" })
    );
    expect(events.map((event) => event.type)).toEqual([
      "thinking",
      "tool_call",
      "tool_call",
      "token",
      "token",
      "final"
    ]);
    expect(messages.append).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ role: "assistant", content: "The primary driver was logistics overhead." })
    );
    expect(tracer.endRun).toHaveBeenCalledWith(
      expect.objectContaining({ runId: "trace-1", status: "completed", output: "The primary driver was logistics overhead." })
    );
  });

  it("stores a recoverable assistant error when generation fails", async () => {
    const messages = {
      append: vi.fn().mockResolvedValue({ id: "msg", sequenceNumber: 1 })
    };

    const events = [];
    for await (const event of buildStreamingChatEvents({
      userId: "user-1",
      sessionId: "session-1",
      prompt: "Fail",
      messages,
      llm: {
        stream: vi.fn().mockImplementation(async function* () {
          throw new Error("provider unavailable");
        })
      },
      ragTool: { invoke: vi.fn().mockResolvedValue({ context: "", citations: [] }) },
      mcp: { listTools: vi.fn().mockResolvedValue([]) },
      tracer: { startRun: vi.fn().mockResolvedValue({ id: "trace-1" }), endRun: vi.fn() },
      settings: { selectedModel: "gemini-1.5-flash", thinkingLevel: "fast" }
    })) {
      events.push(event);
    }

    expect(events.at(-1)).toEqual({
      type: "error",
      message: "Assistant response failed. Retry when provider settings are available."
    });
    expect(messages.append).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "assistant",
        status: "failed",
        content: "Assistant response failed. Retry when provider settings are available."
      })
    );
  });
});
