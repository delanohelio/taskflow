import { Play, Edit3, Trash2, Calendar, Clock, AlertCircle } from "lucide-react";
import type { Task, UpdateTaskPayload } from "@/types/task";
import { formatStartDateTime, formatDueDate } from "@/utils/helpers";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import TagBadge from "@/components/ui/TagBadge";

interface StandbyScreenProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdate: (taskId: number, payload: UpdateTaskPayload) => Promise<Task>;
  onDelete: (taskId: number) => Promise<void>;
}

export default function StandbyScreen({
  tasks,
  onTaskClick,
  onUpdate,
  onDelete,
}: StandbyScreenProps) {
  // Sort tasks: tasks with start_datetime first (soonest first), then tasks without start_datetime
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.start_datetime) return 1;
    if (!b.start_datetime) return -1;
    return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
  });

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden">
      {/* Header Info */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
        <h2 className="text-base font-bold text-amber-900">Gerenciamento de Stand-by</h2>
        <p className="text-sm text-amber-700 mt-1">
          Estas tarefas estão agendadas para liberação automática. Você pode iniciá-las a qualquer momento clicando em <strong>Iniciar Agora</strong> ou editá-las para mudar as datas.
        </p>
      </div>

      {/* Grid of Standby Cards */}
      <div className="flex-1 overflow-y-auto pb-6">
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-surface-300" />
            <p className="text-sm font-semibold text-surface-500">Nenhuma tarefa em stand-by</p>
            <p className="text-xs text-surface-400 mt-1">Crie tarefas agendadas informando uma data de início futura.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="group flex flex-col justify-between rounded-xl border border-surface-200 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:border-amber-300 cursor-pointer card-enter relative"
              >
                <div>
                  {/* Top info: Priority & Start DateTime */}
                  <div className="flex items-center justify-between mb-3">
                    <PriorityIndicator priority={task.priority} showLabel />
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      <Clock className="h-3 w-3" />
                      {formatStartDateTime(task.start_datetime)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-surface-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                    {task.title}
                  </h3>
                  <p className="text-xs text-surface-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {task.description || <span className="italic text-surface-400">Sem descrição</span>}
                  </p>

                  {/* Tags */}
                  {task.tag_list.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {task.tag_list.map((tag) => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  )}

                  {/* Due Date (Optional) */}
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-surface-400 mt-3.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Prazo final: {formatDueDate(task.due_date)}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Panel: Actions */}
                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-surface-100">
                  {/* Iniciar Agora (Promote) */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await onUpdate(task.id, { status: "todo", start_datetime: null });
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-2 text-xs font-semibold text-white transition-all hover:shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Iniciar Agora
                  </button>

                  {/* Edit */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    className="rounded-lg border border-surface-200 p-2 text-surface-500 hover:bg-surface-50 hover:text-surface-700 transition-all"
                    title="Editar"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  {/* Archive */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm("Arquivar esta tarefa?")) {
                        await onUpdate(task.id, { archived: true });
                      }
                    }}
                    className="rounded-lg border border-surface-200 p-2 text-surface-500 hover:bg-surface-50 hover:text-amber-600 transition-all"
                    title="Arquivar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <polyline points="21 8 21 21 3 21 3 8"></polyline>
                      <rect x="1" y="3" width="22" height="5" rx="1"></rect>
                      <line x1="10" y1="12" x2="14" y2="12"></line>
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
                        await onDelete(task.id);
                      }
                    }}
                    className="rounded-lg border border-surface-200 p-2 text-surface-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
