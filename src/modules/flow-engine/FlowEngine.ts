import { FlowData, FlowNode } from "../chatbots/types";
import {
  ContactData,
  EngineTriggerEvent,
  FlowEngineAction,
  FlowEngineResult,
  ConversationStateRecord,
  ConversationStatus,
} from "./types";
import { NodeExecutors } from "./node-executors";

export interface FlowEngineOptions {
  maxStepsPerRun?: number;
}

export class FlowEngine {
  private maxSteps: number;

  constructor(options?: FlowEngineOptions) {
    this.maxSteps = options?.maxStepsPerRun || 50;
  }

  /**
   * Main entry point to run or resume a flow execution.
   */
  public async execute(
    flowData: FlowData,
    contact: ContactData,
    currentState: ConversationStateRecord,
    triggerEvent: EngineTriggerEvent
  ): Promise<FlowEngineResult> {
    const nodesMap = new Map<string, FlowNode>();
    flowData.nodes.forEach((n) => nodesMap.set(n.id, n));

    const edges = flowData.edges || [];
    const variables = { ...currentState.variables };
    const tags = [...contact.tags];
    const dispatchedActions: FlowEngineAction[] = [];
    const logs: FlowEngineResult["logs"] = [];

    let currentNodeId: string | null = currentState.current_node_id;
    let finalStatus: ConversationStatus = "active";
    let resumeAt: string | null = null;
    let stepCount = 0;

    // If starting fresh (no current node), find the start node
    if (!currentNodeId) {
      const startNode = flowData.nodes.find((n) => n.type === "startNode");
      if (!startNode) {
        throw new Error("Fluxo inválido: Nó de início não encontrado.");
      }
      currentNodeId = startNode.id;
    }

    let isResumingFromWait =
      currentState.status === "waiting_input" || currentState.status === "waiting_delay";

    while (currentNodeId && stepCount < this.maxSteps) {
      stepCount++;
      const node = nodesMap.get(currentNodeId);

      if (!node) {
        logs.push({
          level: "error",
          nodeId: currentNodeId,
          message: `Nó não encontrado no fluxo: ${currentNodeId}`,
        });
        finalStatus = "failed";
        break;
      }

      let result;

      switch (node.type) {
        case "startNode": {
          result = NodeExecutors.executeStart(node, triggerEvent, edges);
          break;
        }

        case "messageNode": {
          result = NodeExecutors.executeMessage(node, contact, variables, edges);
          break;
        }

        case "waitNode": {
          result = NodeExecutors.executeWait(node, triggerEvent, edges, isResumingFromWait);
          // Once we pass the wait node on resume, subsequent nodes are normal
          isResumingFromWait = false;
          break;
        }

        case "conditionNode": {
          result = NodeExecutors.executeCondition(
            node,
            contact,
            variables,
            tags,
            triggerEvent.messageText,
            edges
          );
          break;
        }

        case "addTagNode": {
          result = NodeExecutors.executeTag(node, true, edges);
          break;
        }

        case "removeTagNode": {
          result = NodeExecutors.executeTag(node, false, edges);
          break;
        }

        case "variableNode": {
          result = NodeExecutors.executeVariable(
            node,
            contact,
            variables,
            triggerEvent.messageText,
            edges
          );
          break;
        }

        case "webhookNode": {
          result = await NodeExecutors.executeWebhook(node, contact, variables, edges);
          break;
        }

        case "endNode": {
          result = NodeExecutors.executeEnd(node);
          break;
        }

        default: {
          const defaultEdge = edges.find((e) => e.source === node.id);
          result = {
            status: "proceed" as const,
            nextNodeId: defaultEdge ? defaultEdge.target : null,
            actions: [],
          };
        }
      }

      // Collect actions
      if (result.actions.length > 0) {
        dispatchedActions.push(...result.actions);
      }

      // Collect logs
      if (result.log) {
        logs.push({
          level: result.log.level,
          nodeId: node.id,
          message: result.log.message,
          details: result.log.details,
        });
      }

      // Apply variable updates
      if (result.updatedVariables) {
        Object.assign(variables, result.updatedVariables);
      }

      // Apply tag updates
      if (result.addedTags) {
        result.addedTags.forEach((t) => {
          if (!tags.includes(t)) tags.push(t);
        });
      }
      if (result.removedTags) {
        result.removedTags.forEach((t) => {
          const idx = tags.indexOf(t);
          if (idx !== -1) tags.splice(idx, 1);
        });
      }

      // Handle pause or termination
      if (result.status === "pause") {
        if (result.resumeAt) {
          finalStatus = "waiting_delay";
          resumeAt = result.resumeAt.toISOString();
        } else {
          finalStatus = "waiting_input";
        }
        currentNodeId = node.id; // Pause right here
        break;
      }

      if (result.status === "stop" || !result.nextNodeId) {
        finalStatus = result.status === "stop" ? "completed" : "completed";
        currentNodeId = null;
        break;
      }

      // Advance to next node
      currentNodeId = result.nextNodeId;
    }

    if (stepCount >= this.maxSteps) {
      logs.push({
        level: "warn",
        nodeId: currentNodeId || "",
        message: `Limite de segurança atingido (${this.maxSteps} passos). Possível loop detectado.`,
      });
    }

    return {
      conversationStateId: currentState.id,
      finalStatus,
      currentNodeId,
      dispatchedActions,
      variables,
      tags,
      resumeAt,
      logs,
    };
  }
}
