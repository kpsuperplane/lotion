import { Emphasis, InlineCode, PhrasingContent, Strong } from "mdast";
import { Parser } from "./Parser";
import { JSONContent } from "@tiptap/react";

export type WithMarks<T> =
  | Parser<T>
  | Parser<Emphasis>
  | Parser<Strong>
  | Parser<InlineCode>;

export function withMarks<T extends PhrasingContent>(
  parser: Parser<T>,
): WithMarks<T> {
  return {
    // @ts-expect-error TS is confused and I'm too lazy to fix it
    toMarkdown: (input) => {
      let output: ReturnType<WithMarks<T>["toMarkdown"]> =
        parser.toMarkdown(input);
      if (output == null) {
        return output;
      }
      for (const mark of input.marks ?? []) {
        if (mark.type === "italic") {
          output = {
            type: "emphasis",
            children: [output],
          };
        } else if (mark.type === "bold") {
          output = {
            type: "strong",
            children: [output],
          };
        } else if (mark.type === "code" && output.type === "text") {
          output = {
            type: "inlineCode",
            value: output.value,
          };
        } else {
          throw new Error(`Cannot parse mark ${JSON.stringify(mark)}`);
        }
      }
      return output;
    },
    toJSONContent: (input) => {
      function dfs(
        marks: JSONContent["marks"],
        object: PhrasingContent | typeof input,
      ): (JSONContent | void)[] {
        if (object.type === "emphasis") {
          return object.children.flatMap((child) =>
            dfs([...(marks ?? []), { type: "italic" }], child),
          );
        } else if (object.type === "strong") {
          return object.children.flatMap((child) =>
            dfs([...(marks ?? []), { type: "bold" }], child),
          );
        } else if (object.type === "inlineCode") {
          return [
            {
              type: "text",
              marks: [...(marks ?? []), { type: "code" }],
              text: object.value,
            },
          ];
        } else {
          const content = parser.toJSONContent(object);
          if (content != null) {
            return marks != null ? [{ ...content, marks }] : [content];
          } else {
            return [];
          }
        }
      }
      const output = dfs(undefined, input);
      if (output.length === 1) {
        return output[0];
      } else if (output.length === 0) {
        return undefined;
      } else {
        throw Error(`Unable to handle this output ${output}`);
      }
    },
  };
}
