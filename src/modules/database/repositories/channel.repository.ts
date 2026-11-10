import fs from "fs";
import path from "path";
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

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "channel-config.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPersistedConfig(): ChannelConfig | null {
  try {
    ensureDataDir();
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("[ChannelRepository] Erro ao carregar channel-config.json:", err);
  }
  return null;
}

function savePersistedConfig(config: ChannelConfig) {
  try {
    ensureDataDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("[ChannelRepository] Erro ao salvar channel-config.json:", err);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __BOT_CONVERSA_CHANNEL_CONFIG__: ChannelConfig | undefined;
}

if (!global.__BOT_CONVERSA_CHANNEL_CONFIG__) {
  const persisted = loadPersistedConfig();

  if (persisted) {
    global.__BOT_CONVERSA_CHANNEL_CONFIG__ = persisted;
  } else {
    const defaultInstances: InstanceInfo[] = [
      {
        id: "inst_default",
        name: "default",
        status: "open",
        number: "5535999999999",
        profileName: "Atendimento",
        profilePictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        updatedAt: new Date().toISOString(),
        webhookUrl: "http://localhost:3000/api/webhooks/evolution",
        webhookEnabled: true,
        isDefault: true,
      },
    ];

    global.__BOT_CONVERSA_CHANNEL_CONFIG__ = {
      id: "cfg_evolution_main",
      provider: "evolution",
      baseUrl: process.env.NEXT_PUBLIC_EVOLUTION_API_URL || "http://localhost:8080",
      apiKey: process.env.EVOLUTION_API_KEY || "",
      selectedInstanceName: process.env.EVOLUTION_INSTANCE_NAME || "default",
      isConnected: true,
      lastTestedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      instances: defaultInstances,
    };

    savePersistedConfig(global.__BOT_CONVERSA_CHANNEL_CONFIG__);
  }
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
    savePersistedConfig(this.config);
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
    savePersistedConfig(this.config);
  }

  public async selectInstance(instanceName: string): Promise<InstanceInfo | null> {
    const target = this.config.instances.find((i) => i.name === instanceName);
    if (!target) return null;

    this.config.selectedInstanceName = instanceName;
    this.config.instances = this.config.instances.map((i) => ({
      ...i,
      isDefault: i.name === instanceName,
    }));

    savePersistedConfig(this.config);
    return target;
  }

  public async getActiveInstance(): Promise<InstanceInfo | null> {
    const selected = this.config.selectedInstanceName;
    if (selected) {
      const match = this.config.instances.find((i) => i.name === selected);
      if (match) return match;
      return {
        id: `inst_${selected}`,
        name: selected,
        status: "open",
        updatedAt: new Date().toISOString(),
        isDefault: true,
      };
    }
    return this.config.instances.find((i) => i.isDefault) || this.config.instances[0] || null;
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
      savePersistedConfig(this.config);
    }
  }
}

export const channelRepository = new ChannelRepository();
