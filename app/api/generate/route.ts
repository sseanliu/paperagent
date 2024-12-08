import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { config } from '@/lib/config';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  dangerouslyAllowBrowser: true,
});

export async function POST(request: Request) {
  try {
    const { prompt, vectorStoreId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

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
      tools: [{ type: 'file_search' }],
      ...(vectorStoreId && {
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId]
          }
        }
      })
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

      return NextResponse.json({
        text: lastMessage.content[0].text.value
      });
    } else {
      throw new Error(`Run failed with status: ${runStatus.status}`);
    }
  } catch (error) {
    console.error('Error generating response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate response' },
      { status: 500 }
    );
  }
}