<<<<<<< HEAD
import { GoogleGenAI } from '@google/genai';
import { type PagesFunction, Response as WorkerResponse } from '@cloudflare/workers-types';
import { Env } from './lib/env.js';
import { getKV } from './lib/getKV.js';
import { scroll } from './lib/scroll.js';
import { TaskManager } from './services/TaskManager.js';
import { Task, TaskStatus, TaskCategory } from './types/Task.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in the environment variables.');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Define the expected structure of the request
interface ChatRequest {
  channel?: string;
  message: string;
  model?: string;
  userId?: string;
}

// Task-related prompt templates
const TASK_PROMPT_TEMPLATE = `You are a task management assistant. Please help manage the following request:
{userMessage}

Available actions:
- Create a new task
- Update existing task
- List tasks
- Delete task
- Generate daily report
- Get location-based reminders
- Get task insights

Current tasks context:
{tasksContext}

Please respond with a structured action in JSON format:
{
  "action": "createTask|updateTask|listTasks|deleteTask|generateReport|getReminders|getInsights",
  "parameters": {
    // Action specific parameters
  }
}`;

async function handleTaskCommand(taskManager: TaskManager, userMessage: string, tasksContext: string): Promise<any> {
  const model = ai.generateContent({
    model: 'gemini-pro',
    contents: [{ parts: [{ text: prompt }] }]
  });
  
  const prompt = TASK_PROMPT_TEMPLATE
    .replace('{userMessage}', userMessage)
    .replace('{tasksContext}', tasksContext);

  const result = await model;

  const actionData = JSON.parse(result.text);
  
  switch (actionData.action) {
    case 'createTask':
      return await taskManager.createTask(actionData.parameters);
    case 'updateTask':
      return await taskManager.updateTask(actionData.parameters.taskId, actionData.parameters.updates);
    case 'listTasks':
      return await taskManager.listTasks(actionData.parameters);
    case 'deleteTask':
      return await taskManager.deleteTask(actionData.parameters.taskId);
    case 'generateReport':
      return await taskManager.generateDailyReport(actionData.parameters.date);
    case 'getReminders':
      return await taskManager.getTasksNearLocation(
        actionData.parameters.latitude,
        actionData.parameters.longitude,
        actionData.parameters.radius
      );
    case 'getInsights':
      const tasks = await taskManager.listTasks();
      return { insights: taskManager['generateInsights'](tasks) };
    default:
      throw new Error('Unknown task action');
  }
}

export const onRequestGet: PagesFunction<Env> = async (context): Promise<WorkerResponse> => {
  const url = new URL(context.request.url);
  const channel = url.searchParams.get('channel') || 'default';
  const message = url.searchParams.get('message');
  const userId = url.searchParams.get('userId') || 'default';

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message parameter is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }) as unknown as WorkerResponse;
  }

  return handleChatRequest(context, { channel, message, userId });
};

export const onRequestPost: PagesFunction<Env> = async (context): Promise<WorkerResponse> => {
  try {
    const body: ChatRequest = await context.request.json();
    return handleChatRequest(context, body);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }) as unknown as WorkerResponse;
  }
};

async function handleChatRequest(context: any, params: ChatRequest): Promise<WorkerResponse> {
  const kv = await getKV(context, true);

  if (!kv) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }) as unknown as WorkerResponse;
  }

  try {
    const channel = params.channel || 'default';
    const userMessage = params.message;
    const requestedModel = params.model || 'gemini-pro';
    const userId = params.userId || 'default';

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'Message parameter is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }) as unknown as WorkerResponse;
    }

    // Initialize TaskManager
    const taskManager = new TaskManager(kv, userId);

    // Check if the message is task-related
    const isTaskRelated = /task|todo|remind|schedule|due|priority/i.test(userMessage);

    let response;
    if (isTaskRelated) {
      // Get current tasks for context
      const currentTasks = await taskManager.listTasks();
      const tasksContext = JSON.stringify(currentTasks);
      
      try {
        const taskResponse = await handleTaskCommand(taskManager, userMessage, tasksContext);
        response = {
          success: true,
          channel,
          message: userMessage,
          reply: 'Task operation completed successfully',
          taskResult: taskResponse,
        };
      } catch (error) {
        response = {
          success: false,
          channel,
          message: userMessage,
          reply: 'Failed to process task command',
          error: error.message,
        };
      }
    } else {
      // Handle regular chat messages
      const result = await ai.generateContent({
        model: 'gemini-pro',
        contents: [{ parts: [{ text: userMessage }] }]
      });

      response = {
        success: true,
        channel,
        message: userMessage,
        reply: result.text,
      };
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }) as unknown as WorkerResponse;
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process request',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }) as unknown as WorkerResponse;
  }
}

