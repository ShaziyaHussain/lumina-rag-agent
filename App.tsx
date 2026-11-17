
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { Document, ChatMessage } from './types';
import {
  createChunks,
  createPageChunks,
  retrieveRelevantChunks,
} from './utils/ragEngine';
import { extractPdfText } from './utils/pdfExtractor';
import { getGeminiResponse } from './services/geminiService';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files ?? []);

    if (files.length === 0) return;

    setIsProcessing(true);
    setUploadErrors([]);

    const newDocs: Document[] = [];
    const errors: string[] = [];

    try {
      for (const file of files) {
        try {
          const id = crypto.randomUUID();
          const isPdf =
            file.type === 'application/pdf' ||
            file.name.toLowerCase().endsWith('.pdf');

          let text: string;
          let chunks;

          if (isPdf) {
            const extractedPdf = await extractPdfText(file);

            text = extractedPdf.text;
            chunks = createPageChunks(extractedPdf.pages, id);
          } else {
            const isTextFile = /\.(txt|md)$/i.test(file.name);

            if (!isTextFile) {
              throw new Error('Unsupported file type. Upload TXT, MD, or PDF files.');
            }

            text = await file.text();

            if (!text.trim()) {
              throw new Error('The document contains no readable text.');
            }

            chunks = createChunks(text, id);
          }

          if (chunks.length === 0) {
            throw new Error('No usable text chunks could be created.');
          }

          newDocs.push({
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            content: text,
            processed: true,
            chunks,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred.';

          errors.push(`${file.name}: ${message}`);
          console.error(`Error processing ${file.name}:`, error);
        }
      }

      setDocuments(prev => [...prev, ...newDocs]);
      setUploadErrors(errors);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
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
      const relevantChunks = retrieveRelevantChunks(text, documents, 6);

      const response = await getGeminiResponse(
        text,
        messages,
        relevantChunks
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: Date.now(),
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing chat message:', error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "I'm sorry, I encountered an error while processing your request. Please check your API configuration and try again.",
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
        uploadErrors={uploadErrors}
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
