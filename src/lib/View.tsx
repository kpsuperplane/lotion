import { PropsWithChildren, createContext, useContext, useMemo, useState } from "react";
import PageObject from "./PageObject";

type View = {
  type: "page";
  page: PageObject;
} | null;

type ViewContext = {
  view: View;
  setView: (view: View) => void;
};

const ViewContext = createContext<ViewContext>({
  view: null,
  setView: () => {},
});

export function ViewContextProvider({ children }: PropsWithChildren) {
  const [view, setView] = useState<View>(null);
  const value = useMemo(() => ({ view, setView }), [view, setView]);
  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

export function useViewContext(): ViewContext {
  return useContext(ViewContext);
}