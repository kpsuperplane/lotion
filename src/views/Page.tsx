import { Suspense, useCallback, useRef, useState } from "react";
import { $convertToMarkdownString } from "@lexical/markdown";

import { Page as PageEmoji } from "iconoir-react";

import "./Page.scss";
import Editor from "../components/Editor";
import Header from "../components/Header";
import { EditorState } from "lexical";
import TRANSFORMERS from "../components/Editor/transformers";
import PageRef, {
  usePageContent,
  usePageName,
  usePagePath,
} from "../lib/fs/PageRef";

type PageWrapperProps = {
  pageRef: PageRef;
  dirty: boolean;
};
function PageWrapper({
  pageRef,
  dirty,
  children,
}: React.PropsWithChildren<PageWrapperProps>) {
  const { name, emoji } = usePageName(pageRef);
  return (
    <div className="lotion:page">
      <Header title={`${name}${dirty ? "*" : ""}`}></Header>
      <div className="lotion:page:wrapper">
        <div className="lotion:page:top"></div>
        <div className="lotion:page:content">
          <div className="lotion:page:top:emoji">
            {emoji != null ? (
              <span>{emoji}</span>
            ) : (
              <PageEmoji height="1em" width="1em" />
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

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

  const content = usePageContent(pageRef);
  const path = usePagePath(pageRef);

  return (
    <PageWrapper dirty={dirty} pageRef={pageRef}>
      <main className="lotion:page:editor">
        {content != null && (
          <Editor initialContent={content} id={path} onChange={onChange} />
        )}
      </main>
    </PageWrapper>
  );
}

export default function WithSuspense({ pageRef }: Props) {
  return (
    <Suspense fallback={<PageWrapper dirty={false} pageRef={pageRef} />}>
      <Page pageRef={pageRef} />
    </Suspense>
  );
}
