import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { FlowState, Flow, Node, Edge, NodeResult } from '@/lib/types/flow';

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      flows: [],
      currentFlow: null,
      nodes: [],
      edges: [],

      addNode: (position) => {
        const newNode: Node = {
          id: uuidv4(),
          type: 'prompt',
          position,
          data: {
            prompt: '',
            results: [],
            isProcessing: false,
          },
          draggable: true,
        };

        set((state) => ({
          nodes: [...state.nodes, {
            ...newNode,
            data: {
              ...newNode.data,
              updateNodePrompt: (id: string, prompt: string) => {
                set((state) => ({
                  nodes: state.nodes.map((node) =>
                    node.id === id ? { ...node, data: { ...node.data, prompt } } : node
                  ),
                }));
              },
            },
          }],
        }));
      },

      updateNodes: (nodes) => {
        set((state) => ({
          nodes: nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              updateNodePrompt: (id: string, prompt: string) => {
                set((state) => ({
                  nodes: state.nodes.map((n) =>
                    n.id === id ? { ...n, data: { ...n.data, prompt } } : n
                  ),
                }));
              },
            },
          })),
        }));
      },

      updateNodePrompt: (id, prompt) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, prompt } } : node
          ),
        }));
      },

      updateNodeResults: (id, results) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, results } } : node
          ),
        }));
      },

      setNodeProcessing: (id, isProcessing) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, isProcessing } } : node
          ),
        }));
      },

      setNodeError: (id, error) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, error } } : node
          ),
        }));
      },

      connectNodes: (source, target) => {
        const newEdge: Edge = {
          id: uuidv4(),
          source,
          target,
        };

        set((state) => ({
          edges: [...state.edges, newEdge],
        }));
      },

      removeNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          edges: state.edges.filter(
            (edge) => edge.source !== id && edge.target !== id
          ),
        }));
      },

      removeEdge: (id) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== id),
        }));
      },

      saveFlow: (name) => {
        const { nodes, edges } = get();
        const newFlow: Flow = {
          id: uuidv4(),
          name,
          nodes,
          edges,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          flows: [...state.flows, newFlow],
          currentFlow: newFlow,
        }));
      },

      loadFlow: (id) => {
        const { flows } = get();
        const flow = flows.find(f => f.id === id);
        if (flow) {
          set({
            currentFlow: flow,
            nodes: flow.nodes,
            edges: flow.edges,
          });
        }
      },

      deleteFlow: (id) => {
        set((state) => ({
          flows: state.flows.filter(f => f.id !== id),
          currentFlow: state.currentFlow?.id === id ? null : state.currentFlow,
        }));
      },
    }),
    {
      name: 'flow-storage',
    }
  )
);