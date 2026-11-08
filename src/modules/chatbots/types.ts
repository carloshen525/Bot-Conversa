import { Node, Edge } from "@xyflow/react";

export type NodeType =
  | "startNode"
  | "messageNode"
  | "waitNode"
  | "conditionNode"
  | "addTagNode"
  | "removeTagNode"
  | "variableNode"
  | "webhookNode"
  | "endNode";

export type StartTriggerType = "new_conversation" | "keyword" | "webhook" | "manual";

export interface StartNodeData extends Record<string, unknown> {
  label: string;
  triggerType: StartTriggerType;
  keywords?: string[];
  description?: string;
}

export type MessageContentType = "text" | "image" | "video" | "audio" | "document";

export interface MessageNodeData extends Record<string, unknown> {
  label: string;
  messageType: MessageContentType;
  content: string;
  mediaUrl?: string;
  fileName?: string;
  delaySeconds?: number;
}

export type WaitType = "user_reply" | "minutes" | "hours" | "days";

export interface WaitNodeData extends Record<string, unknown> {
  label: string;
  waitType: WaitType;
  duration?: number;
  timeoutMinutes?: number;
}

export type ConditionOperator =
  | "message_contains"
  | "message_equals"
  | "message_starts_with"
  | "message_ends_with"
  | "variable_equals"
  | "tag_exists"
  | "tag_not_exists";

export interface ConditionBranch {
  id: string;
  label: string;
  operator: ConditionOperator;
  variableKey?: string;
  tagName?: string;
  value: string;
}

export interface ConditionNodeData extends Record<string, unknown> {
  label: string;
  branches: ConditionBranch[];
}

export interface TagNodeData extends Record<string, unknown> {
  label: string;
  tagName: string;
}

export interface VariableNodeData extends Record<string, unknown> {
  label: string;
  variableKey: string;
  variableValue: string;
  sourceType: "custom" | "last_message" | "contact_name" | "contact_phone";
}

export type HttpMethod = "GET" | "POST";

export interface WebhookHeader {
  key: string;
  value: string;
}

export interface WebhookNodeData extends Record<string, unknown> {
  label: string;
  method: HttpMethod;
  url: string;
  headers: WebhookHeader[];
  body?: string;
  saveResponseVariable?: string;
}

export interface EndNodeData extends Record<string, unknown> {
  label: string;
  reason?: string;
}

export type FlowNodeData =
  | StartNodeData
  | MessageNodeData
  | WaitNodeData
  | ConditionNodeData
  | TagNodeData
  | VariableNodeData
  | WebhookNodeData
  | EndNodeData;

export type FlowNode = Node<FlowNodeData, NodeType>;
export type FlowEdge = Edge;

export interface FlowSettings {
  defaultDelayBetweenMessages?: number;
  sessionTimeoutHours?: number;
  fallbackMessage?: string;
}

export interface FlowTrigger {
  id: string;
  type: StartTriggerType;
  keywords?: string[];
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  settings: FlowSettings;
  triggers: FlowTrigger[];
  metadata?: {
    zoom?: number;
    viewport?: { x: number; y: number; zoom: number };
    updatedAt?: string;
    [key: string]: any;
  };
}

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published" | "archived";
  current_published_version_id?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  current_version?: ChatbotVersion | null;
  draft?: ChatbotDraft | null;
}

export interface ChatbotDraft {
  id: string;
  chatbot_id: string;
  flow_data: FlowData;
  updated_at: string;
}

export interface ChatbotVersion {
  id: string;
  chatbot_id: string;
  version_number: number;
  flow_data: FlowData;
  changelog: string;
  published_at: string;
}
