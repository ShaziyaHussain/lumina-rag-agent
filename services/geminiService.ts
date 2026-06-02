
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, SearchResult } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export const getGeminiResponse = async (
  query: string,
  history: ChatMessage[],
  relevantChunks: SearchResult[]
): Promise<{ text: string; sources: { docName: string; text: string }[] }> => {
  // Use process.env.API_KEY directly as per SDK guidelines and named parameter requirement
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  // Format context from relevant chunks
  const context = relevantChunks
    .map((res, i) => `[Source ${i+1}: ${res.docName}]\n${res.chunk.text}`)
    .join('\n\n---\n\n');

  const systemInstruction = `
    You are Lumina, a highly intelligent RAG (Retrieval-Augmented Generation) assistant.
    You have been provided with specific context retrieved from the user's uploaded documents.
    
    Guidelines:
    1. Use the provided context to answer the user's question accurately.
    2. If the answer is not in the context, clearly state that you don't have enough information from the documents but try to provide a general helpful answer if possible, while distinguishing it from the document facts.
    3. Be professional, concise, and insightful.
    4. Reference the sources provided in the context (e.g., "According to [Document Name]...") when appropriate.
    5. Support Markdown formatting for clarity.

    CONTEXT FROM DOCUMENTS:
    ${context || "No documents uploaded or no relevant information found."}
  `;

  try {
    // Correctly call generateContent with model name, prompt, and system instruction
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.3, // Lower temperature for more factual RAG responses
      },
    });

    const sources = relevantChunks.map(res => ({
      docName: res.docName,
      text: res.chunk.text
    }));

    // Directly access the .text property of the GenerateContentResponse object
    return {
      text: response.text || "I'm sorry, I couldn't generate a response.",
      sources
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to communicate with AI service.");
  }
};
