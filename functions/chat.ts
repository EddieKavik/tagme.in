import { type PagesFunction } from '@cloudflare/workers-types';
import { Env } from './lib/env.js';
import { getKV } from './lib/getKV.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google GenAI
const { GEMINI_API_KEY } = process.env;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in the environment variables.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const kv = await getKV(context, true);

  if (!kv) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const body = await context.request.json();
    const channel = body.channel || 'default';
    const userMessage = body.message;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'Message parameter is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Fetch all channel messages
    const channelMessages = await kv.get(`seek#${channel}#999999999`);
    if (!channelMessages) {
      return new Response(JSON.stringify({ error: 'No messages found in the channel.' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Limit context to 100,000 characters
    let contextMessages = '';
    let totalCharacters = 0;
    const messages = JSON.parse(channelMessages); // Assuming channelMessages is stored as a JSON array
    for (const message of messages) {
      const messageText = message.text || ''; // Assuming each message has a `text` property
      if (totalCharacters + messageText.length > 100000) {
        break;
      }
      contextMessages += `${messageText}\n`;
      totalCharacters += messageText.length;
    }

    // Use the Gemini API to generate a response
    const modelName = 'gemini-pro'; // Replace with a valid model name
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log('Requesting Gemini API with:', {
      modelName,
      prompt: `Channel: ${channel}\nMessage: ${userMessage}\nContext: ${contextMessages}`,
    });

    let result;
    try {
      result = await model.generateContent({
        contents: [
          {
            parts: [
              { text: `Channel: ${channel}` },
              { text: `Message: ${userMessage}` },
              { text: `Context: ${contextMessages}` },
            ],
          },
        ],
      });
    } catch (fetchError) {
      console.error('Error fetching from Gemini API:', fetchError.message);
      return new Response(JSON.stringify({
        error: 'Failed to fetch from Gemini API',
        details: fetchError.message,
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Extract the response text
    const responseText = result?.candidates?.[0]?.output || 'No response generated.';

    // Suggested content: Extract facts or key points from the response
    const suggestedContent = extractSuggestedContent(responseText);

    const response = {
      channel,
      message: userMessage,
      reply: responseText,
      context: contextMessages,
      suggestedContent, // Include suggested content in the response
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error generating AI response:', error.message);
    console.error('Stack Trace:', error.stack);
    return new Response(JSON.stringify({
      error: 'Failed to generate AI response',
      details: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

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

async function sendMessage(context) {
  // Show a loading indicator while waiting for the AI response
  const messagesArea = this.chatContainer.querySelector('.chat-messages');
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.textContent = 'Thinking...';
  messagesArea.appendChild(loadingIndicator);

  try {
    console.log('Sending request to:', this.chatURL); // Debugging: Log the URL
    console.log('Request payload:', context); // Debugging: Log the payload

    const response = await fetch(this.chatURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonResponse = await response.json();

    // Remove the loading indicator
    loadingIndicator.remove();

    return jsonResponse;
  } catch (error) {
    console.error('Error sending message:', error);
    loadingIndicator.textContent = 'Error fetching response.';
    throw error;
  }
}
