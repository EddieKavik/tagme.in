import { handleRequest } from "../api/handler";

type Env = { GEMINI_API_KEY: string; };

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const channel = url.searchParams.get("channel");
    const message = url.searchParams.get("message");

    // Error if no message is provided
    if (!message) {
        return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }

    let prompt = channel ? `Context: Messages from channel ${channel}. User message: ${message}` : `User message: ${message}`;

    // If a channel is specified, get previous messages for context
    if (channel) {
        const messagesResponse = await fetch(`https://api.example.com/seek?channel=${channel}&hour=999999999`);
        const messages = await messagesResponse.json();
        const channelMessages = messages.slice(0, 5).map(msg => msg.text).join("\n");
        prompt += `\nPrevious channel messages:\n${channelMessages}`;
    }

    // Request to Gemini API
    const response = await fetch("https://gemini.googleapis.com/v1/models/gemini-1:generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GEMINI_API_KEY}` },
        body: JSON.stringify({ prompt })
    });

    const result = await response.json();
    return new Response(JSON.stringify({ response: result.choices?.[0]?.text || "No response" }), { status: 200 });
};
