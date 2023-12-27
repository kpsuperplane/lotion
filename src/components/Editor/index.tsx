import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import Placeholder from "@tiptap/extension-placeholder";
import { useMemo } from "react";
import { EditorContent, EditorOptions, useEditor } from "@tiptap/react";

import DragAndDrop from "./extensions/DragAndDrop";
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

type Props = {
  options?: Partial<EditorOptions>;
};
export default function Editor(props: Props) {
  const options = useMemo<Partial<EditorOptions>>(
    () => ({
      extensions,
      editorProps,
      ...props.options,
    }),
    [props.options],
  );
  const editor = useEditor(options);

  return <EditorContent editor={editor} />;
}
