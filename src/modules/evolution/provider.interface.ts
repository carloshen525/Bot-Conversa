export interface InstanceInfo {
  id: string;
  name: string;
  status: "open" | "close" | "connecting" | "unknown";
  number?: string;
  profileName?: string;
  profilePictureUrl?: string;
  updatedAt?: string;
  webhookUrl?: string;
  webhookEnabled?: boolean;
  isDefault?: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  statusCode?: number;
  message: string;
  details?: Record<string, unknown>;
  latencyMs?: number;
}

export interface ConfigureWebhookParams {
  instanceName: string;
  webhookUrl: string;
  events?: string[];
  enabled?: boolean;
}

export interface ConfigureWebhookResult {
  success: boolean;
  message: string;
  webhookUrl?: string;
  events?: string[];
  details?: Record<string, unknown>;
}

export interface SendTextParams {
  instanceName?: string;
  number: string;
  text: string;
  delay?: number;
}

export interface SendMediaParams {
  instanceName?: string;
  number: string;
  mediatype: "image" | "video" | "audio" | "document";
  media: string;
  caption?: string;
  fileName?: string;
  delay?: number;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  data?: unknown;
  error?: string;
}

export interface ContactProfileResult {
  id: string;
  name: string;
  phone: string;
  profilePicUrl?: string;
  isGroup: boolean;
}

/**
 * Universal WhatsApp Provider Interface
 * Allows seamless plugging of Evolution API, Meta Cloud API, Z-API, Baileys, etc.
 */
export interface WhatsAppProvider {
  name: string;

  /**
   * Tests connection and authentication with the provider server
   */
  testConnection(baseUrl: string, apiKey: string): Promise<TestConnectionResult>;

  /**
   * Fetches all registered instances on the server
   */
  listInstances(baseUrl: string, apiKey: string): Promise<InstanceInfo[]>;

  /**
   * Gets real-time info and connection state of a specific instance
   */
  getInstance(baseUrl: string, apiKey: string, instanceName: string): Promise<InstanceInfo | null>;

  /**
   * Configures webhook URL and events automatically on the instance
   */
  configureWebhook(
    baseUrl: string,
    apiKey: string,
    params: ConfigureWebhookParams
  ): Promise<ConfigureWebhookResult>;

  /**
   * Sends a text message through the given instance
   */
  sendText(
    baseUrl: string,
    apiKey: string,
    params: SendTextParams
  ): Promise<SendMessageResult>;

  /**
   * Sends media (image, audio, video, document) through the given instance
   */
  sendMedia(
    baseUrl: string,
    apiKey: string,
    params: SendMediaParams
  ): Promise<SendMessageResult>;

  /**
   * Fetches profile name and photo for a phone number
   */
  fetchContact(
    baseUrl: string,
    apiKey: string,
    instanceName: string,
    phone: string
  ): Promise<ContactProfileResult>;
}
