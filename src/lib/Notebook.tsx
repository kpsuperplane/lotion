import {
  createContext,
  useEffect,
  useState,
  type PropsWithChildren,
  useMemo,
  useContext,
  useCallback,
} from "react";
import store from "./Store";
import AddNotebook from "../views/AddNotebook";
import PageRef, { IPageRefParent } from "./fs/PageRef";
import { basename, normalize, resolve } from "path";

const STORAGE_KEY = "notebooks";

type NotebookSerialized = { name: string; path: string };
export default class Notebook implements IPageRefParent {
  private static instances: Map<string, Notebook> = new Map();
  public readonly page: PageRef;
  private readonly pagePath: string;
  private constructor(
    public name: string,
    public path: string,
  ) {
    this.pagePath = resolve(path, "../");
    this.page = new PageRef(basename(path), this);
  }

  public serialize(): NotebookSerialized {
    return { name: this.name, path: this.path };
  }

  static get(serialized: NotebookSerialized) {
    const path = normalize(serialized.path);
    if (!Notebook.instances.has(path)) {
      Notebook.instances.set(path, new Notebook(serialized.name, path));
    }
    return Notebook.instances.get(path)!;
  }

  // IPageRefParent
  public getPathForChildPage(): string {
    return this.pagePath;
  }
}

type NotebooksContext = {
  addNotebook: (notebook: Notebook) => void;
  notebooks: Notebook[];
};
const NotebooksContext = createContext<NotebooksContext>({
  notebooks: [],
  addNotebook: () => {},
});

const CurrentNotebookContext = createContext<Notebook>(null as never);

export function NotebooksProvider({ children }: PropsWithChildren) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  useEffect(() => {
    store
      .get<NotebookSerialized[]>(STORAGE_KEY)
      .then((data) => setNotebooks(data?.map((n) => Notebook.get(n)) ?? []));
  }, []);
  const addNotebook = useCallback(
    async (notebook: Notebook) => {
      const newValue = [notebook, ...notebooks];
      await store.set(
        STORAGE_KEY,
        newValue.map((n) => n.serialize()),
      );
      await store.save();
      setNotebooks(newValue);
    },
    [notebooks],
  );

  const [currentNotebook, setCurrentNotebook] = useState<null | Notebook>(null);

  if (currentNotebook == null && notebooks.length > 0) {
    setCurrentNotebook(notebooks[0]);
  }

  const value = useMemo(
    () => ({ notebooks, addNotebook }),
    [notebooks, addNotebook],
  );

  return (
    <NotebooksContext.Provider value={value}>
      {currentNotebook == null ? (
        <AddNotebook />
      ) : (
        <CurrentNotebookContext.Provider value={currentNotebook}>
          {children}
        </CurrentNotebookContext.Provider>
      )}
    </NotebooksContext.Provider>
  );
}

export function useNotebooks(): NotebooksContext {
  return useContext(NotebooksContext);
}

export function useCurrentNotebook(): Notebook {
  return useContext(CurrentNotebookContext);
}
