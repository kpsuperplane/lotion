import { Root } from "mdast";
import { parseAnyToJSONContent, parseAnyToMarkdown } from "./Parser";
import { RootContent } from "./collections";
import { JSONContent } from "@tiptap/react";

const JSONContentParser = {
  toMarkdown: (input: JSONContent): Root => {
    return {
      type: "root",
      children: input.content!.map((content) =>
        parseAnyToMarkdown<Root["children"][0]>(RootContent, content),
      ),
    };
  },
  toJSONContent: (input: Root): undefined | JSONContent => {
    const content = input.children.map((child) =>
      parseAnyToJSONContent(RootContent, child),
    );
    return content.length > 0
      ? {
          type: "doc",
          content,
        }
      : undefined;
  },
};

export default JSONContentParser;
