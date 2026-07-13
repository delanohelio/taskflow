/** Full Kanban board with three columns and drag-and-drop. */

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import type { BoardData, Task } from "@/types/task";
import { KANBAN_COLUMNS } from "@/utils/constants";
import { sortTasks } from "@/utils/sortTasks";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";

interface KanbanBoardProps {
  board: BoardData;
  onMoveTask: (taskId: number, newStatus: string) => Promise<Task>;
  onTaskClick: (task: Task) => void;
}

export default function KanbanBoard({
  board,
  onMoveTask,
  onTaskClick,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as number;
    const targetColumnId = over.id as string;

    // Only process if dropped on a column (not on another card)
    const validColumns = KANBAN_COLUMNS.map((c) => c.id);
    if (!validColumns.includes(targetColumnId as typeof validColumns[number])) {
      // Dropped on a card — check which column that card belongs to
      const overTask = over.data.current?.task as Task | undefined;
      if (overTask && overTask.status !== activeTask?.status) {
        await onMoveTask(taskId, overTask.status);
      }
      return;
    }

    // Dropped on a column directly
    const task = active.data.current?.task as Task | undefined;
    if (task && task.status !== targetColumnId) {
      await onMoveTask(taskId, targetColumnId);
    }
  }

  // Map column IDs to their task arrays (sorted by priority + due_date)
  const columnData: Record<string, Task[]> = {
    todo: sortTasks(board.todo),
    doing: sortTasks(board.doing),
    done: sortTasks(board.done),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row gap-5 pb-4 md:overflow-x-auto">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.label}
            tasks={columnData[col.id] ?? []}
            emptyMessage={col.emptyMessage}
            onTaskClick={onTaskClick}
            onMoveTask={onMoveTask}
          />
        ))}
      </div>

      {/* Drag overlay (floating card while dragging) */}
      <DragOverlay>
        {activeTask && (
          <div className="w-72 opacity-90">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
