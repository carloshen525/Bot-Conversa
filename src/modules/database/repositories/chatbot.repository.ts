import { FlowData, Chatbot, ChatbotDraft, ChatbotVersion } from "../../chatbots/types";
import { generateId } from "../../shared/utils";

// Initial seed data so the user has immediate working examples
const DEFAULT_INITIAL_FLOW: FlowData = {
  nodes: [
    {
      id: "node_start_1",
      type: "startNode",
      position: { x: 250, y: 100 },
      data: {
        label: "Início",
        triggerType: "keyword",
        keywords: ["oi", "ola", "comecar", "menu"],
        description: "Disparado quando o usuário envia mensagem inicial",
      },
    },
    {
      id: "node_msg_1",
      type: "messageNode",
      position: { x: 250, y: 260 },
      data: {
        label: "Boas-vindas",
        messageType: "text",
        content: "Olá {{nome}}! Seja bem-vindo ao nosso atendimento automatizado.\n\nComo posso te ajudar hoje?\n1 - Falar com consultor\n2 - Dúvidas frequentes\n3 - Finalizar",
        delaySeconds: 1,
      },
    },
    {
      id: "node_wait_1",
      type: "waitNode",
      position: { x: 250, y: 440 },
      data: {
        label: "Aguardar Opção",
        waitType: "user_reply",
      },
    },
    {
      id: "node_condition_1",
      type: "conditionNode",
      position: { x: 250, y: 600 },
      data: {
        label: "Checar Resposta",
        branches: [
          {
            id: "branch_1",
            label: "Opção 1 (Consultor)",
            operator: "message_contains",
            value: "1",
          },
          {
            id: "branch_2",
            label: "Opção 2 (Dúvidas)",
            operator: "message_contains",
            value: "2",
          },
          {
            id: "branch_3",
            label: "Opção 3 (Sair)",
            operator: "message_contains",
            value: "3",
          },
        ],
      },
    },
    {
      id: "node_tag_1",
      type: "addTagNode",
      position: { x: -20, y: 800 },
      data: {
        label: "Tag Consultor",
        tagName: "Interesse_Consultoria",
      },
    },
    {
      id: "node_msg_consultor",
      type: "messageNode",
      position: { x: -20, y: 940 },
      data: {
        label: "Mensagem Consultor",
        messageType: "text",
        content: "Perfeito, {{nome}}! Já transferi seu chamado para nossa equipe comercial. Em breve alguém te responderá por aqui.",
        delaySeconds: 1,
      },
    },
    {
      id: "node_end_consultor",
      type: "endNode",
      position: { x: -20, y: 1100 },
      data: {
        label: "Fim do Atendimento",
        reason: "Transferido para consultor humano",
      },
    },
    {
      id: "node_msg_duvidas",
      type: "messageNode",
      position: { x: 250, y: 800 },
      data: {
        label: "Mensagem FAQ",
        messageType: "text",
        content: "Nosso horário de funcionamento é das 09h às 18h de segunda a sexta. Para mais detalhes acesse nosso site!",
        delaySeconds: 1,
      },
    },
    {
      id: "node_end_duvidas",
      type: "endNode",
      position: { x: 250, y: 960 },
      data: {
        label: "Fim FAQ",
        reason: "Dúvida respondida",
      },
    },
    {
      id: "node_end_default",
      type: "endNode",
      position: { x: 520, y: 800 },
      data: {
        label: "Encerramento",
        reason: "Opção 3 ou não reconhecida",
      },
    },
  ],
  edges: [
    { id: "e1", source: "node_start_1", target: "node_msg_1" },
    { id: "e2", source: "node_msg_1", target: "node_wait_1" },
    { id: "e3", source: "node_wait_1", target: "node_condition_1" },
    { id: "e4", source: "node_condition_1", sourceHandle: "branch_1", target: "node_tag_1" },
    { id: "e5", source: "node_tag_1", target: "node_msg_consultor" },
    { id: "e6", source: "node_msg_consultor", target: "node_end_consultor" },
    { id: "e7", source: "node_condition_1", sourceHandle: "branch_2", target: "node_msg_duvidas" },
    { id: "e8", source: "node_msg_duvidas", target: "node_end_duvidas" },
    { id: "e9", source: "node_condition_1", sourceHandle: "branch_3", target: "node_end_default" },
    { id: "e10", source: "node_condition_1", sourceHandle: "default", target: "node_end_default" },
  ],
  settings: {
    defaultDelayBetweenMessages: 1,
    sessionTimeoutHours: 24,
    fallbackMessage: "Desculpe, não entendi sua resposta.",
  },
  triggers: [
    {
      id: "trig_1",
      type: "keyword",
      keywords: ["oi", "ola", "comecar", "menu"],
    },
  ],
};

