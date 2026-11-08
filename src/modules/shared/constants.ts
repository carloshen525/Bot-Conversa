export const NODE_TYPES = {
  START: "startNode",
  MESSAGE: "messageNode",
  WAIT: "waitNode",
  CONDITION: "conditionNode",
  ADD_TAG: "addTagNode",
  REMOVE_TAG: "removeTagNode",
  VARIABLE: "variableNode",
  WEBHOOK: "webhookNode",
  END: "endNode",
} as const;

export const NODE_CONFIG = {
  [NODE_TYPES.START]: {
    label: "Início",
    color: "#10b981", // emerald
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.4)",
    description: "Ponto de partida do fluxo",
  },
  [NODE_TYPES.MESSAGE]: {
    label: "Mensagem",
    color: "#6366f1", // indigo
    bg: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.4)",
    description: "Enviar texto, mídia ou documento",
  },
  [NODE_TYPES.WAIT]: {
    label: "Espera",
    color: "#f59e0b", // amber
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.4)",
    description: "Aguardar resposta ou intervalo",
  },
  [NODE_TYPES.CONDITION]: {
    label: "Condição",
    color: "#ec4899", // pink
    bg: "rgba(236, 72, 153, 0.15)",
    border: "rgba(236, 72, 153, 0.4)",
    description: "Desvio condicional com saídas",
  },
  [NODE_TYPES.ADD_TAG]: {
    label: "Adicionar Tag",
    color: "#8b5cf6", // purple
    bg: "rgba(139, 92, 246, 0.15)",
    border: "rgba(139, 92, 246, 0.4)",
    description: "Etiquetar contato no fluxo",
  },
  [NODE_TYPES.REMOVE_TAG]: {
    label: "Remover Tag",
    color: "#f43f5e", // rose
    bg: "rgba(244, 63, 94, 0.15)",
    border: "rgba(244, 63, 94, 0.4)",
    description: "Remover etiqueta do contato",
  },
  [NODE_TYPES.VARIABLE]: {
    label: "Variável",
    color: "#06b6d4", // cyan
    bg: "rgba(6, 182, 212, 0.15)",
    border: "rgba(6, 182, 212, 0.4)",
    description: "Salvar ou atualizar variável",
  },
  [NODE_TYPES.WEBHOOK]: {
    label: "Webhook",
    color: "#14b8a6", // teal
    bg: "rgba(20, 184, 166, 0.15)",
    border: "rgba(20, 184, 166, 0.4)",
    description: "Chamar API externa via HTTP",
  },
  [NODE_TYPES.END]: {
    label: "Fim",
    color: "#64748b", // slate
    bg: "rgba(100, 116, 139, 0.15)",
    border: "rgba(100, 116, 139, 0.4)",
    description: "Encerrar a execução do fluxo",
  },
};
