import {
  FlowNode,
  FlowEdge,
  StartNodeData,
  MessageNodeData,
  WaitNodeData,
  ConditionNodeData,
  TagNodeData,
  VariableNodeData,
  WebhookNodeData,
  EndNodeData,
} from "../../chatbots/types";
import {
  NodeExecutionResult,
  ContactData,
  EngineTriggerEvent,
} from "../types";
import { interpolateVariables } from "../variable-parser";
import { evaluateConditionBranch } from "../condition-evaluator";

export class NodeExecutors {
  static executeStart(
    node: FlowNode,
    event: EngineTriggerEvent,
    edges: FlowEdge[]
  ): NodeExecutionResult {
    const data = node.data as unknown as StartNodeData;
    const defaultEdge = edges.find((e) => e.source === node.id);

    return {
      status: "proceed",
      nextNodeId: defaultEdge ? defaultEdge.target : null,
      actions: [],
      log: {
        level: "info",
        message: `Início acionado por ${data?.triggerType || "manual"}`,
        details: { triggerType: data?.triggerType, eventType: event.type },
      },
    };
  }

  static executeMessage(
    node: FlowNode,
    contact: ContactData,
    variables: Record<string, string>,
    edges: FlowEdge[]
  ): NodeExecutionResult {
    const data = node.data as unknown as MessageNodeData;
    const defaultEdge = edges.find((e) => e.source === node.id);

    const parsedContent = interpolateVariables(data?.content || "", variables, contact);

    const action =
      data?.messageType === "text"
        ? {
            type: "send_text_message" as const,
            payload: {
              contactPhone: contact.phone,
              text: parsedContent,
              delaySeconds: data?.delaySeconds || 0,
            },
          }
        : {
            type: "send_media_message" as const,
            payload: {
              contactPhone: contact.phone,
              mediaType: data?.messageType,
              mediaUrl: data?.mediaUrl,
              caption: parsedContent,
              fileName: data?.fileName,
              delaySeconds: data?.delaySeconds || 0,
            },
          };

    return {
      status: "proceed",
      nextNodeId: defaultEdge ? defaultEdge.target : null,
      actions: [action],
      log: {
        level: "info",
        message: `Mensagem enviada (${data?.messageType}): "${parsedContent.slice(0, 40)}..."`,
        details: { messageType: data?.messageType, length: parsedContent.length },
      },
    };
  }

  static executeWait(
    node: FlowNode,
    event: EngineTriggerEvent,
    edges: FlowEdge[],
    isResumingAfterWait: boolean = false
  ): NodeExecutionResult {
    const data = node.data as unknown as WaitNodeData;
    const defaultEdge = edges.find((e) => e.source === node.id);

    // If resuming after wait satisfied (user replied or timer woke up)
    if (isResumingAfterWait) {
      return {
        status: "proceed",
        nextNodeId: defaultEdge ? defaultEdge.target : null,
        actions: [],
        log: {
          level: "info",
          message: `Espera concluída. Retomando para nó seguinte.`,
        },
      };
    }

    if (data?.waitType === "user_reply") {
      return {
        status: "pause",
        nextNodeId: defaultEdge ? defaultEdge.target : null,
        actions: [
          {
            type: "wait_reply",
            payload: { nodeId: node.id },
          },
        ],
        log: {
          level: "info",
          message: `Fluxo pausado: aguardando resposta do contato.`,
        },
      };
    }

    // Time-based delay (minutes, hours, days)
    const duration = data?.duration || 1;
    const resumeDate = new Date();
    if (data?.waitType === "minutes") {
      resumeDate.setMinutes(resumeDate.getMinutes() + duration);
    } else if (data?.waitType === "hours") {
      resumeDate.setHours(resumeDate.getHours() + duration);
    } else if (data?.waitType === "days") {
      resumeDate.setDate(resumeDate.getDate() + duration);
    }

    return {
      status: "pause",
      nextNodeId: defaultEdge ? defaultEdge.target : null,
      actions: [
        {
          type: "wait_delay",
          payload: { resumeAt: resumeDate.toISOString(), nodeId: node.id },
        },
      ],
      resumeAt: resumeDate,
      log: {
        level: "info",
        message: `Fluxo pausado até ${resumeDate.toLocaleString("pt-BR")} (${duration} ${data?.waitType})`,
      },
    };
  }

  static executeCondition(
    node: FlowNode,
    contact: ContactData,
    variables: Record<string, string>,
    tags: string[],
    lastMessage: string | undefined,
    edges: FlowEdge[]
  ): NodeExecutionResult {
    const data = node.data as unknown as ConditionNodeData;
    const branches = data?.branches || [];

    let matchedBranchId: string | null = null;

    for (const branch of branches) {
      const isMatch = evaluateConditionBranch(branch, {
        messageText: lastMessage,
        variables,
        tags,
      });

      if (isMatch) {
        matchedBranchId = branch.id;
        break;
      }
    }

    // Find the edge connected to this specific branch's source handle
    let targetEdge = edges.find(
      (e) => e.source === node.id && (e.sourceHandle === matchedBranchId || (!e.sourceHandle && !matchedBranchId))
    );

    // Fallback: If no match found, search for default "else" or generic edge
    if (!targetEdge && !matchedBranchId) {
      targetEdge = edges.find((e) => e.source === node.id && e.sourceHandle === "default");
    }

    return {
      status: "proceed",
      nextNodeId: targetEdge ? targetEdge.target : null,
      actions: [],
      log: {
        level: "info",
        message: matchedBranchId
          ? `Condição satisfeita: galho [${matchedBranchId}]`
          : `Nenhuma condição satisfeita. Seguindo para galho padrão.`,
        details: { matchedBranchId, targetNodeId: targetEdge?.target },
      },
    };
  }