// Global in-memory storage for high reliability across Next.js API calls in dev
declare global {
  // eslint-disable-next-line no-var
  var __BOT_CONVERSA_DB__:
    | {
        chatbots: Map<string, Chatbot>;
        drafts: Map<string, ChatbotDraft>;
        versions: Map<string, ChatbotVersion>;
      }
    | undefined;
}

if (!global.__BOT_CONVERSA_DB__) {
  global.__BOT_CONVERSA_DB__ = {
    chatbots: new Map(),
    drafts: new Map(),
    versions: new Map(),
  };

  // Seed default chatbot
  const defaultBotId = "bot_onboarding_demo";
  const defaultVersionId = "ver_onboarding_v1";

  const defaultBot: Chatbot = {
    id: defaultBotId,
    name: "Atendimento Geral & Boas-Vindas",
    description: "Fluxo padrão de recepção de clientes com menu e triagem automática",
    status: "published",
    current_published_version_id: defaultVersionId,
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  };

  const defaultDraft: ChatbotDraft = {
    id: `draft_${defaultBotId}`,
    chatbot_id: defaultBotId,
    flow_data: JSON.parse(JSON.stringify(DEFAULT_INITIAL_FLOW)),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  };

  const defaultVersion: ChatbotVersion = {
    id: defaultVersionId,
    chatbot_id: defaultBotId,
    version_number: 1,
    flow_data: JSON.parse(JSON.stringify(DEFAULT_INITIAL_FLOW)),
    changelog: "Versão inicial publicada com triagem e tags",
    published_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  };

  global.__BOT_CONVERSA_DB__.chatbots.set(defaultBotId, defaultBot);
  global.__BOT_CONVERSA_DB__.drafts.set(defaultBotId, defaultDraft);
  global.__BOT_CONVERSA_DB__.versions.set(defaultVersionId, defaultVersion);
}

export class ChatbotRepository {
  private get store() {
    return global.__BOT_CONVERSA_DB__!;
  }

