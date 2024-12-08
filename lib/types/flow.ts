export interface Flow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

export interface NodeResult {
  fileId: string;
  result: string;
}

export interface Node {
  id: string;
  type: 'prompt';
  position: { x: number; y: number };
  data: {
    prompt: string;
    results?: NodeResult[];
    isProcessing?: boolean;
    error?: string;
    updateNodePrompt?: (id: string, prompt: string) => void;
  };
  draggable: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface FlowState {
  flows: Flow[];
  currentFlow: Flow | null;
  nodes: Node[];
  edges: Edge[];
  addNode: (position: { x: number; y: number }) => void;
  updateNodes: (nodes: Node[]) => void;
  updateNodePrompt: (id: string, prompt: string) => void;
  updateNodeResults: (id: string, results: NodeResult[]) => void;
  setNodeProcessing: (id: string, isProcessing: boolean) => void;
  setNodeError: (id: string, error: string) => void;
  connectNodes: (source: string, target: string) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  saveFlow: (name: string) => void;
  loadFlow: (id: string) => void;
  deleteFlow: (id: string) => void;
}