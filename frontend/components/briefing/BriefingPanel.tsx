"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useMarkdownRenderer } from "@/lib/helpers/useMarkdownRenderer";
import { useStreamBriefing } from "@/hooks/useStreamBriefing";
import { ParsedElement } from "@/lib/helpers/useMarkdownParser";

interface BriefingPanelProps {
  open: boolean;
  onClose: () => void;
}

export function BriefingPanel({ open, onClose }: BriefingPanelProps) {
  const { elements, streaming, error, rateLimitInfo, startStream, reset } =
    useStreamBriefing();
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    startStream();
  }, [open, startStream, reset]);

  const copyToClipboard = async () => {
    try {
      const text = elements
        .map((el) => {
          if (el.type.startsWith("h")) return `${el.content}\n`;
          if (el.type === "li") return `• ${el.content}\n`;
          return `${el.content}\n\n`;
        })
        .join("");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed right-0 top-0 h-screen w-full lg:w-96 bg-slate-800 border-l border-slate-700
          transform transition-transform duration-300 z-50 flex flex-col
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-bold text-slate-100">Today's Brief</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {elements.length > 0 ? (
            <div className="flex flex-col gap-2 prose prose-invert max-w-none text-sm">
              <BriefingContent elements={elements} />
            </div>
          ) : rateLimitInfo ? (
            // Mostrar información de rate limit
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-red-400">
                    Groq Rate Limit Exceeded
                  </p>
                  <p className="text-sm text-slate-300 mt-2">{error}</p>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded p-3 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Daily Limit:</span>
                  <span className="text-slate-200">
                    {rateLimitInfo.limit.toLocaleString()} tokens
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tokens Used:</span>
                  <span className="text-slate-200">
                    {rateLimitInfo.used.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Remaining:</span>
                  <span className="text-red-400 font-bold">
                    {rateLimitInfo.remaining.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                  <span>Reset In:</span>
                  <span className="text-yellow-400">
                    {rateLimitInfo.resetIn}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 italic">
                Please try again after {rateLimitInfo.resetIn}. The dashboard
                will resume normal operation once the limit resets.
              </p>
            </div>
          ) : streaming ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <p className="text-slate-400 text-sm">Generating briefing...</p>
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-full animate-pulse" />
                    <div className="h-4 bg-slate-700 rounded w-5/6 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {elements.length > 0 && (
          <div className="border-t border-slate-700 p-6">
            <button
              onClick={copyToClipboard}
              className={`
                w-full px-4 py-2 rounded-lg font-medium text-sm
                transition-all duration-200
                ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                }
              `}
            >
              {copied ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy to Clipboard
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function BriefingContent({ elements }: { elements: ParsedElement[] }) {
  const { renderElements } = useMarkdownRenderer();
  return renderElements(elements);
}
