import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChatMessageView, ChatSessionView } from "@/features/app/chat-page-view";
import type { ChatStreamEvent, ChatModel, ThinkingLevel } from "./runtime";
import { validateChatSessionSettings } from "./runtime";

type ChatSessionRow = {
  id: string;
  title: string;
  summary: string | null;
  selected_model: string;
  thinking_level: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  event_log: ChatStreamEvent[] | null;
  status: string;
  created_at: string;
};

export class SupabaseChatRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listSessions(): Promise<ChatSessionView[]> {
    const { data, error } = await this.supabase
      .from("chat_sessions")
      .select("id, title, summary, selected_model, thinking_level, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as ChatSessionRow[]).map(rowToSessionView);
  }

  async getMessages(sessionId: string): Promise<ChatMessageView[]> {
    const { data, error } = await this.supabase
      .from("messages")
      .select("id, role, content, event_log, status, created_at")
      .eq("session_id", sessionId)
      .order("sequence_number", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data as MessageRow[]).map(rowToMessageView);
  }

  async createSession(input: {
    userId: string;
    title?: string;
    selectedModel: string;
    thinkingLevel: string;
  }): Promise<ChatSessionView> {
    const settings = validateChatSessionSettings(input);
    const { data, error } = await this.supabase
      .from("chat_sessions")
      .insert({
        user_id: input.userId,
        title: input.title || "Untitled analysis session",
        selected_model: settings.selectedModel,
        thinking_level: settings.thinkingLevel
      })
      .select("id, title, summary, selected_model, thinking_level, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return rowToSessionView(data as ChatSessionRow);
  }

  async updateSessionSettings(sessionId: string, input: { selectedModel: string; thinkingLevel: string }) {
    const settings = validateChatSessionSettings(input);
    const { error } = await this.supabase
      .from("chat_sessions")
      .update({
        selected_model: settings.selectedModel,
        thinking_level: settings.thinkingLevel,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async append(input: {
    sessionId: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    status?: "complete" | "failed";
    events?: ChatStreamEvent[];
  }): Promise<{ id: string; sequenceNumber: number }> {
    const { data: latest, error: latestError } = await this.supabase
      .from("messages")
      .select("sequence_number")
      .eq("session_id", input.sessionId)
      .order("sequence_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      throw new Error(latestError.message);
    }

    const sequenceNumber = ((latest as { sequence_number?: number } | null)?.sequence_number ?? 0) + 1;
    const { data, error } = await this.supabase
      .from("messages")
      .insert({
        session_id: input.sessionId,
        role: input.role,
        content: input.content,
        status: input.status || "complete",
        event_log: input.events || [],
        sequence_number: sequenceNumber
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { id: data.id as string, sequenceNumber };
  }
}

function rowToSessionView(row: ChatSessionRow): ChatSessionView {
  const settings = validateChatSessionSettings({
    selectedModel: row.selected_model,
    thinkingLevel: row.thinking_level
  });

  return {
    id: row.id,
    title: row.title,
    summary: row.summary || "No summary yet",
    updatedAt: formatTimestamp(row.updated_at),
    selectedModel: settings.selectedModel,
    thinkingLevel: settings.thinkingLevel
  };
}

function rowToMessageView(row: MessageRow): ChatMessageView {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: formatTimestamp(row.created_at),
    events: row.event_log?.filter((event) => event.type === "thinking" || event.type === "tool_call") as ChatMessageView["events"]
  };
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export type PersistedSessionSettings = {
  selectedModel: ChatModel;
  thinkingLevel: ThinkingLevel;
};
