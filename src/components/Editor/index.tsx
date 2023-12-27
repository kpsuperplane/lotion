import { EditorProvider, FloatingMenu, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import DragAndDrop from "./extensions/DragAndDrop";
import Placeholder from "@tiptap/extension-placeholder";

import "./Editor.scss";

// define your extension array
const EmptyDocument = Document.extend({
  content: "heading block*",
});
const extensions = [
  EmptyDocument,
  StarterKit.configure({
    document: false,
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return "Your creative title";
      }
      return "Lorem ipsum...";
    },
  }),
  DragAndDrop,
];

const editorProps = {
  attributes: {
    class: "lotion:editor",
  },
};

export default function Editor() {
  return (
    <EditorProvider extensions={extensions} editorProps={editorProps}>
      <FloatingMenu>This is the floating menu</FloatingMenu>
      <BubbleMenu>This is the bubble menu</BubbleMenu>
    </EditorProvider>
  );
}
