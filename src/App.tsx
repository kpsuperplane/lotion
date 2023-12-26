import "./App.css";
import Page from "./Page";
import Sidebar from "./Sidebar";

export default function App() {
  return (
    <div className="lotion:layout">
      <div className="lotion:layout:sidebar">
        <Sidebar />
      </div>
      <div className="lotion:layout:body">
        <Page />
      </div>
    </div>
  );
}
