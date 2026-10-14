/** A single droppable column in the Kanban board with v3.0 aesthetics. */

import React from "react";
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
  onMoveTask: (taskId: number, newStatus: string) => Promise<Task>;
}

const COLUMN_THEMES: Record<string, { dot: string; pill: string; title: string }> = {
  todo: {
    dot: "bg-slate-400",
    pill: "bg-surface-200 text-surface-700",
    title: "text-surface-700",
  },
  doing: {
    dot: "bg-blue-500 animate-pulse",
    pill: "bg-blue-100 text-blue-700 font-extrabold",
    title: "text-blue-900",
  },
  done: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-100 text-emerald-700 font-extrabold",
    title: "text-emerald-900",
  },
};

function KanbanColumnComponent({
  id,
  label,
  tasks,
  emptyMessage,
  onTaskClick,
  onMoveTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const theme = COLUMN_THEMES[id] || COLUMN_THEMES.todo;

  return (
    <div className="flex min-h-[160px] md:min-h-0 flex-1 flex-col w-full md:min-w-[300px]">
      {/* Column header */}
      <div className="mb-3.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
          <h2 className={`text-xs font-extrabold uppercase tracking-wider ${theme.title}`}>
            {label}
          </h2>
          <span className={`inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-2 text-[11px] tabular-nums ${theme.pill}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-3 rounded-2xl p-2.5 bg-surface-100/60 border border-surface-200/60 transition-all duration-200 min-h-[350px] ${
          isOver ? "drag-over bg-brand-50/40" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-200/80 py-16 px-4 text-center">
              <p className="text-xs font-semibold text-surface-400">{emptyMessage}</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
                onMoveTask={onMoveTask}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default React.memo(KanbanColumnComponent);
