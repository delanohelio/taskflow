/** Top banner with daily review summary in v3.0 aesthetics. */

import { AlertTriangle, CalendarCheck, Sparkles, CheckCircle2 } from "lucide-react";
import type { DailyReview } from "@/types/task";

interface DailyReviewBannerProps {
  review: DailyReview;
}

export default function DailyReviewBanner({ review }: DailyReviewBannerProps) {
  const { today_count, overdue_count } = review;

  // Nothing to show (all caught up)
  if (today_count === 0 && overdue_count === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-2.5 backdrop-blur-md shadow-2xs">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs sm:text-sm font-semibold text-emerald-800">
            Tudo em dia!
          </p>
          <span className="text-xs text-emerald-600 hidden sm:inline">
            Nenhuma tarefa pendente ou atrasada para hoje.
          </span>
        </div>
      </div>
    );
  }

  const hasOverdue = overdue_count > 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 backdrop-blur-md shadow-2xs transition-all ${
        hasOverdue
          ? "border-red-200/80 bg-red-50/70 text-red-900"
          : "border-brand-200/80 bg-brand-50/70 text-brand-900"
      }`}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-xl shrink-0 ${
          hasOverdue ? "bg-red-100 text-red-600" : "bg-brand-100 text-brand-600"
        }`}
      >
        {hasOverdue ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <CalendarCheck className="h-4 w-4" />
        )}
      </div>
      <p className="text-xs sm:text-sm font-medium">
        {today_count > 0 && (
          <span className={hasOverdue ? "text-surface-800" : "text-brand-900"}>
            Você tem{" "}
            <span className="font-extrabold">{today_count}</span>{" "}
            {today_count === 1 ? "tarefa" : "tarefas"} para hoje
          </span>
        )}
        {today_count > 0 && overdue_count > 0 && (
          <span className="text-surface-400"> e </span>
        )}
        {overdue_count > 0 && (
          <span className="text-red-600 font-semibold">
            <span className="font-extrabold">{overdue_count}</span>{" "}
            {overdue_count === 1 ? "atrasada" : "atrasadas"}
          </span>
        )}
      </p>
    </div>
  );
}
