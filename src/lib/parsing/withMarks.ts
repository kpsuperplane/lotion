import { Emphasis, InlineCode, PhrasingContent, Strong } from "mdast";
import { Parser } from "./Parser";

export type WithMarks<T> = T | Emphasis | Strong | InlineCode;

export function withMarks<T extends PhrasingContent>(
  parser: Parser<T>,
): Parser<WithMarks<T>> {
  return {
    toMarkdown: (input) => {
      let output: WithMarks<void | T> = parser.toMarkdown(input);
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
  };
}
