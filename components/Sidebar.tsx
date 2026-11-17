import React from 'react';
import { Document } from '../types';

interface SidebarProps {
  documents: Document[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  isProcessing: boolean;
  uploadErrors: string[];
}

const Sidebar: React.FC<SidebarProps> = ({
  documents,
  onUpload,
  onRemove,
  isProcessing,
  uploadErrors,
}) => {
  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-brain text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Lumina RAG
          </h1>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="sr-only">Upload Documents</span>
            <div className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
              ${isProcessing
                ? 'border-slate-700 opacity-50 cursor-not-allowed'
                : 'border-slate-700 hover:border-blue-500 hover:bg-slate-800/50'}
            `}>
              <i className="fas fa-cloud-upload-alt text-2xl text-slate-400 mb-2"></i>
              <p className="text-sm font-medium text-slate-300">
                {isProcessing ? 'Processing...' : 'Upload Knowledge'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                TXT, MD, PDF (text-only)
              </p>
              <input
                type="file"
                className="hidden"
                multiple
                accept=".txt,.md,.pdf"
                onChange={onUpload}
                disabled={isProcessing}
              />
            </div>
          </label>

          {uploadErrors.length > 0 && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3"
            >
              <p className="text-xs font-semibold text-red-400 mb-2">
                Some files could not be uploaded:
              </p>
              <ul className="space-y-2">
                {uploadErrors.map((error, index) => (
                  <li
                    key={`${index}-${error}`}
                    className="text-xs text-red-300 break-words"
                  >
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Knowledge Base
          </h2>
          <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
            {documents.length} Files
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-sm text-slate-600 italic">
              No documents uploaded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 mt-1">
                    {doc.name.toLowerCase().endsWith('.pdf')
                      ? <i className="far fa-file-pdf"></i>
                      : <i className="far fa-file-alt"></i>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 uppercase">
                      {(doc.size / 1024).toFixed(1)} KB • {doc.chunks.length} chunks
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(doc.id)}
                    aria-label={`Remove ${doc.name}`}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>

                <details className="mt-3 border-t border-slate-700 pt-2">
                  <summary className="cursor-pointer text-xs text-blue-400 hover:text-blue-300">
                    Preview extracted text
                  </summary>

                  <div className="mt-3 space-y-3">
                    {doc.chunks.slice(0, 5).map((chunk, index) => (
                      <div
                        key={chunk.id}
                        className="rounded-lg bg-slate-950/60 p-2"
                      >
                        <p className="text-[10px] font-semibold text-emerald-400 mb-1">
                          {chunk.pageNumber !== undefined
                            ? `PAGE ${chunk.pageNumber}`
                            : 'TEXT DOCUMENT'}
                          {' • '}
                          CHUNK {index + 1}
                        </p>

                        <p className="text-xs text-slate-300 whitespace-pre-wrap break-words">
                          {chunk.text}
                        </p>
                      </div>
                    ))}

                    {doc.chunks.length > 5 && (
                      <p className="text-[10px] text-slate-500">
                        Showing first 5 of {doc.chunks.length} chunks.
                      </p>
                    )}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Engine Status
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Local document extraction and in-memory chunk indexing. AI answers require Gemini API configuration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
