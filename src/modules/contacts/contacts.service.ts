import { contactsRepository } from "./contacts.repository";
import { Contact, ContactsFilter, StartFlowParams, SyncContactsResult } from "./types";
import { channelRepository } from "../database/repositories/channel.repository";
import { chatbotRepository } from "../database/repositories/chatbot.repository";
import { executionRepository } from "../database/repositories/execution.repository";
import { logRepository } from "../database/repositories/log.repository";
import { contactRepository as legacyContactRepo } from "../database/repositories/contact.repository";
import { FlowEngine } from "../flow-engine/FlowEngine";
import { EvolutionApiClient } from "../evolution/client";
import { EngineTriggerEvent, ContactData } from "../flow-engine/types";

export class ContactsService {
  private flowEngine: FlowEngine;
  private evolutionClient: EvolutionApiClient;

  constructor() {
    this.flowEngine = new FlowEngine();
    this.evolutionClient = new EvolutionApiClient();
  }

  /**
   * List contacts with filters
   */
  public async listContacts(filter?: ContactsFilter): Promise<Contact[]> {
    return contactsRepository.list(filter);
  }

  /**
   * Get single contact by ID
   */
  public async getContactById(id: string): Promise<Contact | null> {
    return contactsRepository.findById(id);
  }

  /**
   * Update contact tags
   */
  public async updateTags(id: string, tags: string[]): Promise<Contact | null> {
    const updated = await contactsRepository.updateTags(id, tags);
    if (updated) {
      await legacyContactRepo.updateTags(id, tags);
    }
    return updated;
  }

  /**
   * Update contact custom variables
   */
  public async updateVariables(id: string, variables: Record<string, string>): Promise<Contact | null> {
    const updated = await contactsRepository.updateVariables(id, variables);
    if (updated) {
      await legacyContactRepo.updateVariables(id, variables);
    }
    return updated;
  }

  /**
   * Synchronize all contacts with the Evolution API
   * Extracts real phone numbers (filtering out raw WhatsApp @lid and groups)
   */
  public async syncFromEvolution(targetInstanceName?: string): Promise<SyncContactsResult> {
    // 1. Clean up any invalid/ephemeral WhatsApp LIDs that might have been stored previously
    contactsRepository.purgeInvalidLids();

    const config = await channelRepository.getConfig();
    const activeInstance = await channelRepository.getActiveInstance();
    const instanceName = targetInstanceName || activeInstance?.name || config.selectedInstanceName || "Carlos1";

    const cleanBaseUrl = config.baseUrl.trim().replace(/\/+$/, "");
    const apiKey = config.apiKey.trim();

    let totalSynced = 0;
    let newContacts = 0;
    let updatedContacts = 0;

    // 2. Fetch all real phone contacts from Evolution API (/chat/findContacts)
    try {
      const contactsRes = await fetch(
        `${cleanBaseUrl}/chat/findContacts/${encodeURIComponent(instanceName)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify({}),
        }
      );

      if (contactsRes.ok) {
        const contactsData: any[] = await contactsRes.json();
        for (const item of contactsData) {
          if (item.isGroup || item.type === "group") continue;

          const remoteJid = String(item.remoteJid || item.id || "");
          if (!remoteJid.includes("@s.whatsapp.net") || remoteJid.startsWith("0@")) continue;

          const cleanPhone = remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
          // Valid phone numbers are strictly between 10 and 13 digits
          if (cleanPhone.length < 10 || cleanPhone.length > 13) continue;

          const existing = await contactsRepository.findByPhone(cleanPhone);
          const isNew = !existing;

          const contactName =
            item.pushName || item.name || existing?.name || `WhatsApp ${cleanPhone.slice(-4)}`;

          await contactsRepository.upsert({
            phone: cleanPhone,
            name: contactName,
            profile_pic_url: item.profilePicUrl || existing?.profile_pic_url,
            instance_name: instanceName,
          });

          await legacyContactRepo.getOrCreate(cleanPhone, contactName);

          totalSynced++;
          if (isNew) newContacts++;
          else updatedContacts++;
        }
      }
    } catch (err: any) {
      console.warn("[ContactsService] findContacts warning:", err.message);
    }

    // 3. Fetch all chats to update last message snippets and interaction timestamps
    try {
      const chatsRes = await fetch(
        `${cleanBaseUrl}/chat/findChats/${encodeURIComponent(instanceName)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify({}),
        }
      );

      if (chatsRes.ok) {
        const chats: any[] = await chatsRes.json();
        for (const chat of chats) {
          const rawJid = String(chat.remoteJid || chat.id || "");
          if (rawJid.includes("@g.us") || rawJid.includes("@broadcast")) continue;

          // Resolve real phone number from @s.whatsapp.net or remoteJidAlt
          let cleanPhone = "";
          if (rawJid.includes("@s.whatsapp.net")) {
            cleanPhone = rawJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
          } else if (
            chat.lastMessage?.key?.remoteJidAlt &&
            chat.lastMessage.key.remoteJidAlt.includes("@s.whatsapp.net")
          ) {
            cleanPhone = chat.lastMessage.key.remoteJidAlt
              .replace("@s.whatsapp.net", "")
              .replace(/\D/g, "");
          }

          // Discard raw WhatsApp LIDs that don't have a verified real phone number
          if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 13) {
            continue;
          }

          // Extract last message text snippet
          let lastMsgText = "";
          let lastMsgFromMe = false;
          let lastMsgTimestamp = chat.updatedAt || new Date().toISOString();

          if (chat.lastMessage) {
            const lm = chat.lastMessage;
            lastMsgFromMe = Boolean(lm.key?.fromMe);
            if (lm.messageTimestamp) {
              lastMsgTimestamp = new Date(lm.messageTimestamp * 1000).toISOString();
            }

            const msgContent = lm.message;
            if (msgContent) {
              lastMsgText =
                msgContent.conversation ||
                msgContent.extendedTextMessage?.text ||
                msgContent.imageMessage?.caption ||
                msgContent.videoMessage?.caption ||
                msgContent.documentMessage?.caption ||
                (lm.messageType === "audioMessage" ? "🎵 Áudio" : "") ||
                (lm.messageType === "imageMessage" ? "📷 Foto" : "") ||
                (lm.messageType === "videoMessage" ? "🎥 Vídeo" : "") ||
                (lm.messageType === "documentMessage" ? "📄 Documento" : "") ||
                "";
            }
          }

          const existing = await contactsRepository.findByPhone(cleanPhone);
          const isNew = !existing;

          const contactName =
            chat.pushName || existing?.name || `WhatsApp ${cleanPhone.slice(-4)}`;

          await contactsRepository.upsert({
            phone: cleanPhone,
            name: contactName,
            profile_pic_url: chat.profilePicUrl || existing?.profile_pic_url,
            last_message: lastMsgText || existing?.last_message,
            last_message_at: lastMsgTimestamp || existing?.last_message_at,
            last_message_from_me: lastMsgFromMe,
            instance_name: instanceName,
          });

          await legacyContactRepo.getOrCreate(cleanPhone, contactName);

          if (isNew) {
            totalSynced++;
            newContacts++;
          } else {
            updatedContacts++;
          }
        }
      }
    } catch (err: any) {
      console.warn("[ContactsService] findChats warning:", err.message);
    }

