import { EvolutionWebhookEvent } from "./types";
import { EvolutionApiClient } from "./client";
import { FlowEngine } from "../flow-engine/FlowEngine";
import { ContactData, EngineTriggerEvent } from "../flow-engine/types";
import { contactRepository } from "../database/repositories/contact.repository";
import { chatbotRepository } from "../database/repositories/chatbot.repository";
import { executionRepository } from "../database/repositories/execution.repository";
import { logRepository } from "../database/repositories/log.repository";

export class EvolutionWebhookHandler {
  private evolutionClient: EvolutionApiClient;
  private flowEngine: FlowEngine;

  constructor() {
    this.evolutionClient = new EvolutionApiClient();
    this.flowEngine = new FlowEngine();
  }

  /**
   * Processes incoming Evolution API webhook events.
   */
  public async handleWebhook(event: EvolutionWebhookEvent): Promise<{
    processed: boolean;
    reason?: string;
    conversationStateId?: string;
  }> {
    // Only process incoming messages (messages.upsert, case-insensitive)
    const rawEvent = (event.event || "").toLowerCase();
    const isMessageUpsert =
      rawEvent === "messages.upsert" ||
      rawEvent === "messages_upsert" ||
      rawEvent === "message.upsert" ||
      Boolean(event.data?.key);

    if (!isMessageUpsert) {
      return { processed: false, reason: `Ignored event type: ${event.event}` };
    }

    // Extract message item supporting varying payload topologies (flat, nested, array)
    const dataObj = Array.isArray(event.data) ? event.data[0] : event.data;
    const actualData = dataObj?.key ? dataObj : dataObj?.data || dataObj;
    const key = actualData?.key;
    const message = actualData?.message;
    const pushName = actualData?.pushName || "Contato WhatsApp";

    if (!key) {
      return { processed: false, reason: "No message key found in webhook payload" };
    }

    // Ignore messages sent by ourselves or group chats (for V1 individual contacts)
    if (key.fromMe) {
      return { processed: false, reason: "Ignored fromMe message" };
    }

    const remoteJid = key.remoteJid;
    if (!remoteJid || remoteJid.includes("@g.us")) {
      return { processed: false, reason: "Group chat ignored in V1" };
    }

    const phone = this.evolutionClient.cleanPhoneNumber(remoteJid);
    const messageText =
      message?.conversation ||
      message?.extendedTextMessage?.text ||
      message?.imageMessage?.caption ||
      message?.videoMessage?.caption ||
      message?.documentMessage?.caption ||
      actualData?.body ||
      "";

    // 1. Get or create Contact
    const contactRecord = await contactRepository.getOrCreate(phone, pushName);
    const contactData: ContactData = {
      id: contactRecord.id,
      name: contactRecord.name,
      phone: contactRecord.phone,
      tags: contactRecord.tags,
      variables: contactRecord.variables,
    };

    // 2. Check for existing active or waiting conversation state
    let state = await executionRepository.findActiveStateByContact(contactRecord.id);

    let publishedVersion;

    if (state) {
      // Conversa em andamento: carregar estritamente a versão salva no estado
      publishedVersion = await chatbotRepository.getVersionById(state.chatbot_version_id);
      if (!publishedVersion) {
        return {
          processed: false,
          reason: `Versão publicada ${state.chatbot_version_id} não encontrada.`,
        };
      }
    } else {
      // Nova conversa: procurar chatbot publicado que corresponda ao gatilho
      const chatbots = await chatbotRepository.listAll();
      const publishedChatbots = chatbots.filter(
        (b) => b.status === "published" && b.current_published_version_id
      );

      let matchedBot = null;
      let matchedVersion = null;

      for (const bot of publishedChatbots) {
        if (!bot.current_published_version_id) continue;
        const ver = await chatbotRepository.getVersionById(bot.current_published_version_id);
        if (!ver) continue;

        // Find start node in flow
        const startNode = ver.flow_data.nodes.find((n) => n.type === "startNode");
        const startData = startNode?.data as any;
        const triggerType = startData?.triggerType || "new_conversation";

        // Parse keywords whether string or array
        const rawKeywords = startData?.keywords;
        const keywords: string[] = Array.isArray(rawKeywords)
          ? rawKeywords
          : typeof rawKeywords === "string"
          ? rawKeywords.split(/[\s,]+/).filter(Boolean)
          : [];

        // Keyword trigger check
        if (triggerType === "keyword" && keywords.length > 0) {
          const lowerText = messageText.trim().toLowerCase();
          const match = keywords.some((kw: string) =>
            lowerText.includes(kw.trim().toLowerCase())
          );
          if (match) {
            matchedBot = bot;
            matchedVersion = ver;
            break;
          }
        } else if (triggerType === "new_conversation" || triggerType === "manual" || !matchedBot) {
          // Fallback to published bot if new_conversation or default candidate
          matchedBot = bot;
          matchedVersion = ver;
        }
      }

      if (!matchedBot || !matchedVersion) {
        return {
          processed: false,
          reason: `Nenhum chatbot publicado atendeu ao gatilho para a mensagem "${messageText}"`,
        };
      }

      publishedVersion = matchedVersion;

      // Create new conversation state pinned to this published snapshot
      state = await executionRepository.createState(
        contactRecord.id,
        matchedBot.id,
        matchedVersion.id,
        null,
        contactRecord.variables
      );
    }

    // 3. Create execution record
    const execution = await executionRepository.createExecution(
      state.id,
      publishedVersion.id,
      contactRecord.id,
      state.current_node_id ? "user_reply" : "trigger"
    );

    // 4. Run FlowEngine
    const triggerEvent: EngineTriggerEvent = {
      type: state.current_node_id ? "user_reply" : "new_conversation",
      messageText,
      timestamp: new Date().toISOString(),
    };

    const result = await this.flowEngine.execute(
      publishedVersion.flow_data,
      contactData,
      state,
      triggerEvent
    );

    // 5. Dispatch actions
    const webhookInstance = event.instance?.trim();
    for (const action of result.dispatchedActions) {
      if (action.type === "send_text_message") {
        const sendRes = await this.evolutionClient.sendTextMessage({
          number: phone,
          text: String(action.payload.text || ""),
          delay: Number(action.payload.delaySeconds || 1),
          instanceName: webhookInstance,
        });
        if (!sendRes.success) {
          await logRepository.insert({
            execution_id: execution.id,
            conversation_state_id: state.id,
            chatbot_id: publishedVersion.chatbot_id,
            level: "error",
            node_id: "send_text_failed",
            message: `Falha ao enviar mensagem de texto para WhatsApp (${phone}): ${sendRes.error}`,
            details: { phone, error: sendRes.error },
          });
        }
      } else if (action.type === "send_media_message") {
        const sendRes = await this.evolutionClient.sendMediaMessage({
          number: phone,
          mediatype: action.payload.mediaType as any,
          media: String(action.payload.mediaUrl || ""),
          caption: String(action.payload.caption || ""),
          fileName: String(action.payload.fileName || ""),
          delay: Number(action.payload.delaySeconds || 1),
          instanceName: webhookInstance,
        });
        if (!sendRes.success) {
          await logRepository.insert({
            execution_id: execution.id,
            conversation_state_id: state.id,
            chatbot_id: publishedVersion.chatbot_id,
            level: "error",
            node_id: "send_media_failed",
            message: `Falha ao enviar mídia para WhatsApp (${phone}): ${sendRes.error}`,
            details: { phone, error: sendRes.error },
          });
        }
      }
    }

    // 6. Persist updated contact tags and variables
    await contactRepository.updateTags(contactRecord.id, result.tags);
    await contactRepository.updateVariables(contactRecord.id, result.variables);

    // 7. Update conversation state
    await executionRepository.updateState(state.id, {
      status: result.finalStatus,
      current_node_id: result.currentNodeId,
      variables: result.variables,
      resume_at: result.resumeAt,
      execution_context: {
        last_message_received: messageText,
        waiting_for_input_at_node:
          result.finalStatus === "waiting_input" ? result.currentNodeId || undefined : undefined,
      },
    });

    // 8. Update execution status
    await executionRepository.updateExecution(
      execution.id,
      result.finalStatus === "completed"
        ? "completed"
        : result.finalStatus === "failed"
        ? "failed"
        : "paused",
      { stepsDispatched: result.dispatchedActions.length }
    );

    // 9. Save logs
    for (const log of result.logs) {
      await logRepository.insert({
        execution_id: execution.id,
        conversation_state_id: state.id,
        chatbot_id: publishedVersion.chatbot_id,
        level: log.level,
        node_id: log.nodeId,
        message: log.message,
        details: log.details,
      });
    }

    return {
      processed: true,
      conversationStateId: state.id,
    };
  }
}

export const evolutionWebhookHandler = new EvolutionWebhookHandler();