  static executeTag(
    node: FlowNode,
    isAdd: boolean,
    edges: FlowEdge[]
  ): NodeExecutionResult {
    const data = node.data as unknown as TagNodeData;
    const tagName = data?.tagName?.trim();
    const defaultEdge = edges.find((e) => e.source === node.id);

    if (!tagName) {
      return {
        status: "proceed",
        nextNodeId: defaultEdge ? defaultEdge.target : null,
        actions: [],
      };
    }

    return {
      status: "proceed",
      nextNodeId: defaultEdge ? defaultEdge.target : null,
      actions: [
        {
          type: isAdd ? "add_tag" : "remove_tag",
          payload: { tagName },
        },
      ],
      addedTags: isAdd ? [tagName] : undefined,
      removedTags: !isAdd ? [tagName] : undefined,
      log: {
        level: "info",
        message: isAdd ? `Tag adicionada: "${tagName}"` : `Tag removida: "${tagName}"`,
      },
    };
  }

  static executeVariable(
    node: FlowNode,
    contact: ContactData,
    variables: Record<string, string>,
    lastMessage: string | undefined,
    edges: FlowEdge[]
  ): NodeExecutionResult {
    const data = node.data as unknown as VariableNodeData;
    const defaultEdge = edges.find((e) => e.source === node.id);

    if (!data?.variableKey) {
      return {
        status: "proceed",
        nextNodeId: defaultEdge ? defaultEdge.target : null,
        actions: [],
      };
    }

    let calculatedValue = data.variableValue || "";

    if (data.sourceType === "last_message") {
      calculatedValue = lastMessage || "";
    } else if (data.sourceType === "contact_name") {
      calculatedValue = contact.name || "";
    } else if (data.sourceType === "contact_phone") {
      calculatedValue = contact.phone || "";
    } else {
      calculatedValue = interpolateVariables(calculatedValue, variables, contact);
    }

    return {
      status: "proceed",
      nextNodeId: defaultEdge ? defaultEdge.target : null,
      actions: [],
      updatedVariables: { [data.variableKey]: calculatedValue },
      log: {
        level: "info",
        message: `Variável definida: {{${data.variableKey}}} = "${calculatedValue}"`,
      },
    };
  }

  static async executeWebhook(
    node: FlowNode,
    contact: ContactData,
    variables: Record<string, string>,
    edges: FlowEdge[]
  ): Promise<NodeExecutionResult> {
    const data = node.data as unknown as WebhookNodeData;
    const defaultEdge = edges.find((e) => e.source === node.id);

    const targetUrl = interpolateVariables(data?.url || "", variables, contact);
    const method = data?.method || "GET";

    let headersObj: Record<string, string> = { "Content-Type": "application/json" };
    if (data?.headers && Array.isArray(data.headers)) {
      data.headers.forEach((h) => {
        if (h.key && h.value) {
          headersObj[h.key] = interpolateVariables(h.value, variables, contact);
        }
      });
    }

    let parsedBody: string | undefined;
    if (method === "POST" && data?.body) {
      parsedBody = interpolateVariables(data.body, variables, contact);
    }

    try {
      // In standalone simulation or serverless execution
      let responseData: any = null;
      if (targetUrl.startsWith("http")) {
        const response = await fetch(targetUrl, {
          method,
          headers: headersObj,
          body: method === "POST" ? parsedBody : undefined,
        });
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      }

      const updatedVariables: Record<string, string> = {};
      if (data?.saveResponseVariable && responseData) {
        updatedVariables[data.saveResponseVariable] =
          typeof responseData === "object" ? JSON.stringify(responseData) : String(responseData);
      }

      return {
        status: "proceed",
        nextNodeId: defaultEdge ? defaultEdge.target : null,
        actions: [
          {
            type: "call_webhook",
            payload: { url: targetUrl, method, status: "success" },
          },
        ],
        updatedVariables: Object.keys(updatedVariables).length > 0 ? updatedVariables : undefined,
        log: {
          level: "info",
          message: `Webhook ${method} ${targetUrl} executado com sucesso`,
          details: { responsePreview: responseData },
        },
      };
    } catch (err: any) {
      return {
        status: "proceed",
        nextNodeId: defaultEdge ? defaultEdge.target : null,
        actions: [
          {
            type: "call_webhook",
            payload: { url: targetUrl, method, error: err.message },
          },
        ],
        log: {
          level: "error",
          message: `Falha ao executar Webhook: ${err.message}`,
          details: { url: targetUrl, error: err.message },
        },
      };
    }
  }

  static executeEnd(node: FlowNode): NodeExecutionResult {
    const data = node.data as unknown as EndNodeData;

    return {
      status: "stop",
      nextNodeId: null,
      actions: [
        {
          type: "end",
          payload: { reason: data?.reason || "Finalizado com sucesso" },
        },
      ],
      log: {
        level: "info",
        message: `Fluxo encerrado. ${data?.reason ? `Motivo: ${data.reason}` : ""}`,
      },
    };
  }
}
