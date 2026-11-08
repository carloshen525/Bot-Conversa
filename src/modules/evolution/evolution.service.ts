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
import { EvolutionProvider } from "./evolution.provider";
import { channelRepository, ChannelConfig } from "../database/repositories/channel.repository";
import { logRepository } from "../database/repositories/log.repository";

export class EvolutionService {
  private provider: WhatsAppProvider;

  constructor(provider?: WhatsAppProvider) {
    this.provider = provider || new EvolutionProvider();
  }

  /**
   * Retrieves active Evolution configuration
   */
  public async getConfig(): Promise<ChannelConfig> {
    return channelRepository.getConfig();
  }

  /**
   * Updates Evolution configuration (URL, API Key, selected instance)
   */
  public async saveConfig(
    baseUrl: string,
    apiKey: string,
    selectedInstanceName?: string
  ): Promise<ChannelConfig> {
    const updated = await channelRepository.updateConfig({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      selectedInstanceName: selectedInstanceName || undefined,
    });

    await logRepository.insert({
      level: "info",
      node_id: "channels",
      message: "Configurações da Evolution API salvas com sucesso.",
      details: { baseUrl, hasApiKey: Boolean(apiKey) },
    });

    return updated;
  }

  /**
   * Tests connection to Evolution API using specified credentials or stored ones
   */
  public async testConnection(
    baseUrl?: string,
    apiKey?: string
  ): Promise<TestConnectionResult> {
    const config = await this.getConfig();
    const url = baseUrl || config.baseUrl;
    const key = apiKey || config.apiKey;

    const result = await this.provider.testConnection(url, key);

    await channelRepository.updateConfig({
      isConnected: result.success,
      lastTestedAt: new Date().toISOString(),
    });

    await logRepository.insert({
      level: result.success ? "info" : "warn",
      node_id: "channels",
      message: result.success
        ? "Teste de conexão com a Evolution API concluído com sucesso."
        : `Falha no teste de conexão: ${result.message}`,
      details: { url, success: result.success, latencyMs: result.latencyMs },
    });

    return result;
  }

  /**
   * Fetches all instances, updates local cache and returns them
   */
  public async listInstances(
    baseUrl?: string,
    apiKey?: string
  ): Promise<InstanceInfo[]> {
    const config = await this.getConfig();
    const url = baseUrl || config.baseUrl;
    const key = apiKey || config.apiKey;

    const instances = await this.provider.listInstances(url, key);

    // Save discovered instances to repository
    await channelRepository.setInstances(instances);

    return channelRepository.getInstances();
  }

  /**
   * Fetches current status of a specific instance
   */
  public async getInstance(instanceName: string): Promise<InstanceInfo | null> {
    const config = await this.getConfig();
    return this.provider.getInstance(config.baseUrl, config.apiKey, instanceName);
  }

  /**
   * Sets the active default instance used by chatbots
   */
  public async selectInstance(instanceName: string): Promise<InstanceInfo> {
    const selected = await channelRepository.selectInstance(instanceName);
    if (!selected) {
      throw new Error(`Instância "${instanceName}" não encontrada.`);
    }

    await logRepository.insert({
      level: "info",
      node_id: "channels",
      message: `Instância "${instanceName}" selecionada como padrão para os chatbots.`,
    });

    return selected;
  }

  /**
   * Automatically configures webhook on the selected instance
   */
  public async configureWebhook(
    instanceName: string,
    webhookUrl: string,
    events?: string[]
  ): Promise<ConfigureWebhookResult> {
    const config = await this.getConfig();
    const result = await this.provider.configureWebhook(config.baseUrl, config.apiKey, {
      instanceName,
      webhookUrl,
      events,
    });

    if (result.success) {
      await channelRepository.updateInstanceWebhook(instanceName, webhookUrl, true);

      await logRepository.insert({
        level: "info",
        node_id: "channels",
        message: `Webhook configurado automaticamente na instância "${instanceName}".`,
        details: { webhookUrl, events: result.events },
      });
    }

    return result;
  }

  /**
   * Synchronizes all instances status from the Evolution API
   */
  public async sync(): Promise<{ instances: InstanceInfo[]; isConnected: boolean }> {
    const test = await this.testConnection();
    if (!test.success) {
      const config = await this.getConfig();
      return { instances: config.instances, isConnected: false };
    }

    const instances = await this.listInstances();
    return { instances, isConnected: true };
  }

  /**
   * Sends text message through the active or specified instance
   */
  public async sendTextMessage(params: SendTextParams): Promise<SendMessageResult> {
    const config = await this.getConfig();
    const active = await channelRepository.getActiveInstance();
    const instanceName = params.instanceName || active?.name || "default";

    return this.provider.sendText(config.baseUrl, config.apiKey, {
      ...params,
      instanceName,
    });
  }

  /**
   * Sends media message through the active or specified instance
   */
  public async sendMediaMessage(params: SendMediaParams): Promise<SendMessageResult> {
    const config = await this.getConfig();
    const active = await channelRepository.getActiveInstance();
    const instanceName = params.instanceName || active?.name || "default";

    return this.provider.sendMedia(config.baseUrl, config.apiKey, {
      ...params,
      instanceName,
    });
  }

  /**
   * Fetches contact profile through active instance
   */
  public async fetchContact(phone: string): Promise<ContactProfileResult> {
    const config = await this.getConfig();
    const active = await channelRepository.getActiveInstance();
    const instanceName = active?.name || "default";

    return this.provider.fetchContact(config.baseUrl, config.apiKey, instanceName, phone);
  }
}

export const evolutionService = new EvolutionService();
