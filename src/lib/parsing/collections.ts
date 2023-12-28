import { List } from "./List";
import { Break, Heading, Paragraph, Text } from "./Text";
import { withMarks } from "./withMarks";

export const PhrasingContent = [
  Break,
  // Delete
  // Emphasis
  // FootnoteReference
  // Html
  // Image
  // ImageReference
  // InlineCode
  // Link
  // LinkReference
  // Strong
  withMarks(Text),
];
export const RootContent = [
  // Blockquote
  Break,
  // Code
  // Definition
  // Delete
  // Emphasis
  // FootnoteDefinition
  // FootnoteReference
  Heading,
  // Html
  // Image
  // ImageReference
  // InlineCode
  // Link
  // LinkReference
  List,
  // ListItem
  Paragraph,
  // Strong
  // Table
  // TableCell
  // TableRow
  Text,
  // ThematicBreak
  // Yaml
];

export const BlockContent = [
  // Blockquote
  // Code
  Heading,
  // Html
  List,
  Paragraph
  // Table
  // ThematicBreak
];

export const DefinitionContent = [
  // Definition,
  // FootnoteDefinition
];

export const ListItemContent = [
  ...BlockContent,
  ...DefinitionContent
];