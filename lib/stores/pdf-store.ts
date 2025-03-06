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
  
  console.log('API Key exists:', !!apiKey, 'Length:', apiKey.length);
  
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
      
      console.log('Generating response with prompt:', prompt);
      console.log('File ID:', fileId);
      console.log('OpenAI File ID:', file?.openaiFileId);
      
      // If we have a file, use the Assistants API
      if (file?.openaiFileId) {
        console.log('Using Assistants API for file-based query');
        
        // Create a thread with the prompt
        const thread = await openai.beta.threads.create({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        // Create an assistant with file search capability
        const assistant = await openai.beta.assistants.create({
          name: 'PDF Analysis Assistant',
          instructions: 'You are a helpful assistant that answers questions based on the provided PDF documents.',
          model: 'gpt-4o',
          tools: [{ type: 'retrieval' }],
          file_ids: [file.openaiFileId]
        });

        // Create and wait for the run to complete
        const run = await openai.beta.threads.runs.create(
          thread.id,
          { assistant_id: assistant.id }
        );

        // Poll for completion
        let runStatus = await openai.beta.threads.runs.retrieve(
          thread.id,
          run.id
        );

        while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
          );
        }

        if (runStatus.status === 'completed') {
          // Get the assistant's response
          const messages = await openai.beta.threads.messages.list(thread.id);
          const lastMessage = messages.data[0];

          return lastMessage.content[0].text.value;
        } else {
          throw new Error(`Run failed with status: ${runStatus.status}`);
        }
      } else {
        // For regular queries without files, use the standard chat completions API
        const requestParams = {
          messages: [{ 
            role: 'user', 
            content: prompt 
          }],
          model: 'gpt-4o'
          // Note: file_ids is not supported in the standard chat completions API
          // To use files with OpenAI, we need to use the Assistants API instead
        };
        
        console.log('Using standard chat completions API');
        console.log('Request params:', JSON.stringify(requestParams));
        
        const completion = await openai.chat.completions.create(requestParams);
        return completion.choices[0].message.content || '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate response';
      throw new Error(errorMessage);
    }
  },
}));