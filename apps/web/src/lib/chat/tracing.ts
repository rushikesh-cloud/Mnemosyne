import type { ChatModel, ThinkingLevel } from "./runtime";

export function createLangSmithTraceSink(settings: { langsmithApiKey?: string }) {
  return {
    async startRun(input: {
      userId: string;
      sessionId: string;
      model: ChatModel;
      thinkingLevel: ThinkingLevel;
    }): Promise<{ id: string } | null> {
      if (!settings.langsmithApiKey) {
        return null;
      }

      return {
        id: `${input.sessionId}:${Date.now()}`
      };
    },
    async endRun() {
      return undefined;
    }
  };
}
