
import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { Document, ChatMessage } from './types';
import { createChunks, retrieveRelevantChunks } from './utils/ragEngine';
import { getGeminiResponse } from './services/geminiService';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newDocs: Document[] = [];

    // Cast to File[] to fix 'unknown' type errors when iterating over files
    const fileList = Array.from(files) as File[];

    for (const file of fileList) {
      try {
        const text = await file.text();
        const id = Math.random().toString(36).substring(7);
        const chunks = createChunks(text, id);

        newDocs.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          content: text,
          processed: true,
          chunks,
        });
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
      }
    }

    setDocuments(prev => [...prev, ...newDocs]);
    setIsProcessing(false);
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 1. Retrieve relevant chunks
      const relevantChunks = retrieveRelevantChunks(text, documents, 6);
      
      // 2. Call Gemini Service
      const response = await getGeminiResponse(text, messages, relevantChunks);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: Date.now(),
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please ensure your API key is valid and try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden">
      <Sidebar 
        documents={documents} 
        onUpload={handleFileUpload} 
        onRemove={handleRemoveDoc}
        isProcessing={isProcessing}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};

export default App;
