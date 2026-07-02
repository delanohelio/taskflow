/** Modal for creating a new task. */

import { useState, type FormEvent } from "react";
import { X, Plus, CalendarPlus, Tag } from "lucide-react";
import type { CreateTaskPayload, Priority } from "@/types/task";
import { PRIORITY_CONFIG } from "@/utils/constants";

interface CreateTaskModalProps {
  parentId?: number | null;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
  onClose: () => void;
}

export default function CreateTaskModal({
  parentId = null,
  onSubmit,
  onClose,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDatetime, setStartDatetime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        start_datetime: startDatetime || null,
        due_date: dueDate || null,
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
      <div className="modal-content w-full max-w-lg rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-start" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-surface-700">
                <CalendarPlus className="h-3.5 w-3.5" />
                Início (agendamento)
              </label>
              <input
                id="task-start"
                type="datetime-local"
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
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
            <label htmlFor="task-tag-input" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-surface-700">
              <Tag className="h-3.5 w-3.5" />
              Tags
            </label>
            <div className="flex gap-2">
              <input
                id="task-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Digite e pressione Enter"
                className="flex-1 rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-lg bg-surface-100 px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-brand-200"
                      aria-label={`Remover tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Temporal hint */}
          {startDatetime && new Date(startDatetime) > new Date() && (
            <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
              ⏳ Esta tarefa ficará em <strong>Stand-by</strong> até{" "}
              {new Date(startDatetime).toLocaleString("pt-BR")}
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
