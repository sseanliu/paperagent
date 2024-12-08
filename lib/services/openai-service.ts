import OpenAI from 'openai';
import { config } from '../config';

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

export async function generateCompletion(prompt: string) {
  const client = getOpenAIClient();
  
  try {
    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in completion:', error);
    throw error;
  }
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