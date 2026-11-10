export interface ContactActiveFlow {
  chatbot_id: string;
  chatbot_name: string;
  version_id: string;
  current_node_id?: string;
  status: "active" | "waiting_input" | "completed" | "paused" | "canceled";
  started_at: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  profile_pic_url?: string;
  last_message?: string;
  last_message_at?: string;
  last_message_from_me?: boolean;
  instance_name?: string;
  tags: string[];
  variables: Record<string, string>;
  active_flow?: ContactActiveFlow;
  status: "active" | "waiting" | "completed" | "paused" | "idle";
  created_at: string;
  updated_at: string;
}

export interface ContactsFilter {
  search?: string;
  tag?: string;
  status?: string;
  hasActiveFlow?: boolean;
  chatbotId?: string;
}

export interface StartFlowParams {
  contactIds: string[];
  chatbotId: string;
  policy?: "replace" | "keep";
}

export interface SyncContactsResult {
  totalSynced: number;
  newContacts: number;
  updatedContacts: number;
  instanceName: string;
}
