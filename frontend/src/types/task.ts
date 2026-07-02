/** Shared TypeScript types for the TaskFlow API. */

// ── Enums ────────────────────────────────────────────────────────────────

export type Status = "standby" | "todo" | "doing" | "done";
export type Priority = "low" | "normal" | "high";

// ── API response shape ───────────────────────────────────────────────────

export interface Task {
  id: number;
  title: string;
  description: string | null;
  start_datetime: string | null; // ISO-8601
  due_date: string | null; // YYYY-MM-DD
  status: Status;
  priority: Priority;
  tags: string | null; // CSV in DB, but API also returns tag_list
  parent_id: number | null;
  archived: boolean;
  created_at: string | null;
  updated_at: string | null;

  // Computed fields from the API
  tag_list: string[];
  is_overdue: boolean;
  subtasks_done: number;
  subtasks_total: number;
  children: Task[];
}

// ── Request payloads ─────────────────────────────────────────────────────

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  start_datetime?: string | null;
  due_date?: string | null;
  priority: Priority;
  tags: string[];
  parent_id?: number | null;
  archived?: boolean;
}

export interface UpdateTaskPayload {
  title?: string | null;
  description?: string | null;
  start_datetime?: string | null;
  due_date?: string | null;
  status?: Status;
  priority?: Priority;
  tags?: string[];
  archived?: boolean;
}

// ── Board response ───────────────────────────────────────────────────────

export interface BoardData {
  todo: Task[];
  doing: Task[];
  done: Task[];
  standby: Task[];
  overdue: Task[];
}

// ── Daily review ─────────────────────────────────────────────────────────

export interface DailyReview {
  today_count: number;
  overdue_count: number;
  today_tasks: Task[];
  overdue_tasks: Task[];
}
