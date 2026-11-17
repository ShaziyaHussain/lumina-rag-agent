
import { describe, expect, it } from "vitest";
import {
  createPageChunks,
  retrieveRelevantChunks,
} from "../ragEngine";
import { Document } from "../../types";

describe("PDF page-aware chunking", () => {
  it("preserves original page numbers in chunks", () => {
    const pages = [
      { pageNumber: 1, text: "Introduction to Java programming." },
      { pageNumber: 3, text: "Spring Boot makes Java development easier." },
    ];

    const chunks = createPageChunks(pages, "doc-1");

    expect(chunks).toHaveLength(2);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[1].pageNumber).toBe(3);
  });

  it("does not create chunks for empty PDF pages", () => {
    const pages = [
      { pageNumber: 1, text: "Java programming" },
      { pageNumber: 2, text: "   " },
      { pageNumber: 3, text: "Spring Boot" },
    ];

    const chunks = createPageChunks(pages, "doc-1");

    expect(chunks).toHaveLength(2);
    expect(chunks.map(chunk => chunk.pageNumber)).toEqual([1, 3]);
  });

  it("preserves page numbers in retrieved search results", () => {
    const pages = [
      { pageNumber: 2, text: "Java programming language" },
      { pageNumber: 5, text: "Spring Boot framework" },
    ];

    const chunks = createPageChunks(pages, "doc-1");

    const document: Document = {
      id: "doc-1",
      name: "research.pdf",
      size: 1024,
      type: "application/pdf",
      content: pages.map(page => page.text).join("\n\n"),
      processed: true,
      chunks,
    };

    const results = retrieveRelevantChunks(
      "Spring Boot",
      [document]
    );

    expect(results).toHaveLength(1);
    expect(results[0].chunk.pageNumber).toBe(5);
    expect(results[0].docName).toBe("research.pdf");
  });

  it("creates unique chunk IDs across PDF pages", () => {
    const pages = [
      { pageNumber: 1, text: "First page content" },
      { pageNumber: 2, text: "Second page content" },
    ];

    const chunks = createPageChunks(pages, "doc-1");
    const ids = chunks.map(chunk => chunk.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
