import {
  ConversationStateRecord,
  ConversationStatus,
} from "../../flow-engine/types";
import { generateId } from "../../shared/utils";

export interface ExecutionRecord {
  id: string;
  conversation_state_id: string;
  chatbot_version_id: string;
  contact_id: string;
  trigger_type: string;
  status: "running" | "paused" | "completed" | "failed";
  started_at: string;
  finished_at: string | null;
  metadata: Record<string, unknown>;
}

declare global {
  // eslint-disable-next-line no-var
  var __BOT_CONVERSA_STATES__: Map<string, ConversationStateRecord> | undefined;
  // eslint-disable-next-line no-var
  var __BOT_CONVERSA_EXECUTIONS__: Map<string, ExecutionRecord> | undefined;
}

if (!global.__BOT_CONVERSA_STATES__) {
  global.__BOT_CONVERSA_STATES__ = new Map();
}
if (!global.__BOT_CONVERSA_EXECUTIONS__) {
  global.__BOT_CONVERSA_EXECUTIONS__ = new Map();
}

export class ExecutionRepository {
  private get states() {
    return global.__BOT_CONVERSA_STATES__!;
  }
  private get executions() {
    return global.__BOT_CONVERSA_EXECUTIONS__!;
  }

  /**
   * Finds an active or waiting conversation state for a contact
   */
  public async findActiveStateByContact(
    contactId: string
  ): Promise<ConversationStateRecord | null> {
    for (const state of Array.from(this.states.values())) {
      if (
        state.contact_id === contactId &&
        (state.status === "active" ||
          state.status === "waiting_input" ||
          state.status === "waiting_delay")
      ) {
        return state;
      }
    }
    return null;
  }

  public async findStateById(id: string): Promise<ConversationStateRecord | null> {
    return this.states.get(id) || null;
  }

  /**
   * Creates a brand new conversation state bound to an IMMUTABLE PUBLISHED SNAPSHOT (chatbot_version_id)
   */
  public async createState(
    contactId: string,
    chatbotId: string,
    chatbotVersionId: string,
    initialNodeId: string | null = null,
    initialVariables: Record<string, string> = {}
  ): Promise<ConversationStateRecord> {
    const id = generateId("state");
    const now = new Date().toISOString();

    const record: ConversationStateRecord = {
      id,
      contact_id: contactId,
      chatbot_id: chatbotId,
      chatbot_version_id: chatbotVersionId, // STRICTLY PINNED
      current_node_id: initialNodeId,
      status: "active",
      variables: initialVariables,
      resume_at: null,
      execution_context: {
        history: [],
      },
      last_interaction_at: now,
    };

    this.states.set(id, record);
    return record;
  }

  public async updateState(
    id: string,
    updates: Partial<ConversationStateRecord>
  ): Promise<ConversationStateRecord | null> {
    const existing = this.states.get(id);
    if (!existing) return null;

    const updated: ConversationStateRecord = {
      ...existing,
      ...updates,
      last_interaction_at: new Date().toISOString(),
    };

    this.states.set(id, updated);
    return updated;
  }

  public async createExecution(
    conversationStateId: string,
    chatbotVersionId: string,
    contactId: string,
    triggerType: string
  ): Promise<ExecutionRecord> {
    const id = generateId("exec");
    const now = new Date().toISOString();

    const record: ExecutionRecord = {
      id,
      conversation_state_id: conversationStateId,
      chatbot_version_id: chatbotVersionId,
      contact_id: contactId,
      trigger_type: triggerType,
      status: "running",
      started_at: now,
      finished_at: null,
      metadata: {},
    };

    this.executions.set(id, record);
    return record;
  }

  public async updateExecution(
    id: string,
    status: ExecutionRecord["status"],
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const record = this.executions.get(id);
    if (record) {
      record.status = status;
      if (status === "completed" || status === "failed") {
        record.finished_at = new Date().toISOString();
      }
      if (metadata) {
        record.metadata = { ...record.metadata, ...metadata };
      }
      this.executions.set(id, record);
    }
  }

  public async listExecutions(limit = 50): Promise<ExecutionRecord[]> {
    return Array.from(this.executions.values())
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, limit);
  }

  /**
   * Finds conversations waiting for delay that are due to resume (resume_at <= now())
   */
  public async findDueDelayedStates(): Promise<ConversationStateRecord[]> {
    const now = new Date();
    const due: ConversationStateRecord[] = [];

    for (const state of Array.from(this.states.values())) {
      if (state.status === "waiting_delay" && state.resume_at) {
        const resumeTime = new Date(state.resume_at);
        if (resumeTime <= now) {
          due.push(state);
        }
      }
    }

    return due;
  }
}

export const executionRepository = new ExecutionRepository();
