import OpenAI from 'openai';
import { config } from './config';

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is missing');
    }
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  return openaiClient;
}

export async function createVectorStore(name: string) {
  const client = getOpenAIClient();
  return await client.beta.vectorStores.create({ name });
}

export async function uploadFileToVectorStore(vectorStoreId: string, file: File) {
  const client = getOpenAIClient();
  
  // First, upload the file to OpenAI
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', 'assistants');
  
  const uploadedFile = await client.files.create({
    file,
    purpose: 'assistants'
  });

  // Add the file to the vector store
  const fileBatch = await client.beta.vectorStores.fileBatches.create(
    vectorStoreId,
    { file_ids: [uploadedFile.id] }
  );

  return { uploadedFile, fileBatch };
}

export async function createAssistant(vectorStoreId: string) {
  const client = getOpenAIClient();
  
  return await client.beta.assistants.create({
    name: "PDF Assistant",
    instructions: "You are a helpful assistant. Do not include any citation mark like [4:0 xxx.pdf] in the result",
    model: "gpt-4o",
    tools: [{ type: "file_search" }],
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStoreId]
      }
    }
  });
}

export async function createThread() {
  const client = getOpenAIClient();
  return await client.beta.threads.create();
}

export async function createMessage(threadId: string, content: string) {
  const client = getOpenAIClient();
  return await client.beta.threads.messages.create(threadId, {
    role: "user",
    content
  });
}

export async function createRun(threadId: string, assistantId: string) {
  const client = getOpenAIClient();
  return await client.beta.threads.runs.create(threadId, {
    assistant_id: assistantId
  });
}

export async function getRunStatus(threadId: string, runId: string) {
  const client = getOpenAIClient();
  return await client.beta.threads.runs.retrieve(threadId, runId);
}

export async function getMessages(threadId: string) {
  const client = getOpenAIClient();
  return await client.beta.threads.messages.list(threadId);
}