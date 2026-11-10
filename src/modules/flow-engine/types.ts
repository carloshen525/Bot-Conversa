import { FlowData, FlowNode, FlowEdge } from "../chatbots/types";

export interface ContactData {
  id: string;
  name: string;
  phone: string;
  profile_pic_url?: string;
  tags: string[];
  variables: Record<string, string>;
}

export type ConversationStatus =
  | "active"
  | "waiting_input"
  | "waiting_delay"
  | "completed"
  | "failed"
  | "paused";

export interface ConversationStateRecord {
  id: string;
  contact_id: string;
  chatbot_id: string;
  chatbot_version_id: string; // STRICTLY pinned snapshot
  current_node_id: string | null;
  status: ConversationStatus;
  variables: Record<string, string>;
  resume_at: string | null;
  execution_context: {
    last_message_received?: string;
    waiting_for_input_at_node?: string;
    canceled_reason?: string;
    history?: {
      node_id: string;
      node_type: string;
      timestamp: string;
    }[];
    [key: string]: any;
  };
  last_interaction_at: string;
  created_at?: string;
}

export interface EngineTriggerEvent {
  type: "new_conversation" | "keyword" | "webhook" | "manual" | "user_reply" | "timer_wakeup";
  messageText?: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export type FlowEngineActionType =
  | "send_text_message"
  | "send_media_message"
  | "add_tag"
  | "remove_tag"
  | "call_webhook"
  | "wait_reply"
  | "wait_delay"
  | "log"
  | "end";

export interface FlowEngineAction {
  type: FlowEngineActionType;
  payload: Record<string, unknown>;
}

export interface NodeExecutionResult {
  status: "proceed" | "pause" | "stop";
  nextNodeId?: string | null;
  actions: FlowEngineAction[];
  updatedVariables?: Record<string, string>;
  addedTags?: string[];
  removedTags?: string[];
  resumeAt?: Date | null;
  log?: {
    level: "info" | "warn" | "error" | "debug";
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface FlowEngineResult {
  conversationStateId: string;
  finalStatus: ConversationStatus;
  currentNodeId: string | null;
  dispatchedActions: FlowEngineAction[];
  variables: Record<string, string>;
  tags: string[];
  resumeAt: string | null;
  logs: {
    level: "info" | "warn" | "error" | "debug";
    nodeId: string;
    message: string;
    details?: Record<string, unknown>;
  }[];
}
