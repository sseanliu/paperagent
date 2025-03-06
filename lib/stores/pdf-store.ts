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

        // Create an assistant with file_search capability
        console.log('Creating assistant with file:', file.openaiFileId);
        const assistant = await openai.beta.assistants.create({
          name: 'PDF Analysis Assistant',
          instructions: 'You are a helpful assistant that answers questions based on the provided PDF documents.',
          model: 'gpt-4o',
          tools: [{ type: 'file_search' }]
        });
        console.log('Assistant created:', assistant.id);
        
        // Attach the file to the assistant after creation
        console.log('Attaching file to assistant...');
        try {
          await openai.beta.assistants.files.create(
            assistant.id,
            { file_id: file.openaiFileId }
          );
          console.log('File attached to assistant');
        } catch (fileAttachError) {
          console.error('Error attaching file to assistant:', fileAttachError);
          throw new Error('Failed to attach file to assistant');
        }

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

        let maxAttempts = 60; // 1 minute timeout (1 second per attempt)
        let attempts = 0;

        while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
          console.log('Run status:', runStatus.status, '- waiting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
          );
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          console.error('Run timed out after 60 seconds');
          throw new Error('Assistant run timed out');
        }
        
        console.log('Final run status:', runStatus.status);

        if (runStatus.status === 'completed') {
          // Get the assistant's response
          console.log('Getting messages from thread:', thread.id);
          const messages = await openai.beta.threads.messages.list(thread.id);
          console.log('Messages received, count:', messages.data.length);
          
          if (!messages || !messages.data || messages.data.length === 0) {
            console.error('No messages found in thread or invalid response format');
            return 'Sorry, I could not generate a response for this document.';
          }
          
          const lastMessage = messages.data[0];
          console.log('Last message role:', lastMessage?.role || 'undefined');

          // Add comprehensive null checks to prevent undefined errors
          if (!lastMessage) {
            console.error('Last message is undefined');
            return 'Sorry, I could not generate a response for this document.';
          }
          
          if (!lastMessage.content || !Array.isArray(lastMessage.content) || lastMessage.content.length === 0) {
            console.error('Message content is invalid:', lastMessage.content);
            return 'Sorry, I could not generate a response for this document.';
          }
          
          const content = lastMessage.content[0];
          console.log('Content type:', content?.type || 'undefined');
          
          if (!content) {
            console.error('Content is undefined');
            return 'Sorry, I could not generate a response for this document.';
          }
          
          if (content.type === 'text' && content.text && typeof content.text.value === 'string') {
            return content.text.value;
          } else {
            console.error('Unexpected content format:', content);
            return 'Sorry, I could not generate a response in the expected format.';
          }
        } else {
          console.error('Run failed with status:', runStatus.status);
          return `Run failed with status: ${runStatus.status}`;
        }
      } catch (assistantError) {
        console.error('Error using Assistants API:', assistantError);
        
        // Fall back to standard chat completions API
        console.log('Falling back to standard chat completions API');
        return handleFallbackQuery(prompt);
      }
    } else {
      // For regular queries without files, use the standard chat completions API
      return handleStandardQuery(prompt);
    }
  },
}));

// Helper function for standard queries
async function handleStandardQuery(prompt: string) {
  try {
    const apiKey = config.openai.apiKey;
    
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      throw new Error('OpenAI API key is required');
    }
    
    const requestParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ 
        role: 'user', 
        content: prompt 
      }]
    };
    
    console.log('Request params:', JSON.stringify(requestParams));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestParams)
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Failed to get error details');
      console.error(`API request failed with status ${response.status}: ${errorText}`);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Parse response with error handling
    let data;
    try {
      data = await response.json();
      console.log('API response received');
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      return 'Sorry, I could not generate a response due to an API response parsing error.';
    }
    
    // Add comprehensive null checks
    if (!data) {
      console.error('API response data is null or undefined');
      return 'Sorry, I could not generate a response due to an empty API response.';
    }
    
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('API response has no choices:', data);
      return 'Sorry, I could not generate a response due to an invalid API response format.';
    }
    
    const firstChoice = data.choices[0];
    if (!firstChoice) {
      console.error('First choice is undefined');
      return 'Sorry, I could not generate a response due to an invalid API response format.';
    }
    
    if (!firstChoice.message) {
      console.error('Message in first choice is undefined:', firstChoice);
      return 'Sorry, I could not generate a response due to an invalid API response format.';
    }
    
    // Safely access content with null check
    const content = firstChoice.message.content;
    if (typeof content !== 'string') {
      console.error('Content is not a string:', content);
      return 'Sorry, I could not generate a response due to an invalid API response format.';
    }
    
    return content;
  } catch (error) {
    console.error('Standard query error:', error);
    return 'Sorry, I could not generate a response due to an API error.';
  }
}

// Helper function for fallback queries
async function handleFallbackQuery(prompt: string) {
  try {
    const apiKey = config.openai.apiKey;
    
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      throw new Error('OpenAI API key is required');
    }
    
    const requestParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ 
        role: 'user', 
        content: `The following question is about a PDF document: ${prompt}` 
      }]
    };
    
    console.log('Fallback request params:', JSON.stringify(requestParams));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestParams)
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Failed to get error details');
      console.error(`API request failed with status ${response.status}: ${errorText}`);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Parse response with error handling
    let data;
    try {
      data = await response.json();
      console.log('Fallback response received');
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      return 'Sorry, I could not generate a response due to an API response parsing error.';
    }
    
    // Add comprehensive null checks
    if (!data) {
      console.error('API response data is null or undefined');
      return 'Sorry, I could not generate a response due to an empty API response.';
    }
    
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('API response has no choices:', data);
      return 'Sorry, I could not generate a response due to an invalid API response format.';
    }
    
    const firstChoice = data.choices[0];
    if (!firstChoice) {
      console.error('First choice is undefined');
      return 'Sorry, I could not generate a response due to an invalid API response format.';
    }
    
    if (!firstChoice.message) {
      console.error('Message in first choice is undefined:', firstChoice);
      return 'Sorry, I could not generate a response due to an invalid API response format.';
    }
    
    // Safely access content with null check
    const content = firstChoice.message.content;
    if (typeof content !== 'string') {
      console.error('Content is not a string:', content);
      return 'Sorry, I could not generate a response due to an invalid API response format.';
    }
    
    return content;
  } catch (error) {
    console.error('Fallback query error:', error);
    return 'Sorry, I could not generate a response due to an API error.';
  }
}