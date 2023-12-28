import { EditorState } from "lexical";
import { useEffect, useMemo, useState } from "react";

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { $convertFromMarkdownString } from "@lexical/markdown";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";

import "./Editor.scss";
import EquationsPlugin from "./plugins/EquationsPlugin";
import { EquationNode } from "./nodes/EquationNode";
import TRANSFORMERS from "./transformers";
import DraggableBlockPlugin from "./plugins/DraggableBlockPlugin";
import PageObject from "../../lib/PageObject";
import usePromise from "react-promise-suspense";

const theme = {};
function onError(error: Error) {
  console.error(error);
}

function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}

type Props = {
  page: PageObject;
  onChange: (editorState: EditorState) => void;
};
export default function Editor({ page, onChange }: Props) {
  const content = usePromise(PageObject.read, [page]);
  const initialConfig = useMemo<InitialConfigType>(
    () => ({
      editorState: () => {
        $convertFromMarkdownString(content, TRANSFORMERS);
      },
      namespace: `lotion:editor:${page.path}`,
      theme,
      onError,
      nodes: [
        CodeNode,
        EquationNode,
        ListNode,
        ListItemNode,
        HeadingNode,
        QuoteNode,
        HorizontalRuleNode,
        LinkNode,
      ],
    }),
    [content],
  );
  const [rootRef, setRootRef] = useState<null | HTMLDivElement>(null);
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <div ref={setRootRef} className="lotion:editor">
            <ContentEditable className="lotion:editor:content-editable" />
          </div>
        }
        placeholder={<div>Enter some text...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <EquationsPlugin />
      <MyCustomAutoFocusPlugin />
      <ListPlugin />
      {rootRef != null ? <DraggableBlockPlugin anchorElem={rootRef} /> : ""}
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <OnChangePlugin
        ignoreHistoryMergeTagChange={true}
        ignoreSelectionChange={true}
        onChange={onChange}
      />
    </LexicalComposer>
  );
}
