import { JSONContent } from "@tiptap/react";
import { toMarkdown } from "mdast-util-to-markdown";
import JSONContentParser from "./parsing/JSONContentParser";

export function tipTapToMarkdown(input: JSONContent): string {
  console.log("input", input);
  const parsed = JSONContentParser.toMarkdown(input);
  console.log("parsed", parsed);
  const output = toMarkdown(parsed);
  console.log("markdown", output);
  return output;
}
