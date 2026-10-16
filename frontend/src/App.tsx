/** Root application component: AuthProvider + sidebar + screens + modals + PWA installer. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Menu, PanelLeftClose, PanelLeftOpen, Smartphone } from "lucide-react";
import type { Task } from "@/types/task";
import { useTasks } from "@/hooks/useTasks";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { fetchInvitations } from "@/services/api";

import Sidebar, { type ScreenType } from "@/components/layout/Sidebar";
import LoginScreen from "@/components/layout/LoginScreen";
import KanbanBoard from "@/components/board/KanbanBoard";
import DailyReviewBanner from "@/components/board/DailyReviewBanner";
import CreateTaskModal from "@/components/modals/CreateTaskModal";
import TaskDetailModal from "@/components/modals/TaskDetailModal";
import TaskListView from "@/components/board/TaskListView";
import StandbyScreen from "@/components/board/StandbyScreen";
import ArchivedScreen from "@/components/board/ArchivedScreen";
import SettingsModal from "@/components/modals/SettingsModal";
import CalendarView from "@/components/board/CalendarView";
import UserManagementScreen from "@/components/modals/UserManagementScreen";
import UserGroupsScreen from "@/components/modals/UserGroupsScreen";
import InvitationsScreen from "@/components/modals/InvitationsScreen";
import StatsScreen from "@/components/board/StatsScreen";
import InstallAppModal from "@/components/modals/InstallAppModal";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import * as api from "@/services/api";


function TaskFlowMain() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    board,
    review,
    archivedTasks,
    loading: tasksLoading,
    error,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    refreshBoard,
  } = useTasks(isAuthenticated);

  const {
    canInstall,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    triggerInstall,
  } = usePWAInstall();

  // Desktop sidebar collapsible state
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem("taskflow_desktop_sidebar") !== "false";
    } catch {
      return true;
    }
  });

  const toggleDesktopSidebar = useCallback(() => {
    setDesktopSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("taskflow_desktop_sidebar", String(next));
      } catch {}
      return next;
    });
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenType>("board");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [invitationsCount, setInvitationsCount] = useState(0);

  const loadInvitationsCount = async () => {
    if (!isAuthenticated) return;
    try {
      const invs = await fetchInvitations();
      setInvitationsCount(invs.length);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadInvitationsCount();
    const interval = setInterval(loadInvitationsCount, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

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

  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    const allTasks = [
      ...board.todo,
      ...board.doing,
      ...board.done,
      ...board.standby,
    ];
    for (const task of allTasks) {
      task.tag_list.forEach((t) => tagsSet.add(t));
    }
    return Array.from(tagsSet).sort();
  }, [board]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium text-surface-500">
            Carregando autenticação...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (tasksLoading) {
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
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Sidebar with mobile overlay + desktop collapsible support */}
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
        invitationsCount={invitationsCount}
        onTaskClick={(task) => setSelectedTask(task)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => setShowSettingsModal(true)}
        isDesktopOpen={desktopSidebarOpen}
        onToggleDesktop={toggleDesktopSidebar}
        onInstallApp={triggerInstall}
        canInstallApp={canInstall}
      />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden w-full">
        {/* Top bar */}
        <header className="flex-shrink-0 border-b border-surface-200 bg-white/80 px-4 md:px-8 py-3.5 backdrop-blur-md flex items-center justify-between gap-3 shadow-2xs">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden rounded-lg p-2 text-surface-500 hover:bg-surface-100 transition-colors cursor-pointer"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop menu toggle (Requirement 3: hide/show lateral menu on PC) */}
          <button
            onClick={toggleDesktopSidebar}
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-bold text-surface-700 hover:bg-surface-100 transition-all cursor-pointer shadow-2xs shrink-0"
            title={desktopSidebarOpen ? "Recolher menu lateral" : "Expandir menu lateral"}
            aria-label={desktopSidebarOpen ? "Recolher menu lateral" : "Expandir menu lateral"}
          >
            {desktopSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4 text-surface-500" />
            ) : (
              <PanelLeftOpen className="h-4 w-4 text-brand-600" />
            )}
            <span className="hidden lg:inline">{desktopSidebarOpen ? "Recolher" : "Menu"}</span>
          </button>

          <div className="flex-1 min-w-0">
            <DailyReviewBanner review={review} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Install Web App Button in Header (Requirement 1) */}
            {canInstall && (
              <button
                onClick={triggerInstall}
                className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/80 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 hover:border-brand-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Instalar TaskFlow no Android, iPhone ou PC"
              >
                <Smartphone className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}

            <NotificationDropdown
              onNotificationClick={async (taskId) => {
                if (taskId) {
                  try {
                    const t = await api.fetchTask(taskId);
                    setSelectedTask(t);
                  } catch {
                    refreshBoard();
                  }
                } else {
                  refreshBoard();
                }
              }}
            />
          </div>
        </header>

        {/* Dynamic Screen Area */}
        <section className="flex-1 overflow-auto">
          {activeScreen === "board" && (
            <div className="p-4 sm:p-6 md:p-8">
              <KanbanBoard
                board={filteredBoard}
                onMoveTask={moveTask}
                onTaskClick={(task) => setSelectedTask(task)}
              />
            </div>
          )}
          {activeScreen === "list" && (
            <div className="p-4 sm:p-6 md:p-8">
              <TaskListView
                tasks={filteredActiveTasks}
                onTaskClick={(task) => setSelectedTask(task)}
                onUpdate={updateTask}
              />
            </div>
          )}
          {activeScreen === "calendar" && (
            <div className="p-4 sm:p-6 md:p-8">
              <CalendarView
                tasks={filteredActiveTasks}
                onTaskClick={(task) => setSelectedTask(task)}
              />
            </div>
          )}
          {activeScreen === "stats" && <StatsScreen />}

          {activeScreen === "standby" && (
            <div className="p-4 sm:p-6 md:p-8">
              <StandbyScreen
                tasks={filteredStandbyTasks}
                onTaskClick={(task) => setSelectedTask(task)}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            </div>
          )}
          {activeScreen === "archived" && (
            <div className="p-4 sm:p-6 md:p-8">
              <ArchivedScreen
                tasks={filteredArchivedTasks}
                onTaskClick={(task) => setSelectedTask(task)}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            </div>
          )}
          {activeScreen === "users" && <UserManagementScreen />}
          {activeScreen === "groups" && <UserGroupsScreen />}
          {activeScreen === "invitations" && (
            <InvitationsScreen
              onInvitationHandled={() => {
                loadInvitationsCount();
                refreshBoard();
              }}
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
          availableTags={availableTags}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onCreate={createTask}
          onDelete={deleteTask}
          availableTags={availableTags}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onArchiveDone={refreshBoard}
        />
      )}

      {/* PWA Install Modal (for iOS & direct fallback) */}
      <InstallAppModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isIOS={isIOS}
        onDirectInstall={triggerInstall}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TaskFlowMain />
    </AuthProvider>
  );
}
