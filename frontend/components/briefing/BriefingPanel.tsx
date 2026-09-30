"use client";

import { useEffect } from "react";
import { useStreamBriefing } from "@/hooks/useStreamBriefing";
import { BriefingOverlay } from "./BriefingOverlay";
import { BriefingHeader } from "./BriefingHeader";
import { BriefingBody } from "./BriefingBody";
import { CopyBriefingButton } from "./CopyBriefingButton";

interface BriefingPanelProps {
  open: boolean;
  onClose: () => void;
}

export function BriefingPanel({ open, onClose }: BriefingPanelProps) {
  const { elements, streaming, error, rateLimitInfo, startStream, reset } =
    useStreamBriefing();

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    startStream();
  }, [open, startStream, reset]);

  return (
    <>
      <BriefingOverlay open={open} onClose={onClose} />

      <aside
        className={`
          fixed right-0 top-0 h-screen w-full lg:w-96 bg-slate-800 border-l border-slate-700
          transform transition-transform duration-300 z-50 flex flex-col
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <BriefingHeader onClose={onClose} />
        <BriefingBody
          elements={elements}
          rateLimitInfo={rateLimitInfo}
          error={error}
          streaming={streaming}
        />
        {elements.length > 0 && <CopyBriefingButton elements={elements} />}
      </aside>
    </>
  );
}
