import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import "./useEmojiPicker.scss";

type Props = {
  anchor: HTMLElement;
  autoFocus?: boolean;
  onEmojiSelect: (emoji: string) => void;
  close: () => void;
};
function EmojiPicker({ autoFocus, close, ...props }: Props) {
  const anchor = useMemo(
    () => props.anchor.getBoundingClientRect(),
    [props.anchor],
  );
  const onEmojiSelect = useCallback(
    (selected: { native: string }) => {
      props.onEmojiSelect(selected.native);
    },
    [props],
  );

  const listener = useCallback(
    (e: MouseEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest(".lotion\\:emoji-picker") == null &&
        !props.anchor.contains(e.target)
      ) {
        close();
      }
    },
    [close, props.anchor],
  );
  
  useEffect(() => {
    document.addEventListener("click", listener);
    return () => document.removeEventListener("click", listener);
  }, [listener]);

  return createPortal(
    <div
      className="lotion:emoji-picker"
      style={{ left: anchor.left, top: anchor.top + anchor.height }}
    >
      <Picker autoFocus={autoFocus} data={data} onEmojiSelect={onEmojiSelect} />
    </div>,
    document.body,
  );
}

export default function useEmojiPicker(): {
  emojiPicker: React.ReactNode;
  toggleEmojiPicker: (props: Omit<Props, "close">) => void;
  closeEmojiPicker: () => void;
} {
  const [emojiPicker, setEmojiPicker] = useState<React.ReactNode>(null);
  const closeEmojiPicker = useCallback(() => setEmojiPicker(null), []);
  const toggleEmojiPicker = useCallback(
    (props: Omit<Props, "close">) => {
      if (emojiPicker == null) {
        setEmojiPicker(<EmojiPicker close={closeEmojiPicker} {...props} />);
      } else {
        setEmojiPicker(null);
      }
    },
    [closeEmojiPicker, emojiPicker],
  );
  return useMemo(
    () => ({ emojiPicker, closeEmojiPicker, toggleEmojiPicker }),
    [closeEmojiPicker, emojiPicker, toggleEmojiPicker],
  );
}
