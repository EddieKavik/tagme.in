import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PagesFunction } from '@cloudflare/workers-types';
import { Env } from './lib/env.js';

interface ChatRequest {
    message: string;
    channel: string;
    history?: Array<{ role: string; content: string }>;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const data: ChatRequest = await request.json();

        if (!data.message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Initialize Gemini with API key from environment
        const genAI = new GoogleGenerativeAI(context.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Prepare chat history if provided
        const history = data.history?.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: msg.content
        })) || [];

        // Start a chat
        const chat = model.startChat({
            history,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
                topP: 0.8,
                topK: 40
            }
        });

        // Get response from Gemini
        const result = await chat.sendMessage(data.message);
        const response = await result.response;
        const text = response.text();

        return new Response(JSON.stringify({
            message: text,
            sender: 'Tagmein AI',
            channel: data.channel
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Chat error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to process chat message',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 