import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { NotebooksProvider } from "./lib/Notebook";
import { ViewContextProvider } from "./lib/View";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
      <NotebooksProvider>
        <ViewContextProvider>
          <App />
        </ViewContextProvider>
      </NotebooksProvider>
  </React.StrictMode>,
);
