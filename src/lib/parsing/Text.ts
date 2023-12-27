import * as mdast from "mdast";
import { Parser, parseAnyToMarkdown } from "./Parser";
import { assertHeadingLevel } from "./util";
import { PhrasingContent } from "./collections";

export const Text: Parser<mdast.Text> = {
  toMarkdown: (input) => {
    if (input.type === "text") {
      return {
        type: "text",
        value: input.text!,
      };
    }
  },
};

export const Heading: Parser<mdast.Heading> = {
  toMarkdown: (input) => {
    if (input.type === "heading") {
      return {
        type: "heading",
        depth: assertHeadingLevel(input.attrs!.level),
        children: input.content!.map((content) =>
          parseAnyToMarkdown<mdast.Paragraph["children"][0]>(
            PhrasingContent,
            content,
          ),
        ),
      };
    }
  },
};

export const Paragraph: Parser<mdast.Paragraph> = {
  toMarkdown: (input) => {
    if (input.type === "paragraph") {
      return input.content != null && input.content.length > 0
        ? {
            type: "paragraph",
            children: input.content.map((content) =>
              parseAnyToMarkdown<mdast.Paragraph["children"][0]>(
                PhrasingContent,
                content,
              ),
            ),
          }
        : { type: "paragraph", children: [] };
    }
  },
};

export const Break: Parser<mdast.Break> = {
  toMarkdown: (input) => {
    if (input.type === "hardBreak") {
      return { type: "break" };
    }
  },
};
