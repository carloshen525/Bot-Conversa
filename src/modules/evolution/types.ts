export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface SendTextMessageParams {
  number: string;
  text: string;
  delay?: number;
  instanceName?: string;
}

export interface SendMediaMessageParams {
  number: string;
  mediatype: "image" | "video" | "audio" | "document";
  media: string; // URL or base64
  caption?: string;
  fileName?: string;
  delay?: number;
  instanceName?: string;
}

export interface EvolutionWebhookEvent {
  event:
    | "messages.upsert"
    | "messages.update"
    | "send.message"
    | "connection.update"
    | "contacts.upsert"
    | string;
  instance: string;
  data: {
    key: {
      remoteJid: string; // e.g. 5511999999999@s.whatsapp.net
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
      imageMessage?: {
        caption?: string;
        url?: string;
      };
      [key: string]: unknown;
    };
    messageType?: string;
    messageTimestamp?: number;
    source?: string;
    [key: string]: unknown;
  };
}

export interface EvolutionContactProfile {
  id: string;
  name: string;
  phone: string;
  profilePicUrl?: string;
  isGroup: boolean;
}
