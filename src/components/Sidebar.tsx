import { useCurrentNotebook } from "../lib/Notebook";
import Header from "./Header";
import { Book } from "iconoir-react";

import "./Sidebar.scss";
import Folder from "./Folder";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

export default function Sidebar() {
  const notebook = useCurrentNotebook();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  return (
    <div className="lotion:sidebar">
      <Header className="lotion:sidebar:header" />
      <button className="lotion:sidebar:notebook">
        <Book />
        <span>{notebook.name}</span>
      </button>
      <DndContext sensors={sensors}>
        <Folder pageRef={notebook.page} />
      </DndContext>
    </div>
  );
}
