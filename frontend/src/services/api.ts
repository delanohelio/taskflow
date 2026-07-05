/** Axios-based service for the FastAPI backend. */

import axios from "axios";
import type {
  BoardData,
  CreateTaskPayload,
  DailyReview,
  Task,
  UpdateTaskPayload,
} from "@/types/task";
import { API_BASE_URL } from "@/utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

// Interceptor to inject password from localStorage in request headers
api.interceptors.request.use((config) => {
  const pwd = localStorage.getItem("taskflow_pwd");
  if (pwd) {
    config.headers["X-App-Password"] = pwd;
  }
  return config;
});

// ── Task CRUD ────────────────────────────────────────────────────────────

export async function fetchBoard(): Promise<BoardData> {
  const { data } = await api.get<BoardData>("/tasks/board");
  return data;
}

export async function fetchDailyReview(): Promise<DailyReview> {
  const { data } = await api.get<DailyReview>("/tasks/review");
  return data;
}

export async function fetchTask(taskId: number): Promise<Task> {
  const { data } = await api.get<Task>(`/tasks/${taskId}`);
  return data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const { data } = await api.post<Task>("/tasks", payload);
  return data;
}

export async function updateTask(
  taskId: number,
  payload: UpdateTaskPayload,
): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${taskId}`, payload);
  return data;
}

export async function moveTaskStatus(
  taskId: number,
  status: string,
): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${taskId}/status`, {
    status,
  });
  return data;
}

export async function deleteTask(taskId: number): Promise<void> {
  await api.delete(`/tasks/${taskId}`);
}

export async function triggerTemporal(): Promise<{ promoted: number }> {
  const { data } = await api.post("/tasks/trigger-temporal");
  return data;
}

export async function fetchTasks(filters?: {
  status?: string;
  tag?: string;
  parent_id?: number | null;
  archived?: boolean;
}): Promise<Task[]> {
  const { data } = await api.get<Task[]>("/tasks", { params: filters });
  return data;
}