  public async listAll(): Promise<Chatbot[]> {
    const bots = Array.from(this.store.chatbots.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return bots.map((bot) => {
      const currentVer = bot.current_published_version_id
        ? this.store.versions.get(bot.current_published_version_id) || null
        : null;
      return {
        ...bot,
        current_version: currentVer,
      };
    });
  }

  public async findById(id: string): Promise<Chatbot | null> {
    const bot = this.store.chatbots.get(id);
    if (!bot) return null;

    const currentVer = bot.current_published_version_id
      ? this.store.versions.get(bot.current_published_version_id) || null
      : null;

    const draft = this.store.drafts.get(id) || null;

    return {
      ...bot,
      current_version: currentVer,
      draft,
    };
  }

  public async create(name: string, description: string = ""): Promise<Chatbot> {
    const id = generateId("bot");
    const now = new Date().toISOString();

    const emptyFlow: FlowData = {
      nodes: [
        {
          id: generateId("node_start"),
          type: "startNode",
          position: { x: 250, y: 150 },
          data: {
            label: "Início",
            triggerType: "keyword",
            keywords: ["oi", "ola", "comecar"],
          },
        },
      ],
      edges: [],
      settings: { defaultDelayBetweenMessages: 1 },
      triggers: [{ id: generateId("trig"), type: "keyword", keywords: ["oi", "ola"] }],
    };

    const chatbot: Chatbot = {
      id,
      name,
      description,
      status: "draft",
      current_published_version_id: null,
      created_at: now,
      updated_at: now,
    };

    const draft: ChatbotDraft = {
      id: generateId("draft"),
      chatbot_id: id,
      flow_data: emptyFlow,
      updated_at: now,
    };

    this.store.chatbots.set(id, chatbot);
    this.store.drafts.set(id, draft);

    return chatbot;
  }

  public async update(id: string, updates: Partial<Chatbot>): Promise<Chatbot | null> {
    const existing = this.store.chatbots.get(id);
    if (!existing) return null;

    const updated: Chatbot = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.store.chatbots.set(id, updated);
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    if (!this.store.chatbots.has(id)) return false;
    this.store.chatbots.delete(id);
    this.store.drafts.delete(id);

    // Delete associated versions
    for (const [vId, v] of Array.from(this.store.versions.entries())) {
      if (v.chatbot_id === id) {
        this.store.versions.delete(vId);
      }
    }
    return true;
  }

  public async duplicate(id: string): Promise<Chatbot | null> {
    const source = await this.findById(id);
    if (!source) return null;

    const newBot = await this.create(`${source.name} (Cópia)`, source.description);
    const sourceDraft = this.store.drafts.get(id);

    if (sourceDraft) {
      await this.saveDraft(newBot.id, sourceDraft.flow_data);
    }

    return this.findById(newBot.id);
  }

  /**
   * DRAFT MANAGEMENT: Updates ONLY the draft, never touches published versions!
   */
  public async getDraft(chatbotId: string): Promise<ChatbotDraft | null> {
    return this.store.drafts.get(chatbotId) || null;
  }

  public async saveDraft(chatbotId: string, flowData: FlowData): Promise<ChatbotDraft> {
    const now = new Date().toISOString();
    const existingDraft = this.store.drafts.get(chatbotId);

    const draft: ChatbotDraft = {
      id: existingDraft?.id || generateId("draft"),
      chatbot_id: chatbotId,
      flow_data: flowData,
      updated_at: now,
    };

    this.store.drafts.set(chatbotId, draft);

    // Also update chatbot updated_at
    const bot = this.store.chatbots.get(chatbotId);
    if (bot) {
      bot.updated_at = now;
      this.store.chatbots.set(chatbotId, bot);
    }

    return draft;
  }

  /**
   * PUBLISHING: Creates an immutable published snapshot!
   * Increments version number (v1, v2, v3...)
   * Updates chatbots.current_published_version_id
   */
  public async publishDraft(chatbotId: string, changelog: string = ""): Promise<ChatbotVersion> {
    const bot = this.store.chatbots.get(chatbotId);
    if (!bot) throw new Error("Chatbot não encontrado");

    const draft = this.store.drafts.get(chatbotId);
    if (!draft) throw new Error("Rascunho não encontrado");

    // Calculate next version number
    const existingVersions = Array.from(this.store.versions.values()).filter(
      (v) => v.chatbot_id === chatbotId
    );
    const nextVersionNumber = existingVersions.length + 1;

    // Deep clone the flowData to guarantee snapshot immutability
    const snapshotFlowData: FlowData = JSON.parse(JSON.stringify(draft.flow_data));

    const versionId = generateId("ver");
    const now = new Date().toISOString();

    const newVersion: ChatbotVersion = {
      id: versionId,
      chatbot_id: chatbotId,
      version_number: nextVersionNumber,
      flow_data: snapshotFlowData,
      changelog: changelog || `Publicação da versão ${nextVersionNumber}`,
      published_at: now,
    };

    this.store.versions.set(versionId, newVersion);

    // Update chatbot status and current published version pointer
    bot.status = "published";
    bot.current_published_version_id = versionId;
    bot.updated_at = now;
    this.store.chatbots.set(chatbotId, bot);

    return newVersion;
  }

  public async getVersions(chatbotId: string): Promise<ChatbotVersion[]> {
    return Array.from(this.store.versions.values())
      .filter((v) => v.chatbot_id === chatbotId)
      .sort((a, b) => b.version_number - a.version_number);
  }

  public async getVersionById(versionId: string): Promise<ChatbotVersion | null> {
    return this.store.versions.get(versionId) || null;
  }
}

export const chatbotRepository = new ChatbotRepository();
