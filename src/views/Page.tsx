import { Suspense, useCallback, useRef, useState } from "react";
import { $convertToMarkdownString } from "@lexical/markdown";

import "./Page.css";
import Editor from "../components/Editor";
import Header from "../components/Header";
import PageObject from "../lib/PageObject";
import { EditorState } from "lexical";
import TRANSFORMERS from "../components/Editor/transformers";

type Props = {
  page: PageObject;
};
function Page({ page }: Props) {

  const [dirty, setDirty] = useState(false);

  const saveDebounce = useRef<null | number>(null);
  const save = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        PageObject.write(page, markdown).then(() => {
          setDirty(false);
        });
      });
    },
    [page],
  );

  const onChange = useCallback(
    (editorState: EditorState) => {
      if (editorState.toJSON())
      setDirty(true);
      if (saveDebounce.current != null) {
        clearTimeout(saveDebounce.current);
      }
      saveDebounce.current = setTimeout(() => save(editorState), 4000);
    },
    [save],
  );
  return (
    <div className="lotion:page">
      <Header title={`${page.name}${dirty ? "*" : ""}`}></Header>
      <main className="lotion:page:editor">
        <Editor page={page} onChange={onChange} />
      </main>
    </div>
  );
}

export default function WithSuspense({ page }: Props) {
  return (
    <Suspense
      fallback={
        <div className="lotion:page">
          <Header title={page.name}></Header>
        </div>
      }
    >
      <Page page={page} />
    </Suspense>
  );
}
