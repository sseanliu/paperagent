import { create } from 'zustand';
import OpenAI from 'openai';
import { config } from '@/lib/config';
import { v4 as uuidv4 } from 'uuid';

interface PDFFile {
  id: string;
  name: string;
  size: number;
  title: string;
  openaiFileId?: string;
}

interface PDFStore {
  uploadedFiles: PDFFile[];
  isUploading: boolean;
  error: string | null;
  selectedFileId: string | null;
  uploadPDF: (file: File) => Promise<void>;
  removePDF: (id: string) => void;
  selectFile: (id: string) => void;
  generateResponse: (prompt: string, fileId?: string) => Promise<string>;
}

function createOpenAIClient() {
  const apiKey = config.openai.apiKey;
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export const usePDFStore = create<PDFStore>((set, get) => ({
  uploadedFiles: [],
  isUploading: false,
  error: null,
  selectedFileId: null,

  uploadPDF: async (file: File) => {
    try {
      set({ isUploading: true, error: null });
      
      const openai = createOpenAIClient();
      const fileId = uuidv4();
      
      const uploadedFile = await openai.files.create({
        file,
        purpose: 'assistants'
      });

      set((state) => ({
        uploadedFiles: [...state.uploadedFiles, {
          id: fileId,
          name: file.name,
          size: file.size,
          title: file.name,
          openaiFileId: uploadedFile.id
        }]
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload PDF';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ isUploading: false });
    }
  },

  removePDF: (id: string) => {
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((file) => file.id !== id),
      selectedFileId: state.selectedFileId === id ? null : state.selectedFileId,
    }));
  },

  selectFile: (id: string) => {
    set({ selectedFileId: id });
  },

  generateResponse: async (prompt: string, fileId?: string) => {
    try {
      const openai = createOpenAIClient();
      const file = fileId ? get().uploadedFiles.find(f => f.id === fileId) : null;
      
      const completion = await openai.chat.completions.create({
        messages: [{ 
          role: 'user', 
          content: prompt 
        }],
        model: 'gpt-4',
        ...(file?.openaiFileId && {
          file_ids: [file.openaiFileId]
        })
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate response';
      throw new Error(errorMessage);
    }
  },
}));