// Helper function to extract suggested content (facts) from the AI response
function extractSuggestedContent(responseText: string): string[] {
  const facts = responseText
    .split('.')
    .map((sentence) => sentence.trim())
    .filter((sentence) =>
      /\d/.test(sentence) || // Contains numbers
      /(important|key|notable|fact|suggest|recommend)/i.test(sentence) // Contains keywords
    );
  return facts;
}
=======
import type {
 PagesFunction,
 Response as ResponseType,
} from '@cloudflare/workers-types'
import { GoogleGenAI } from '@google/genai'
import { Env } from './lib/env.js'

interface ChatRequest {
 message: string
 channel: string
 userName?: string
 history?: Array<{
  text: string | any
  sender: string
  timestamp?: string
 }>
}

// Helper to fetch channel messages from /seek
async function fetchChannelMessages(
 channel: string,
 request: Request
): Promise<any[]> {
 const url = `/seek?channel=${encodeURIComponent(
  channel
 )}&hour=999999999`
 const base = new URL(request.url).origin
 const seekUrl = base + url
 const resp = await fetch(seekUrl, {
  headers: { Accept: 'application/json' },
 })
 if (!resp.ok) return []
 const data: any = await resp.json()
 if (Array.isArray(data.messages))
  return data.messages
 if (typeof data.messages === 'object')
  return Object.values(data.messages)
 return []
}

// Helper to fetch channel metadata from /channel-info
async function fetchChannelMetadata(
 channel: string,
 request: Request
): Promise<any> {
 const url = `/channel-info?channel=${encodeURIComponent(
  channel
 )}`
 const base = new URL(request.url).origin
 const metadataUrl = base + url
 try {
  const resp = await fetch(metadataUrl, {
   headers: { Accept: 'application/json' },
  })
  if (!resp.ok) return null
  return await resp.json()
 } catch (error) {
  console.error(
   'Error fetching channel metadata:',
   error
  )
  return null
 }
}

export const onRequestPost: PagesFunction<
 Env
