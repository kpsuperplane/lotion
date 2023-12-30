import { Suspense, useCallback, useRef, useState } from "react";
import { $convertToMarkdownString } from "@lexical/markdown";

import "./Page.css";
import Editor from "../components/Editor";
import Header from "../components/Header";
import { EditorState } from "lexical";
import TRANSFORMERS from "../components/Editor/transformers";
import PageRef, {
  usePageContent,
  usePageName,
  usePagePath,
} from "../lib/fs/PageRef";

type Props = {
  pageRef: PageRef;
};
function Page({ pageRef }: Props) {
  const [dirty, setDirty] = useState(false);

  const saveDebounce = useRef<null | NodeJS.Timeout>(null);
  const save = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        pageRef.write(markdown).then(() => {
          setDirty(false);
        });
      });
    },
    [pageRef],
  );

  const onChange = useCallback(
    (editorState: EditorState) => {
      if (editorState.toJSON()) setDirty(true);
      if (saveDebounce.current != null) {
        clearTimeout(saveDebounce.current);
      }
      saveDebounce.current = setTimeout(() => save(editorState), 4000);
    },
    [save],
  );

  const name = usePageName(pageRef);
  const content = usePageContent(pageRef);
  const path = usePagePath(pageRef);

  return (
    <div className="lotion:page">
      <Header title={`${name}${dirty ? "*" : ""}`}></Header>
      <main className="lotion:page:editor">
        {content != null && (
          <Editor initialContent={content} id={path} onChange={onChange} />
        )}
      </main>
    </div>
  );
}

export default function WithSuspense({ pageRef }: Props) {
  const name = usePageName(pageRef);
  return (
    <Suspense
      fallback={
        <div className="lotion:page">
          <Header title={name}></Header>
        </div>
      }
    >
      <Page pageRef={pageRef} />
    </Suspense>
  );
}
