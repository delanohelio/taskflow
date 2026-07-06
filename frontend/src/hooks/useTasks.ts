/**
 * Custom hook encapsulating all task data fetching and mutations.
 *
 * Provides board data, daily review, and actions (create, update, move, delete)
 * with automatic refresh on mutation.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardData, CreateTaskPayload, DailyReview, Task, UpdateTaskPayload } from "@/types/task";
import * as api from "@/services/api";

const POLL_INTERVAL_MS = 30_000; // refresh board every 30 s

export interface UseTasksReturn {
  board: BoardData;
  review: DailyReview;
  archivedTasks: Task[];
  loading: boolean;
  error: string | null;

  // Mutations
  createTask: (payload: CreateTaskPayload) => Promise<Task>;
  updateTask: (taskId: number, payload: UpdateTaskPayload) => Promise<Task>;
  moveTask: (taskId: number, status: string) => Promise<Task>;
  deleteTask: (taskId: number) => Promise<void>;
  refreshBoard: () => Promise<void>;
}

const EMPTY_BOARD: BoardData = {
  todo: [],
  doing: [],
  done: [],
  standby: [],
  overdue: [],
};

const EMPTY_REVIEW: DailyReview = {
  today_count: 0,
  overdue_count: 0,
  today_tasks: [],
  overdue_tasks: [],
};

export function useTasks(): UseTasksReturn {
  const [board, setBoard] = useState<BoardData>(EMPTY_BOARD);
  const [review, setReview] = useState<DailyReview>(EMPTY_REVIEW);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch everything ──────────────────────────────────────────────

  const refreshBoard = useCallback(async () => {
    try {
      const [boardData, reviewData, archivedData] = await Promise.all([
        api.fetchBoard(),
        api.fetchDailyReview(),
        api.fetchTasks({ archived: true }),
      ]);
      setBoard(boardData);
      setReview(reviewData);
      setArchivedTasks(archivedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    refreshBoard();
    intervalRef.current = setInterval(refreshBoard, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshBoard]);

  // ── Mutation wrappers (auto-refresh after each) ───────────────────

  const createTaskAction = useCallback(
    async (payload: CreateTaskPayload) => {
      const task = await api.createTask(payload);
      await refreshBoard();
      return task;
    },
    [refreshBoard],
  );

  const updateTaskAction = useCallback(
    async (taskId: number, payload: UpdateTaskPayload) => {
      const task = await api.updateTask(taskId, payload);
      await refreshBoard();
      return task;
    },
    [refreshBoard],
  );

  const moveTaskAction = useCallback(
    async (taskId: number, status: string) => {
      const task = await api.moveTaskStatus(taskId, status);
      await refreshBoard();
      return task;
    },
    [refreshBoard],
  );

  const deleteTaskAction = useCallback(
    async (taskId: number) => {
      await api.deleteTask(taskId);
      await refreshBoard();
    },
    [refreshBoard],
  );

  return {
    board,
    review,
    archivedTasks,
    loading,
    error,
    createTask: createTaskAction,
    updateTask: updateTaskAction,
    moveTask: moveTaskAction,
    deleteTask: deleteTaskAction,
    refreshBoard,
  };
}
