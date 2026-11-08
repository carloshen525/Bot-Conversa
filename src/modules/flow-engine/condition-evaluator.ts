import { ConditionBranch } from "../chatbots/types";

export interface ConditionEvaluationContext {
  messageText?: string;
  variables: Record<string, string>;
  tags: string[];
}

export function evaluateConditionBranch(
  branch: ConditionBranch,
  context: ConditionEvaluationContext
): boolean {
  const normalize = (val: string) => val.trim().toLowerCase();
  const msg = normalize(context.messageText || "");
  const targetVal = normalize(branch.value || "");

  switch (branch.operator) {
    case "message_contains":
      return msg.includes(targetVal);

    case "message_equals":
      return msg === targetVal;

    case "message_starts_with":
      return msg.startsWith(targetVal);

    case "message_ends_with":
      return msg.endsWith(targetVal);

    case "variable_equals": {
      if (!branch.variableKey) return false;
      const varVal = normalize(context.variables[branch.variableKey] || "");
      return varVal === targetVal;
    }

    case "tag_exists": {
      const tagToFind = normalize(branch.tagName || branch.value || "");
      return context.tags.map(normalize).includes(tagToFind);
    }

    case "tag_not_exists": {
      const tagToCheck = normalize(branch.tagName || branch.value || "");
      return !context.tags.map(normalize).includes(tagToCheck);
    }

    default:
      return false;
  }
}
