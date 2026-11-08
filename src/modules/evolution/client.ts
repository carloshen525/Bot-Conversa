import {
  EvolutionConfig,
  SendTextMessageParams,
  SendMediaMessageParams,
  EvolutionContactProfile,
} from "./types";

export class EvolutionApiClient {
  private baseUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor(config?: Partial<EvolutionConfig>) {
    this.baseUrl = (config?.baseUrl || process.env.NEXT_PUBLIC_EVOLUTION_API_URL || "http://localhost:8080").replace(/\/$/, "");
    this.apiKey = config?.apiKey || process.env.EVOLUTION_API_KEY || "";
    this.instanceName = config?.instanceName || process.env.EVOLUTION_INSTANCE_NAME || "botconversa";
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      apikey: this.apiKey,
    };
  }

  /**
   * Cleans WhatsApp phone number: removes '@s.whatsapp.net', non-digits, etc.
   */
  public cleanPhoneNumber(rawPhone: string): string {
    return rawPhone.replace("@s.whatsapp.net", "").replace(/\D/g, "");
  }

  /**
   * Enviar Mensagem de Texto
   */
  public async sendTextMessage(
    params: SendTextMessageParams
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const cleanNumber = this.cleanPhoneNumber(params.number);
    const endpoint = `${this.baseUrl}/message/sendText/${this.instanceName}`;

    try {
      if (!this.apiKey || this.baseUrl.includes("localhost:8080")) {
        console.info(`[EvolutionMock] Enviando texto para ${cleanNumber}: "${params.text}"`);
        return { success: true, data: { simulated: true, to: cleanNumber, text: params.text } };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          number: cleanNumber,
          text: params.text,
          delay: (params.delay || 1) * 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Evolution API Error (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      console.warn(`[EvolutionClient] Exceção ao enviar mensagem: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Enviar Mídia (Imagem, Áudio, Vídeo, Documento)
   */
  public async sendMediaMessage(
    params: SendMediaMessageParams
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const cleanNumber = this.cleanPhoneNumber(params.number);
    const endpoint = `${this.baseUrl}/message/sendMedia/${this.instanceName}`;

    try {
      if (!this.apiKey || this.baseUrl.includes("localhost:8080")) {
        console.info(`[EvolutionMock] Enviando mídia (${params.mediatype}) para ${cleanNumber}: ${params.media}`);
        return { success: true, data: { simulated: true, to: cleanNumber, media: params.media } };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          number: cleanNumber,
          mediatype: params.mediatype,
          media: params.media,
          caption: params.caption || "",
          fileName: params.fileName,
          delay: (params.delay || 1) * 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Evolution API Error: ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      console.warn(`[EvolutionClient] Exceção ao enviar mídia: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Consultar Perfil / Foto de Contato
   */
  public async fetchContact(phone: string): Promise<EvolutionContactProfile> {
    const cleanNumber = this.cleanPhoneNumber(phone);
    const endpoint = `${this.baseUrl}/chat/fetchProfile/${this.instanceName}`;

    try {
      if (!this.apiKey || this.baseUrl.includes("localhost:8080")) {
        return {
          id: cleanNumber,
          name: `Contato ${cleanNumber.slice(-4)}`,
          phone: cleanNumber,
          isGroup: false,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ number: cleanNumber }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: cleanNumber,
          name: data?.name || data?.pushName || `Contato ${cleanNumber.slice(-4)}`,
          phone: cleanNumber,
          profilePicUrl: data?.profilePicUrl,
          isGroup: cleanNumber.includes("@g.us"),
        };
      }
    } catch (err) {
      console.warn(`[EvolutionClient] Erro ao consultar perfil: ${err}`);
    }

    return {
      id: cleanNumber,
      name: `Contato ${cleanNumber.slice(-4)}`,
      phone: cleanNumber,
      isGroup: false,
    };
  }

  /**
   * Verificar Status da Instância
   */
  public async checkInstanceStatus(): Promise<{ state: "open" | "close" | "connecting" | "unknown"; details?: unknown }> {
    const endpoint = `${this.baseUrl}/instance/connectionState/${this.instanceName}`;

    try {
      if (!this.apiKey || this.baseUrl.includes("localhost:8080")) {
        return { state: "open", details: { status: "Simulado / Conectado Localmente" } };
      }

      const res = await fetch(endpoint, { headers: this.headers });
      if (res.ok) {
        const data = await res.json();
        return { state: data?.instance?.state || "unknown", details: data };
      }
    } catch (err) {
      // Ignored for fallback
    }

    return { state: "close" };
  }
}
