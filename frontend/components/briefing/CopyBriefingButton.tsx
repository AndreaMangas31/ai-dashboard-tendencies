import { CustomButton } from "@/components/CustomButton";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { briefingToPlainText } from "@/lib/helpers/briefingToPlainText";
import { ParsedElement } from "@/lib/helpers/useMarkdownParser";

interface CopyBriefingButtonProps {
  elements: ParsedElement[];
}

export function CopyBriefingButton({ elements }: CopyBriefingButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="border-t border-slate-700 p-6">
      <CustomButton
        variant={copied ? "success" : "secondary"}
        icon={copied ? <CheckIcon /> : <CopyIcon />}
        onClick={() => copy(briefingToPlainText(elements))}
        className="w-full active:scale-95"
      >
        {copied ? "Copied!" : "Copy to Clipboard"}
      </CustomButton>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
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
  );
}
