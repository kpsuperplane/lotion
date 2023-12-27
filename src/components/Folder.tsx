import * as fs from "tauri-plugin-fs";
import { Plus } from "iconoir-react";

import "./Folder.scss";
import { useMemo, Suspense, useEffect, useState, useCallback } from "react";
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
    usePromise(readFolder, [path])
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

  return items.map((item) => {
    const newPath = `${path}/${item.name}`;
    if (item.isDirectory) {
      return <Folder path={newPath} key={newPath} root={false} />;
    }
    return null;
  });
}

interface Props {
  path: string;
  root: boolean;
}
export default function Folder({ path, root }: Props): React.ReactNode {
  const page = useMemo(() => new PageObject(path), [path]);
  const { view, setView } = useViewContext();
  const isSelected = view?.type === "page" && view.page.path === path;
  const onSelect = useCallback(() => {
    if (!root) {
      setView({ type: "page", page });
    }
  }, [page, root, setView]);
  return (
    <div className={`lotion:folder ${root ? "" : "selectable"}`}>
      <header
        className={`lotion:folder:header lotion:folder:control ${
          isSelected ? "active" : ""
        }`}
        onClick={onSelect}
      >
        <h3 className="lotion:folder:header:name">{page.name}</h3>
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
