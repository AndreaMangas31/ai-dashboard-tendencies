import { ParsedElement } from "@/lib/helpers/useMarkdownParser";

export function briefingToPlainText(elements: ParsedElement[]): string {
  return elements
    .map((el) => {
      if (el.type.startsWith("h")) return `${el.content}\n`;
      if (el.type === "li") return `• ${el.content}\n`;
      return `${el.content}\n\n`;
    })
    .join("");
}
