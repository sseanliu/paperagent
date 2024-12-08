import OpenAI from 'openai';
import { config, validateConfig } from './config';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    validateConfig();
    openai = new OpenAI({
      apiKey: config.openai.apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  return openai;
}

export async function getChatCompletion(messages: { role: string; content: string }[]) {
  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      messages: messages,
      model: 'gpt-4o',
    });

    return completion.choices[0].message;
  } catch (error) {
    console.error('Error in chat completion:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is invalid or missing. Please check your configuration.');
      }
    }
    throw error;
  }
}