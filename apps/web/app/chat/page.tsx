import { ChatPageView } from "@/features/app/chat-page-view";
import { SupabaseChatRepository } from "@/lib/chat/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ChatPage() {
  const data = await loadChatData();
  return <ChatPageView sessions={data?.sessions} activeSessionId={data?.activeSessionId} messages={data?.messages} />;
}

async function loadChatData() {
  try {
    const supabase = await createServerSupabaseClient();
    const repository = new SupabaseChatRepository(supabase);
    const sessions = await repository.listSessions();
    const activeSessionId = sessions[0]?.id;
    const messages = activeSessionId ? await repository.getMessages(activeSessionId) : [];
    return { sessions, activeSessionId, messages };
  } catch {
    return undefined;
  }
}
