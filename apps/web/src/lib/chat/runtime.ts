export const supportedChatModels = ["gemini-1.5-flash", "gemini-1.5-pro"] as const;
export const supportedThinkingLevels = ["fast", "deep", "extensive"] as const;

export type ChatModel = (typeof supportedChatModels)[number];
export type ThinkingLevel = (typeof supportedThinkingLevels)[number];

export type ChatStreamEvent =
  | { type: "thinking"; message: string }
  | { type: "tool_call"; name: string; detail: string; status: "started" | "completed" | "failed" }
  | { type: "token"; text: string }
  | { type: "final"; messageId?: string; content: string }
  | { type: "error"; message: string };

export type RagResult = {
  context: string;
  citations: string[];
};

type MessageAppender = {
  append(input: {
    sessionId: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    status?: "complete" | "failed";
    events?: ChatStreamEvent[];
  }): Promise<{ id: string; sequenceNumber: number }>;
};

type TraceSink = {
  startRun(input: {
    userId: string;
    sessionId: string;
    model: ChatModel;
    thinkingLevel: ThinkingLevel;
  }): Promise<{ id: string } | null>;
  endRun(input: { runId?: string; status: "completed" | "failed"; output?: string; error?: string }): Promise<void>;
};

export function validateChatSessionSettings(input: { selectedModel: string; thinkingLevel: string }) {
  if (!supportedChatModels.includes(input.selectedModel as ChatModel)) {
    throw new Error("Unsupported chat model.");
  }
  if (!supportedThinkingLevels.includes(input.thinkingLevel as ThinkingLevel)) {
    throw new Error("Unsupported thinking level.");
  }

  return {
    selectedModel: input.selectedModel as ChatModel,
    thinkingLevel: input.thinkingLevel as ThinkingLevel
  };
}

export function createRagRetrieverTool(input: {
  userId: string;
  embeddings: { embedQuery(query: string): Promise<number[]> };
  vectorStore: {
    query(query: { namespace: string; vector: number[]; topK: number }): Promise<
      Array<{
        id: string;
        score?: number;
        metadata?: {
          document_id?: string;
          chunk_id?: string;
          chunk_index?: number;
          filename?: string;
          text?: string;
        };
      }>
    >;
  };
  topK?: number;
}) {
  return {
    name: "SearchDocuments",
    async invoke(query: string): Promise<RagResult> {
      const vector = await input.embeddings.embedQuery(query);
      const matches = await input.vectorStore.query({
        namespace: input.userId,
        vector,
        topK: input.topK ?? 5
      });

      return {
        context: matches
          .map((match) => match.metadata?.text)
          .filter((text): text is string => Boolean(text))
          .join("\n\n"),
        citations: matches.map((match) => {
          const filename = match.metadata?.filename || "document";
          const index = match.metadata?.chunk_index ?? 0;
          return `${filename}#${index}`;
        })
      };
    }
  };
}

export async function* buildStreamingChatEvents(input: {
  userId: string;
  sessionId: string;
  prompt: string;
  messages: MessageAppender;
  llm: { stream(input: { prompt: string; context: string; model: ChatModel; thinkingLevel: ThinkingLevel }): AsyncIterable<string> };
  ragTool: { invoke(query: string): Promise<RagResult> };
  mcp: { listTools(): Promise<Array<{ serverName: string; toolName: string }>> };
  tracer: TraceSink;
  settings: { selectedModel: ChatModel; thinkingLevel: ThinkingLevel };
}): AsyncGenerator<ChatStreamEvent> {
  await input.messages.append({
    sessionId: input.sessionId,
    role: "user",
    content: input.prompt,
    status: "complete"
  });

  const run = await input.tracer.startRun({
    userId: input.userId,
    sessionId: input.sessionId,
    model: input.settings.selectedModel,
    thinkingLevel: input.settings.thinkingLevel
  });
  const emittedEvents: ChatStreamEvent[] = [];
  let assistantContent = "";

  const emit = async function* (event: ChatStreamEvent) {
    emittedEvents.push(event);
    yield event;
  };

  try {
    yield* emit({ type: "thinking", message: "Inspecting tenant documents and configured tools." });

    const rag = await input.ragTool.invoke(input.prompt);
    yield* emit({
      type: "tool_call",
      name: "SearchDocuments",
      detail: rag.context ? `Retrieved ${rag.citations.length} tenant-scoped chunks.` : "No tenant-scoped chunks found.",
      status: "completed"
    });

    const mcpTools = await input.mcp.listTools();
    yield* emit({
      type: "tool_call",
      name: "MCPTools",
      detail: mcpTools.length
        ? mcpTools.map((tool) => `${tool.serverName}.${tool.toolName}`).join(", ")
        : "No MCP tools configured.",
      status: "completed"
    });

    for await (const token of input.llm.stream({
      prompt: input.prompt,
      context: rag.context,
      model: input.settings.selectedModel,
      thinkingLevel: input.settings.thinkingLevel
    })) {
      assistantContent += token;
      yield* emit({ type: "token", text: token });
    }

    const assistant = await input.messages.append({
      sessionId: input.sessionId,
      role: "assistant",
      content: assistantContent,
      status: "complete",
      events: emittedEvents
    });
    await input.tracer.endRun({ runId: run?.id, status: "completed", output: assistantContent });

    yield* emit({ type: "final", messageId: assistant.id, content: assistantContent });
  } catch (error) {
    const message = "Assistant response failed. Retry when provider settings are available.";
    await input.messages.append({
      sessionId: input.sessionId,
      role: "assistant",
      content: message,
      status: "failed",
      events: emittedEvents
    });
    await input.tracer.endRun({
      runId: run?.id,
      status: "failed",
      error: error instanceof Error ? error.message : message
    });
    yield* emit({ type: "error", message });
  }
}
