/** UI constants — columns, priorities, tag colors. */

// ── Kanban column definitions ────────────────────────────────────────────

export const KANBAN_COLUMNS = [
  { id: "todo", label: "Para Fazer", emptyMessage: "Nenhuma tarefa pendente" },
  { id: "doing", label: "Em Andamento", emptyMessage: "Nenhuma tarefa em progresso" },
  { id: "done", label: "Concluído", emptyMessage: "Nenhuma tarefa concluída" },
] as const;

export type KanbanColumnId = (typeof KANBAN_COLUMNS)[number]["id"];

// ── Priority config ──────────────────────────────────────────────────────

export const PRIORITY_CONFIG = {
  high: {
    label: "Alta",
    dotClass: "bg-red-500 priority-dot-high",
    bgClass: "bg-red-50 text-red-700",
  },
  normal: {
    label: "Normal",
    dotClass: "bg-amber-400",
    bgClass: "bg-amber-50 text-amber-700",
  },
  low: {
    label: "Baixa",
    dotClass: "bg-blue-300",
    bgClass: "bg-blue-50 text-blue-600",
  },
} as const;

// ── Tag color palette (cycles for unknown tags) ──────────────────────────

const TAG_COLOR_MAP: Record<string, string> = {
  design: "bg-purple-100 text-purple-700 border-purple-200",
  backend: "bg-emerald-100 text-emerald-700 border-emerald-200",
  frontend: "bg-sky-100 text-sky-700 border-sky-200",
  docs: "bg-amber-100 text-amber-700 border-amber-200",
  meeting: "bg-rose-100 text-rose-700 border-rose-200",
  research: "bg-orange-100 text-orange-700 border-orange-200",
  bug: "bg-red-100 text-red-700 border-red-200",
  feature: "bg-indigo-100 text-indigo-700 border-indigo-200",
  urgent: "bg-pink-100 text-pink-700 border-pink-200",
};

const TAG_FALLBACK_COLORS = [
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-lime-100 text-lime-700 border-lime-200",
  "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
];

export function getTagColor(tag: string): string {
  const lower = tag.toLowerCase();
  if (TAG_COLOR_MAP[lower]) return TAG_COLOR_MAP[lower];

  // Deterministic fallback based on string hash
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_FALLBACK_COLORS[Math.abs(hash) % TAG_FALLBACK_COLORS.length];
}

// ── API base URL ─────────────────────────────────────────────────────────

export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
