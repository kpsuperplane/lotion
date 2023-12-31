import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
import useEditPageEmoji from "../lib/useEditPageEmoji";

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
  const { emojiPicker, emojiRef, onEmojiClick } = useEditPageEmoji(pageRef);
  return (
    <div className="lotion:page">
      <Header title={`${name}${dirty ? "*" : ""}`}></Header>
      <div className="lotion:page:wrapper">
        <div className="lotion:page:top"></div>
        <div className="lotion:page:content">
          <button
            className="lotion:page:top:emoji"
            onClick={onEmojiClick}
            ref={emojiRef}
          >
            {emoji != null ? (
              <span>{emoji}</span>
            ) : (
              <PageEmoji height="1em" width="1em" />
            )}
          </button>
          {children}
        </div>
      </div>
      {emojiPicker}
    </div>
  );
}

type Props = {
  pageRef: PageRef;
};
function Page({ pageRef }: Props) {
  const [dirty, setDirty] = useState(false);

  const saveDebounce = useRef<null | NodeJS.Timeout>(null);
  const saveCommand = useRef<null | (() => void)>(null);
  const save = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        saveCommand.current = null;
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
      setDirty(true);
      if (saveDebounce.current != null) {
        clearTimeout(saveDebounce.current);
      }
      saveCommand.current = () => save(editorState);
      saveDebounce.current = setTimeout(saveCommand.current, 3000);
    },
    [save],
  );

  const content = usePageContent(pageRef);
  const path = usePagePath(pageRef);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (saveCommand.current != null) {
        saveCommand.current();
        if (saveDebounce.current != null) {
          clearTimeout(saveDebounce.current);
        }
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

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
