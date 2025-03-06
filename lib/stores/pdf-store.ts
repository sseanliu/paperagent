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
      
      console.log('Uploading file to OpenAI:', file.name);
      const uploadedFile = await openai.files.create({
        file,
        purpose: 'assistants'
      });
      console.log('File uploaded successfully, OpenAI file ID:', uploadedFile.id);

      // Verify the file is ready for use with the Assistants API
      console.log('Checking file status...');
      const fileStatus = await openai.files.retrieve(uploadedFile.id);
      console.log('File status:', fileStatus.status);
      
      if (fileStatus.status !== 'processed') {
        console.log('File not yet processed, waiting...');
        // Wait for the file to be processed (optional)
        // You might want to implement a polling mechanism here
      }

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
        
        try {
          // Create a thread with the prompt
          console.log('Creating thread with prompt:', prompt);
          const thread = await openai.beta.threads.create({
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          });
          console.log('Thread created:', thread.id);

          // Create an assistant with retrieval capability
          console.log('Creating assistant with file:', file.openaiFileId);
          const assistant = await openai.beta.assistants.create({
            name: 'PDF Analysis Assistant',
            instructions: 'You are a helpful assistant that answers questions based on the provided PDF documents.',
            model: 'gpt-4o',
            tools: [{ type: 'retrieval' }],
            file_ids: [file.openaiFileId]
          });
          console.log('Assistant created:', assistant.id);

          // Create and wait for the run to complete
          console.log('Creating run with thread:', thread.id, 'and assistant:', assistant.id);
          const run = await openai.beta.threads.runs.create(
            thread.id,
            { assistant_id: assistant.id }
          );
          console.log('Run created:', run.id);

          // Poll for completion
          let runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
          );
          console.log('Initial run status:', runStatus.status);

          while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
            console.log('Run status:', runStatus.status, '- waiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(
              thread.id,
              run.id
            );
          }
          console.log('Final run status:', runStatus.status);

          if (runStatus.status === 'completed') {
            // Get the assistant's response
            console.log('Getting messages from thread:', thread.id);
            const messages = await openai.beta.threads.messages.list(thread.id);
            console.log('Messages received, count:', messages.data.length);
            
            if (messages.data.length === 0) {
              console.error('No messages found in thread');
              return 'Sorry, I could not generate a response for this document.';
            }
            
            const lastMessage = messages.data[0];
            console.log('Last message:', JSON.stringify(lastMessage));

            // Add null check to prevent undefined errors
            if (lastMessage && lastMessage.content && lastMessage.content.length > 0) {
              const content = lastMessage.content[0];
              console.log('Content type:', content.type);
              
              if (content.type === 'text' && content.text) {
                return content.text.value || '';
              } else {
                console.error('Unexpected content type:', content.type);
                return 'Sorry, I could not generate a response in the expected format.';
              }
            } else {
              console.error('Unexpected response format from Assistants API:', lastMessage);
              return 'Sorry, I could not generate a response for this document.';
            }
          } else {
            console.error('Run failed with status:', runStatus.status);
            throw new Error(`Run failed with status: ${runStatus.status}`);
          }
        } catch (assistantError) {
          console.error('Error using Assistants API:', assistantError);
          
          // Fall back to standard chat completions if Assistants API fails
          console.log('Falling back to standard chat completions API');
          const requestParams = {
            messages: [{ 
              role: 'user', 
              content: `The following question is about a PDF document: ${prompt}` 
            }],
            model: 'gpt-3.5-turbo'
          };
          
          console.log('Fallback request params:', JSON.stringify(requestParams));
          const completion = await openai.chat.completions.create(requestParams);
          return completion.choices[0].message.content || '';
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