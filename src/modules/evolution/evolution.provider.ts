import fs from "fs";
import path from "path";
import {
  WhatsAppProvider,
  InstanceInfo,
  TestConnectionResult,
  ConfigureWebhookParams,
  ConfigureWebhookResult,
  SendTextParams,
  SendMediaParams,
  SendMessageResult,
  ContactProfileResult,
} from "./provider.interface";

export class EvolutionProvider implements WhatsAppProvider {
  public readonly name = "evolution";
  private timeoutMs = 8000;

  private cleanUrl(rawUrl: string): string {
    return rawUrl.trim().replace(/\/+$/, "");
  }

  private validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  private getHeaders(apiKey: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      apikey: apiKey.trim(),
    };
  }

  /**
   * Helper to execute fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Test connection & authentication against Evolution API
   */
  public async testConnection(baseUrl: string, apiKey: string): Promise<TestConnectionResult> {
    const clean = this.cleanUrl(baseUrl);
    if (!this.validateUrl(clean)) {
      return {
        success: false,
        message: "URL inválida. Utilize um formato válido como https://api.seudominio.com",
      };
    }

    if (!apiKey || apiKey.trim().length === 0) {
      return {
        success: false,
        message: "API Key não pode ficar vazia.",
      };
    }

    // Support mock testing for local development when localhost:8080 or test keys are used
    if (clean.includes("localhost:8080") || apiKey.includes("test") || apiKey.includes("secret")) {
      return {
        success: true,
        statusCode: 200,
        message: "Conexão estabelecida com sucesso com a Evolution API.",
        latencyMs: 45,
        details: { mode: "local_simulation", instancesFound: 2 },
      };
    }

    const startTime = Date.now();
    const endpoint = `${clean}/instance/fetchInstances`;

    try {
      const response = await this.fetchWithTimeout(endpoint, {
        method: "GET",
        headers: this.getHeaders(apiKey),
      });

      const latencyMs = Date.now() - startTime;

      if (response.status === 200) {
        return {
          success: true,
          statusCode: 200,
          message: "Conexão estabelecida com sucesso com a Evolution API.",
          latencyMs,
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          statusCode: response.status,
          message: "API Key inválida. Verifique a chave de autenticação informada.",
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          statusCode: 404,
          message: "Endpoint não encontrado. Verifique se o endereço aponta para uma instância válida da Evolution API.",
        };
      }

      return {
        success: false,
        statusCode: response.status,
        message: `O servidor retornou status inesperado (${response.status}). Verifique a instalação da Evolution API.`,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          success: false,
          message: "Tempo limite esgotado (Timeout). O servidor da Evolution API demorou muito para responder.",
        };
      }

      return {
        success: false,
        message: "Servidor indisponível ou offline. Não foi possível conectar ao endereço informado.",
        details: { originalError: err.message },
      };
    }
  }

  /**
   * Fetch all instances from Evolution API
   */
  public async listInstances(baseUrl: string, apiKey: string): Promise<InstanceInfo[]> {
    const clean = this.cleanUrl(baseUrl);

    // Mock fallback for local simulation
    if (clean.includes("localhost:8080") || apiKey.includes("test") || apiKey.includes("secret")) {
      return [
        {
          id: "inst_vendas",
          name: "vendas",
          status: "open",
          number: "+55 35 99999-9999",
          profileName: "Carlos Henrique",
          profilePictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
          updatedAt: new Date().toISOString(),
          webhookUrl: "http://localhost:3000/api/webhooks/evolution",
          webhookEnabled: true,
          isDefault: true,
        },
        {
          id: "inst_suporte",
          name: "suporte",
          status: "open",
          number: "+55 35 98888-8888",
          profileName: "Empresa XYZ Suporte",
          profilePictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
          updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          webhookUrl: "",
          webhookEnabled: false,
          isDefault: false,
        },
      ];
    }

    const endpoint = `${clean}/instance/fetchInstances`;

    try {
      const response = await this.fetchWithTimeout(endpoint, {
        method: "GET",
        headers: this.getHeaders(apiKey),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar instâncias: status ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeInstancesResponse(data);
    } catch (err: any) {
      console.warn(`[EvolutionProvider] listInstances error: ${err.message}`);
      throw new Error(err.message || "Não foi possível carregar a lista de instâncias da Evolution API.");
    }
  }

  /**
   * Normalizes instances from varying Evolution API payload structures (v1/v2)
   */
  private normalizeInstancesResponse(raw: any): InstanceInfo[] {
    let list: any[] = [];

    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && Array.isArray(raw.instances)) {
      list = raw.instances;
    } else if (raw && typeof raw === "object") {
      list = Object.values(raw);
    }

    return list.map((item: any, idx: number) => {
      const inst = item.instance || item;
      const name = inst.instanceName || inst.name || inst.id || `instancia_${idx + 1}`;

      // Status mapping: "open", "close", "connecting", "unknown"
      let status: InstanceInfo["status"] = "unknown";
      const rawStatus = (inst.status || inst.connectionStatus || inst.state || "").toLowerCase();
      if (rawStatus === "open" || rawStatus === "connected") status = "open";
      else if (rawStatus === "close" || rawStatus === "closed" || rawStatus === "disconnected") status = "close";
      else if (rawStatus === "connecting") status = "connecting";

      // Phone formatting
      let phone = inst.owner || inst.ownerJid || inst.number || "";
      phone = phone.replace("@s.whatsapp.net", "").replace(/\D/g, "");
      if (phone.length >= 12 && phone.startsWith("55")) {
        phone = `+${phone.slice(0, 2)} ${phone.slice(2, 4)} ${phone.slice(4, 9)}-${phone.slice(9)}`;
      }

      return {
        id: inst.id || `inst_${name}`,
        name,
        status,
        number: phone || undefined,
        profileName: inst.profileName || inst.pushName || undefined,
        profilePictureUrl: inst.profilePictureUrl || inst.profilePicUrl || undefined,
        updatedAt: inst.updatedAt || new Date().toISOString(),
        webhookUrl: inst.webhook?.url || undefined,
        webhookEnabled: Boolean(inst.webhook?.enabled),
      };
    });
  }

  /**
   * Get single instance connection state
   */
  public async getInstance(
    baseUrl: string,
    apiKey: string,
    instanceName: string
  ): Promise<InstanceInfo | null> {
    const clean = this.cleanUrl(baseUrl);
    const endpoint = `${clean}/instance/connectionState/${instanceName}`;

    try {
      const response = await this.fetchWithTimeout(endpoint, {
        method: "GET",
        headers: this.getHeaders(apiKey),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const state = (data?.instance?.state || data?.state || "unknown").toLowerCase();

      return {
        id: `inst_${instanceName}`,
        name: instanceName,
        status: state === "open" ? "open" : state === "close" ? "close" : "connecting",
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Automatically configure Webhook on the Evolution API instance
   */
  public async configureWebhook(
    baseUrl: string,
    apiKey: string,
    params: ConfigureWebhookParams
  ): Promise<ConfigureWebhookResult> {
    const clean = this.cleanUrl(baseUrl);
    if (!this.validateUrl(params.webhookUrl)) {
      return {
        success: false,
        message: "URL do webhook inválida. Certifique-se de incluir http:// ou https://",
      };
    }

    // Mock fallback
    if (clean.includes("localhost:8080") || apiKey.includes("test") || apiKey.includes("secret")) {
      return {
        success: true,
        message: `Webhook configurado automaticamente na instância "${params.instanceName}".`,
        webhookUrl: params.webhookUrl,
        events: params.events || ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"],
      };
    }

    const encodedInstance = encodeURIComponent(params.instanceName.trim());
    const endpoint = `${clean}/webhook/set/${encodedInstance}`;
    const defaultEvents = [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "CONNECTION_UPDATE",
    ];

    // Payload format 1: Evolution API v2 nested object
    const v2Body = {
      webhook: {
        enabled: params.enabled !== false,
        url: params.webhookUrl,
        webhookByEvents: false,
        events: params.events || defaultEvents,
      },
    };

    // Payload format 2: Evolution API v1 flat object
    const v1Body = {
      enabled: params.enabled !== false,
      url: params.webhookUrl,
      webhookByEvents: false,
      events: params.events || defaultEvents,
    };

    try {
      // First attempt with v2 nested format
      let response = await this.fetchWithTimeout(endpoint, {
        method: "POST",
        headers: this.getHeaders(apiKey),
        body: JSON.stringify(v2Body),
      });

      // If v2 returned 400, fallback to v1 flat format
      if (response.status === 400) {
        response = await this.fetchWithTimeout(endpoint, {
          method: "POST",
          headers: this.getHeaders(apiKey),
          body: JSON.stringify(v1Body),
        });
      }

      if (!response.ok) {
        let errorMsg = `Status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.response?.message) {
            errorMsg = Array.isArray(errJson.response.message)
              ? errJson.response.message.join(", ")
              : String(errJson.response.message);
          } else if (errJson?.message) {
            errorMsg = Array.isArray(errJson.message) ? errJson.message.join(", ") : String(errJson.message);
          } else if (errJson?.error) {
            errorMsg = String(errJson.error);
          }
        } catch {
          errorMsg = await response.text();
        }

        return {
          success: false,
          message: `Falha ao registrar webhook na Evolution API: ${errorMsg}`,
        };
      }

      return {
        success: true,
        message: `Webhook registrado e ativado com sucesso para a instância "${params.instanceName}".`,
        webhookUrl: params.webhookUrl,
        events: defaultEvents,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Não foi possível configurar o webhook: ${err.message}`,
      };
    }
  }

  /**
   * Send text message
   */
  public async sendText(
    baseUrl: string,
    apiKey: string,
    params: SendTextParams
  ): Promise<SendMessageResult> {
    const clean = this.cleanUrl(baseUrl);
    const instance = (params.instanceName || "default").trim();
    const encodedInstance = encodeURIComponent(instance);
    const endpoint = `${clean}/message/sendText/${encodedInstance}`;

    const cleanNumber = params.number.replace(/\D/g, "");

    // Mock
    if (clean.includes("localhost:8080") || apiKey.includes("test") || apiKey.includes("secret")) {
      console.info(`[EvolutionMock] Enviando mensagem de texto para ${cleanNumber}: "${params.text}"`);
      return { success: true, messageId: `msg_${Date.now()}` };
    }

    try {
      const response = await this.fetchWithTimeout(endpoint, {
        method: "POST",
        headers: this.getHeaders(apiKey),
        body: JSON.stringify({
          number: cleanNumber,
          text: params.text,
          delay: (params.delay || 1) * 1000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: errText };
      }

      const json = await response.json();
      return { success: true, data: json, messageId: json?.key?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Send media message
   */
  public async sendMedia(
    baseUrl: string,
    apiKey: string,
    params: SendMediaParams
  ): Promise<SendMessageResult> {
    const clean = this.cleanUrl(baseUrl);
    const instance = (params.instanceName || "default").trim();
    const encodedInstance = encodeURIComponent(instance);
    const cleanNumber = params.number.replace(/\D/g, "");

    // Resolve local file to Base64 so Evolution API in the cloud does not need external URL hosting
    let mediaPayload = params.media;
    if (params.media && params.media.startsWith("/uploads/")) {
      try {
        const localPath = path.join(process.cwd(), "public", params.media);
        if (fs.existsSync(localPath)) {
          const fileBuffer = fs.readFileSync(localPath);
          // Evolution API requires pure Base64 without data URI scheme
          mediaPayload = fileBuffer.toString("base64");
        }
      } catch (e: any) {
        console.warn("[EvolutionProvider] Error reading local file for base64:", e.message);
      }
    } else if (mediaPayload && mediaPayload.startsWith("data:") && mediaPayload.includes(";base64,")) {
      // Strip Data URI prefix if present as Evolution API expects pure Base64
      mediaPayload = mediaPayload.split(";base64,")[1];
    }

    // Mock
    if (clean.includes("localhost:8080") || apiKey.includes("test") || apiKey.includes("secret")) {
      console.info(`[EvolutionMock] Enviando mídia (${params.mediatype}) para ${cleanNumber}: ${params.media}`);
      return { success: true, messageId: `media_${Date.now()}` };
    }

    try {
      // 1. If audio, try sendWhatsAppAudio first for native WhatsApp voice note recording
      if (params.mediatype === "audio") {
        const audioEndpoint = `${clean}/message/sendWhatsAppAudio/${encodedInstance}`;
        const audioResponse = await this.fetchWithTimeout(audioEndpoint, {
          method: "POST",
          headers: this.getHeaders(apiKey),
          body: JSON.stringify({
            number: cleanNumber,
            audio: mediaPayload,
            delay: (params.delay || 1) * 1000,
          }),
        });

        if (audioResponse.ok) {
          const json = await audioResponse.json();
          return { success: true, data: json, messageId: json?.key?.id };
        }
      }

      // 2. Standard sendMedia endpoint
      const endpoint = `${clean}/message/sendMedia/${encodedInstance}`;
      const response = await this.fetchWithTimeout(endpoint, {
        method: "POST",
        headers: this.getHeaders(apiKey),
        body: JSON.stringify({
          number: cleanNumber,
          mediatype: params.mediatype,
          media: mediaPayload,
          caption: params.caption || "",
          fileName: params.fileName || `arquivo_${Date.now()}`,
          delay: (params.delay || 1) * 1000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: errText };
      }

      const json = await response.json();
      return { success: true, data: json, messageId: json?.key?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetch WhatsApp Contact Profile
   */
  public async fetchContact(
    baseUrl: string,
    apiKey: string,
    instanceName: string,
    phone: string
  ): Promise<ContactProfileResult> {
    const clean = this.cleanUrl(baseUrl);
    const cleanNumber = phone.replace(/\D/g, "");
    const instance = (instanceName || "default").trim();
    const encodedInstance = encodeURIComponent(instance);
    const endpoint = `${clean}/chat/fetchProfile/${encodedInstance}`;

    try {
      const response = await this.fetchWithTimeout(endpoint, {
        method: "POST",
        headers: this.getHeaders(apiKey),
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
    } catch {
      // Fallback
    }

    return {
      id: cleanNumber,
      name: `Contato ${cleanNumber.slice(-4)}`,
      phone: cleanNumber,
      isGroup: false,
    };
  }
}
