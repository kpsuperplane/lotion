import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import PageRef from "./fs/PageRef";

type View = {
  type: "page";
  pageRef: PageRef;
} | null;

type ViewContext = {
  view: View;
  openPageView: (pageRef: PageRef) => void;
  clearView: () => void;
};

const ViewContext = createContext<ViewContext>({
  view: null,
  openPageView: () => {},
  clearView: () => {},
});

export function ViewContextProvider({ children }: PropsWithChildren) {
  const [view, setView] = useState<View>(null);
  const clearView = useCallback(() => {
    setView(null);
  }, []);
  const openPageView = useCallback((pageRef: PageRef) => {
    setView({ type: "page", pageRef });
  }, []);
  const value = useMemo(
    () => ({ view, clearView, openPageView }),
    [view, clearView, openPageView],
  );
  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

export function useViewContext(): ViewContext {
  return useContext(ViewContext);
}
