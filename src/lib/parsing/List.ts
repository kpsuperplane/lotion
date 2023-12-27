import * as mdast from "mdast";
import { Parser, parseAnyToMarkdown } from "./Parser";
import { ListItemContent } from "./collections";
import { nullthrows } from "./util";

export const ListItem: Parser<mdast.ListItem> = {
  toMarkdown: (input) => {
    if (input.type === "listItem") {
      return {
        type: "listItem",
        children: input.content!.map((child) =>
          parseAnyToMarkdown<mdast.ListItem['children'][0]>(ListItemContent, child),
        ),
      };
    }
  },
};

export const List: Parser<mdast.List> = {
  toMarkdown: (input) => {
    if (input.type === "bulletList") {
      return {
        type: "list",
        ordered: false,
        children: input.content!.map((item) =>
          nullthrows(ListItem.toMarkdown(item)),
        ),
      };
    } else if (input.type === "orderedList") {
      return {
        type: "list",
        ordered: true,
        start: input.attrs?.start,
        children: input.content!.map((item) =>
          nullthrows(ListItem.toMarkdown(item)),
        ),
      };
    }
  },
};
