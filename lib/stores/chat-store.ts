import { create } from 'zustand';
import { Message } from '@/lib/types';
import { createAssistant, createThread, uploadPDFAndAttachToThread, sendMessage, getMessages } from '@/lib/services/chat-service';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  assistantId: string | null;
  threadId: string | null;
  uploadedFile: File | null;
  initializeChat: () => Promise<void>;
  uploadPDF: (file: File) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  assistantId: null,
  threadId: null,
  uploadedFile: null,

  initializeChat: async () => {
    try {
      set({ isLoading: true, error: null });
      const assistant = await createAssistant();
      const thread = await createThread();
      set({ 
        assistantId: assistant.id,
        threadId: thread.id
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to initialize chat' });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadPDF: async (file: File) => {
    const { threadId } = get();
    if (!threadId) {
      throw new Error('Chat not initialized');
    }

    try {
      set({ isLoading: true, error: null });
      await uploadPDFAndAttachToThread(file, threadId);
      set({ uploadedFile: file });
      
      // Fetch initial messages after upload
      const messages = await getMessages(threadId);
      set({ messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: Array.isArray(msg.content) ? msg.content[0].text.value : msg.content
      })) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to upload PDF' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (content: string) => {
    const { threadId, assistantId } = get();
    if (!threadId || !assistantId) {
      throw new Error('Chat not initialized');
    }

    try {
      set({ isLoading: true, error: null });
      const response = await sendMessage(threadId, assistantId, content);
      
      // Fetch updated messages
      const messages = await getMessages(threadId);
      set({ messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: Array.isArray(msg.content) ? msg.content[0].text.value : msg.content
      })) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    } finally {
      set({ isLoading: false });
    }
  },
}));