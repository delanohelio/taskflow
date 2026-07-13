/** Sorts tasks by priority (high→normal→low) then by due_date ascending (soonest first). Tasks without a due date come last within each priority group. */

import type { Task } from "@/types/task";

const PRIORITY_WEIGHT: Record<string, number> = { high: 3, normal: 2, low: 1 };

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. Priority descending
    const pA = PRIORITY_WEIGHT[a.priority] ?? 0;
    const pB = PRIORITY_WEIGHT[b.priority] ?? 0;
    if (pB !== pA) return pB - pA;

    // 2. Due date ascending (no due date → Infinity → goes last)
    const dA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const dB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return dA - dB;
  });
}
