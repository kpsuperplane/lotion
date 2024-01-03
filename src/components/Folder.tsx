import {
  NavArrowDown,
  NavArrowRight,
  Plus,
  PagePlus,
  MoreHoriz,
  Page,
} from "iconoir-react";
import { confirm } from "@tauri-apps/plugin-dialog";

import "./Folder.scss";
import {
  useState,
  useCallback,
  ChangeEvent,
  KeyboardEventHandler,
  MouseEventHandler,
} from "react";
import { useViewContext } from "../lib/View";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import PageRef, { usePageChildren, usePageName } from "../lib/fs/PageRef";
import useEditPageEmoji from "../lib/useEditPageEmoji";

interface Props {
  pageRef: PageRef;
}
export default function Folder({ pageRef }: Props): React.ReactNode {
  const { view, openPageView, clearView } = useViewContext();
  const currentlyOpenPage =
    view != null && view.type === "page" ? view.pageRef : null;
  const isSelected = currentlyOpenPage === pageRef;

  const { name, emoji } = usePageName(pageRef);

  const [edit, setEdit] = useState<null | string>(null);
  const [editSaving, setEditSaving] = useState(false);
  const saveEdit = useCallback(async () => {
    if (edit != null && edit.trim() !== name) {
      setEditSaving(true);
      try {
        await pageRef.rename(emoji, edit);
      } finally {
        setEditSaving(false);
      }
    }
    setEdit(null);
  }, [edit, emoji, name, pageRef]);
  const onEditChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEdit(e.target.value);
  }, []);

  const onSaveKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.key === "Enter") {
        saveEdit();
      } else if (event.key === "Escape") {
        setEdit(null);
      }
    },
    [saveEdit],
  );

  const onSelect: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (
        !pageRef.isRoot &&
        e.target instanceof HTMLElement &&
        e.target.closest(".lotion\\:folder\\:icon") == null
      ) {
        if (isSelected) {
          setEdit(name);
        } else {
          openPageView(pageRef);
        }
      }
    },
    [isSelected, name, openPageView, pageRef],
  );

  const onMoreOptions = useCallback(async () => {
    const items = await Promise.all([
      MenuItem.new({
        text: "Rename...",
        action: () => {
          setEdit(name);
        },
      }),
      MenuItem.new({
        text: "Delete",
        action: async () => {
          if (
            await confirm(
              "This action cannot be reverted. The page and all of its children will be deleted.\nAre you sure?",
              {
                title: `Delete "${name}"?`,
                type: "warning",
              },
            )
          ) {
            if (currentlyOpenPage?._path.includes(pageRef._path)) {
              clearView();
            }
            pageRef.delete();
          }
        },
      }),
    ]);
    const menu = await Menu.new({ items });
    menu.popup();
  }, [clearView, currentlyOpenPage?._path, name, pageRef]);

  const [newPageName, setNewPageName] = useState<null | string>(null);
  const newPage = useCallback(() => {
    setNewPageName("");
  }, []);

  const cancelNewPage = useCallback(() => {
    setNewPageName(null);
  }, []);

  const saveNewPage = useCallback(() => {
    if (newPageName != null && newPageName.trim() !== "") {
      const newPage = pageRef.createChild(newPageName.trim());
      setNewPageName(null);
      openPageView(newPage);
    }
  }, [newPageName, openPageView, pageRef]);

  const onNewPageNameChangeKeyDown: KeyboardEventHandler<HTMLInputElement> =
    useCallback(
      (event) => {
        if (event.key === "Enter") {
          saveNewPage();
        } else if (event.key === "Escape") {
          cancelNewPage();
        }
      },
      [cancelNewPage, saveNewPage],
    );

  const onNewPageNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setNewPageName(e.target.value);
    },
    [],
  );

  const autoSelect = useCallback((e: null | HTMLInputElement) => {
    e?.focus();
    e?.select();
  }, []);

  const children = usePageChildren(pageRef);

  const { emojiPicker, emojiRef, onEmojiClick } = useEditPageEmoji(pageRef);

  const [expanded, setExpanded] = useState(true);
  const toggleExpand = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  return (
    <div className={`lotion:folder ${pageRef.isRoot ? "root" : ""}`}>
      <header
        className={`lotion:folder:header lotion:folder:control ${
          isSelected && newPageName == null ? "active" : ""
        } ${
          !pageRef.isRoot &&
          !expanded &&
          currentlyOpenPage !== pageRef &&
          currentlyOpenPage?._path.startsWith(pageRef._path)
            ? "contains-open-child"
            : ""
        }`}
        onClick={onSelect}
      >
        {!pageRef.isRoot && (
          <button
            disabled={!(children != null && children.length > 0)}
            onClick={toggleExpand}
            className="lotion:folder:icon lotion:folder:control:item lotion:folder:control:item:visible"
          >
            {expanded ? (
              <NavArrowDown height="1em" width="1em" strokeWidth={1.5} />
            ) : (
              <NavArrowRight height="1em" width="1em" strokeWidth={1.5} />
            )}
          </button>
        )}
        {!pageRef.isRoot && (
          <button
            onClick={onEmojiClick}
            ref={emojiRef}
            className={`lotion:folder:icon lotion:folder:control:item lotion:folder:control:item:visible ${
              emoji ? "emoji" : ""
            }`}
          >
            {emoji ?? <Page height="1em" width="1em" strokeWidth={1.5} />}
          </button>
        )}
        {edit != null ? (
          <input
            className="lotion:folder:header:name lotion:folder:header:name:edit"
            type="text"
            disabled={editSaving}
            value={edit}
            onBlur={saveEdit}
            onKeyDown={onSaveKeyDown}
            placeholder={name}
            onChange={onEditChange}
            ref={autoSelect}
            autoFocus
          />
        ) : (
          <h3 className="lotion:folder:header:name">{name}</h3>
        )}
        {!pageRef.isRoot && (
          <button
            className="lotion:folder:icon lotion:folder:control:item"
            onClick={onMoreOptions}
          >
            <MoreHoriz height="1em" width="1em" strokeWidth={3} />
          </button>
        )}
        <button
          className="lotion:folder:icon lotion:folder:control:item"
          onClick={newPage}
        >
          <Plus height="1em" width="1em" strokeWidth={3} />
        </button>
      </header>
      <div className="lotion:folder:body">
        {(expanded || pageRef.isRoot) &&
          children?.map((child) => (
            <Folder pageRef={child} key={child._name} />
          ))}
        {newPageName != null && (
          <div className="lotion:folder:header lotion:folder:add-page active">
            <span className="lotion:folder:icon">
              <PagePlus height="1em" width="1em" strokeWidth={1.5} />
            </span>
            <input
              type="text"
              className="lotion:folder:header:name lotion:folder:header:name:edit"
              placeholder="Page name..."
              onKeyDown={onNewPageNameChangeKeyDown}
              onBlur={cancelNewPage}
              autoFocus
              onChange={onNewPageNameChange}
            />
          </div>
        )}
      </div>
      {emojiPicker}
    </div>
  );
}
