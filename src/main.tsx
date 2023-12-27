import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import NotebookContext from "./lib/NotebookContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <NotebookContext>
      <App />
    </NotebookContext>
  </React.StrictMode>
);
