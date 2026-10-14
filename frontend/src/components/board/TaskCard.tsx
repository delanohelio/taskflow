/** Draggable task card for the Kanban board with share indicators and performance memoization. */

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical, Share2, User as UserIcon, Play, Check, RotateCcw, Pause } from "lucide-react";
import type { Task } from "@/types/task";
import { formatDueDate } from "@/utils/helpers";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import TagBadge from "@/components/ui/TagBadge";
import ProgressBar from "@/components/ui/ProgressBar";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onMoveTask?: (taskId: number, newStatus: string) => Promise<Task>;
}

function TaskCardComponent({ task, onClick, onMoveTask }: TaskCardProps) {
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
        card-enter group relative cursor-pointer rounded-2xl border
        border-surface-200/90 bg-white p-4 shadow-2xs
        transition-all duration-200
        hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5
        ${isDragging ? "dragging" : ""}
        ${task.is_overdue ? "border-l-4 border-l-red-500 bg-red-50/10" : ""}
        ${task.status === "done" ? "opacity-90 bg-surface-50/40" : ""}
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
        className="absolute right-2.5 top-2.5 cursor-grab rounded-lg p-1.5 opacity-0 transition-opacity hover:bg-surface-100 group-hover:opacity-100 active:cursor-grabbing text-surface-400 hover:text-surface-700"
        {...attributes}
        {...listeners}
        aria-label="Arrastar tarefa"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Share Badges / Owner indicator */}
      {task.is_shared_with_me && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200/80">
          <UserIcon className="h-3 w-3 text-purple-500" />
          <span>De: {task.owner?.full_name || task.owner?.username || "Outro Usuário"}</span>
        </div>
      )}
      {!task.is_shared_with_me && task.is_shared && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200/80">
          <Share2 className="h-3 w-3 text-indigo-500" />
          <span>Compartilhada</span>
        </div>
      )}

      {/* Header: priority + title */}
      <div className="mb-2 flex items-start gap-2 pr-7">
        <PriorityIndicator priority={task.priority} />
        <h3 className="text-sm font-bold leading-snug text-surface-900 group-hover:text-brand-600 transition-colors">
          {task.title}
        </h3>
      </div>

      {/* Tags */}
      {task.tag_list.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {task.tag_list.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      {/* Footer: due date + subtask progress */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {dueDateLabel ? (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
              task.is_overdue ? "text-red-600 bg-red-50 px-2 py-0.5 rounded-md" : "text-surface-400"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {dueDateLabel}
          </span>
        ) : <span />}

        {hasSubtasks && (
          <div className="min-w-[85px]">
            <ProgressBar done={task.subtasks_done} total={task.subtasks_total} />
          </div>
        )}
      </div>

      {/* Quick status action buttons */}
      {onMoveTask && (
        <div
          className="mt-3 pt-2.5 border-t border-surface-100 flex justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {task.status === "todo" && (
            <button
              onClick={() => onMoveTask(task.id, "doing")}
              className="flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <Play className="h-3 w-3 fill-current" />
              Iniciar
            </button>
          )}
          {task.status === "doing" && (
            <>
              <button
                onClick={() => onMoveTask(task.id, "todo")}
                className="flex items-center gap-1 rounded-xl bg-surface-100 px-2.5 py-1 text-[11px] font-bold text-surface-700 hover:bg-surface-200 transition-all active:scale-95 cursor-pointer"
              >
                <Pause className="h-3 w-3" />
                Pausar
              </button>
              <button
                onClick={() => onMoveTask(task.id, "done")}
                className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <Check className="h-3 w-3" />
                Concluir
              </button>
            </>
          )}
          {task.status === "done" && (
            <button
              onClick={() => onMoveTask(task.id, "doing")}
              className="flex items-center gap-1 rounded-xl bg-surface-100 px-2.5 py-1 text-[11px] font-bold text-surface-600 hover:bg-surface-200 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Refazer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(TaskCardComponent);
