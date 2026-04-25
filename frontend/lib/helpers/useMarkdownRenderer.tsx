import React from "react";
import { ParsedElement } from "./useMarkdownParser";

export function useMarkdownRenderer() {
  const renderElements = (elements: ParsedElement[]): React.ReactElement => {
    const result: React.ReactElement[] = [];
    let listItems: React.ReactElement[] = [];
    elements.forEach((element, index) => {
      const key = `${element.type}-${index}`;

      if (element.type === "li") {
        // Acumula items de lista
        listItems.push(
          <li key={key} className={element.className}>
            {element.content}
          </li>,
        );
      } else {
        // Si hay items acumulados, renderiza la lista primero
        if (listItems.length > 0) {
          result.push(
            <ul key={`list-${index}`} className="list-disc space-y-1">
              {listItems}
            </ul>,
          );
          listItems = [];
        }

        // Luego renderiza el elemento actual
        switch (element.type) {
          case "h1":
            result.push(
              <h1 key={key} className={element.className}>
                {element.content}
              </h1>,
            );
            break;
          case "h2":
            result.push(
              <h2 key={key} className={element.className} style={element.style}>
                {element.content}
              </h2>,
            );
            break;
          case "h3":
            result.push(
              <h3 key={key} className={element.className}>
                {element.content}
              </h3>,
            );
            break;
          case "p":
            result.push(
              <p key={key} className={element.className}>
                {element.content}
              </p>,
            );
            break;
        }
      }
    });

    // Si quedaron items de lista sin renderizar
    if (listItems.length > 0) {
      result.push(
        <ul key="list-end" className="list-disc space-y-1">
          {listItems}
        </ul>,
      );
    }

    return <>{result}</>;
  };

  return { renderElements };
}
