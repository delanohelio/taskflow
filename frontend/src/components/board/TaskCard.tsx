/** Draggable task card for the Kanban board. */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical } from "lucide-react";
import type { Task } from "@/types/task";
import { formatDueDate } from "@/utils/helpers";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import TagBadge from "@/components/ui/TagBadge";
import ProgressBar from "@/components/ui/ProgressBar";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDateLabel = formatDueDate(task.due_date);
  const hasSubtasks = task.subtasks_total > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        card-enter group relative cursor-pointer rounded-xl border
        border-surface-200 bg-white p-4 shadow-sm
        transition-all duration-200
        hover:border-brand-300 hover:shadow-md
        ${isDragging ? "dragging" : ""}
        ${task.is_overdue ? "border-l-[3px] border-l-red-400" : ""}
      `}
      onClick={() => onClick(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(task);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Tarefa: ${task.title}`}
    >
      {/* Drag handle */}
      <button
        className="absolute right-2 top-2 cursor-grab rounded p-1 opacity-0 transition-opacity hover:bg-surface-100 group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Arrastar tarefa"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-surface-400" />
      </button>

      {/* Header: priority + title */}
      <div className="mb-2 flex items-start gap-2 pr-6">
        <PriorityIndicator priority={task.priority} />
        <h3 className="text-sm font-semibold leading-snug text-surface-800">
          {task.title}
        </h3>
      </div>

      {/* Tags */}
      {task.tag_list.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.tag_list.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      {/* Footer: due date + subtask progress */}
      <div className="flex items-center justify-between gap-2">
        {dueDateLabel && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              task.is_overdue ? "text-red-500" : "text-surface-400"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {dueDateLabel}
          </span>
        )}
        {hasSubtasks && (
          <div className="min-w-[80px]">
            <ProgressBar done={task.subtasks_done} total={task.subtasks_total} />
          </div>
        )}
      </div>
    </div>
  );
}
