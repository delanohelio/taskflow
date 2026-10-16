/** Modal showing task details, editing, share settings, and subtask delegation. */

import { useEffect, useState, type FormEvent } from "react";
import { marked } from "marked";
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
  Edit3,
  Share2,
  User as UserIcon,
  UserPlus,
  Users,
  LogOut,
  ListTodo,
  PlayCircle,
} from "lucide-react";


import type { Task, CreateTaskPayload, Priority, UpdateTaskPayload, User, UserGroup } from "@/types/task";
import { PRIORITY_CONFIG } from "@/utils/constants";
import { formatDueDate, formatStartDateTime } from "@/utils/helpers";
import * as api from "@/services/api";
import { AutocompleteMultiSelect, AutocompleteOption } from "@/components/ui/AutocompleteMultiSelect";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import TagBadge from "@/components/ui/TagBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import TagInput from "@/components/ui/TagInput";
import MarkdownEditor from "@/components/ui/MarkdownEditor";

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

  const [editStartDate, setEditStartDate] = useState(
    task.start_datetime ? task.start_datetime.slice(0, 10) : ""
  );
  const [editStartTime, setEditStartTime] = useState(
    task.start_datetime ? task.start_datetime.slice(11, 16) : ""
  );
  const [editStartTimeEnabled, setEditStartTimeEnabled] = useState(
    !!task.start_datetime && task.start_datetime.length >= 16
  );
  const [editTags, setEditTags] = useState<string[]>(task.tag_list);

  // Subtask editing & creation
  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Subtask delegation state
  const [assigningSubtaskId, setAssigningSubtaskId] = useState<number | null>(null);

  // Sharing Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allGroups, setAllGroups] = useState<UserGroup[]>([]);
  const [selectedShareUserIds, setSelectedShareUserIds] = useState<number[]>([]);
  const [selectedShareGroupIds, setSelectedShareGroupIds] = useState<number[]>([]);
  const [sharing, setSharing] = useState(false);

  function buildEditStartDatetime(): string | null {
    if (!editStartDate) return null;
    const time = editStartTimeEnabled && editStartTime ? editStartTime : "09:00";
    return `${editStartDate}T${time}`;
  }

  const refreshTask = async () => {
    try {
      const fresh = await api.fetchTask(task.id);
      setTask(fresh);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    refreshTask();
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(task.title);
      setEditDescription(task.description ?? "");
      setEditPriority(task.priority);
      setEditDueDate(task.due_date ?? "");
      setEditStartDate(task.start_datetime ? task.start_datetime.slice(0, 10) : "");
      setEditStartTime(task.start_datetime ? task.start_datetime.slice(11, 16) : "");
      setEditStartTimeEnabled(!!task.start_datetime && task.start_datetime.length >= 16);
      setEditTags(task.tag_list);
    }
  }, [task, isEditing]);

  // Load potential share targets
  const openShareModal = async () => {
    try {
      const [uList, gList] = await Promise.all([api.fetchPublicUsers(), api.fetchUserGroups()]);
      setAllUsers(uList);
      setAllGroups(gList);
      setShowShareModal(true);
    } catch (err) {
      console.error("Erro ao carregar lista para compartilhamento", err);
    }
  };

  async function handleLeaveTask() {
    if (!window.confirm("Deseja realmente sair desta atividade compartilhada? Seu acesso e delegações serão removidos.")) return;
    try {
      await api.leaveSharedTask(task.id);
      onClose();
    } catch (err: any) {
      alert(api.parseApiError(err, "Erro ao sair da atividade."));
    }
  }



  async function handleSave() {
    await onUpdate(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      priority: editPriority,
      due_date: editDueDate || null,
      start_datetime: buildEditStartDatetime(),
      tags: editTags,
    });
    await refreshTask();
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm("Tem certeza que deseja excluir esta tarefa e todas as subtarefas?")) {
      return;
    }
    await onDelete(task.id);
    onClose();
  }

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

  async function toggleSubtask(subtask: Task) {
    const newStatus = subtask.status === "done" ? "todo" : "done";
    await api.moveTaskStatus(subtask.id, newStatus);
    await refreshTask();
  }

  async function handleSaveSubtaskTitle(subtaskId: number) {
    if (!editingSubtaskTitle.trim()) return;
    await api.updateTask(subtaskId, { title: editingSubtaskTitle.trim() });
    setEditingSubtaskId(null);
    await refreshTask();
  }

  async function handleExecuteShare() {
    setSharing(true);
    try {
      await api.shareTask(task.id, {
        user_ids: selectedShareUserIds,
        group_ids: selectedShareGroupIds,
      });
      setShowShareModal(false);
      setSelectedShareUserIds([]);
      setSelectedShareGroupIds([]);
      await refreshTask();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao compartilhar tarefa.");
    } finally {
      setSharing(false);
    }
  }

  async function handleRevokeShare(shareId: number) {
    try {
      await api.revokeShare(shareId);
      await refreshTask();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao revogar compartilhamento.");
    }
  }

  async function handleToggleSubtaskAssignee(subtaskId: number, currentAssignees: User[], targetUser: User) {
    const isAssigned = currentAssignees.some((a) => a.id === targetUser.id);
    let nextAssigneeIds: number[];
    if (isAssigned) {
      nextAssigneeIds = currentAssignees.filter((a) => a.id !== targetUser.id).map((a) => a.id);
    } else {
      nextAssigneeIds = [...currentAssignees.map((a) => a.id), targetUser.id];
    }
    await api.setSubtaskAssignees(subtaskId, nextAssigneeIds);
    await refreshTask();
  }

  // Participants eligible for subtask assignees = task owner + users who accepted share
  const eligibleAssignees: User[] = [];
  if (task.owner) eligibleAssignees.push(task.owner);
  for (const s of task.shares) {
    if (s.status === "accepted" && !eligibleAssignees.some((u) => u.id === s.user.id)) {
      eligibleAssignees.push(s.user);
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl overflow-y-auto rounded-none sm:rounded-2xl border border-surface-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-surface-100 bg-white/95 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <PriorityIndicator priority={task.priority} showLabel hideLabelOnMobile />
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 sm:px-2.5 py-0.5 text-xs font-semibold shrink-0 ${
                task.status === "done"
                  ? "bg-emerald-100 text-emerald-700"
                  : task.status === "doing"
                  ? "bg-blue-100 text-blue-700"
                  : task.status === "standby"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-surface-100 text-surface-600"
              }`}
              title={`Status: ${
                task.status === "standby"
                  ? "Stand-by"
                  : task.status === "todo"
                  ? "Para Fazer"
                  : task.status === "doing"
                  ? "Em Andamento"
                  : "Concluído"
              }`}
            >
              {task.status === "standby" && <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
              {task.status === "todo" && <ListTodo className="h-3.5 w-3.5 shrink-0 text-slate-600" />}
              {task.status === "doing" && <PlayCircle className="h-3.5 w-3.5 shrink-0 text-blue-600" />}
              {task.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}

              <span className="hidden sm:inline">
                {task.status === "standby"
                  ? "Stand-by"
                  : task.status === "todo"
                  ? "Para Fazer"
                  : task.status === "doing"
                  ? "Em Andamento"
                  : "Concluído"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Share button (only for owner) */}
            {!task.is_shared_with_me && (
              <button
                onClick={openShareModal}
                className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                title="Compartilhar atividade"
              >
                <Share2 className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline">Compartilhar</span>
              </button>
            )}

            {/* Leave shared task button (only for guest) */}
            {task.is_shared_with_me && (
              <button
                onClick={handleLeaveTask}
                className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                title="Sair desta atividade compartilhada"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline">Sair</span>
              </button>
            )}

            {/* Explicit Edit Button before Archive Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer border ${
                isEditing
                  ? "bg-brand-100 text-brand-800 border-brand-300"
                  : "bg-surface-100 text-surface-700 border-surface-200 hover:bg-surface-200"
              }`}
              title="Editar atividade"
            >
              <Edit3 className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">{isEditing ? "Cancelar" : "Editar"}</span>
            </button>

            {/* Archive button */}
            <button
              onClick={handleArchiveToggle}
              className={`rounded-lg p-1.5 sm:p-2 transition-colors cursor-pointer ${
                task.archived
                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                  : "text-surface-400 hover:bg-surface-100 hover:text-surface-600"
              }`}
              title={task.archived ? "Desarquivar tarefa" : "Arquivar tarefa"}
            >
              <Archive className="h-4 w-4" />
            </button>

            {/* Delete button (only for owner) */}
            {!task.is_shared_with_me && (
              <button
                onClick={handleDelete}
                className="rounded-lg p-1.5 sm:p-2 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-500 cursor-pointer"
                title="Excluir tarefa"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 sm:p-2 text-surface-400 transition-colors hover:bg-surface-100 cursor-pointer"
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

          {/* Sharing Info Banner */}
          {task.is_shared_with_me && (
            <div className="mb-4 rounded-xl bg-purple-50 border border-purple-200 p-3 flex items-center justify-between text-xs text-purple-800">
              <span className="flex items-center gap-1.5 font-semibold">
                <UserIcon className="h-4 w-4 text-purple-600" />
                Compartilhada por @{task.owner?.username || "outro usuário"}
              </span>
            </div>
          )}

          {/* Current shares list (for owner) */}
          {!task.is_shared_with_me && task.shares.length > 0 && (
            <div className="mb-4 rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-xs space-y-2">
              <div className="flex items-center gap-1 font-bold text-indigo-900 uppercase tracking-wider">
                <Share2 className="h-3.5 w-3.5" />
                Compartilhada com:
              </div>
              <div className="flex flex-wrap gap-2">
                {task.shares.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-medium text-indigo-800 border border-indigo-200 shadow-2xs"
                  >
                    @{s.user.username}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        s.status === "accepted"
                          ? "bg-emerald-100 text-emerald-800"
                          : s.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {s.status === "accepted" ? "Aceito" : s.status === "rejected" ? "Recusado" : "Pendente"}
                    </span>
                    <button
                      onClick={() => handleRevokeShare(s.id)}
                      className="text-surface-400 hover:text-red-600 ml-1 cursor-pointer"
                      title="Revogar compartilhamento"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mb-3 w-full rounded-xl border border-surface-300 px-3.5 py-2 text-lg font-bold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              autoFocus
            />
          ) : (
            <h1 className="mb-3 text-xl sm:text-2xl font-bold tracking-tight text-surface-900 select-text">
              {task.title}
            </h1>
          )}

          {/* Meta row */}
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

          {/* Description */}
          {isEditing ? (
            <div className="mb-5 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500">
                Descrição da Tarefa (Markdown Rico)
              </label>
              <MarkdownEditor
                value={editDescription}
                onChange={setEditDescription}
                placeholder="Detalhes da tarefa, links e notas de entrega em Markdown..."
                minHeight="180px"
              />
            </div>
          ) : (
            <div className="mb-5 rounded-2xl border border-surface-200/80 bg-surface-50/50 p-4 transition-colors">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-150">
                <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400">
                  Descrição
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-brand-600 hover:bg-brand-50 hover:text-brand-700 transition-colors cursor-pointer"
                  title="Editar descrição da tarefa"
                >
                  <Edit3 className="h-3 w-3" />
                  Editar Descrição
                </button>
              </div>
              {task.description ? (
                <div
                  className="prose max-w-none text-surface-800 select-text leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: marked.parse(task.description) as string }}
                />
              ) : (
                <p className="italic text-xs text-surface-400">
                  Nenhuma descrição informada para esta tarefa.
                </p>
              )}
            </div>
          )}

          {/* Edit mode fields */}
          {isEditing && (
            <div className="mb-4 space-y-3 rounded-xl bg-surface-50 p-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-start-date" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Início (agendamento)
                  </label>
                  <input
                    id="edit-start-date"
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  {editStartDate && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit-start-time-enabled"
                        checked={editStartTimeEnabled}
                        onChange={(e) => setEditStartTimeEnabled(e.target.checked)}
                        className="rounded border-surface-300 text-brand-600"
                      />
                      <label htmlFor="edit-start-time-enabled" className="text-xs text-surface-600">Definir horário</label>
                      {editStartTimeEnabled && (
                        <input
                          type="time"
                          value={editStartTime || "09:00"}
                          onChange={(e) => setEditStartTime(e.target.value)}
                          className="flex-1 rounded-lg border border-surface-300 bg-white px-2 py-1.5 text-sm"
                        />
                      )}
                    </div>
                  )}
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
                    className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-500">Tags</label>
                <TagInput
                  tags={editTags}
                  setTags={setEditTags}
                  availableTags={availableTags}
                  placeholder="Adicionar tags..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
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

          {/* Tags display */}
          {!isEditing && task.tag_list.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {task.tag_list.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* Subtasks Section */}
          <div className="border-t border-surface-100 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-surface-700">Subtarefas</h3>
              {task.subtasks_total > 0 && (
                <div className="w-32">
                  <ProgressBar done={task.subtasks_done} total={task.subtasks_total} />
                </div>
              )}
            </div>

            {/* Subtask list */}
            <div className="space-y-2">
              {task.children.map((sub) => (
                <div
                  key={sub.id}
                  className="group rounded-xl border border-surface-200 bg-white p-3 space-y-2 hover:border-surface-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSubtask(sub)}
                      className="flex-shrink-0 transition-transform hover:scale-110 cursor-pointer"
                    >
                      {sub.status === "done" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-surface-300 group-hover:text-brand-400" />
                      )}
                    </button>

                    {/* Inline editing subtask title */}
                    {editingSubtaskId === sub.id ? (
                      <input
                        type="text"
                        value={editingSubtaskTitle}
                        onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                        onBlur={() => handleSaveSubtaskTitle(sub.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveSubtaskTitle(sub.id);
                          if (e.key === "Escape") setEditingSubtaskId(null);
                        }}
                        className="flex-1 rounded-md border border-brand-400 px-2 py-1 text-sm outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingSubtaskId(sub.id);
                          setEditingSubtaskTitle(sub.title);
                        }}
                        className={`flex-1 text-sm cursor-pointer hover:text-brand-700 ${
                          sub.status === "done" ? "text-surface-400 line-through" : "text-surface-700"
                        }`}
                        title="Clique para editar o nome da subtarefa"
                      >
                        {sub.title}
                      </span>
                    )}

                    {/* Delegar responsaveis button */}
                    <button
                      onClick={() =>
                        setAssigningSubtaskId(assigningSubtaskId === sub.id ? null : sub.id)
                      }
                      className="rounded-lg border border-surface-200 px-2 py-1 text-[11px] font-semibold text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer"
                      title="Atribuir responsáveis"
                    >
                      <UserPlus className="h-3 w-3 inline mr-1" />
                      Delegar ({sub.assignees.length})
                    </button>

                    <button
                      onClick={async () => {
                        await onDelete(sub.id);
                        await refreshTask();
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                      title="Excluir subtarefa"
                    >
                      <Trash2 className="h-4 w-4 text-surface-400 hover:text-red-500" />
                    </button>
                  </div>

                  {/* Assignees chips display */}
                  {sub.assignees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-8">
                      {sub.assignees.map((assignee) => (
                        <span
                          key={assignee.id}
                          className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-semibold text-surface-700 border border-surface-200"
                        >
                          @{assignee.username}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Assignee selection panel */}
                  {assigningSubtaskId === sub.id && (
                    <div className="pl-8 pt-2 space-y-1">
                      <p className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">
                        Selecione os responsáveis:
                      </p>
                      {eligibleAssignees.length === 0 ? (
                        <p className="text-xs text-surface-400 italic">Nenhum usuário compartilhado elegível.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {eligibleAssignees.map((u) => {
                            const isAssigned = sub.assignees.some((a) => a.id === u.id);
                            return (
                              <button
                                key={u.id}
                                onClick={() => handleToggleSubtaskAssignee(sub.id, sub.assignees, u)}
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer border ${
                                  isAssigned
                                    ? "bg-brand-600 text-white border-brand-600"
                                    : "bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100"
                                }`}
                              >
                                @{u.username} {isAssigned && "✓"}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add subtask */}
            {showSubtaskInput ? (
              <form onSubmit={handleAddSubtask} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Nome da subtarefa..."
                  className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Adicionar subtarefa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Compartilhar Tarefa */}
      {showShareModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl space-y-5 border border-surface-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900">Compartilhar Atividade</h3>
                  <p className="text-xs text-surface-500">Busque e selecione usuários ou grupos para enviar convites.</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="rounded-xl p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <AutocompleteMultiSelect
                label="Buscar Usuários"
                options={allUsers
                  .filter((u) => u.id !== task.owner_id)
                  .map((u) => ({
                    id: u.id,
                    label: `${u.full_name} (@${u.username})`,
                    sublabel: u.email || `@${u.username}`,
                    type: "user",
                  }))}
                selectedIds={selectedShareUserIds}
                onChange={(ids) => setSelectedShareUserIds(ids as number[])}
                placeholder="Digite o nome ou username para buscar um usuário..."
              />

              {allGroups.length > 0 && (
                <AutocompleteMultiSelect
                  label="Buscar Grupos de Usuários"
                  options={allGroups.map((g) => ({
                    id: g.id,
                    label: `Grupo: ${g.name}`,
                    sublabel: `${g.members.length} membro(s) no grupo`,
                    type: "group",
                  }))}
                  selectedIds={selectedShareGroupIds}
                  onChange={(ids) => setSelectedShareGroupIds(ids as number[])}
                  placeholder="Digite o nome do grupo para buscar..."
                />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="rounded-xl border border-surface-200 px-5 py-2.5 text-sm font-semibold text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteShare}
                disabled={sharing || (selectedShareUserIds.length === 0 && selectedShareGroupIds.length === 0)}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {sharing ? "Enviando..." : "Enviar Convites"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
