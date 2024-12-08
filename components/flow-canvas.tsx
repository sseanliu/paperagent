"use client";

import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Connection,
  Edge,
  Node as FlowNode,
  OnNodesChange,
  applyNodeChanges,
} from 'react-flow-renderer';
import { useFlowStore } from '@/lib/stores/flow-store';
import { PromptNode } from '@/components/nodes/prompt-node';
import { generateCompletion } from '@/lib/services/openai-service';
import { FlowToolbar } from '@/components/flow-toolbar';
import { PDFUpload } from '@/components/pdf/pdf-upload';

const nodeTypes = {
  prompt: PromptNode,
};

const INITIAL_NODE_POSITION = { x: 100, y: 100 };

export function FlowCanvas() {
  const {
    nodes,
    edges,
    addNode,
    updateNodes,
    updateNodePrompt,
    updateNodeResult,
    setNodeProcessing,
    setNodeError,
    connectNodes,
    removeNode,
    removeEdge,
  } = useFlowStore();

  const onNodesChange: OnNodesChange = useCallback(
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

  const executeFlow = async () => {
    const startNodes = nodes.filter(
      (node) => !edges.some((edge) => edge.target === node.id)
    );

    for (const node of startNodes) {
      await executeNode(node.id);
    }
  };

  const executeNode = async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !node.data.prompt) return;

    try {
      setNodeProcessing(nodeId, true);
      setNodeError(nodeId, '');

      const result = await generateCompletion(node.data.prompt);
      updateNodeResult(nodeId, result || '');

      // Execute connected nodes
      const connectedEdges = edges.filter((edge) => edge.source === nodeId);
      for (const edge of connectedEdges) {
        await executeNode(edge.target);
      }
    } catch (error) {
      setNodeError(nodeId, error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setNodeProcessing(nodeId, false);
    }
  };

  const handleAddNode = () => {
    const offset = nodes.length * 50;
    const position = {
      x: INITIAL_NODE_POSITION.x + offset,
      y: INITIAL_NODE_POSITION.y + offset,
    };
    addNode(position);
  };

  const nodesWithUpdater = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      updateNodePrompt,
    },
  }));

  return (
    <div className="h-screen w-full">
      <FlowToolbar onAddNode={handleAddNode} onExecuteFlow={executeFlow} />
      <PDFUpload />
      
      <ReactFlow
        nodes={nodesWithUpdater}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodesDelete={nodes => nodes.forEach(node => removeNode(node.id))}
        onEdgesDelete={edges => edges.forEach(edge => removeEdge(edge.id))}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
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