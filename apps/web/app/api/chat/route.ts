import { NextResponse } from "next/server";

import { createMcpToolLister } from "@/lib/chat/mcp";
import { SupabaseChatRepository } from "@/lib/chat/repository";
import { buildStreamingChatEvents, createRagRetrieverTool } from "@/lib/chat/runtime";
import { createLangSmithTraceSink } from "@/lib/chat/tracing";
import { createQueryEmbeddingClientFromEnv, createQueryVectorStoreFromEnv } from "@/lib/chat/vector-retriever";
import { SupabaseSettingsRepository } from "@/lib/settings/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as { sessionId?: string; prompt?: string };
  if (!body.sessionId || !body.prompt?.trim()) {
    return NextResponse.json({ error: "A sessionId and prompt are required." }, { status: 400 });
  }

  const chatRepository = new SupabaseChatRepository(supabase);
  const settings = await new SupabaseSettingsRepository(supabase).loadSafeSettings();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const ragTool = createRagRetrieverTool({
        userId: user.id,
        embeddings: createQueryEmbeddingClientFromEnv(),
        vectorStore: createQueryVectorStoreFromEnv()
      });
      const events = buildStreamingChatEvents({
        userId: user.id,
        sessionId: body.sessionId as string,
        prompt: body.prompt as string,
        messages: chatRepository,
        llm: createFallbackLlm(),
        ragTool,
        mcp: createMcpToolLister(settings.mcpServers),
        tracer: createLangSmithTraceSink({ langsmithApiKey: settings.langsmithApiKey }),
        settings: {
          selectedModel: "gemini-1.5-pro",
          thinkingLevel: "deep"
        }
      });

      for await (const event of events) {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function createFallbackLlm() {
  return {
    async *stream(input: { prompt: string; context: string }) {
      yield input.context
        ? `I found tenant-scoped context for: ${input.prompt}`
        : "No indexed document context was found for this question.";
    }
  };
}
