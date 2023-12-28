import * as mdast from "mdast";
import { Parser, parseAnyToJSONContent, parseAnyToMarkdown } from "./Parser";
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
  toJSONContent: (input) => {
    if (input.type === "text") {
      return {
        type: "text",
        text: input.value,
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
  toJSONContent: (input) => {
    if (input.type === "heading") {
      return {
        type: "heading",
        attrs: { level: input.depth },
        content: input.children.map((child) =>
          parseAnyToJSONContent(PhrasingContent, child),
        ),
      };
    }
  },
};

export const Paragraph: Parser<mdast.Paragraph> = {
  toMarkdown: (input) => {
    if (input.type === "paragraph") {
      const children = (input.content ?? []).map((content) =>
        parseAnyToMarkdown<mdast.Paragraph["children"][0]>(
          PhrasingContent,
          content,
        ),
      );
      if (
        children.length === 0 ||
        children[children.length - 1].type === "break"
      ) {
        children.push({ type: "text", value: " " });
      }
      return {
        type: "paragraph",
        children,
      };
    }
  },
  toJSONContent: (input) => {
    if (input.type === "paragraph") {
      return {
        type: "paragraph",
        content: input.children.map((child) =>
          parseAnyToJSONContent(PhrasingContent, child),
        ),
      };
    }
  },
};

export const Break: Parser<mdast.Break> = {
  toMarkdown: (input) => {
    if (input.type === "hardBreak") {
      return { type: "break" };
    }
  },
  toJSONContent: (input) => {
    if (input.type === "break") {
      return { type: "hardBreak" };
    }
  },
};
