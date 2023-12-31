import { RefObject, useCallback, useMemo, useRef } from "react";
import useEmojiPicker from "../components/useEmojiPicker";
import PageRef, { usePageName } from "./fs/PageRef";

export default function useEditPageEmoji(pageRef: PageRef): {
  emojiRef: RefObject<HTMLButtonElement>;
  emojiPicker: React.ReactNode;
  onEmojiClick: () => void;
} {
  const { emojiPicker, closeEmojiPicker, toggleEmojiPicker } = useEmojiPicker();
  const { emoji, name } = usePageName(pageRef);
  const emojiRef = useRef<HTMLButtonElement>(null);
  const onEmojiSelect = useCallback(
    (newEmoji: string) => {
      if (newEmoji !== emoji) {
        pageRef.rename(newEmoji, name);
      }
      closeEmojiPicker();
    },
    [closeEmojiPicker, emoji, name, pageRef],
  );
  const onEmojiClick = useCallback(() => {
    if (emojiRef.current != null) {
      toggleEmojiPicker({
        anchor: emojiRef.current,
        autoFocus: true,
        onEmojiSelect,
      });
    }
  }, [onEmojiSelect, toggleEmojiPicker]);
  return useMemo(
    () => ({ emojiRef, emojiPicker, onEmojiClick }),
    [emojiPicker, onEmojiClick],
  );
}
