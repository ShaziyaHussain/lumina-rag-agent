
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDocumentMock, destroyMock } = vi.hoisted(() => ({
  getDocumentMock: vi.fn(),
  destroyMock: vi.fn(),
}));

vi.mock("pdfjs-dist", () => ({
  getDocument: getDocumentMock,
  GlobalWorkerOptions: {
    workerSrc: "",
  },
}));

import { extractPdfText } from "../pdfExtractor";

describe("extractPdfText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    destroyMock.mockResolvedValue(undefined);
  });

  const createPdfFile = (content = "sample pdf content") =>
    new File([content], "sample.pdf", {
      type: "application/pdf",
    });

  it("extracts text from multiple PDF pages", async () => {
    const mockPdf = {
      numPages: 2,
      getPage: vi.fn()
        .mockResolvedValueOnce({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: "First page text" }],
          }),
        })
        .mockResolvedValueOnce({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: "Second page text" }],
          }),
        }),
    };

    getDocumentMock.mockReturnValue({
      promise: Promise.resolve(mockPdf),
      destroy: destroyMock,
    });

    const result = await extractPdfText(createPdfFile());

    expect(result.pages).toEqual([
      { pageNumber: 1, text: "First page text" },
      { pageNumber: 2, text: "Second page text" },
    ]);

    expect(result.text).toBe(
      "First page text\n\nSecond page text"
    );

    expect(destroyMock).toHaveBeenCalled();
  });

  it("rejects an empty PDF file", async () => {
    await expect(
      extractPdfText(createPdfFile(""))
    ).rejects.toThrow("The PDF file is empty.");

    expect(getDocumentMock).not.toHaveBeenCalled();
  });

  it("rejects PDFs without selectable text", async () => {
    const mockPdf = {
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [],
        }),
      }),
    };

    getDocumentMock.mockReturnValue({
      promise: Promise.resolve(mockPdf),
      destroy: destroyMock,
    });

    await expect(
      extractPdfText(createPdfFile())
    ).rejects.toThrow(
      "No selectable text was found. This PDF may contain scanned images."
    );

    expect(destroyMock).toHaveBeenCalled();
  });

  it("handles corrupted PDFs", async () => {
    getDocumentMock.mockReturnValue({
      promise: Promise.reject(new Error("Invalid PDF")),
      destroy: destroyMock,
    });

    await expect(
      extractPdfText(createPdfFile())
    ).rejects.toThrow(
      "Unable to read this PDF. It may be corrupted, invalid, or unsupported."
    );

    expect(destroyMock).toHaveBeenCalled();
  });

  it("handles password-protected PDFs", async () => {
    const passwordError = new Error("Password required");
    passwordError.name = "PasswordException";

    getDocumentMock.mockReturnValue({
      promise: Promise.reject(passwordError),
      destroy: destroyMock,
    });

    await expect(
      extractPdfText(createPdfFile())
    ).rejects.toThrow(
      "This PDF is password-protected and cannot be opened."
    );

    expect(destroyMock).toHaveBeenCalled();
  });
});
