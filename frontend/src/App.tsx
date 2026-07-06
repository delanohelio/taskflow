/** Root application component: sidebar + Kanban board + modals. */

import { useCallback, useMemo, useState } from "react";
import { Loader2, Menu } from "lucide-react";
import type { Task } from "@/types/task";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";

import Sidebar from "@/components/layout/Sidebar";
import LoginScreen from "@/components/layout/LoginScreen";
import KanbanBoard from "@/components/board/KanbanBoard";
import DailyReviewBanner from "@/components/board/DailyReviewBanner";
import CreateTaskModal from "@/components/modals/CreateTaskModal";
import TaskDetailModal from "@/components/modals/TaskDetailModal";
import TaskListView from "@/components/board/TaskListView";
import StandbyScreen from "@/components/board/StandbyScreen";
import ArchivedScreen from "@/components/board/ArchivedScreen";

export default function App() {
  const {
    board,
    review,
    archivedTasks,
    loading,
    error,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    refreshBoard,
  } = useTasks();

  // ── Authentication & UI states ─────────────────────────────────────
  const { unlocked, loading: authLoading, error: authError, login, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeScreen, setActiveScreen] = useState<"board" | "list" | "standby" | "archived">("board");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // ── Tag filter toggle ──────────────────────────────────────────────
  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  // ── Filtered board (apply tag filters) ─────────────────────────────
  const filteredBoard = useMemo(() => {
    if (selectedTags.length === 0) return board;

    const filterTasks = (tasks: Task[]) =>
      tasks.filter((task) =>
        selectedTags.some((tag) => task.tag_list.includes(tag)),
      );

    return {
      ...board,
      todo: filterTasks(board.todo),
      doing: filterTasks(board.doing),
      done: filterTasks(board.done),
      standby: filterTasks(board.standby),
    };
  }, [board, selectedTags]);

  // ── Filtered lists for specific views ──────────────────────────────
  const filteredActiveTasks = useMemo(() => {
    const list = [...board.todo, ...board.doing, ...board.done, ...board.standby];
    if (selectedTags.length === 0) return list;
    return list.filter((task) =>
      selectedTags.some((tag) => task.tag_list.includes(tag)),
    );
  }, [board, selectedTags]);

  const filteredStandbyTasks = useMemo(() => {
    const list = board.standby;
    if (selectedTags.length === 0) return list;
    return list.filter((task) =>
      selectedTags.some((tag) => task.tag_list.includes(tag)),
    );
  }, [board.standby, selectedTags]);

  const filteredArchivedTasks = useMemo(() => {
    const list = archivedTasks;
    if (selectedTags.length === 0) return list;
    return list.filter((task) =>
      selectedTags.some((tag) => task.tag_list.includes(tag)),
    );
  }, [archivedTasks, selectedTags]);

  // ── Auth Loading state ─────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium text-surface-500">
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  // ── Auth Lock Screen ────────────────────────────────────────────────
  if (!unlocked) {
    return <LoginScreen onLogin={login} hasError={authError !== null} />;
  }

  // ── Task Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium text-surface-500">
            Carregando tarefas...
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────
  if (error) {

    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <div className="max-w-sm rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="mb-2 text-sm font-semibold text-red-700">
            Erro ao carregar
          </p>
          <p className="text-xs text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Sidebar */}
      <Sidebar
        board={board}
        onCreateTask={() => setShowCreateModal(true)}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
        activeScreen={activeScreen}
        onChangeScreen={(screen) => {
          setActiveScreen(screen);
          setSidebarOpen(false);
        }}
        archivedCount={archivedTasks.length}
        onTaskClick={(task) => setSelectedTask(task)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden w-full">
        {/* Top bar */}
        <header className="flex-shrink-0 border-b border-surface-200 bg-white/80 px-4 md:px-8 py-4 backdrop-blur-sm flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden rounded-lg p-2 hover:bg-surface-100 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5 text-surface-500" />
          </button>
          <div className="flex-1 min-w-0">
            <DailyReviewBanner review={review} />
          </div>
        </header>

        {/* Dynamic Screen Area */}
        <section className="flex-1 overflow-auto px-8 py-6">
          {activeScreen === "board" && (
            <KanbanBoard
              board={filteredBoard}
              onMoveTask={moveTask}
              onTaskClick={(task) => setSelectedTask(task)}
            />
          )}
          {activeScreen === "list" && (
            <TaskListView
              tasks={filteredActiveTasks}
              onTaskClick={(task) => setSelectedTask(task)}
              onUpdate={updateTask}
            />
          )}
          {activeScreen === "standby" && (
            <StandbyScreen
              tasks={filteredStandbyTasks}
              onTaskClick={(task) => setSelectedTask(task)}
              onUpdate={updateTask}
              onDelete={deleteTask}
            />
          )}
          {activeScreen === "archived" && (
            <ArchivedScreen
              tasks={filteredArchivedTasks}
              onTaskClick={(task) => setSelectedTask(task)}
              onUpdate={updateTask}
              onDelete={deleteTask}
            />
          )}
        </section>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal
          onSubmit={async (payload) => {
            await createTask(payload);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onCreate={createTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}
