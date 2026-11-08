import { FlowData, Chatbot, ChatbotDraft, ChatbotVersion } from "./types";
import { chatbotRepository } from "../database/repositories/chatbot.repository";
import { contactRepository } from "../database/repositories/contact.repository";
import { executionRepository } from "../database/repositories/execution.repository";
import { logRepository } from "../database/repositories/log.repository";
import { FlowEngine } from "../flow-engine/FlowEngine";
import { EngineTriggerEvent, ContactData } from "../flow-engine/types";

export class ChatbotService {
  private flowEngine: FlowEngine;

  constructor() {
    this.flowEngine = new FlowEngine();
  }

  public async listChatbots(): Promise<Chatbot[]> {
    return chatbotRepository.listAll();
  }

  public async getChatbot(id: string): Promise<Chatbot | null> {
    return chatbotRepository.findById(id);
  }

  public async createChatbot(name: string, description?: string): Promise<Chatbot> {
    return chatbotRepository.create(name, description || "");
  }

  public async updateChatbot(id: string, updates: Partial<Chatbot>): Promise<Chatbot | null> {
    return chatbotRepository.update(id, updates);
  }

  public async deleteChatbot(id: string): Promise<boolean> {
    return chatbotRepository.delete(id);
  }

  public async duplicateChatbot(id: string): Promise<Chatbot | null> {
    return chatbotRepository.duplicate(id);
  }

  public async getDraft(chatbotId: string): Promise<ChatbotDraft | null> {
    return chatbotRepository.getDraft(chatbotId);
  }

  public async saveDraft(chatbotId: string, flowData: FlowData): Promise<ChatbotDraft> {
    return chatbotRepository.saveDraft(chatbotId, flowData);
  }

  /**
   * Publishes the current draft into an immutable snapshot version.
   */
  public async publishChatbot(chatbotId: string, changelog?: string): Promise<ChatbotVersion> {
    const version = await chatbotRepository.publishDraft(chatbotId, changelog);

    await logRepository.insert({
      chatbot_id: chatbotId,
      level: "info",
      node_id: "system",
      message: `Versão ${version.version_number} publicada com sucesso.`,
      details: { versionId: version.id, changelog: version.changelog },
    });

    return version;
  }

  public async getVersions(chatbotId: string): Promise<ChatbotVersion[]> {
    return chatbotRepository.getVersions(chatbotId);
  }

  /**
   * Simulates/tests execution of a flow in draft mode or published mode.
   * This allows the user to test the chatbot visual editor interactively!
   */
  public async simulateExecution(
    flowData: FlowData,
    testContact: Partial<ContactData> & { phone: string },
    messageText?: string,
    existingVariables: Record<string, string> = {}
  ) {
    const contact: ContactData = {
      id: "sim_contact_1",
      name: testContact.name || "Usuário de Teste",
      phone: testContact.phone || "5511999999999",
      tags: testContact.tags || [],
      variables: { ...existingVariables, ...testContact.variables },
    };

    const dummyState = {
      id: "sim_state_1",
      contact_id: contact.id,
      chatbot_id: "sim_bot",
      chatbot_version_id: "sim_ver",
      current_node_id: null,
      status: "active" as const,
      variables: { ...contact.variables },
      resume_at: null,
      execution_context: { history: [] },
      last_interaction_at: new Date().toISOString(),
    };

    const triggerEvent: EngineTriggerEvent = {
      type: messageText ? "user_reply" : "new_conversation",
      messageText,
      timestamp: new Date().toISOString(),
    };

    const result = await this.flowEngine.execute(flowData, contact, dummyState, triggerEvent);
    return result;
  }
}

export const chatbotService = new ChatbotService();
