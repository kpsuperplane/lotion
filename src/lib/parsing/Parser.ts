import { JSONContent } from "@tiptap/react";

export type Parser<T> = {
  toMarkdown: (input: JSONContent) => T | void;
}

export function parseAnyToMarkdown<T>(parsers: Parser<T>[], input: JSONContent): T {
  for (const parser of parsers) {
    const value = parser.toMarkdown(input);
    if (value != null) {
      return value;
    }
  }
  throw new Error(`No parser match for ${JSON.stringify(input)}`);
}