    await logRepository.insert({
      level: "info",
      node_id: "contacts",
      message: `Sincronização de contatos concluída: ${totalSynced} contatos válidos processados (${newContacts} novos, ${updatedContacts} atualizados).`,
      details: { instanceName, totalSynced, newContacts, updatedContacts },
    });

    return {
      totalSynced,
      newContacts,
      updatedContacts,
      instanceName,
    };
  }

  /**
   * Manually trigger a published chatbot flow for one or multiple contacts
   */
  public async startFlow(params: StartFlowParams): Promise<{
    success: boolean;
    dispatchedCount: number;
    errors: string[];
  }> {
    const { contactIds, chatbotId, policy = "replace" } = params;

    const bot = await chatbotRepository.findById(chatbotId);
    if (!bot) throw new Error("Chatbot não encontrado.");

    if (!bot.current_published_version_id) {
      throw new Error("Este chatbot ainda não possui nenhuma versão publicada ativa.");
    }

    const version = await chatbotRepository.getVersionById(bot.current_published_version_id);
    if (!version) {
      throw new Error("Versão publicada do chatbot não encontrada.");
    }

    const startNode = version.flow_data.nodes.find((n) => n.type === "startNode");
    if (!startNode) {
      throw new Error("O fluxo publicado não possui um bloco de Início válido.");
    }

    let dispatchedCount = 0;
    const errors: string[] = [];

    for (const contactId of contactIds) {
      try {
        const contact = await contactsRepository.findById(contactId);
        if (!contact) continue;

        const cleanPhone = contact.phone.replace(/\D/g, "");
        if (!cleanPhone || cleanPhone.length < 10) {
          errors.push(`Número de telefone inválido para o contato ${contact.name}`);
          continue;
        }

        // Check if phone was an unresolved temporary LID
        if (cleanPhone.length > 13 || (!cleanPhone.startsWith("55") && cleanPhone.length > 11)) {
          errors.push(
            `O contato ${contact.name} (${contact.phone}) ainda possui um identificador provisório (LID). Clique em "Sincronizar Contatos" no topo da página para carregar o número de WhatsApp real.`
          );
          continue;
        }

        // Legacy contact record
        const legacyContact = await legacyContactRepo.getOrCreate(cleanPhone, contact.name);

        // Check existing state
        const existingState = await executionRepository.findActiveStateByContact(legacyContact.id);

        if (existingState) {
          if (policy === "keep") {
            continue; // Keep current flow running
          }
          // Policy "replace": Cancel current active execution
          await executionRepository.updateState(existingState.id, {
            status: "failed",
            execution_context: {
              canceled_reason: `Substituído manualmente pelo fluxo "${bot.name}"`,
            },
          });
          await logRepository.insert({
            level: "info",
            node_id: "contacts",
            message: `Fluxo anterior interrompido para iniciar "${bot.name}" no contato ${contact.name}.`,
          });
        }

        // Create new conversation state pinned to startNode
        const state = await executionRepository.createState(
          legacyContact.id,
          bot.id,
          version.id,
          startNode.id,
          contact.variables
        );

        // Create execution log record
        const execution = await executionRepository.createExecution(
          state.id,
          version.id,
          legacyContact.id,
          "trigger"
        );

        // Update contact's active flow metadata
        await contactsRepository.updateActiveFlow(contact.id, {
          chatbot_id: bot.id,
          chatbot_name: bot.name,
          version_id: version.id,
          current_node_id: startNode.id,
          status: "active",
          started_at: new Date().toISOString(),
        });

        // Run FlowEngine starting from startNode
        const contactData: ContactData = {
          id: legacyContact.id,
          name: contact.name,
          phone: cleanPhone,
          tags: contact.tags,
          variables: contact.variables,
        };

        const triggerEvent: EngineTriggerEvent = {
          type: "manual",
          messageText: "Início Manual",
          timestamp: new Date().toISOString(),
        };

        const result = await this.flowEngine.execute(
          version.flow_data,
          contactData,
          state,
          triggerEvent
        );

        // Dispatch initial messages via Evolution API to the clean phone number
        const channelCfg = await channelRepository.getConfig();
        const activeInst = await channelRepository.getActiveInstance();
        const instanceName = (contact.instance_name || activeInst?.name || channelCfg.selectedInstanceName || "Carlos1").trim();
        for (const action of result.dispatchedActions) {
          if (action.type === "send_text_message") {
            const sendRes = await this.evolutionClient.sendTextMessage({
              number: cleanPhone,
              text: String(action.payload.text || ""),
              delay: Number(action.payload.delaySeconds || 1),
              instanceName,
            });
            if (!sendRes.success) {
              const errMsg = `Falha ao enviar mensagem para ${contact.name} (${cleanPhone}): ${sendRes.error}`;
              console.error("[ContactsService]", errMsg);
              errors.push(errMsg);
            }
          } else if (action.type === "send_media_message") {
            const sendRes = await this.evolutionClient.sendMediaMessage({
              number: cleanPhone,
              mediatype: action.payload.mediaType as any,
              media: String(action.payload.mediaUrl || ""),
              caption: String(action.payload.caption || ""),
              fileName: String(action.payload.fileName || ""),
              delay: Number(action.payload.delaySeconds || 1),
              instanceName,
            });
            if (!sendRes.success) {
              const errMsg = `Falha ao enviar mídia para ${contact.name} (${cleanPhone}): ${sendRes.error}`;
              console.error("[ContactsService]", errMsg);
              errors.push(errMsg);
            }
          }
        }

        // Update contact variables and tags
        await contactsRepository.updateTags(contact.id, result.tags);
        await contactsRepository.updateVariables(contact.id, result.variables);

        // Update state status
        await executionRepository.updateState(state.id, {
          status: result.finalStatus,
          current_node_id: result.currentNodeId,
          variables: result.variables,
          resume_at: result.resumeAt,
        });

        // Update contact active flow status
        await contactsRepository.updateActiveFlow(contact.id, {
          chatbot_id: bot.id,
          chatbot_name: bot.name,
          version_id: version.id,
          current_node_id: result.currentNodeId || undefined,
          status: result.finalStatus as any,
          started_at: state.created_at || state.last_interaction_at || new Date().toISOString(),
        });

        dispatchedCount++;
      } catch (err: any) {
        errors.push(`Erro no contato ${contactId}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      dispatchedCount,
      errors,
    };
  }

  /**
   * Stop/Cancel active flow for a contact
   */
  public async stopFlow(contactId: string): Promise<boolean> {
    const contact = await contactsRepository.findById(contactId);
    if (!contact) return false;

    const legacyContact = await legacyContactRepo.findByPhone(contact.phone);
    if (legacyContact) {
      const activeState = await executionRepository.findActiveStateByContact(legacyContact.id);
      if (activeState) {
        await executionRepository.updateState(activeState.id, {
          status: "failed",
          execution_context: {
            canceled_reason: "Fluxo cancelado manualmente pelo usuário no Módulo de Contatos",
          },
        });
      }
    }

    await contactsRepository.updateActiveFlow(contactId, undefined);

    await logRepository.insert({
      level: "warn",
      node_id: "contacts",
      message: `Fluxo interrompido manualmente para o contato ${contact.name} (${contact.phone}).`,
      details: { contactId, phone: contact.phone },
    });

    return true;
  }

  /**
   * Get contact history (details, messages from WhatsApp, execution history)
   */
  public async getHistory(contactId: string): Promise<{
    contact: Contact;
    executions: any[];
    messages: any[];
  }> {
    const contact = await contactsRepository.findById(contactId);
    if (!contact) throw new Error("Contato não encontrado.");

    // 1. Fetch executions
    const legacyContact = await legacyContactRepo.findByPhone(contact.phone);
    let executions: any[] = [];
    if (legacyContact) {
      const allStates = await executionRepository.listStatesByContact(legacyContact.id);
      executions = allStates;
    }

    // 2. Fetch message history from Evolution API querying both remoteJid and remoteJidAlt
    let messages: any[] = [];
    try {
      const config = await channelRepository.getConfig();
      const cleanBaseUrl = config.baseUrl.trim().replace(/\/+$/, "");
      const instanceName = contact.instance_name || config.selectedInstanceName || "Carlos1";
      const cleanPhone = contact.phone.replace(/\D/g, "");
      const jid = `${cleanPhone}@s.whatsapp.net`;

      const [resJid, resAlt] = await Promise.all([
        fetch(`${cleanBaseUrl}/chat/findMessages/${encodeURIComponent(instanceName)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: config.apiKey.trim(),
          },
          body: JSON.stringify({
            where: { key: { remoteJid: jid } },
          }),
        }),
        fetch(`${cleanBaseUrl}/chat/findMessages/${encodeURIComponent(instanceName)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: config.apiKey.trim(),
          },
          body: JSON.stringify({
            where: { key: { remoteJidAlt: jid } },
          }),
        }),
      ]);

      const rawRecords: any[] = [];
      if (resJid.ok) {
        const j = await resJid.json();
        const recs = j?.messages?.records || (Array.isArray(j) ? j : []);
        rawRecords.push(...recs);
      }
      if (resAlt.ok) {
        const j = await resAlt.json();
        const recs = j?.messages?.records || (Array.isArray(j) ? j : []);
        rawRecords.push(...recs);
      }

      // Deduplicate by message key id
      const seenIds = new Set<string>();
      const uniqueRecords: any[] = [];
      for (const rec of rawRecords) {
        const msgId = rec?.key?.id || rec?.id;
        if (msgId && !seenIds.has(msgId)) {
          seenIds.add(msgId);
          uniqueRecords.push(rec);
        }
      }

      // Sort chronologically (oldest to newest)
      uniqueRecords.sort((a, b) => {
        const tA = (a.messageTimestamp || 0) * 1000 || new Date(a.createdAt || 0).getTime();
        const tB = (b.messageTimestamp || 0) * 1000 || new Date(b.createdAt || 0).getTime();
        return tA - tB;
      });

      messages = uniqueRecords.map((m: any) => {
        const msgObj = m.message || {};
        const text =
          msgObj.conversation ||
          msgObj.extendedTextMessage?.text ||
          msgObj.imageMessage?.caption ||
          msgObj.videoMessage?.caption ||
          msgObj.documentMessage?.caption ||
          (m.messageType === "audioMessage" ? "🎵 Mensagem de áudio" : "") ||
          (m.messageType === "imageMessage" ? "📷 Imagem recebida" : "") ||
          (m.messageType === "documentMessage" ? "📄 Documento anexo" : "") ||
          "";

        return {
          id: m.key?.id || m.id,
          fromMe: Boolean(m.key?.fromMe),
          text,
          messageType: m.messageType,
          timestamp: m.messageTimestamp
            ? new Date(m.messageTimestamp * 1000).toISOString()
            : m.createdAt || new Date().toISOString(),
        };
      });
    } catch (err: any) {
      console.warn("[ContactsService] Error fetching WhatsApp messages history:", err.message);
    }

    return {
      contact,
      executions,
      messages,
    };
  }
}

export const contactsService = new ContactsService();
