import { StartNode } from "./StartNode";
import { MessageNode } from "./MessageNode";
import { WaitNode } from "./WaitNode";
import { ConditionNode } from "./ConditionNode";
import { AddTagNode } from "./AddTagNode";
import { RemoveTagNode } from "./RemoveTagNode";
import { VariableNode } from "./VariableNode";
import { WebhookNode } from "./WebhookNode";
import { EndNode } from "./EndNode";
import { NODE_TYPES } from "@/modules/shared/constants";

export const nodeTypes = {
  [NODE_TYPES.START]: StartNode,
  [NODE_TYPES.MESSAGE]: MessageNode,
  [NODE_TYPES.WAIT]: WaitNode,
  [NODE_TYPES.CONDITION]: ConditionNode,
  [NODE_TYPES.ADD_TAG]: AddTagNode,
  [NODE_TYPES.REMOVE_TAG]: RemoveTagNode,
  [NODE_TYPES.VARIABLE]: VariableNode,
  [NODE_TYPES.WEBHOOK]: WebhookNode,
  [NODE_TYPES.END]: EndNode,
};
