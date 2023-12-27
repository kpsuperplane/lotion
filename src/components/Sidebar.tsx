import { useCurrentNotebook } from "../lib/Notebook";
import Header from "./Header";
import { Book } from "iconoir-react";

import "./Sidebar.scss";
import Folder from "./Folder";

export default function Sidebar() {
  const notebook = useCurrentNotebook();
  return (
    <div className="lotion:sidebar">
      <Header className="lotion:sidebar:header" />
      <button className="lotion:sidebar:notebook">
        <Book />
        <span>{notebook.name}</span>
      </button>
      <Folder path={notebook.path} root={true} />
    </div>
  );
}
