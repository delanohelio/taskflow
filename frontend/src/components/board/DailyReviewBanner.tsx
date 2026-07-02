/** Top banner with daily review summary. */

import { AlertTriangle, CalendarCheck, Sparkles } from "lucide-react";
import type { DailyReview } from "@/types/task";

interface DailyReviewBannerProps {
  review: DailyReview;
}

export default function DailyReviewBanner({ review }: DailyReviewBannerProps) {
  const { today_count, overdue_count } = review;

  // Nothing to show
  if (today_count === 0 && overdue_count === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-5 py-3 backdrop-blur-sm">
        <Sparkles className="h-5 w-5 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-700">
          Tudo em dia! Nenhuma tarefa pendente para hoje.
        </p>
      </div>
    );
  }

  const hasOverdue = overdue_count > 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-5 py-3 backdrop-blur-sm ${
        hasOverdue
          ? "border-red-200 bg-red-50/80"
          : "border-brand-200 bg-brand-50/80"
      }`}
    >
      {hasOverdue ? (
        <AlertTriangle className="h-5 w-5 text-red-500" />
      ) : (
        <CalendarCheck className="h-5 w-5 text-brand-500" />
      )}
      <p className="text-sm font-medium">
        {today_count > 0 && (
          <span className={hasOverdue ? "text-surface-700" : "text-brand-700"}>
            Você tem{" "}
            <span className="font-bold">{today_count}</span>{" "}
            {today_count === 1 ? "tarefa" : "tarefas"} para hoje
          </span>
        )}
        {today_count > 0 && overdue_count > 0 && (
          <span className="text-surface-400"> e </span>
        )}
        {overdue_count > 0 && (
          <span className="text-red-600">
            <span className="font-bold">{overdue_count}</span>{" "}
            {overdue_count === 1 ? "atrasada" : "atrasadas"}
          </span>
        )}
      </p>
    </div>
  );
}
