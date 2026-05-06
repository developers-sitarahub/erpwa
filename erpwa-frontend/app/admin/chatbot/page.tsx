"use client";

import React, { useCallback, useEffect, useRef, useState, DragEvent } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  Node,
  Panel,
  ReactFlowInstance,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { Save, FolderOpen, AlertTriangle, Zap, Bot, Plus } from "lucide-react";
import { useTheme } from "@/context/theme-provider";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";

interface SavedWorkflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  triggerKeyword?: string;
  description?: string;
  createdAt?: string;
}

interface ChatbotLimits {
  limit: number;
  currentCount: number;
  planName?: string | null;
}

// Components
import Sidebar from "../../../components/chatbot/Sidebar";
import MessageNode from "../../../components/chatbot/nodes/MessageNode";
import ButtonNode from "../../../components/chatbot/nodes/ButtonNode";
import ListNode from "../../../components/chatbot/nodes/ListNode";
import ImageNode from "../../../components/chatbot/nodes/ImageNode";
import GalleryNode from "../../../components/chatbot/nodes/GalleryNode";
import StartNode from "../../../components/chatbot/nodes/StartNode";
import ButtonEdge from "../../../components/chatbot/edges/ButtonEdge";
import WorkflowListModal from "../../../components/chatbot/WorkflowListModal";

// Helper for ID generation
const generateId = () => `node_${Math.random().toString(36).substr(2, 9)}`;

// Register types
const nodeTypes = {
  message: MessageNode,
  button: ButtonNode,
  list: ListNode,
  image: ImageNode,
  gallery: GalleryNode,
  start: StartNode,
};

const edgeTypes = {
  button: ButtonEdge,
};

const initialNodes: Node[] = [
  {
    id: "start-1",
    type: "start",
    data: { label: "Start", triggerKeyword: "hello" },
    position: { x: 250, y: 50 },
  },
];

