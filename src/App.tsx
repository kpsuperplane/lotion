import "./App.css";
import Page from "./views/Page";
import Sidebar from "./components/Sidebar";
import { useViewContext } from "./lib/View";
import { useMemo } from "react";

export default function App() {
  const { view } = useViewContext();
  const body = useMemo(() => {
    switch (view?.type) {
      case "page":
        return <Page page={view.page} />;
      case null:
        return null;
    }
  }, [view]);
  return (
    <div className="lotion:layout">
      <div className="lotion:layout:sidebar">
        <Sidebar />
      </div>
      <div className="lotion:layout:body">{body}</div>
    </div>
  );
}
