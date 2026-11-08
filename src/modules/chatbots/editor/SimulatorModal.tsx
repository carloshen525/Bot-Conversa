import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlowData } from "../types";
import { Send, Bot, User, CheckCircle2, Tag, Binary, RefreshCw } from "lucide-react";

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowData: FlowData;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  mediaUrl?: string;
  mediaType?: string;
  timestamp: string;
}

export function SimulatorModal({ isOpen, onClose, flowData }: SimulatorModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contactName, setContactName] = useState("Mariana Silva");
  const [contactPhone, setContactPhone] = useState("5511988887777");
  const [tags, setTags] = useState<string[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const startSimulation = async (initialTrigger?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/execution/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowData,
          contact: { name: contactName, phone: contactPhone, tags, variables },
          messageText: initialTrigger || undefined,
          variables,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const { dispatchedActions, updatedTags, updatedVariables, tags: resTags, variables: resVars } = json.data;

        if (resTags) setTags(resTags);
        if (resVars) setVariables(resVars);

        const newBotMessages: ChatMessage[] = [];
        for (const action of dispatchedActions) {
          if (action.type === "send_text_message") {
            newBotMessages.push({
              id: Math.random().toString(),
              sender: "bot",
              text: action.payload.text,
              timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            });
          } else if (action.type === "send_media_message") {
            newBotMessages.push({
              id: Math.random().toString(),
              sender: "bot",
              text: action.payload.caption || `[Mídia: ${action.payload.mediaType}]`,
              mediaUrl: action.payload.mediaUrl,
              mediaType: action.payload.mediaType,
              timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            });
          }
        }

        setMessages((prev) => [...prev, ...newBotMessages]);
      }
    } catch (err) {
      console.error("Simulation error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userText = inputVal.trim();
    setInputVal("");

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    await startSimulation(userText);
  };

  const handleReset = () => {
    setMessages([]);
    setTags([]);
    setVariables({});
    startSimulation();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulador do Chatbot (WhatsApp)"
      description="Teste o comportamento do fluxo em tempo real exatamente como o usuário vivenciará"
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[520px]">
        {/* WhatsApp Chat Preview (2 cols) */}
        <div className="md:col-span-2 flex flex-col rounded-xl border border-border/70 bg-[#0b0c10] overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-border/70 bg-[#12141c] px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-xs">
                WA
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{contactName}</p>
                <p className="text-[10px] text-emerald-400 font-mono">online no simulador</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              title="Reiniciar conversa"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-xs p-6">
                <Bot className="h-8 w-8 mb-2 text-indigo-400/60" />
                <p>Nenhuma mensagem trocada ainda.</p>
                <p className="text-[11px] mt-1 text-muted-foreground/70">
                  Clique abaixo para iniciar o fluxo ou digite uma palavra-chave.
                </p>
                <Button size="sm" variant="secondary" onClick={() => startSimulation()} className="mt-3">
                  Iniciar Fluxo
                </Button>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-end gap-1.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.sender === "bot" && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] mb-1">
                      <Bot className="h-3 w-3" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                      m.sender === "user"
                        ? "rounded-br-none bg-emerald-600 text-white"
                        : "rounded-bl-none bg-[#1a1d28] text-foreground border border-border/60"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        m.sender === "user" ? "text-emerald-200" : "text-muted-foreground"
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                  {m.sender === "user" && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] mb-1">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                Digitando...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 border-t border-border/70 bg-[#12141c] p-2.5"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Digite uma mensagem ou resposta..."
              className="flex-1 rounded-lg bg-[#0c0d12] border border-border/70 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500"
            />
            <Button size="sm" type="submit" disabled={isLoading || !inputVal.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>

        {/* State Inspector (1 col) */}
        <div className="flex flex-col rounded-xl border border-border/70 bg-[#12141c] p-3 text-xs overflow-hidden">
          <h4 className="font-semibold text-foreground border-b border-border/60 pb-2 mb-2 text-xs">
            Estado da Conversa
          </h4>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {/* Contact info */}
            <div>
              <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Contato Teste
              </span>
              <p className="font-medium text-foreground text-xs mt-0.5">{contactName}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{contactPhone}</p>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                <Tag className="h-3 w-3 text-purple-400" />
                <span>Tags Atribuídas ({tags.length})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic">Nenhuma tag</span>
                ) : (
                  tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[10px] text-purple-300"
                    >
                      {t}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Variables */}
            <div>
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                <Binary className="h-3 w-3 text-cyan-400" />
                <span>Variáveis Salvas</span>
              </div>
              <div className="rounded-lg bg-[#0c0d12] border border-border/60 p-2 space-y-1 font-mono text-[10px]">
                {Object.keys(variables).length === 0 ? (
                  <span className="text-muted-foreground italic">Nenhuma variável</span>
                ) : (
                  Object.entries(variables).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-slate-300">
                      <span className="text-cyan-400">{k}:</span>
                      <span className="truncate max-w-[100px] text-right">{v}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
