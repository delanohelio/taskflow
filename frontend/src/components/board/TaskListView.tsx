import { useState, useMemo } from "react";
import { Search, Filter, Calendar, Clock, ArrowUpDown, AlertCircle, Edit3 } from "lucide-react";
import type { Task, Status, Priority, UpdateTaskPayload } from "@/types/task";
import { PRIORITY_CONFIG } from "@/utils/constants";
import { formatDueDate, formatStartDateTime } from "@/utils/helpers";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import TagBadge from "@/components/ui/TagBadge";
import ProgressBar from "@/components/ui/ProgressBar";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdate: (taskId: number, payload: UpdateTaskPayload) => Promise<Task>;
}

type SortField = "due_date" | "priority" | "created_at" | "title";
type SortOrder = "asc" | "desc";

export default function TaskListView({ tasks, onTaskClick, onUpdate }: TaskListViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // ── Status mapping for display ─────────────────────────────────────────
  const getStatusLabel = (status: Status) => {
    switch (status) {
      case "standby": return "Stand-by";
      case "todo": return "Para Fazer";
      case "doing": return "Em Andamento";
      case "done": return "Concluído";
    }
  };

  const getStatusBadgeClass = (status: Status) => {
    switch (status) {
      case "standby": return "bg-amber-100 text-amber-800 border-amber-200";
      case "todo": return "bg-slate-100 text-slate-700 border-slate-200";
      case "doing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "done": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  // ── Handle sort cycle ──────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // ── Filter & Sort tasks ────────────────────────────────────────────────
  const processedTasks = useMemo(() => {
    let filtered = tasks.filter((t) => !t.archived);

    // Apply search query
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    // Apply sorting
    const priorityWeight = { high: 3, normal: 2, low: 1 };
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "priority") {
        comparison = (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
      } else if (sortField === "due_date") {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
        comparison = dateA - dateB;
      } else {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, search, statusFilter, priorityFilter, sortField, sortOrder]);

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden">
      {/* Filters & Actions Panel */}
      <div className="flex flex-col gap-4 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pr-4 pl-10 text-sm transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-surface-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm font-medium text-surface-700 focus:border-brand-500 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="todo">Para Fazer</option>
            <option value="doing">Em Andamento</option>
            <option value="done">Concluído</option>
            <option value="standby">Stand-by</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm font-medium text-surface-700 focus:border-brand-500 focus:outline-none"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="high">Alta Prioridade</option>
            <option value="normal">Prioridade Normal</option>
            <option value="low">Baixa Prioridade</option>
          </select>
        </div>
      </div>

      {/* Table headers / Sorting */}
      <div className="flex flex-col flex-1 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 border-b border-surface-100 bg-surface-50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-surface-500">
          <button
            onClick={() => handleSort("title")}
            className="col-span-5 flex items-center gap-1.5 text-left hover:text-surface-700"
          >
            Tarefa
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => handleSort("priority")}
            className="col-span-2 flex items-center gap-1.5 text-left hover:text-surface-700"
          >
            Prioridade
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => handleSort("due_date")}
            className="col-span-2 flex items-center gap-1.5 text-left hover:text-surface-700"
          >
            Entrega
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto divide-y divide-surface-100">
          {processedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-surface-300" />
              <p className="text-sm font-medium text-surface-500">Nenhuma tarefa ativa encontrada</p>
              <p className="text-xs text-surface-400 mt-1">Experimente alterar os filtros ou pesquisar outro termo.</p>
            </div>
          ) : (
            processedTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="grid grid-cols-12 items-center px-6 py-4 transition-colors hover:bg-surface-50 cursor-pointer"
              >
                {/* Title & tags & subtasks */}
                <div className="col-span-5 pr-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-surface-900 line-clamp-1 hover:text-brand-600 transition-colors">
                      {task.title}
                    </span>
                    {task.tag_list.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tag_list.map((tag) => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                      </div>
                    )}
                    {task.subtasks_total > 0 && (
                      <div className="w-28 mt-0.5">
                        <ProgressBar done={task.subtasks_done} total={task.subtasks_total} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="col-span-2">
                  <PriorityIndicator priority={task.priority} showLabel />
                </div>

                {/* Due Date & start datetime */}
                <div className="col-span-2">
                  <div className="flex flex-col gap-0.5 text-xs text-surface-500">
                    {task.due_date && (
                      <span className={`flex items-center gap-1 ${task.is_overdue ? "text-red-500 font-medium" : ""}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDueDate(task.due_date)}
                      </span>
                    )}
                    {task.start_datetime && task.status === "standby" && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3.5 w-3.5" />
                        {formatStartDateTime(task.start_datetime)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-150 hover:text-brand-600 transition-all"
                    title="Editar tarefa"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm("Arquivar esta tarefa?")) {
                        await onUpdate(task.id, { archived: true });
                      }
                    }}
                    className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-150 hover:text-amber-600 transition-all"
                    title="Arquivar tarefa"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <polyline points="21 8 21 21 3 21 3 8"></polyline>
                      <rect x="1" y="3" width="22" height="5" rx="1"></rect>
                      <line x1="10" y1="12" x2="14" y2="12"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
