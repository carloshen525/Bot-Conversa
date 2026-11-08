import { generateId } from "../../shared/utils";

export interface LogRecord {
  id: string;
  execution_id?: string | null;
  conversation_state_id?: string | null;
  chatbot_id?: string | null;
  level: "info" | "warn" | "error" | "debug";
  node_id: string;
  message: string;
  details?: Record<string, unknown>;
  created_at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __BOT_CONVERSA_LOGS__: LogRecord[] | undefined;
}

if (!global.__BOT_CONVERSA_LOGS__) {
  global.__BOT_CONVERSA_LOGS__ = [];
}

export class LogRepository {
  private get logs() {
    return global.__BOT_CONVERSA_LOGS__!;
  }

  public async insert(log: Omit<LogRecord, "id" | "created_at">): Promise<LogRecord> {
    const record: LogRecord = {
      ...log,
      id: generateId("log"),
      created_at: new Date().toISOString(),
    };

    this.logs.unshift(record);

    // Keep memory clean
    if (this.logs.length > 500) {
      this.logs.pop();
    }

    return record;
  }

  public async insertBatch(logs: Omit<LogRecord, "id" | "created_at">[]): Promise<void> {
    for (const log of logs) {
      await this.insert(log);
    }
  }

  public async listRecent(limit = 100): Promise<LogRecord[]> {
    return this.logs.slice(0, limit);
  }

  public async listByChatbot(chatbotId: string, limit = 50): Promise<LogRecord[]> {
    return this.logs.filter((l) => l.chatbot_id === chatbotId).slice(0, limit);
  }
}

export const logRepository = new LogRepository();
