import { useMarkdownRenderer } from "@/lib/helpers/useMarkdownRenderer";
import { ParsedElement } from "@/lib/helpers/useMarkdownParser";

interface BriefingContentProps {
  elements: ParsedElement[];
}

export function BriefingContent({ elements }: BriefingContentProps) {
  const { renderElements } = useMarkdownRenderer();

  return (
    <div className="flex flex-col gap-2 prose prose-invert max-w-none text-sm">
      {renderElements(elements)}
    </div>
  );
}
