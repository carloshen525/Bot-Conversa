import { z } from "zod";

export const chatbotCreateSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
});

export const chatbotUpdateSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "archived", "paused"]).optional(),
});

export const conditionBranchSchema = z.object({
  id: z.string(),
  label: z.string(),
  operator: z.enum([
    "message_contains",
    "message_equals",
    "message_starts_with",
    "message_ends_with",
    "variable_equals",
    "tag_exists",
    "tag_not_exists",
  ]),
  variableKey: z.string().optional(),
  tagName: z.string().optional(),
  value: z.string(),
});

export const flowSettingsSchema = z.object({
  defaultDelayBetweenMessages: z.number().optional(),
  sessionTimeoutHours: z.number().optional(),
  fallbackMessage: z.string().optional(),
});

export const flowDataSchema = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  settings: flowSettingsSchema.default({}),
  triggers: z.array(z.any()).default([]),
  metadata: z.record(z.any()).optional(),
});

export const publishSnapshotSchema = z.object({
  changelog: z.string().optional(),
});
