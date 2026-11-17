import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist";

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedPdf {
  text: string;
  pages: ExtractedPdfPage[];
}

export const extractPdfText = async (
  file: File
): Promise<ExtractedPdf> => {
  if (file.size === 0) {
    throw new Error("The PDF file is empty.");
  }

  let loadingTask: ReturnType<typeof getDocument> | undefined;

  try {
    const data = new Uint8Array(await file.arrayBuffer());

    loadingTask = getDocument({
      data,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const pages: ExtractedPdfPage[] = [];

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      const textItems: string[] = [];

      for (const item of content.items) {
        if ("str" in item && typeof item.str === "string") {
          textItems.push(item.str);
        }
      }

      pages.push({
        pageNumber,
        text: textItems.join(" ").trim(),
      });
    }

    const text = pages
      .map(page => page.text)
      .filter(pageText => pageText.length > 0)
      .join("\n\n");

    if (!text.trim()) {
      throw new Error(
        "No selectable text was found. This PDF may contain scanned images."
      );
    }

    return { text, pages };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("No selectable text")
    ) {
      throw error;
    }

    if (
      error instanceof Error &&
      error.name === "PasswordException"
    ) {
      throw new Error(
        "This PDF is password-protected and cannot be opened."
      );
    }

    throw new Error(
      "Unable to read this PDF. It may be corrupted, invalid, or unsupported."
    );
  } finally {
    if (loadingTask) {
      try {
        await loadingTask.destroy();
      } catch {
        // Cleanup failure should not override the extraction result.
      }
    }
  }
};
