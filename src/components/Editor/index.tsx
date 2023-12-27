import * as react from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import DragAndDrop from "./extensions/DragAndDrop";
import Placeholder from "@tiptap/extension-placeholder";

import "./Editor.scss";
import { useCallback, useMemo, useRef } from "react";
import { EditorContent } from "@tiptap/react";

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
  const saveDebounce = useRef<null | number>(null);
  const save = useCallback(() => {}, []);
  const options = useMemo<Partial<react.EditorOptions>>(
    () => ({
      extensions,
      editorProps,
      onUpdate: () => {
        if (saveDebounce.current != null) {
          clearTimeout(saveDebounce.current);
        }
        saveDebounce.current = setTimeout(save, 5000);
      },
    }),
    [save],
  );

  const editor = react.useEditor(options);

  return <EditorContent editor={editor} />;
}
