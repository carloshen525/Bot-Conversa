"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FlowEditor } from "@/modules/chatbots/editor/FlowEditor";
import { Loading } from "@/components/ui/loading";
import { FlowData, Chatbot } from "@/modules/chatbots/types";

export default function ChatbotEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadEditorData() {
      try {
        const [botRes, draftRes] = await Promise.all([
          fetch(`/api/chatbots/${id}`),
          fetch(`/api/chatbots/${id}/draft`),
        ]);

        const botJson = await botRes.json();
        const draftJson = await draftRes.json();

        if (!botRes.ok || !botJson.success) {
          throw new Error(botJson.error || "Chatbot não encontrado");
        }

        setChatbot(botJson.data);

        if (draftJson.success && draftJson.data?.flow_data) {
          setFlowData(draftJson.data.flow_data);
        } else {
          // Fallback initial flow data if empty
          setFlowData({
            nodes: [
              {
                id: "start_1",
                type: "startNode",
                position: { x: 250, y: 150 },
                data: {
                  label: "Início",
                  triggerType: "keyword",
                  keywords: ["oi", "ola"],
                },
              },
            ],
            edges: [],
            settings: { defaultDelayBetweenMessages: 1 },
            triggers: [],
          });
        }
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadEditorData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#090a0f]">
        <Loading text="Carregando editor visual do chatbot..." size="lg" />
      </div>
    );
  }

  if (errorMsg || !chatbot || !flowData) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-[#090a0f] p-6 text-center">
        <h2 className="text-base font-semibold text-red-400">Falha ao abrir editor</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">{errorMsg || "Chatbot não encontrado"}</p>
        <button
          onClick={() => router.push("/chatbots")}
          className="mt-4 rounded-md bg-white/5 border border-border px-4 py-2 text-xs text-foreground hover:bg-white/10"
        >
          Voltar para Chatbots
        </button>
      </div>
    );
  }

  return (
    <FlowEditor
      chatbotId={chatbot.id}
      chatbotName={chatbot.name}
      chatbotStatus={chatbot.status}
      initialFlowData={flowData}
    />
  );
}
