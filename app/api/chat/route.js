import { NextResponse } from "next/server"; // Import NextResponse from Next.js for handling responses
import OpenAI from "openai"; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are an AI-powered customer support assistant for HeadstarterAI, a platform that provides AI-powered interviews for software engineering jobs. Your role is to help users with questions about the platform, its features, and how to prepare for AI interviews. Please follow these guidelines:

1. Be friendly, professional, and supportive in your interactions.
2. Provide accurate information about HeadstarterAI's services and features.
3. Offer guidance on how to use the platform and prepare for AI interviews.
4. If asked about specific technical questions, provide general advice but encourage users to practice with the actual AI interview system.
5. Respect user privacy and do not ask for or store personal information.
6. If you're unsure about an answer, admit it and offer to find more information or direct the user to appropriate resources.
7. Encourage users to take advantage of HeadstarterAI's features to improve their interview skills.
8. Be patient and willing to rephrase or clarify information if needed.
9. Provide tips on common software engineering interview topics and best practices.
10. If users express concerns or frustrations, empathize and offer constructive solutions or alternatives.

Remember, your goal is to help users succeed in their software engineering interviews by making the most of HeadstarterAI's platform.`;

// POST function andle incoming requests
export async function POST(req) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const data = await req.json();

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: "gpt-4o", // Model to use
    stream: true, // Enable streaming
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
