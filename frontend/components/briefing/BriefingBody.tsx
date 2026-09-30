import { RateLimitInfo } from "@/hooks/useStreamBriefing";
import { ParsedElement } from "@/lib/helpers/useMarkdownParser";
import { BriefingContent } from "./BriefingContent";
import { BriefingLoading } from "./BriefingLoading";
import { RateLimitNotice } from "./RateLimitNotice";

interface BriefingBodyProps {
  elements: ParsedElement[];
  rateLimitInfo: RateLimitInfo | null;
  error: string | null;
  streaming: boolean;
}

export function BriefingBody({
  elements,
  rateLimitInfo,
  error,
  streaming,
}: BriefingBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {elements.length > 0 ? (
        <BriefingContent elements={elements} />
      ) : rateLimitInfo ? (
        <RateLimitNotice info={rateLimitInfo} message={error} />
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : streaming ? (
        <BriefingLoading />
      ) : null}
    </div>
  );
}
