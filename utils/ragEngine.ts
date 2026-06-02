
import { Document, Chunk, SearchResult } from "../types";

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

/**
 * Splits text into overlapping chunks for better context preservation.
 */
export const createChunks = (text: string, documentId: string): Chunk[] => {
  const chunks: Chunk[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + CHUNK_SIZE;
    
    // Try to break at a newline or space to avoid cutting words/sentences
    if (endIndex < text.length) {
      const nextSpace = text.indexOf(' ', endIndex);
      const nextNewline = text.indexOf('\n', endIndex);
      if (nextNewline !== -1 && nextNewline < endIndex + 100) {
        endIndex = nextNewline;
      } else if (nextSpace !== -1 && nextSpace < endIndex + 50) {
        endIndex = nextSpace;
      }
    }

    chunks.push({
      id: `${documentId}-chunk-${chunks.length}`,
      documentId,
      text: text.substring(startIndex, endIndex).trim(),
      startIndex
    });

    startIndex = endIndex - CHUNK_OVERLAP;
    if (startIndex < 0) startIndex = 0;
    if (endIndex >= text.length) break;
  }

  return chunks;
};

/**
 * Simple TF-IDF inspired keyword search for in-browser retrieval.
 * In a production app, we would use vector embeddings.
 */
export const retrieveRelevantChunks = (
  query: string,
  documents: Document[],
  topK: number = 5
): SearchResult[] => {
  const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
  const results: SearchResult[] = [];

  documents.forEach(doc => {
    doc.chunks.forEach(chunk => {
      let score = 0;
      const chunkTextLower = chunk.text.toLowerCase();
      
      queryTerms.forEach(term => {
        // Bonus for whole word matches
        const regex = new RegExp(`\\b${term}\\b`, 'g');
        const matches = chunkTextLower.match(regex);
        if (matches) {
          score += matches.length * 5;
        } else if (chunkTextLower.includes(term)) {
          score += 1;
        }
      });

      if (score > 0) {
        results.push({
          chunk,
          score,
          docName: doc.name
        });
      }
    });
  });

  // Sort by score and return top K
  return results.sort((a, b) => b.score - a.score).slice(0, topK);
};
