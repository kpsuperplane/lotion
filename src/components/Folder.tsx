import * as fs from "tauri-plugin-fs";
import { Plus } from "iconoir-react";

import "./Folder.scss";
import {
  useMemo,
  Suspense,
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
  KeyboardEventHandler,
} from "react";
import usePromise from "react-promise-suspense";
import { useViewContext } from "../lib/View";
import PageObject from "../lib/PageObject";

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

  return items.map((item) => {
    const newPath = `${path}/${item.name}`;
    if (item.isDirectory) {
      return (
        <Folder
          path={newPath}
          optimisticUpdatePageRename={optimisticUpdatePageRename}
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
}
export default function Folder({
  path,
  root,
  optimisticUpdatePageRename,
}: Props): React.ReactNode {
  const page = useMemo(() => new PageObject(path), [path]);
  const { view, setView } = useViewContext();
  const isSelected = view?.type === "page" && view.page.path === path;
  const [edit, setEdit] = useState<null | string>(null);
  const saveEdit = useCallback(async () => {
    if (edit != null) {
      setEdit(null);
      const newPage = await PageObject.rename(page, edit);
      optimisticUpdatePageRename?.(page, newPage);
      setView({ type: "page", page: newPage });
    }
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
  return (
    <div className={`lotion:folder ${root ? "" : "selectable"}`}>
      <header
        className={`lotion:folder:header lotion:folder:control ${
          isSelected ? "active" : ""
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
            autoFocus
          />
        ) : (
          <h3 className="lotion:folder:header:name">{page.name}</h3>
        )}
        <button className="lotion:folder:control:item">
          <Plus height="1em" width="1em" strokeWidth={3} />
        </button>
      </header>
      <Suspense fallback={null}>
        <Children path={path} />
      </Suspense>
    </div>
  );
}
