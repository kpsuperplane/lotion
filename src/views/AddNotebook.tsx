import { ChangeEvent, useCallback, useState } from "react";
import Header from "../components/Header";
import "./AddNotebook.css";
import { open } from "@tauri-apps/plugin-dialog";
import Notebook, { useNotebooks } from "../lib/Notebook";

export default function AddNotebook() {
  const [name, setName] = useState<string>("");

  const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const [folder, setFolder] = useState<null | string>(null);
  const selectFolder = useCallback(async () => {
    setFolder(
      await open({
        multiple: false,
        directory: true,
      }),
    );
  }, []);

  const { addNotebook } = useNotebooks();
  const submit = useCallback(() => {
    if (folder != null) {
      addNotebook(new Notebook(name, folder));
    }
  }, [addNotebook, folder, name]);

  return (
    <div className="lotion:add-notebook">
      <Header title="Add Notebook" />
      <main className="lotion:add-notebook:content">
        <div className="lotion:add-notebook:form">
          <input
            type="text"
            placeholder="Notebook Name"
            value={name}
            onChange={onNameChange}
          />
          <button onClick={selectFolder}>{folder ?? "Select a folder"}</button>
          <button
            disabled={name.trim() === "" || folder == null}
            onClick={submit}
          >
            Submit
          </button>
        </div>
      </main>
    </div>
  );
}