function FlowBuilderContent() {
  const { theme } = useTheme();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);

  // Chatbot limits
  const [chatbotLimits, setChatbotLimits] = useState<ChatbotLimits | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(true);

  const isDark = theme === "dark";

  // Derived: is it a new (unsaved) workflow and is the limit reached?
  const isNewWorkflow = !currentWorkflowId;
  const isLimitReached =
    chatbotLimits !== null &&
    chatbotLimits.limit !== -1 &&
    chatbotLimits.currentCount >= chatbotLimits.limit;
  const isBlocked = isNewWorkflow && isLimitReached;

  useEffect(() => {
    fetchChatbotLimits();
  }, []);

  const fetchChatbotLimits = async () => {
    try {
      setLimitsLoading(true);
      const res = await api.get("/workflow/limits");
      setChatbotLimits(res.data);
    } catch (err) {
      console.error("Failed to fetch chatbot limits", err);
      // Silently fail — limits won't show but page still works
      setChatbotLimits(null);
    } finally {
      setLimitsLoading(false);
    }
  };

  // Connect using custom ButtonEdge
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, type: "button", animated: true }, eds),
      ),
    [setEdges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type) return;
      if (!reactFlowInstance || !reactFlowWrapper.current) return;
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode: Node = {
        id: generateId(),
        type,
        position,
        data: { label: `${type} node` },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const handleSave = async () => {
    const startNode = nodes.find((n) => n.type === "start");
    if (!startNode || !startNode.data.triggerKeyword) {
      toast.error("⚠️ You must have a 'Start Flow' node with a trigger keyword set!");
      return;
    }

    // Block creation if limit reached (updates are always allowed)
    if (isBlocked) {
      toast.error(
        chatbotLimits?.limit === 0
          ? "No subscription plan assigned. Please contact support to activate your plan."
          : `Chatbot limit reached (${chatbotLimits?.currentCount}/${chatbotLimits?.limit}). Upgrade your plan to create more chatbots.`
      );
      return;
    }

    const payload = {
      id: currentWorkflowId,
      name: `Flow: ${startNode.data.triggerKeyword}`,
      nodes,
      edges,
      triggerKeyword: startNode.data.triggerKeyword,
      description: "Auto-saved flow",
    };

    try {
      const res = await api.post("/workflow", payload);
      if (res.data && res.data.id) {
        setCurrentWorkflowId(res.data.id);
      }
      toast.success("✅ Workflow saved successfully!");
      fetchChatbotLimits();
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to save workflow";
      toast.error(msg);
    }
  };

  const handleSelectWorkflow = (workflow: SavedWorkflow) => {
    setCurrentWorkflowId(workflow.id);
    if (workflow.nodes) setNodes(workflow.nodes);
    if (workflow.edges) {
      setEdges(
        workflow.edges.map((e: Edge) => ({
          ...e,
          type: "button",
          animated: true,
        })),
      );
    }
    setIsListModalOpen(false);
    setTimeout(() => reactFlowInstance?.fitView(), 100);
  };

  // Limit badge — same style as templates/manage-team pages
  const renderLimitBadge = () => {
    if (limitsLoading || !chatbotLimits) return null;

    if (chatbotLimits.limit === -1) {
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-200/50 gap-1">
          <Zap className="w-3 h-3" />
          Unlimited Chatbots
        </Badge>
      );
    }

    if (chatbotLimits.limit === 0) {
      return (
        <Badge variant="destructive" className="gap-1 text-[11px]">
          <AlertTriangle className="w-3 h-3" />
          No plan assigned — contact support
        </Badge>
      );
    }

    const isOver = chatbotLimits.currentCount >= chatbotLimits.limit;
    return (
      <Badge
        variant={isOver ? "destructive" : "secondary"}
        className={isOver ? "" : "bg-primary/10 text-primary border-primary/20"}
      >
        <AlertTriangle className={`w-3 h-3 mr-1 ${isOver ? "" : "hidden"}`} />
        {chatbotLimits.currentCount} / {chatbotLimits.limit} used
        {chatbotLimits.planName ? ` · ${chatbotLimits.planName} plan` : ""}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Page Header (matches templates & manage-team style) ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-sm shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Chatbot Builder
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-muted-foreground/80">
              Build automated WhatsApp chatbot flows triggered by keywords.
            </p>
            {renderLimitBadge()}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsListModalOpen(true)}
            className="flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Load Workflow
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isBlocked}
            title={
              isBlocked
                ? chatbotLimits?.limit === 0
                  ? "No plan assigned."
                  : `Limit reached (${chatbotLimits?.currentCount}/${chatbotLimits?.limit}). Upgrade to add more.`
                : ""
            }
            className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {currentWorkflowId ? "Update Workflow" : "Save Workflow"}
          </Button>
        </div>
      </div>

      {/* ── Limit Reached Banner ── */}
      {isBlocked && (
        <div className="flex items-center gap-2 bg-destructive/10 border-b border-destructive/20 text-destructive px-6 py-2 text-sm font-medium shrink-0">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {chatbotLimits?.limit === 0
            ? "No subscription plan assigned. Please contact support to activate your plan."
            : `Chatbot limit reached: ${chatbotLimits?.currentCount}/${chatbotLimits?.limit}. Upgrade your plan to create more chatbot flows.`}
        </div>
      )}

      {/* ── Builder Canvas ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div
          className="flex-1 h-full bg-gray-50 dark:bg-slate-900 relative"
          ref={reactFlowWrapper}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            defaultEdgeOptions={{
              type: "button",
              animated: true,
              style: {
                strokeWidth: 2,
                stroke: isDark ? "#475569" : "#94a3b8",
              },
            }}
            className={isDark ? "dark" : ""}
          >
            <Background
              color={isDark ? "#334155" : "#aaa"}
              gap={16}
              className="dark:bg-slate-900"
            />
            <Controls className="dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 fill-current" />

            {/* Current workflow indicator in canvas */}
            {currentWorkflowId && (
              <Panel position="top-left">
                <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5 shadow-sm">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                  Editing saved workflow
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>

      <WorkflowListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSelect={handleSelectWorkflow}
        onWorkflowDeleted={fetchChatbotLimits}
      />
    </div>
  );
}

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent />
    </ReactFlowProvider>
  );
}
