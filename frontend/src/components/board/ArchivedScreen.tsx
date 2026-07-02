import { RotateCcw, Trash2, Calendar, Archive, AlertCircle } from "lucide-react";
import type { Task, Status, UpdateTaskPayload } from "@/types/task";
import { formatDueDate } from "@/utils/helpers";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import TagBadge from "@/components/ui/TagBadge";

interface ArchivedScreenProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdate: (taskId: number, payload: UpdateTaskPayload) => Promise<Task>;
  onDelete: (taskId: number) => Promise<void>;
}

export default function ArchivedScreen({
  tasks,
  onTaskClick,
  onUpdate,
  onDelete,
}: ArchivedScreenProps) {
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
      case "standby": return "bg-amber-50 text-amber-600 border-amber-100";
      case "todo": return "bg-slate-50 text-slate-500 border-slate-200";
      case "doing": return "bg-blue-50 text-blue-500 border-blue-100";
      case "done": return "bg-emerald-50 text-emerald-600 border-emerald-100";
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden">
      {/* Header Info */}
      <div className="rounded-2xl border border-surface-200 bg-surface-100/50 p-5 shadow-sm">
        <h2 className="text-base font-bold text-surface-800">Baú de Arquivados</h2>
        <p className="text-sm text-surface-500 mt-1">
          Tarefas arquivadas ficam ocultas do quadro Kanban e da lista ativa. Restaure-as a qualquer momento ou exclua de forma permanente.
        </p>
      </div>

      {/* Grid of Archived Cards */}
      <div className="flex-1 overflow-y-auto pb-6">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Archive className="mb-3 h-10 w-10 text-surface-300" />
            <p className="text-sm font-semibold text-surface-500">Nenhuma tarefa arquivada</p>
            <p className="text-xs text-surface-400 mt-1">Sua gaveta de arquivos está vazia por enquanto.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="group flex flex-col justify-between rounded-xl border border-surface-200 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:border-surface-300 cursor-pointer card-enter relative"
              >
                <div>
                  {/* Top info: Priority & Original Status */}
                  <div className="flex items-center justify-between mb-3">
                    <PriorityIndicator priority={task.priority} showLabel />
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-surface-900 group-hover:text-surface-700 transition-colors line-clamp-1">
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

                  {/* Due Date */}
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-surface-400 mt-3.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Venceu em: {formatDueDate(task.due_date)}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Panel: Actions */}
                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-surface-100">
                  {/* Desarquivar (Restore) */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await onUpdate(task.id, { archived: false });
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-white hover:bg-surface-50 px-3 py-2 text-xs font-semibold text-surface-750 transition-all shadow-sm"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Desarquivar
                  </button>

                  {/* Delete Permanently */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          "ATENÇÃO: Isso excluirá permanentemente esta tarefa e não poderá ser desfeito. Continuar?"
                        )
                      ) {
                        await onDelete(task.id);
                      }
                    }}
                    className="rounded-lg border border-surface-200 p-2 text-surface-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    title="Excluir Permanentemente"
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
