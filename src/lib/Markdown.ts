import { JSONContent } from "@tiptap/react";
import { toMarkdown } from "mdast-util-to-markdown";
import { fromMarkdown } from "mdast-util-from-markdown";
import JSONContentParser from "./parsing/JSONContentParser";

export function tipTapToMarkdown(input: JSONContent): string {
  const parsed = JSONContentParser.toMarkdown(input);
  const output = toMarkdown(parsed);
  return output;
}

export function markdownToTipTap(input: string): undefined | JSONContent {
  const parsed = fromMarkdown(input);
  const output = JSONContentParser.toJSONContent(parsed);
  return output;
}
