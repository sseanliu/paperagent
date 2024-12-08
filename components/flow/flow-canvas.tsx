"use client";

import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Connection,
  Edge,
  OnNodesChange,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFlowStore } from '@/lib/stores/flow-store';
import { usePDFStore } from '@/lib/stores/pdf-store';
import { PromptNode } from '@/components/flow/prompt-node';
import { FlowToolbar } from '@/components/flow/flow-toolbar';
import { toast } from 'sonner';

const nodeTypes = {
  prompt: PromptNode,
};

const INITIAL_NODE_POSITION = { x: 100, y: 100 };
const NODE_SPACING = 300; // Reduced vertical spacing

export function FlowCanvas() {
  const {
    nodes,
    edges,
    addNode,
    updateNodes,
    updateNodeResults,
    setNodeProcessing,
    setNodeError,
    connectNodes,
    removeNode,
    removeEdge,
  } = useFlowStore();

  const { generateResponse, uploadedFiles } = usePDFStore();

  const onNodesChange = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, nodes);
      updateNodes(updatedNodes);
    },
    [nodes, updateNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        connectNodes(connection.source, connection.target);
      }
    },
    [connectNodes]
  );

  const handleAddNode = () => {
    const offset = nodes.length * NODE_SPACING;
    const position = {
      x: INITIAL_NODE_POSITION.x,
      y: INITIAL_NODE_POSITION.y + offset,
    };
    addNode(position);
  };

  const executeFlow = async () => {
    if (!uploadedFiles.length) {
      toast.error('Please upload at least one PDF first');
      return;
    }

    const startNodes = nodes.filter(
      (node) => !edges.some((edge) => edge.target === node.id)
    );

    if (startNodes.length === 0) {
      toast.error('Please add at least one node to the canvas');
      return;
    }

    for (const node of startNodes) {
      await executeNode(node.id);
    }
  };

  const executeNode = async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node?.data.prompt) {
      toast.error('Please enter a prompt in all nodes');
      return;
    }

    try {
      setNodeProcessing(nodeId, true);
      setNodeError(nodeId, '');

      const results = await Promise.all(
        uploadedFiles.map(async (file) => {
          const result = await generateResponse(node.data.prompt, file.id);
          return result;
        })
      );

      updateNodeResults(nodeId, results);

      const connectedEdges = edges.filter((edge) => edge.source === nodeId);
      for (const edge of connectedEdges) {
        await executeNode(edge.target);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setNodeError(nodeId, errorMessage);
      toast.error(errorMessage);
    } finally {
      setNodeProcessing(nodeId, false);
    }
  };

  return (
    <div className="h-full w-full relative">
      <FlowToolbar onAddNode={handleAddNode} onExecuteFlow={executeFlow} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodesDelete={nodes => nodes.forEach(node => removeNode(node.id))}
        onEdgesDelete={edges => edges.forEach(edge => removeEdge(edge.id))}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 text-muted-foreground">
            <p className="text-lg">Your canvas is empty</p>
            <p className="text-sm">Click the &quot;Add Node&quot; button to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}