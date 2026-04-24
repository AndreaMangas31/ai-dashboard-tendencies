export interface ParsedElement {
  type: "h1" | "h2" | "h3" | "p" | "li" | "blockquote" | "code";
  content: string;
  className: string;
}
