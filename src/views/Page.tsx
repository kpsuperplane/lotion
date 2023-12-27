import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import usePromise from "react-promise-suspense";
import type { Editor as TipTapEditor, EditorOptions } from "@tiptap/core";

import "./Page.css";
import Editor from "../components/Editor";
import Header from "../components/Header";
import PageObject from "../lib/PageObject";
import { tipTapToMarkdown } from "../lib/Markdown";

type Props = {
  page: PageObject;
};
function Page({ page }: Props) {
  const data = usePromise(PageObject.read, [page]);

  const [dirty, setDirty] = useState(false);

  const saveDebounce = useRef<null | number>(null);
  const save = useCallback(
    (editor: TipTapEditor) => {
      PageObject.write(page, tipTapToMarkdown(editor.getJSON())).then(() => {
        setDirty(false);
      });
    },
    [page],
  );

  const options = useMemo<Partial<EditorOptions>>(
    () => ({
      onUpdate: (e) => {
        setDirty(true);
        if (saveDebounce.current != null) {
          clearTimeout(saveDebounce.current);
        }
        saveDebounce.current = setTimeout(() => save(e.editor), 4000);
      },
    }),
    [save],
  );
  return (
    <div className="lotion:page">
      <Header title={`${page.name}${dirty ? "*" : ""}`}></Header>
      <main className="lotion:page:editor">
        <Editor options={options} />
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
