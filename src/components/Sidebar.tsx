import { useCurrentNotebook } from "../lib/Notebook";
import Header from "./Header";
import { Book } from "iconoir-react";

import "./Sidebar.scss";
import Folder from "./Folder";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useCallback } from "react";
import PageRef from "../lib/fs/PageRef";

export default function Sidebar() {
  const notebook = useCurrentNotebook();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );
  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    if (
      event.active.data.current instanceof PageRef &&
      event.over?.data.current instanceof PageRef
    ) {
      await event.active.data.current.moveTo(event.over.data.current);
    }
  }, []);
  return (
    <div className="lotion:sidebar">
      <Header className="lotion:sidebar:header" />
      <button className="lotion:sidebar:notebook">
        <Book />
        <span>{notebook.name}</span>
      </button>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <Folder pageRef={notebook.page} />
      </DndContext>
    </div>
  );
}
