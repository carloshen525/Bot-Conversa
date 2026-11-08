import { InstanceInfo } from "../../evolution/provider.interface";
import { generateId } from "../../shared/utils";

export interface ChannelConfig {
  id: string;
  provider: "evolution";
  baseUrl: string;
  apiKey: string;
  selectedInstanceName: string | null;
  isConnected: boolean;
  lastTestedAt: string | null;
  lastSyncedAt: string | null;
  instances: InstanceInfo[];
}

declare global {
  // eslint-disable-next-line no-var
  var __BOT_CONVERSA_CHANNEL_CONFIG__: ChannelConfig | undefined;
}

if (!global.__BOT_CONVERSA_CHANNEL_CONFIG__) {
  // Initial seed configuration with realistic default instances
  const defaultInstances: InstanceInfo[] = [
    {
      id: "inst_vendas",
      name: "vendas",
      status: "open",
      number: "5535999999999",
      profileName: "Carlos Henrique - Atendimento",
      profilePictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      webhookUrl: "http://localhost:3000/api/webhooks/evolution",
      webhookEnabled: true,
      isDefault: true,
    },
    {
      id: "inst_suporte",
      name: "suporte",
      status: "open",
      number: "5535988888888",
      profileName: "Suporte Técnico XYZ",
      profilePictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      webhookUrl: "",
      webhookEnabled: false,
      isDefault: false,
    },
  ];

  global.__BOT_CONVERSA_CHANNEL_CONFIG__ = {
    id: "cfg_evolution_main",
    provider: "evolution",
    baseUrl: process.env.NEXT_PUBLIC_EVOLUTION_API_URL || "http://localhost:8080",
    apiKey: process.env.EVOLUTION_API_KEY || "evolution_secret_key_v1",
    selectedInstanceName: "vendas",
    isConnected: true,
    lastTestedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    instances: defaultInstances,
  };
}

export class ChannelRepository {
  private get config() {
    return global.__BOT_CONVERSA_CHANNEL_CONFIG__!;
  }

  public async getConfig(): Promise<ChannelConfig> {
    return { ...this.config };
  }

  public async updateConfig(updates: Partial<ChannelConfig>): Promise<ChannelConfig> {
    Object.assign(this.config, updates);
    return { ...this.config };
  }

  public async getInstances(): Promise<InstanceInfo[]> {
    return [...this.config.instances];
  }

  public async setInstances(instances: InstanceInfo[]): Promise<void> {
    let selected = this.config.selectedInstanceName;
    const exists = instances.some((i) => i.name === selected);

    // If current selected does not exist in the fetched instances, auto-select the first connected or first instance
    if (!exists && instances.length > 0) {
      const firstOpen = instances.find((i) => i.status === "open") || instances[0];
      selected = firstOpen.name;
      this.config.selectedInstanceName = selected;
    }

    const mapped = instances.map((inst) => ({
      ...inst,
      isDefault: inst.name === selected,
    }));
    this.config.instances = mapped;
    this.config.lastSyncedAt = new Date().toISOString();
  }

  public async selectInstance(instanceName: string): Promise<InstanceInfo | null> {
    const target = this.config.instances.find((i) => i.name === instanceName);
    if (!target) return null;

    this.config.selectedInstanceName = instanceName;
    this.config.instances = this.config.instances.map((i) => ({
      ...i,
      isDefault: i.name === instanceName,
    }));

    return target;
  }

  public async getActiveInstance(): Promise<InstanceInfo | null> {
    if (!this.config.selectedInstanceName) {
      return this.config.instances.find((i) => i.isDefault) || this.config.instances[0] || null;
    }
    return (
      this.config.instances.find((i) => i.name === this.config.selectedInstanceName) ||
      this.config.instances[0] ||
      null
    );
  }

  public async updateInstanceWebhook(
    instanceName: string,
    webhookUrl: string,
    webhookEnabled: boolean
  ): Promise<void> {
    const inst = this.config.instances.find((i) => i.name === instanceName);
    if (inst) {
      inst.webhookUrl = webhookUrl;
      inst.webhookEnabled = webhookEnabled;
      inst.updatedAt = new Date().toISOString();
    }
  }
}

export const channelRepository = new ChannelRepository();
