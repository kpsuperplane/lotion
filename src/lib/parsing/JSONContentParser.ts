import { Root } from "mdast";
import { parseAnyToMarkdown } from "./Parser";
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
};

export default JSONContentParser;
