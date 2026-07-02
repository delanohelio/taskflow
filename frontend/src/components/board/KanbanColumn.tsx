/** A single droppable column in the Kanban board. */

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task } from "@/types/task";
import TaskCard from "./TaskCard";

interface KanbanColumnProps {
  id: string;
  label: string;
  tasks: Task[];
  emptyMessage: string;
  onTaskClick: (task: Task) => void;
}

export default function KanbanColumn({
  id,
  label,
  tasks,
  emptyMessage,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-surface-500">
            {label}
          </h2>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface-200 px-1.5 text-[11px] font-bold tabular-nums text-surface-600">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2.5 rounded-xl p-2 transition-colors duration-200 ${
          isOver ? "drag-over" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-surface-200 py-12">
              <p className="text-sm text-surface-400">{emptyMessage}</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
