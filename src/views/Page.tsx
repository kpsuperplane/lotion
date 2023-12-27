import "./Page.css";
import Editor from "../components/Editor";

export default function Page() {
  return (
    <div className="lotion:page">
      <header data-tauri-drag-region className="lotion:page:header">
        Page
      </header>
      <main className="lotion:page:editor">
        <Editor />
      </main>
    </div>
  );
}
