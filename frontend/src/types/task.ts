/** Shared TypeScript types for the TaskFlow API. */

// ── Enums ────────────────────────────────────────────────────────────────

export type Status = "standby" | "todo" | "doing" | "done";
export type Priority = "low" | "normal" | "high";
export type UserRole = "admin" | "user";
export type ShareStatus = "pending" | "accepted" | "rejected";

// ── User & Group shapes ──────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  role: UserRole;
  created_at: string | null;
}

export interface UserGroup {
  id: number;
  name: string;
  owner_id: number;
  created_at: string | null;
  members: User[];
}

export interface TaskShare {
  id: number;
  task_id: number;
  user_id: number;
  status: ShareStatus;
  created_at: string | null;
  user: User;
}

// ── API response shape ───────────────────────────────────────────────────

export interface Task {
  id: number;
  title: string;
  description: string | null;
  start_datetime: string | null; // ISO-8601
  due_date: string | null; // YYYY-MM-DD
  status: Status;
  priority: Priority;
  tags: string | null;
  parent_id: number | null;
  owner_id: number | null;
  archived: boolean;
  created_at: string | null;
  updated_at: string | null;

  // Ownership & sharing details
  owner: User | null;
  shares: TaskShare[];
  assignees: User[];

  // Computed fields from the API
  tag_list: string[];
  is_overdue: boolean;
  is_shared: boolean;
  is_shared_with_me: boolean;
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

export interface ShareTaskPayload {
  user_ids: number[];
  group_ids: number[];
}

export interface SubtaskAssigneePayload {
  user_ids: number[];
}

export interface CreateUserPayload {
  username: string;
  password: string;
  full_name: string;
  email?: string | null;
  role: UserRole;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  full_name?: string;
  email?: string | null;
  role?: UserRole;
}

export interface UpdateProfilePayload {
  password?: string;
  full_name?: string;
  email?: string | null;
}

export interface CreateGroupPayload {
  name: string;
  member_ids: number[];
}

export interface UpdateGroupPayload {
  name?: string;
  member_ids?: number[];
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

// ── Settings, Notifications & Stats ──────────────────────────────────────

export interface UserSettings {
  id: number;
  user_id: number;
  auto_archive_minutes: number | null;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: "invitation" | "subtask_assigned" | "due_soon" | "overdue" | "info";
  link_task_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface DayActivity {
  date: string;
  day_name: string;
  completed: number;
  created: number;
}

export interface TagMetric {
  tag: string;
  count: number;
}

export interface UserStats {
  total_tasks: number;
  completed_tasks: number;
  completed_on_time: number;
  overdue_tasks: number;
  standby_tasks: number;
  subtasks_total: number;
  subtasks_completed: number;
  completion_rate_percent: number;
  on_time_rate_percent: number;
  by_priority: {
    high: number;
    normal: number;
    low: number;
  };
  by_status: {
    todo: number;
    doing: number;
    done: number;
    standby: number;
  };
  recent_activity_trend?: DayActivity[];
  tag_distribution?: TagMetric[];
  productivity_score?: number;
}

