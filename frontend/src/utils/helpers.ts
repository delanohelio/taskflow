/** Date and time formatting helpers. */

/**
 * Format a date string to a user-friendly relative label.
 * Examples: "Hoje", "Amanhã", "3 jul", "Atrasado"
 */
export function formatDueDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const target = new Date(dateStr + "T00:00:00"); // ensure local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d atrasado`;
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  if (diffDays <= 7) return `Em ${diffDays} dias`;

  return target.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

/**
 * Format an ISO datetime string into a compact label.
 * Examples: "Hoje às 14:30", "3 jul às 09:00"
 */
export function formatStartDateTime(dtStr: string | null | undefined): string {
  if (!dtStr) return "";

  const dt = new Date(dtStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateOnly = new Date(dt);
  dateOnly.setHours(0, 0, 0, 0);

  const diffMs = dateOnly.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const time = dt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays === 0) return `Hoje às ${time}`;
  if (diffDays === 1) return `Amanhã às ${time}`;
  if (diffDays > 1 && diffDays <= 7) return `Em ${diffDays} dias às ${time}`;

  const dateLabel = dt.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
  return `${dateLabel} às ${time}`;
}

/**
 * Return today's date in YYYY-MM-DD format.
 */
export function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}
