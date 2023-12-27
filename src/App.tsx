import "./App.css";
import Page from "./views/Page";
import Sidebar from "./components/Sidebar";

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
