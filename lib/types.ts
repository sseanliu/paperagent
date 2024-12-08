export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface UploadedFile {
  name: string;
  size: number;
  lastModified: number;
  vectorStoreId?: string;
  assistantId?: string;
  threadId?: string;
}

export interface ChatSession {
  vectorStoreId: string;
  assistantId: string;
  threadId: string;
}