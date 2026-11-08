"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  ReactFlowProvider,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodes";
import { NodeSidebar } from "./NodeSidebar";
import { PropertiesPanel } from "./PropertiesPanel";
import { Toolbar } from "./Toolbar";
import { SimulatorModal } from "./SimulatorModal";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { FlowData, FlowNode, FlowEdge } from "../types";
import { useToast } from "@/components/ui/toast";
import { generateId } from "@/modules/shared/utils";

interface FlowEditorProps {
  chatbotId: string;
  chatbotName: string;
  chatbotStatus: string;
  initialFlowData: FlowData;
}

function FlowEditorInner({
  chatbotId,
  chatbotName: initialName,
  chatbotStatus: initialStatus,
  initialFlowData,
}: FlowEditorProps) {
  const { success, error, info } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);

  const [chatbotName, setChatbotName] = useState(initialName);
  const [chatbotStatus, setChatbotStatus] = useState(initialStatus);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialFlowData.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(initialFlowData.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // UI state
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }[]>([
    { nodes: initialFlowData.nodes || [], edges: initialFlowData.edges || [] },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Clipboard for Copy / Paste
  const [copiedNodes, setCopiedNodes] = useState<FlowNode[]>([]);

  // Push snapshot to history
  const pushHistory = useCallback(
    (newNodes: FlowNode[], newEdges: FlowEdge[]) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, { nodes: newNodes, edges: newEdges }];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex((idx) => idx - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex((idx) => idx + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Connect edge
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
          },
          eds
        );
        pushHistory(nodes, newEdges);
        return newEdges;
      });
    },
    [nodes, pushHistory, setEdges]
  );

  // Selected node
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Update node data from PropertiesPanel
  const handleUpdateNodeData = useCallback(
    (nodeId: string, updatedData: any) => {
      setNodes((nds) => {
        const updated = nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: updatedData,
            };
          }
          return node;
        });
        pushHistory(updated, edges);
        return updated;
      });
    },
    [edges, pushHistory, setNodes]
  );

  // Drag & drop new node from sidebar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowWrapper.current || !rfInstance) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Constraint: only 1 start node per flow!
      if (type === "startNode" && nodes.some((n) => n.type === "startNode")) {
        error("Limite do Fluxo", "Apenas 1 bloco inicial de Início é permitido por fluxo.");
        return;
      }

      const newNode: FlowNode = {
        id: generateId("node"),
        type: type as any,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((nds) => {
        const next = nds.concat(newNode);
        pushHistory(next, edges);
        return next;
      });
      setSelectedNodeId(newNode.id);
    },
    [error, nodes, edges, pushHistory, rfInstance, setNodes]
  );

  // Add node via click
  const handleAddNode = useCallback(
    (type: string) => {
      if (type === "startNode" && nodes.some((n) => n.type === "startNode")) {
        error("Limite do Fluxo", "Apenas 1 bloco inicial de Início é permitido por fluxo.");
        return;
      }

      const newNode: FlowNode = {
        id: generateId("node"),
        type: type as any,
        position: { x: 300, y: 150 + nodes.length * 60 },
        data: getDefaultNodeData(type),
      };

      setNodes((nds) => {
        const next = nds.concat(newNode);
        pushHistory(next, edges);
        return next;
      });
      setSelectedNodeId(newNode.id);
    },
    [error, nodes, edges, pushHistory, setNodes]
  );

  // Save Draft
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const flowData: FlowData = {
        nodes,
        edges,
        settings: initialFlowData.settings || {},
        triggers: initialFlowData.triggers || [],
      };

      const res = await fetch(`/api/chatbots/${chatbotId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow_data: flowData }),
      });

      if (!res.ok) throw new Error("Erro ao salvar rascunho");

      success("Rascunho salvo", "As alterações do fluxo foram salvas com sucesso.");
    } catch (err: any) {
      error("Erro ao salvar", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Draft as Immutable Snapshot
  const handlePublish = async () => {
    // Check if start node exists
    const hasStart = nodes.some((n) => n.type === "startNode");
    if (!hasStart) {
      error("Publicação bloqueada", "O fluxo precisa ter pelo menos um bloco de Início.");
      return;
    }

    setIsPublishing(true);
    try {
      // 1. Save current draft first
      const flowData: FlowData = {
        nodes,
        edges,
        settings: initialFlowData.settings || {},
        triggers: initialFlowData.triggers || [],
      };
      await fetch(`/api/chatbots/${chatbotId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow_data: flowData }),
      });

      // 2. Trigger snapshot publication
      const res = await fetch(`/api/chatbots/${chatbotId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changelog: "Publicado via Editor Visual" }),
      });

      if (!res.ok) throw new Error("Erro ao publicar snapshot");

      const data = await res.json();
      setChatbotStatus("published");
      success(
        "Chatbot Publicado!",
        `Snapshot imutável v${data.data?.version_number} gerado. Novas conversas usarão esta versão.`
      );
    } catch (err: any) {
      error("Falha na publicação", err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Keyboard Shortcuts: Copy, Paste, Undo, Redo, Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }
      // Copy: Ctrl+C
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        const selected = nodes.filter((n) => n.selected);
        if (selected.length > 0) {
          setCopiedNodes(selected);
          info("Blocos copiados", `${selected.length} bloco(s) na área de transferência.`);
        }
      }
      // Paste: Ctrl+V
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (copiedNodes.length > 0) {
          const newNodes = copiedNodes.map((n) => ({
            ...n,
            id: generateId("node"),
            position: { x: n.position.x + 40, y: n.position.y + 40 },
            selected: true,
          }));
          setNodes((nds) => {
            const deselected = nds.map((n) => ({ ...n, selected: false }));
            const combined = [...deselected, ...newNodes];
            pushHistory(combined, edges);
            return combined;
          });
          info("Colado", `${newNodes.length} bloco(s) duplicado(s).`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copiedNodes, edges, handleRedo, handleUndo, info, nodes, pushHistory, setNodes]);

  const handleExportJson = useCallback(() => {
    const dataToExport: FlowData = {
      nodes,
      edges,
      settings: initialFlowData.settings || {},
      triggers: initialFlowData.triggers || [],
      metadata: {
        exportedAt: new Date().toISOString(),
        chatbotName,
        chatbotId,
      },
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute(
      "download",
      `${chatbotName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-flow.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success("Fluxo Exportado", "O arquivo JSON do fluxo foi baixado com sucesso.");
  }, [nodes, edges, initialFlowData, chatbotName, chatbotId, success]);

  const handleImportJson = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
            throw new Error("Formato inválido: o arquivo deve conter a lista 'nodes'.");
          }
          setNodes(parsed.nodes);
          setEdges(parsed.edges || []);
          pushHistory(parsed.nodes, parsed.edges || []);
          success("Fluxo Importado", `${parsed.nodes.length} blocos carregados.`);
        } catch (err: any) {
          error("Erro na Importação", err.message || "Não foi possível ler o arquivo JSON.");
        } finally {
          event.target.value = "";
        }
      };
      reader.readAsText(file);
    },
    [setNodes, setEdges, pushHistory, success, error]
  );

  const handleTogglePause = useCallback(async () => {
    setIsPausing(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/toggle-pause`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erro ao alterar status do fluxo.");
      }

      setChatbotStatus(json.status);
      if (json.isPaused) {
        info(
          "Fluxo Pausado",
          "O chatbot não responderá automaticamente a novas mensagens no WhatsApp enquanto estiver pausado."
        );
      } else {
        success(
          "Fluxo Ativado!",
          "O chatbot voltou a responder normalmente às mensagens do WhatsApp."
        );
      }
    } catch (err: any) {
      error("Erro ao Pausar/Ativar", err.message);
    } finally {
      setIsPausing(false);
    }
  }, [chatbotId, error, info, success]);

  const currentFlowData: FlowData = {
    nodes,
    edges,
    settings: initialFlowData.settings || {},
    triggers: initialFlowData.triggers || [],
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090a0f]">
      {/* Top Toolbar */}
      <Toolbar
        chatbotName={chatbotName}
        chatbotStatus={chatbotStatus}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isPausing={isPausing}
        onTogglePause={handleTogglePause}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isMiniMapOpen={isMiniMapOpen}
        onSave={handleSave}
        onPublish={handlePublish}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={() => rfInstance?.zoomIn()}
        onZoomOut={() => rfInstance?.zoomOut()}
        onFitView={() => rfInstance?.fitView({ padding: 0.2 })}
        onToggleMiniMap={() => setIsMiniMapOpen(!isMiniMapOpen)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* Main Workspace: Left Sidebar + Central React Flow Canvas + Right Properties Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Blocks Palette */}
        <NodeSidebar onAddNode={handleAddNode} />

        {/* Central Infinite Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 h-full w-full relative">
          <ReactFlow<FlowNode, FlowEdge>
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "#6366f1", strokeWidth: 2 },
            }}
            className="bg-[#090a0f]"
          >
            <Background
              color="#232736"
              gap={24}
              size={1.5}
              variant={BackgroundVariant.Dots}
            />

            {isMiniMapOpen && (
              <MiniMap
                nodeStrokeColor="#4f46e5"
                nodeColor="#1e2230"
                maskColor="rgba(9, 10, 15, 0.75)"
                className="!bg-[#11131a] !border !border-border/80 !rounded-lg"
              />
            )}
          </ReactFlow>
        </div>

        {/* Right Panel: Selected Block Properties */}
        <PropertiesPanel
          selectedNode={selectedNode}
          onUpdateNodeData={handleUpdateNodeData}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>

      {/* Simulator Modal for live testing */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        flowData={currentFlowData}
      />

      {/* Version History & Rollback Modal */}
      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        chatbotId={chatbotId}
        onRollbackComplete={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

function getDefaultNodeData(type: string): any {
  switch (type) {
    case "startNode":
      return {
        label: "Início",
        triggerType: "keyword",
        keywords: ["oi", "ola"],
        description: "Disparado ao receber mensagem",
      };
    case "messageNode":
      return {
        label: "Mensagem",
        messageType: "text",
        content: "Olá {{nome}}! Tudo bem?",
        delaySeconds: 1,
      };
    case "waitNode":
      return {
        label: "Espera",
        waitType: "user_reply",
      };
    case "conditionNode":
      return {
        label: "Condição",
        branches: [
          {
            id: generateId("branch"),
            label: "Sim",
            operator: "message_contains",
            value: "sim",
          },
          {
            id: generateId("branch"),
            label: "Não",
            operator: "message_contains",
            value: "nao",
          },
        ],
      };
    case "addTagNode":
      return {
        label: "Adicionar Tag",
        tagName: "Cliente",
      };
    case "removeTagNode":
      return {
        label: "Remover Tag",
        tagName: "Lead",
      };
    case "variableNode":
      return {
        label: "Salvar Variável",
        variableKey: "resposta",
        sourceType: "last_message",
        variableValue: "",
      };
    case "webhookNode":
      return {
        label: "Webhook",
        method: "GET",
        url: "https://api.exemplo.com/dados",
        headers: [{ key: "Accept", value: "application/json" }],
      };
    case "endNode":
      return {
        label: "Fim",
        reason: "Fluxo concluído",
      };
    default:
      return { label: "Bloco" };
  }
}

export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
