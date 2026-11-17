
import { Document, Chunk, SearchResult } from "../types";

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

/**
 * Splits text into overlapping chunks.
 * An optional page number preserves PDF page references.
 */
export const createChunks = (
  text: string,
  documentId: string,
  pageNumber?: number
): Chunk[] => {
  const chunks: Chunk[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + CHUNK_SIZE, text.length);

    // Prefer breaking at a nearby newline or space.
    if (endIndex < text.length) {
      const nextSpace = text.indexOf(" ", endIndex);
      const nextNewline = text.indexOf("\n", endIndex);

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
      startIndex,
      ...(pageNumber !== undefined ? { pageNumber } : {}),
    });

    if (endIndex >= text.length) break;

    startIndex = Math.max(0, endIndex - CHUNK_OVERLAP);
  }

  return chunks;
};

/**
 * Creates independent chunks for each PDF page.
 * Chunks retain their original PDF page numbers.
 */
export const createPageChunks = (
  pages: { pageNumber: number; text: string }[],
  documentId: string
): Chunk[] => {
  const chunks: Chunk[] = [];

  pages.forEach(page => {
    const pageChunks = createChunks(
      page.text,
      documentId,
      page.pageNumber
    );

    pageChunks.forEach(chunk => {
      chunks.push({
        ...chunk,
        id: `${documentId}-chunk-${chunks.length}`,
      });
    });
  });

  return chunks;
};

/**
 * Simple keyword-based retrieval.
 */
export const retrieveRelevantChunks = (
  query: string,
  documents: Document[],
  topK: number = 5
): SearchResult[] => {
  const queryTerms = query
    .toLowerCase()
    .split(/\W+/)
    .filter(term => term.length > 2);

  const results: SearchResult[] = [];

  documents.forEach(doc => {
    doc.chunks.forEach(chunk => {
      let score = 0;
      const chunkTextLower = chunk.text.toLowerCase();

      queryTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, "g");
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
          docName: doc.name,
        });
      }
    });
  });

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};
