/** Modal for creating a new task. */

import { useState, type FormEvent } from "react";
import { X, CalendarPlus } from "lucide-react";
import type { CreateTaskPayload, Priority } from "@/types/task";
import { PRIORITY_CONFIG } from "@/utils/constants";
import TagInput from "@/components/ui/TagInput";

interface CreateTaskModalProps {
  parentId?: number | null;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
  onClose: () => void;
  availableTags?: string[];
}

export default function CreateTaskModal({
  parentId = null,
  onSubmit,
  onClose,
  availableTags = [],
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [startTimeEnabled, setStartTimeEnabled] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [dueTimeEnabled, setDueTimeEnabled] = useState(false);
  const [priority, setPriority] = useState<Priority>("normal");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function buildStartDatetime(): string | null {
    if (!startDate) return null;
    const time = startTimeEnabled && startTime ? startTime : "09:00";
    return `${startDate}T${time}`;
  }

  function buildDueDatetime(): string | null {
    if (!dueDate) return null;
    // due_date stays as date-only for the API; time is informational
    return dueDate;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const startDatetime = buildStartDatetime();
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        start_datetime: startDatetime,
        due_date: buildDueDatetime(),
        priority,
        tags,
        parent_id: parentId,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content w-full h-full sm:h-auto sm:max-w-lg rounded-none sm:rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-surface-900">
            {parentId ? "Nova Subtarefa" : "Nova Tarefa"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-surface-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-surface-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-surface-700">
              Título *
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              autoFocus
              required
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="mb-1 block text-sm font-medium text-surface-700">
              Descrição
            </label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
              className="w-full resize-none rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Date fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-start-date" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-surface-700">
                <CalendarPlus className="h-3.5 w-3.5" />
                Início (agendamento)
              </label>
              <input
                id="task-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {startDate && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="start-time-enabled"
                    checked={startTimeEnabled}
                    onChange={(e) => setStartTimeEnabled(e.target.checked)}
                    className="rounded border-surface-300 text-brand-600"
                  />
                  <label htmlFor="start-time-enabled" className="text-xs text-surface-600">Definir horário</label>
                  {startTimeEnabled && (
                    <input
                      type="time"
                      value={startTime || "09:00"}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="flex-1 rounded-lg border border-surface-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="task-due" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-surface-700">
                <CalendarPlus className="h-3.5 w-3.5" />
                Data de Entrega
              </label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {dueDate && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="due-time-enabled"
                    checked={dueTimeEnabled}
                    onChange={(e) => setDueTimeEnabled(e.target.checked)}
                    className="rounded border-surface-300 text-brand-600"
                  />
                  <label htmlFor="due-time-enabled" className="text-xs text-surface-600">Definir horário</label>
                  {dueTimeEnabled && (
                    <input
                      type="time"
                      value={dueTime || "23:59"}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="flex-1 rounded-lg border border-surface-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-2 block text-sm font-medium text-surface-700">
              Prioridade
            </label>
            <div className="flex gap-2">
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    priority === p
                      ? `${PRIORITY_CONFIG[p].bgClass} ring-2 ring-current/20`
                      : "bg-surface-100 text-surface-500 hover:bg-surface-200"
                  }`}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Tags</label>
            <TagInput
              tags={tags}
              setTags={setTags}
              availableTags={availableTags}
              placeholder="Adicionar tags..."
            />
          </div>

          {/* Temporal hint */}
          {startDate && new Date(`${startDate}T${startTimeEnabled && startTime ? startTime : "09:00"}`) > new Date() && (
            <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
              ⏳ Esta tarefa ficará em <strong>Stand-by</strong> até{" "}
              {new Date(`${startDate}T${startTimeEnabled && startTime ? startTime : "09:00"}`).toLocaleString("pt-BR")}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Criando..." : "Criar Tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