> = async (context) => {
 try {
  const request = context.request
  const data: ChatRequest = await request.json()

  if (!data.message) {
   return new Response(
    JSON.stringify({
     error: 'Message is required',
    }),
    {
     status: 400,
     headers: {
      'Content-Type': 'application/json',
     },
    }
   ) as unknown as ResponseType
  }

  const GEMINI_API_KEY =
   context.env.GEMINI_API_KEY

  if (
   !GEMINI_API_KEY ||
   GEMINI_API_KEY.trim() === ''
  ) {
   console.error(
    'Chat error: GEMINI_API_KEY is missing or empty'
   )
   return new Response(
    JSON.stringify({
     error: 'API key configuration error',
     details:
      'GEMINI_API_KEY is not configured properly',
    }),
    {
     status: 500,
     headers: {
      'Content-Type': 'application/json',
     },
    }
   ) as unknown as ResponseType
  }

  // Initialize Google Gen AI
  const ai = new GoogleGenAI({
   apiKey: GEMINI_API_KEY,
  })

  // Build the conversation as a single prompt
  let prompt =
   'You are Tag Me In AI, a helpful and friendly assistant. '
  if (data.userName) {
   prompt += `You're chatting with ${data.userName}. `
  }
  prompt +=
   'Please be conversational and helpful in your responses.\n\n'

  // Add channel metadata context
  const channelMetadata =
   await fetchChannelMetadata(
    data.channel,
    request
   )
  if (channelMetadata) {
   prompt += `\nChannel Information for #${data.channel}:\n`
   prompt += `Description: ${
    channelMetadata.description ||
    'No description available'
   }\n`
   prompt += `Purpose: ${
    channelMetadata.purpose ||
    'General discussion'
   }\n`
   prompt += `Created: ${
    channelMetadata.created || 'Unknown'
   }\n`
   if (
    channelMetadata.tags &&
    channelMetadata.tags.length > 0
   ) {
    prompt += `Tags: ${channelMetadata.tags.join(
     ', '
    )}\n`
   }
   prompt += '\n'
  }

  // Add channel messages context
  const channelMessages =
   await fetchChannelMessages(
    data.channel,
    request
   )
  if (channelMessages.length > 0) {
   prompt += `\nRecent messages from channel #${data.channel}. Use these to understand the context and ongoing discussions:\n`
   // Limit to last 10 messages for context
   const recentMessages =
    channelMessages.slice(-10)
   for (const msg of recentMessages) {
    if (!msg || !msg.text) continue
    let text = ''
    if (typeof msg.text === 'string') {
     text = msg.text
    } else if (msg.text.content) {
     text = msg.text.content
    } else if (msg.text.text) {
     text = msg.text.text
    } else if (msg.text.title) {
     text = msg.text.title
    } else {
     text = JSON.stringify(msg.text)
    }
    prompt += `${msg.sender}: ${text}\n`
   }
   prompt += '\n'
  }

  // Add recent conversation history
  const history = data.history || []
  for (const msg of history) {
   if (msg.sender === 'System') continue
   const text =
    typeof msg.text === 'string'
     ? msg.text
     : msg.text &&
       typeof msg.text.text === 'string'
     ? msg.text.text
     : JSON.stringify(msg.text)
   prompt += `${msg.sender}: ${text}\n`
  }

  // Add the current message
  prompt += `User: ${data.message}\nAssistant: `

  try {
   // Format messages for Gemini API
   const messages = [
    {
     role: 'user',
     parts: [{ text: prompt }],
    },
   ]

   // Get response from Gemini using the structured content format
   const response =
    await ai.models.generateContent({
     model: 'gemini-2.0-flash-001',
     contents: messages,
    })

   const text = response.text

   if (!text) {
    throw new Error('No response generated')
   }

   // Extract suggested replies (bullet points or key facts)
   let suggestedReplies: string[] = []
   // 1. Bullet points (lines starting with -, *, or •)
   const bulletRegex = /^\s*[-*•]\s+(.*)$/gm
   let match
   while (
    (match = bulletRegex.exec(text)) !== null
   ) {
    if (
     match[1] &&
     match[1].trim().length > 0
    ) {
     suggestedReplies.push(match[1].trim())
    }
   }
   // 2. If no bullets, try to extract short factual sentences (optional, fallback)
   if (suggestedReplies.length === 0) {
    // Split into sentences and pick those under 120 chars
    const sentences = text.split(
     /(?<=[.!?])\s+/
    )
    suggestedReplies = sentences
     .filter(
      (s) => s.length > 0 && s.length < 120
     )
     .slice(0, 3)
   }

   return new Response(
    JSON.stringify({
     message: text,
     sender: 'Tag Me In AI',
     channel: data.channel,
     suggestedReplies,
    }),
    {
     headers: {
      'Content-Type': 'application/json',
     },
    }
   ) as unknown as ResponseType
  } catch (apiError) {
   console.error('Gemini API error:', apiError)

   if (
    apiError.message &&
    apiError.message.includes('403')
   ) {
    return new Response(
     JSON.stringify({
      error:
       'Authentication error with Gemini API',
      details:
       'API key may be invalid or missing permissions',
     }),
     {
      status: 403,
      headers: {
       'Content-Type': 'application/json',
      },
     }
    ) as unknown as ResponseType
   }

   return new Response(
    JSON.stringify({
     error: 'Error calling Gemini API',
     details: apiError.message,
    }),
    {
     status: 500,
     headers: {
      'Content-Type': 'application/json',
     },
    }
   ) as unknown as ResponseType
  }
 } catch (error) {
  console.error('Chat error:', error)
  return new Response(
   JSON.stringify({
    error: 'Failed to process chat message',
    details: error.message,
   }),
   {
    status: 500,
    headers: {
     'Content-Type': 'application/json',
    },
   }
  ) as unknown as ResponseType
 }
}
>>>>>>> 1112a7c14fef519ba81d6fdd4cefc1aac442d477
