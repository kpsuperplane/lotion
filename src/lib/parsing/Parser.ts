import { JSONContent } from "@tiptap/react";
import {
  BlockContent,
  DefinitionContent,
  ListContent,
  PhrasingContent,
  RootContent,
  RowContent,
  TableContent,
} from "mdast";

type MDAstContent =
  | BlockContent
  | ListContent
  | RowContent
  | TableContent
  | RootContent
  | DefinitionContent
  | PhrasingContent;
export type Parser<T> = {
  toMarkdown: (input: JSONContent) => T | void;
  toJSONContent: (input: MDAstContent) => JSONContent | void;
};

export function parseAnyToMarkdown<T>(
  parsers: (T extends unknown ? Parser<T> : never)[],
  input: JSONContent,
): T {
  for (const parser of parsers) {
    const value = parser.toMarkdown(input);
    if (value != null) {
      return value;
    }
  }
  throw new Error(`No parser match for ${JSON.stringify(input)}`);
}

export function parseAnyToJSONContent(
  parsers: Parser<unknown>[],
  input: MDAstContent,
): JSONContent {
  for (const parser of parsers) {
    const value = parser.toJSONContent(input);
    if (value != null) {
      return value;
    }
  }
  throw new Error(`No parser match for ${JSON.stringify(input)}`);
}
