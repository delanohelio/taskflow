/** Left sidebar with navigation, standby tasks, overdue list, and tag filters. */

import {
  Plus,
  Clock,
  AlertTriangle,
  Tag,
  LayoutDashboard,
  Zap,
  List,
  Archive,
  LogOut,
  Settings,
  Calendar,
} from "lucide-react";
import type { BoardData, Task } from "@/types/task";
import { formatStartDateTime, formatDueDate } from "@/utils/helpers";
import TagBadge from "@/components/ui/TagBadge";

interface SidebarProps {
  board: BoardData;
  onCreateTask: () => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  activeScreen: "board" | "list" | "calendar" | "standby" | "archived";
  onChangeScreen: (screen: "board" | "list" | "calendar" | "standby" | "archived") => void;
  archivedCount: number;
  onTaskClick: (task: Task) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export default function Sidebar({
  board,
  onCreateTask,
  selectedTags,
  onToggleTag,
  activeScreen,
  onChangeScreen,
  archivedCount,
  onTaskClick,
  isOpen = false,
  onClose,
  onLogout,
  onOpenSettings,
}: SidebarProps) {
  // Collect all unique tags across all tasks
  const allTags = new Set<string>();
  const allTasks = [
    ...board.todo,
    ...board.doing,
    ...board.done,
    ...board.standby,
  ];
  for (const task of allTasks) {
    for (const tag of task.tag_list) {
      allTags.add(tag);
    }
  }

  const overdueCount = board.overdue.length;
  const standbyCount = board.standby.length;

  return (
    <>
      {/* Mobile sidebar backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity md:hidden cursor-pointer"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-shrink-0 flex-col border-r border-surface-200 bg-white transition-transform duration-300 md:static md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-surface-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-surface-900">
            TaskFlow
          </h1>
          <p className="text-[11px] text-surface-400">Kanban Temporal</p>
        </div>
      </div>

      {/* New task button */}
      <div className="px-4 py-4">
        <button
          onClick={onCreateTask}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-700 hover:to-brand-800 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {/* Navigation Menu */}
        <div className="space-y-0.5">
          <button
            onClick={() => onChangeScreen("board")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-surface-100 ${
              activeScreen === "board" ? "sidebar-item-active" : "text-surface-600"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Quadro</span>
          </button>

          <button
            onClick={() => onChangeScreen("list")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-surface-100 ${
              activeScreen === "list" ? "sidebar-item-active" : "text-surface-600"
            }`}
          >
            <List className="h-4 w-4" />
            <span>Listagem</span>
          </button>

          <button
            onClick={() => onChangeScreen("calendar")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-surface-100 ${
              activeScreen === "calendar" ? "sidebar-item-active" : "text-surface-600"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Calendário</span>
          </button>

          <button
            onClick={() => onChangeScreen("standby")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-surface-100 ${
              activeScreen === "standby" ? "sidebar-item-active" : "text-surface-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4" />
              <span>Stand-by</span>
            </div>
            {standbyCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeScreen === "standby" ? "bg-brand-200 text-brand-800" : "bg-amber-100 text-amber-700"
              }`}>
                {standbyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onChangeScreen("archived")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-surface-100 ${
              activeScreen === "archived" ? "sidebar-item-active" : "text-surface-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <Archive className="h-4 w-4" />
              <span>Arquivadas</span>
            </div>
            {archivedCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeScreen === "archived" ? "bg-brand-200 text-brand-800" : "bg-surface-200 text-surface-600"
              }`}>
                {archivedCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Overdue section ────────────────────────────────────────── */}
        <div className="pt-4">
          <div className="mb-2 flex items-center justify-between px-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-400">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              Atrasadas
            </h3>
            {overdueCount > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-red-600">
                {overdueCount}
              </span>
            )}
          </div>

          {overdueCount === 0 ? (
            <p className="px-3 py-2 text-xs text-surface-400 italic">
              Nenhuma tarefa atrasada ✓
            </p>
          ) : (
            <div className="space-y-0.5">
              {board.overdue.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-red-50 cursor-pointer"
                >
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span className="flex-1 truncate text-surface-700">
                    {task.title}
                  </span>
                  <span className="flex-shrink-0 text-[11px] font-medium text-red-500">
                    {formatDueDate(task.due_date)}
                  </span>
                </div>
              ))}
              {overdueCount > 8 && (
                <p className="px-3 py-1 text-xs text-surface-400">
                  +{overdueCount - 8} mais
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Stand-by section ───────────────────────────────────────── */}
        <div className="pt-4">
          <div className="mb-2 flex items-center justify-between px-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-400">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Stand-by
            </h3>
            {standbyCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-amber-600">
                {standbyCount}
              </span>
            )}
          </div>

          {standbyCount === 0 ? (
            <p className="px-3 py-2 text-xs text-surface-400 italic">
              Nenhuma tarefa agendada
            </p>
          ) : (
            <div className="space-y-0.5">
              {board.standby.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-amber-50 cursor-pointer"
                >
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                  <span className="flex-1 truncate text-surface-700">
                    {task.title}
                  </span>
                  <span className="flex-shrink-0 text-[11px] font-medium text-amber-600">
                    {formatStartDateTime(task.start_datetime)}
                  </span>
                </div>
              ))}
              {standbyCount > 8 && (
                <p className="px-3 py-1 text-xs text-surface-400">
                  +{standbyCount - 8} mais
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Tags filter section ───────────────────────────────────── */}
        {allTags.size > 0 && (
          <div className="pt-4">
            <div className="mb-2 flex items-center gap-2 px-3">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-400">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5 px-3">
              {Array.from(allTags)
                .sort()
                .map((tag) => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    onClick={onToggleTag}
                    active={selectedTags.includes(tag)}
                  />
                ))}
            </div>
          </div>
        )}
      </nav>

      {/* Settings button */}
      {onOpenSettings && (
        <div className="px-3 pb-2">
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-surface-600 transition-colors hover:bg-surface-100"
          >
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-surface-100 px-5 py-3 flex items-center justify-between">
        <p className="text-[11px] text-surface-400">
          TaskFlow v1.0 — Kanban Temporal
        </p>
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
          >
            <LogOut className="h-3 w-3" />
            <span>Sair</span>
          </button>
        )}
      </div>
    </aside>
    </>
  );
}
