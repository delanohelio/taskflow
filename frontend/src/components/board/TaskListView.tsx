import { useState, useMemo } from "react";
import { Search, Calendar, Clock, ArrowUpDown, AlertCircle, Edit3, Archive, CheckCircle2, PlayCircle, ListTodo } from "lucide-react";
import type { Task, Status, UpdateTaskPayload } from "@/types/task";
import { formatDueDate, formatStartDateTime } from "@/utils/helpers";
import { sortTasks } from "@/utils/sortTasks";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import TagBadge from "@/components/ui/TagBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdate: (taskId: number, payload: UpdateTaskPayload) => Promise<Task>;
}

type SortField = "due_date" | "priority" | "created_at" | "title";
type SortOrder = "asc" | "desc";

function StatusToggle({
  status,
  onStatusChange,
}: {
  status: Status;
  onStatusChange: (newStatus: Status) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-xl bg-surface-100 p-1 border border-surface-200 shadow-2xs"
      onClick={(e) => e.stopPropagation()}
    >
      {status === "standby" && (
        <span className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 rounded-lg mr-1 border border-amber-200 shrink-0">
          Stand-by
        </span>
      )}
      <button
        type="button"
        onClick={() => onStatusChange("todo")}
        className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
          status === "todo"
            ? "bg-white text-surface-900 shadow-xs border border-surface-200 font-extrabold"
            : "text-surface-500 hover:text-surface-800"
        }`}
        title="Mudar status para Para Fazer"
      >
        <ListTodo className="h-3 w-3" />
        <span className="hidden xl:inline">A Fazer</span>
      </button>
      <button
        type="button"
        onClick={() => onStatusChange("doing")}
        className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
          status === "doing"
            ? "bg-blue-600 text-white shadow-xs font-extrabold"
            : "text-surface-500 hover:text-surface-800"
        }`}
        title="Mudar status para Em Andamento"
      >
        <PlayCircle className="h-3 w-3" />
        <span className="hidden xl:inline">Fazendo</span>
      </button>
      <button
        type="button"
        onClick={() => onStatusChange("done")}
        className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
          status === "done"
            ? "bg-emerald-600 text-white shadow-xs font-extrabold"
            : "text-surface-500 hover:text-surface-800"
        }`}
        title="Mudar status para Concluído"
      >
        <CheckCircle2 className="h-3 w-3" />
        <span className="hidden xl:inline">Concluído</span>
      </button>
    </div>
  );
}

export default function TaskListView({ tasks, onTaskClick, onUpdate }: TaskListViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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
        return sortTasks([a, b])[0] === a ? -1 : 1;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, search, statusFilter, priorityFilter, sortField, sortOrder]);

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden">
      {/* Filters & Actions Panel */}
      <div className="flex flex-col gap-3 rounded-3xl border border-surface-200 bg-white p-4 md:p-5 shadow-2xs md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-2.5 pr-4 pl-10 text-sm transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:flex md:w-auto">
          {/* Status Filter */}
          <div className="w-full md:w-44">
            <CustomSelect
              options={[
                { value: "all", label: "Todos os Status" },
                { value: "todo", label: "Para Fazer" },
                { value: "doing", label: "Em Andamento" },
                { value: "done", label: "Concluído" },
                { value: "standby", label: "Stand-by" },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
            />
          </div>

          {/* Priority Filter */}
          <div className="w-full md:w-48">
            <CustomSelect
              options={[
                { value: "all", label: "Todas as Prioridades" },
                { value: "high", label: "Alta Prioridade" },
                { value: "normal", label: "Prioridade Normal" },
                { value: "low", label: "Baixa Prioridade" },
              ]}
              value={priorityFilter}
              onChange={(val) => setPriorityFilter(val)}
            />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col flex-1 overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-2xs">
        {/* Desktop Table Headers */}
        <div className="hidden lg:grid grid-cols-12 border-b border-surface-100 bg-surface-50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-surface-500">
          <button
            onClick={() => handleSort("title")}
            className="col-span-4 flex items-center gap-1.5 text-left hover:text-surface-700 cursor-pointer"
          >
            Tarefa
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => handleSort("priority")}
            className="col-span-2 flex items-center gap-1.5 text-left hover:text-surface-700 cursor-pointer"
          >
            Prioridade
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => handleSort("due_date")}
            className="col-span-2 flex items-center gap-1.5 text-left hover:text-surface-700 cursor-pointer"
          >
            Entrega
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <div className="col-span-3">Status</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>

        {/* Task Rows / Mobile Cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-surface-100 p-2 lg:p-0">
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
                className="group relative transition-colors hover:bg-surface-50/70"
              >
                {/* Desktop View */}
                <div
                  onClick={() => onTaskClick(task)}
                  className="hidden lg:grid grid-cols-12 items-center px-6 py-4 cursor-pointer"
                >

                  {/* Title & tags & subtasks */}
                  <div className="col-span-4 pr-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-semibold text-surface-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
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

                  {/* Status Toggle (Segmented Pill Buttons) */}
                  <div className="col-span-3">
                    <StatusToggle
                      status={task.status}
                      onStatusChange={async (newStatus) => {
                        await onUpdate(task.id, { status: newStatus });
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onTaskClick(task)}
                      className="rounded-xl p-2 text-surface-400 hover:bg-surface-200 hover:text-brand-600 transition-colors cursor-pointer"
                      title="Editar tarefa"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm("Arquivar esta tarefa?")) {
                          await onUpdate(task.id, { archived: true });
                        }
                      }}
                      className="rounded-xl p-2 text-surface-400 hover:bg-surface-200 hover:text-amber-600 transition-colors cursor-pointer"
                      title="Arquivar tarefa"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile / Tablet Card View */}
                <div
                  onClick={() => onTaskClick(task)}
                  className="flex lg:hidden flex-col gap-3 p-4 bg-white rounded-2xl border border-surface-150 my-1 cursor-pointer shadow-2xs"
                >

                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-surface-900 text-sm">{task.title}</h4>
                    <PriorityIndicator priority={task.priority} showLabel />
                  </div>

                  {task.tag_list.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.tag_list.map((tag) => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  )}

                  {task.subtasks_total > 0 && (
                    <div className="w-full">
                      <ProgressBar done={task.subtasks_done} total={task.subtasks_total} />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-100">
                    <div className="flex items-center gap-2 text-xs text-surface-500">
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${task.is_overdue ? "text-red-500 font-medium" : ""}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDueDate(task.due_date)}
                        </span>
                      )}
                    </div>

                    <StatusToggle
                      status={task.status}
                      onStatusChange={async (newStatus) => {
                        await onUpdate(task.id, { status: newStatus });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
