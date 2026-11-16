
export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  processed: boolean;
  chunks: Chunk[];
}

export interface Chunk {
  id: string;
  documentId: string;
  text: string;
  startIndex: number;
  pageNumber?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: {
    docName: string;
    text: string;
    pageNumber?: number;
  }[];
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
  docName: string;
}
