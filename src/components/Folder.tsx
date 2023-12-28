import * as fs from "tauri-plugin-fs";
import { Plus, PagePlus, MoreHoriz } from "iconoir-react";
import { confirm } from "@tauri-apps/plugin-dialog";

import "./Folder.scss";
import {
  useMemo,
  Suspense,
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
  KeyboardEventHandler,
  MouseEventHandler,
} from "react";
import usePromise from "react-promise-suspense";
import { useViewContext } from "../lib/View";
import PageObject from "../lib/PageObject";
import { Menu, MenuItem } from "@tauri-apps/api/menu";

async function readFolder(path: string): Promise<fs.DirEntry[]> {
  return await fs.readDir(path);
}

interface ChildrenProps {
  path: string;
}
function Children({ path }: ChildrenProps): React.ReactNode {
  const [items, setItems] = useState<fs.DirEntry[]>(
    usePromise(readFolder, [path]),
  );

  useEffect(() => {
    const watcher = fs.watch(path, () => {
      void readFolder(path).then(setItems);
    });
    return () => {
      void watcher.then((unwatch) => {
        unwatch();
      });
    };
  }, [path]);

  const optimisticUpdatePageRename = useCallback(
    (oldPage: PageObject, newPage: PageObject) => {
      setItems(
        items.map((item) =>
          item.name === oldPage.name ? { ...item, name: newPage.name } : item,
        ),
      );
    },
    [items],
  );

  const optimisticDeletePage = useCallback(
    (page: PageObject) => {
      setItems(items.filter((item) => item.name !== page.name));
    },
    [items],
  );

  const optimisticAddPage = useCallback(
    (page: PageObject) => {
      setItems([
        ...items,
        { name: page.name, isDirectory: true, isFile: false, isSymlink: false },
      ]);
    },
    [items],
  );

  return items.map((item) => {
    const newPath = `${path}/${item.name}`;
    if (item.isDirectory) {
      return (
        <Folder
          path={newPath}
          optimisticAddPage={optimisticAddPage}
          optimisticUpdatePageRename={optimisticUpdatePageRename}
          optimisticDeletePage={optimisticDeletePage}
          key={newPath}
          root={false}
        />
      );
    }
    return null;
  });
}

interface Props {
  path: string;
  root: boolean;
  optimisticUpdatePageRename?: (
    oldPage: PageObject,
    newPage: PageObject,
  ) => void;
  optimisticDeletePage?: (page: PageObject) => void;
  optimisticAddPage?: (page: PageObject) => void;
}
export default function Folder({
  path,
  root,
  optimisticUpdatePageRename,
  optimisticAddPage,
  optimisticDeletePage,
}: Props): React.ReactNode {
  const page = useMemo(() => new PageObject(path), [path]);
  const { view, setView } = useViewContext();
  const isSelected = view?.type === "page" && view.page.path === path;
  const [edit, setEdit] = useState<null | string>(null);
  const saveEdit = useCallback(async () => {
    if (edit != null && edit.trim() !== page.name) {
      const newPage = await PageObject.rename(page, edit.trim());
      optimisticUpdatePageRename?.(page, newPage);
      setView({ type: "page", page: newPage });
    }
    setEdit(null);
  }, [edit, optimisticUpdatePageRename, page, setView]);
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

  const onSelect = useCallback(() => {
    if (!root) {
      if (isSelected) {
        setEdit(page.name);
      } else {
        setView({ type: "page", page });
      }
    }
  }, [isSelected, page, root, setView]);

  const onMoreOptions: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      e.stopPropagation();
      const items = await Promise.all([
        MenuItem.new({
          text: "Rename...",
          action: () => {
            setEdit(page.name);
          },
        }),
        MenuItem.new({
          text: "Delete",
          action: async () => {
            if (
              await confirm(
                "This action cannot be reverted. The page and all of its children will be deleted.\nAre you sure?",
                {
                  title: `Delete "${page.name}"?`,
                  type: "warning",
                },
              )
            ) {
              if (isSelected) {
                setView(null);
              }
              optimisticDeletePage?.(page);
              await PageObject.delete(page);
            }
          },
        }),
      ]);
      const menu = await Menu.new({ items });
      menu.popup();
    },
    [isSelected, optimisticDeletePage, page, setView],
  );

  const [addPageName, setAddPageName] = useState<null | string>(null);
  const addPage: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      e.stopPropagation();
      setAddPageName("");
    },
    [],
  );

  const cancelAddPage = useCallback(() => {
    setAddPageName(null);
  }, []);

  const saveAddPage = useCallback(async () => {
    const newPage = new PageObject(`${page.path}/${addPageName}`);
    setAddPageName(null);
    await PageObject.createFolder(newPage);
    setTimeout(() => {
      optimisticAddPage?.(newPage);
      setView({ type: "page", page: newPage });
    }, 1000);
  }, [addPageName, optimisticAddPage, page.path, setView]);

  const onAddPageNameChangeKeyDown: KeyboardEventHandler<HTMLInputElement> =
    useCallback(
      (event) => {
        if (event.key === "Enter") {
          saveAddPage();
        } else if (event.key === "Escape") {
          cancelAddPage();
        }
      },
      [cancelAddPage, saveAddPage],
    );

  const onAddPageNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAddPageName(e.target.value);
    },
    [],
  );

  const autoSelect = useCallback((e: null | HTMLInputElement) => {
    e?.focus();
    e?.select();
  }, []);

  return (
    <div className={`lotion:folder ${root ? "root" : ""}`}>
      <header
        className={`lotion:folder:header lotion:folder:control ${
          isSelected && addPageName == null ? "active" : ""
        }`}
        onClick={onSelect}
      >
        {edit != null ? (
          <input
            className="lotion:folder:header:name lotion:folder:header:name:edit"
            type="text"
            value={edit}
            onBlur={saveEdit}
            onKeyDown={onSaveKeyDown}
            placeholder={page.name}
            onChange={onEditChange}
            ref={autoSelect}
            autoFocus
          />
        ) : (
          <h3 className="lotion:folder:header:name">{page.name}</h3>
        )}
        {!root && (
          <button
            className="lotion:folder:icon lotion:folder:control:item"
            onClick={onMoreOptions}
          >
            <MoreHoriz height="1em" width="1em" strokeWidth={3} />
          </button>
        )}
        <button
          className="lotion:folder:icon lotion:folder:control:item"
          onClick={addPage}
        >
          <Plus height="1em" width="1em" strokeWidth={3} />
        </button>
      </header>
      <div className="lotion:folder:body">
        <Suspense fallback={null}>
          <Children path={path} />
        </Suspense>
        {addPageName != null && (
          <div className="lotion:folder:header lotion:folder:add-page active">
            <span className="lotion:folder:icon">
              <PagePlus height="1em" width="1em" strokeWidth={1.5} />
            </span>
            <input
              type="text"
              className="lotion:folder:header:name lotion:folder:header:name:edit"
              placeholder="Page name..."
              onKeyDown={onAddPageNameChangeKeyDown}
              onBlur={cancelAddPage}
              autoFocus
              onChange={onAddPageNameChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
