import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AutomationBuilderProps {
  onClose?: () => void;
  onSaved?: () => void;
}

let nid = 1;

export default function AutomationBuilder({ onClose, onSaved }: AutomationBuilderProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const initialNodes = useMemo<Node[]>(
    () => [
      {
        id: `trigger-${nid++}`,
        type: "input",
        position: { x: 150, y: 50 },
        data: { label: "Trigger: New Lead", kind: "trigger", triggerType: "new_lead" },
      },
    ],
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), []);

  const addNode = (kind: "trigger" | "condition" | "action") => {
    const base = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };
    const next: Node = {
      id: `${kind}-${nid++}`,
      type: kind === "action" ? "output" : kind === "trigger" ? "input" : "default",
      position: base,
      data: {
        label: `${kind === "trigger" ? "Trigger" : kind === "condition" ? "Condition" : "Action"}`,
        kind,
      },
    };
    setNodes((n) => [...n, next]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    const triggerNode = nodes.find((n) => (n.data as any)?.kind === "trigger");
    const trigger_type = (triggerNode?.data as any)?.triggerType || "new_lead";

    try {
      const payload = {
        name,
        description,
        trigger_type,
        trigger_conditions: {},
        actions: { nodes, edges },
        is_active: false,
      };

      const { error } = await supabase.from("automation_workflows").insert([payload]);
      if (error) throw error;

      toast.success("Workflow saved");
      onSaved?.();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save workflow");
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="border-b p-4 flex items-center gap-3">
        <Input placeholder="Workflow name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-sm" />
        <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="max-w-xl h-10" />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave}>Save Workflow</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r p-3 space-y-2">
          <Card className="p-3">
            <div className="text-sm font-medium mb-2">Components</div>
            <div className="grid gap-2">
              <Button variant="secondary" onClick={() => addNode("trigger")}>Add Trigger</Button>
              <Button variant="secondary" onClick={() => addNode("condition")}>Add Condition</Button>
              <Button variant="secondary" onClick={() => addNode("action")}>Add Action</Button>
            </div>
          </Card>
        </div>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="h-full"
            attributionPosition="bottom-right"
          >
            <MiniMap zoomable pannable />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
