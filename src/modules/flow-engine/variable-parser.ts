/**
 * Replaces {{variable}} placeholders with values from contact data and variables map.
 * Example: "Olá {{nome}}, seu número é {{telefone}}" -> "Olá Carlos, seu número é 5511999999999"
 */
export function interpolateVariables(
  template: string,
  variables: Record<string, unknown>,
  contact?: { name?: string; phone?: string } | null
): string {
  if (!template) return "";

  const mergedContext: Record<string, string> = {
    nome: contact?.name || "",
    name: contact?.name || "",
    telefone: contact?.phone || "",
    phone: contact?.phone || "",
    ...Object.entries(variables).reduce((acc, [k, v]) => {
      acc[k] = v !== null && v !== undefined ? String(v) : "";
      return acc;
    }, {} as Record<string, string>),
  };

  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key) => {
    const trimmedKey = key.trim();
    if (trimmedKey in mergedContext) {
      return mergedContext[trimmedKey];
    }
    return `{{${trimmedKey}}}`; // Keep placeholder if undefined
  });
}
