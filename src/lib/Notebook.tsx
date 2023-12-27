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

const STORAGE_KEY = "notebooks";

export type Notebook = {
  name: string;
  path: string;
};

type NotebooksContext = {
  addNotebook: (notebook: Notebook) => void;
  notebooks: Notebook[];
};
const NotebooksContext = createContext<NotebooksContext>({
  notebooks: [],
  addNotebook: () => {},
});

const CurrentNotebookContext = createContext<Notebook>({ path: "", name: "" });

export function NotebooksProvider({ children }: PropsWithChildren) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  useEffect(() => {
    store.get<Notebook[]>(STORAGE_KEY).then((data) => setNotebooks(data ?? []));
  }, []);
  const addNotebook = useCallback(
    async (notebook: Notebook) => {
      console.log(notebook);
      const newValue = [notebook, ...notebooks];
      await store.set(STORAGE_KEY, newValue);
      await store.save();
      setNotebooks(newValue);
    },
    [notebooks]
  );

  const [currentNotebook, setCurrentNotebook] = useState<null | Notebook>(null);

  if (currentNotebook == null && notebooks.length > 0) {
    setCurrentNotebook(notebooks[0]);
  }

  const value = useMemo(
    () => ({ notebooks, addNotebook }),
    [notebooks, addNotebook]
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
