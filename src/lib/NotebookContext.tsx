import {
  createContext,
  useEffect,
  useState,
  type PropsWithChildren,
  useMemo,
} from "react";
import store from "./Store";

const STORAGE_KEY = "notebooks";

type Context = {
  notebooks: string[];
};
const Context = createContext({});

export default function Provider({ children }: PropsWithChildren) {
  const [notebooks, setNotebooks] = useState<string[]>([]);
  useEffect(() => {
    store.get<string[]>(STORAGE_KEY).then((data) => setNotebooks(data ?? []));
  }, []);
  const value = useMemo(() => ({ notebooks }), []);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
