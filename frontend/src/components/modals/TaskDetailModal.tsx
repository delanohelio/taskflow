/** Modal showing task details, editing, and subtask management. */

import { useEffect, useState, type FormEvent } from "react";
import {
  X,
  Trash2,
  Plus,
  Check,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Archive,
  Play,
} from "lucide-react";
import type { Task, CreateTaskPayload, Priority, UpdateTaskPayload } from "@/types/task";
import { PRIORITY_CONFIG } from "@/utils/constants";
import { formatDueDate, formatStartDateTime } from "@/utils/helpers";
import * as api from "@/services/api";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import TagBadge from "@/components/ui/TagBadge";
import ProgressBar from "@/components/ui/ProgressBar";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (taskId: number, payload: UpdateTaskPayload) => Promise<Task>;
  onCreate: (payload: CreateTaskPayload) => Promise<Task>;
  onDelete: (taskId: number) => Promise<void>;
  availableTags?: string[];
}

export default function TaskDetailModal({
  task: initialTask,
  onClose,
  onUpdate,
  onCreate,
  onDelete,
  availableTags = [],
}: TaskDetailModalProps) {
  const [task, setTask] = useState<Task>(initialTask);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description ?? "");
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editDueDate, setEditDueDate] = useState(task.due_date ?? "");
  const [editStartDatetime, setEditStartDatetime] = useState(
    task.start_datetime ? task.start_datetime.slice(0, 16) : ""
  );
  const [editTagInput, setEditTagInput] = useState("");
  const [editTags, setEditTags] = useState<string[]>(task.tag_list);

  // Subtask creation
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Refresh task from server
  const refreshTask = async () => {
    try {
      const fresh = await api.fetchTask(task.id);
      setTask(fresh);
    } catch { /* silently fail */ }
  };

  useEffect(() => {
    refreshTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(task.title);
      setEditDescription(task.description ?? "");
      setEditPriority(task.priority);
      setEditDueDate(task.due_date ?? "");
      setEditStartDatetime(task.start_datetime ? task.start_datetime.slice(0, 16) : "");
      setEditTags(task.tag_list);
    }
  }, [task, isEditing]);

  // ── Save edits ─────────────────────────────────────────────────────

  async function handleSave() {
    await onUpdate(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      priority: editPriority,
      due_date: editDueDate || null,
      start_datetime: editStartDatetime || null,
      tags: editTags,
    });
    await refreshTask();
    setIsEditing(false);
  }

  // ── Delete ─────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!window.confirm("Tem certeza que deseja excluir esta tarefa e todas as subtarefas?")) {
      return;
    }
    await onDelete(task.id);
    onClose();
  }

  // ── Archive / Promote ──────────────────────────────────────────────

  async function handleArchiveToggle() {
    const nextVal = !task.archived;
    await onUpdate(task.id, { archived: nextVal });
    if (nextVal) {
      onClose();
    } else {
      await refreshTask();
    }
  }

  async function handlePromote() {
    await onUpdate(task.id, { status: "todo", start_datetime: null });
    await refreshTask();
  }

  // ── Subtask creation ───────────────────────────────────────────────

  async function handleAddSubtask(e: FormEvent) {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;

    setAddingSubtask(true);
    try {
      await onCreate({
        title: subtaskTitle.trim(),
        priority: "normal",
        tags: [],
        parent_id: task.id,
      });
      setSubtaskTitle("");
      setShowSubtaskInput(false);
      await refreshTask();
    } finally {
      setAddingSubtask(false);
    }
  }

  // ── Toggle subtask done/todo ───────────────────────────────────────

  async function toggleSubtask(subtask: Task) {
    const newStatus = subtask.status === "done" ? "todo" : "done";
    await api.moveTaskStatus(subtask.id, newStatus);
    await refreshTask();
  }

  // ── Tag helpers ────────────────────────────────────────────────────

  function addEditTag() {
    const trimmed = editTagInput.trim().toLowerCase();
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags([...editTags, trimmed]);
    }
    setEditTagInput("");
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl overflow-y-auto rounded-none sm:rounded-2xl border border-surface-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <PriorityIndicator priority={task.priority} showLabel />
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                task.status === "done"
                  ? "bg-emerald-100 text-emerald-700"
                  : task.status === "doing"
                  ? "bg-blue-100 text-blue-700"
                  : task.status === "standby"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-surface-100 text-surface-600"
              }`}
            >
              {task.status === "standby"
                ? "Stand-by"
                : task.status === "todo"
                ? "Para Fazer"
                : task.status === "doing"
                ? "Em Andamento"
                : "Concluído"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleArchiveToggle}
              className={`rounded-lg p-2 transition-colors ${
                task.archived
                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                  : "text-surface-400 hover:bg-surface-100 hover:text-surface-600"
              }`}
              title={task.archived ? "Desarquivar tarefa" : "Arquivar tarefa"}
            >
              <Archive className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Excluir tarefa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Standby Promotion Banner */}
          {task.status === "standby" && (
            <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between shadow-sm card-enter">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Tarefa Agendada (Stand-by)</h4>
                  <p className="text-xs text-amber-700 mt-0.5">Esta tarefa está programada para iniciar no futuro.</p>
                </div>
              </div>
              <button
                onClick={handlePromote}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Iniciar Agora
              </button>
            </div>
          )}

          {/* ── Title ────────────────────────────────────────────────── */}
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mb-3 w-full rounded-lg border border-surface-300 px-3 py-2 text-lg font-bold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              autoFocus
            />
          ) : (
            <h1
              className="mb-3 cursor-pointer text-xl font-bold text-surface-900 hover:text-brand-700"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {task.title}
            </h1>
          )}

          {/* ── Meta row ────────────────────────────────────────────── */}
          <div className="mb-5 flex flex-wrap gap-3 text-sm text-surface-500">
            {task.due_date && (
              <span
                className={`inline-flex items-center gap-1.5 ${
                  task.is_overdue ? "text-red-500 font-medium" : ""
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                {formatDueDate(task.due_date)}
              </span>
            )}
            {task.start_datetime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatStartDateTime(task.start_datetime)}
              </span>
            )}
          </div>

          {/* ── Description ─────────────────────────────────────────── */}
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
              className="mb-4 w-full resize-none rounded-lg border border-surface-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Adicionar descrição..."
            />
          ) : (
            <p
              className="mb-4 cursor-pointer rounded-lg p-2 text-sm leading-relaxed text-surface-600 hover:bg-surface-50"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {task.description || (
                <span className="italic text-surface-400">
                  Sem descrição. Clique para adicionar.
                </span>
              )}
            </p>
          )}

          {/* ── Edit mode fields ────────────────────────────────────── */}
          {isEditing && (
            <div className="mb-4 space-y-3 rounded-xl bg-surface-50 p-4">
              {/* Priority */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-500">
                  Prioridade
                </label>
                <div className="flex gap-2">
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPriority(p)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        editPriority === p
                          ? `${PRIORITY_CONFIG[p].bgClass} ring-2 ring-current/20`
                          : "bg-white text-surface-500 hover:bg-surface-200"
                      }`}
                    >
                      {PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-start" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Início (agendamento)
                  </label>
                  <input
                    id="edit-start"
                    type="datetime-local"
                    value={editStartDatetime}
                    onChange={(e) => setEditStartDatetime(e.target.value)}
                    className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="edit-due" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Data de Entrega
                  </label>
                  <input
                    id="edit-due"
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-500">
                  Tags
                </label>
                <div className="flex gap-2">
                  <input
                    list="available-tags-detail-list"
                    type="text"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEditTag();
                      }
                    }}
                    placeholder="Adicionar tag..."
                    className="flex-1 rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <datalist id="available-tags-detail-list">
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={addEditTag}
                    className="rounded-lg bg-white px-2 py-1.5 text-surface-500 hover:bg-surface-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {editTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {editTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setEditTags(editTags.filter((t) => t !== tag))}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-brand-200"
                          aria-label={`Remover tag ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(task.title);
                    setEditDescription(task.description ?? "");
                    setEditPriority(task.priority);
                    setEditDueDate(task.due_date ?? "");
                    setEditStartDatetime(task.start_datetime ? task.start_datetime.slice(0, 16) : "");
                    setEditTags(task.tag_list);
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm text-surface-500 hover:bg-surface-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  <Check className="h-3.5 w-3.5" />
                  Salvar
                </button>
              </div>
            </div>
          )}

          {/* ── Tags display (view mode) ────────────────────────────── */}
          {!isEditing && task.tag_list.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {task.tag_list.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* ── Subtasks section ─────────────────────────────────────── */}
          <div className="border-t border-surface-100 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-surface-700">
                Subtarefas
              </h3>
              {task.subtasks_total > 0 && (
                <div className="w-32">
                  <ProgressBar
                    done={task.subtasks_done}
                    total={task.subtasks_total}
                  />
                </div>
              )}
            </div>

            {/* Subtask list */}
            <div className="space-y-1">
              {task.children.map((sub) => (
                <div
                  key={sub.id}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-50"
                >
                  <button
                    onClick={() => toggleSubtask(sub)}
                    className="flex-shrink-0 transition-transform hover:scale-110"
                    aria-label={sub.status === "done" ? "Marcar como pendente" : "Marcar como concluída"}
                  >
                    {sub.status === "done" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-surface-300 group-hover:text-brand-400" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      sub.status === "done"
                        ? "text-surface-400 line-through"
                        : "text-surface-700"
                    }`}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={async () => {
                      await onDelete(sub.id);
                      await refreshTask();
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    title="Excluir subtarefa"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-surface-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask */}
            {showSubtaskInput ? (
              <form onSubmit={handleAddSubtask} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Nome da subtarefa..."
                  className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={addingSubtask || !subtaskTitle.trim()}
                  className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {addingSubtask ? "..." : "Adicionar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubtaskInput(false);
                    setSubtaskTitle("");
                  }}
                  className="rounded-lg px-3 py-2 text-sm text-surface-500 hover:bg-surface-100"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowSubtaskInput(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" />
                Adicionar subtarefa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
