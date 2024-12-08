export interface Node {
  id: string;
  type: 'prompt';
  position: { x: number; y: number };
  draggable?: boolean;
  data: {
    prompt: string;
    result?: string;
    isProcessing?: boolean;
    error?: string;
    updateNodePrompt?: (id: string, prompt: string) => void;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  addNode: (position: { x: number; y: number }) => void;
  updateNodes: (nodes: Node[]) => void;
  updateNodePrompt: (id: string, prompt: string) => void;
  updateNodeResult: (id: string, result: string) => void;
  setNodeProcessing: (id: string, isProcessing: boolean) => void;
  setNodeError: (id: string, error: string) => void;
  connectNodes: (source: string, target: string) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
}