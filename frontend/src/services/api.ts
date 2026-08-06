/** Axios-based service for the FastAPI backend. */

import axios from "axios";
import type {
  BoardData,
  CreateGroupPayload,
  CreateTaskPayload,
  CreateUserPayload,
  DailyReview,
  ShareTaskPayload,
  Task,
  TaskShare,
  UpdateGroupPayload,
  UpdateProfilePayload,
  UpdateTaskPayload,
  UpdateUserPayload,
  User,
  UserGroup,
} from "@/types/task";
import { API_BASE_URL } from "@/utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

// Attach Authorization header if JWT token exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("taskflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("taskflow_token");
    }
    return Promise.reject(error);
  }
);


// ── Helper: Parse API Error ───────────────────────────────────────────────

export function parseApiError(err: any, fallbackMessage: string = "Ocorreu um erro na requisição."): string {
  if (!err) return fallbackMessage;
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item?.msg) {
          const fieldLoc = item.loc ? item.loc[item.loc.length - 1] : "";
          const fieldMap: Record<string, string> = {
            password: "Senha",
            username: "Nome de usuário",
            full_name: "Nome completo",
            email: "E-mail",
            role: "Função",
            title: "Título",
          };
          const fieldName = fieldMap[fieldLoc] || fieldLoc;
          let msg = item.msg;
          if (msg.includes("String should have at least")) {
            const minMatch = msg.match(/\d+/);
            const minCount = minMatch ? minMatch[0] : "";
            msg = `deve ter pelo menos ${minCount} caracteres`;
          }
          return fieldName ? `${fieldName} ${msg}` : msg;
        }
        return JSON.stringify(item);
      })
      .join(". ");
  }
  if (detail && typeof detail === "object") {
    return JSON.stringify(detail);
  }
  return err.message || fallbackMessage;
}

// ── Auth Services ────────────────────────────────────────────────────────

export async function loginUser(username: string, password: string): Promise<{ access_token: string; user: User }> {
  const { data } = await api.post<{ access_token: string; user: User }>("/auth/login", {
    username,
    password,
  });
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await api.patch<User>("/auth/profile", payload);
  return data;
}

export async function fetchPublicUsers(q?: string): Promise<User[]> {
  const { data } = await api.get<User[]>("/users", { params: { q } });
  return data;
}


// ── Admin User Management ────────────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/admin/users");
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<User>("/admin/users", payload);
  return data;
}

export async function updateUser(userId: number, payload: UpdateUserPayload): Promise<User> {
  const { data } = await api.patch<User>(`/admin/users/${userId}`, payload);
  return data;
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}

// ── User Groups Management ───────────────────────────────────────────────

export async function fetchUserGroups(): Promise<UserGroup[]> {
  const { data } = await api.get<UserGroup[]>("/user-groups");
  return data;
}

export async function createGroup(payload: CreateGroupPayload): Promise<UserGroup> {
  const { data } = await api.post<UserGroup>("/user-groups", payload);
  return data;
}

export async function updateGroup(groupId: number, payload: UpdateGroupPayload): Promise<UserGroup> {
  const { data } = await api.patch<UserGroup>(`/user-groups/${groupId}`, payload);
  return data;
}

export async function deleteGroup(groupId: number): Promise<void> {
  await api.delete(`/user-groups/${groupId}`);
}

// ── Task Sharing & Invitations ───────────────────────────────────────────

export async function shareTask(taskId: number, payload: ShareTaskPayload): Promise<TaskShare[]> {
  const { data } = await api.post<TaskShare[]>(`/tasks/${taskId}/share`, payload);
  return data;
}

export async function fetchInvitations(): Promise<TaskShare[]> {
  const { data } = await api.get<TaskShare[]>("/shares/invitations");
  return data;
}

export async function acceptShare(shareId: number): Promise<TaskShare> {
  const { data } = await api.post<TaskShare>(`/shares/${shareId}/accept`);
  return data;
}

export async function rejectShare(shareId: number): Promise<TaskShare> {
  const { data } = await api.post<TaskShare>(`/shares/${shareId}/reject`);
  return data;
}

export async function revokeShare(shareId: number): Promise<void> {
  await api.delete(`/shares/${shareId}`);
}

export async function setSubtaskAssignees(subtaskId: number, userIds: number[]): Promise<Task> {
  const { data } = await api.post<Task>(`/tasks/${subtaskId}/assignees`, { user_ids: userIds });
  return data;
}

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

// ── Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  auto_archive_minutes: number | null;
}

export async function fetchSettings(): Promise<AppSettings> {
  const { data } = await api.get<AppSettings>("/settings");
  return data;
}

export async function updateSettings(payload: Partial<AppSettings>): Promise<AppSettings> {
  const { data } = await api.patch<AppSettings>("/settings", payload);
  return data;
}

export async function archiveAllDone(): Promise<{ archived: number }> {
  const { data } = await api.post<{ archived: number }>("/tasks/archive-done");
  return data;
}

export async function exportBackup(): Promise<void> {
  const { data } = await api.get("/backup/export");
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `taskflow-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackup(backupData: any): Promise<{ status: string; imported_count: number }> {
  const { data } = await api.post<{ status: string; imported_count: number }>("/backup/import", backupData);
  return data;
}
